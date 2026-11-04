const pool = require("../../../config/db");

/**
 * Whitelist các cột được phép dùng trong WHERE.
 * Không lấy tên cột trực tiếp từ query param để ghép vào SQL.
 */
const FILTER_COLUMNS = {
  category_name: "c.category_name",
  manufacturer: "p.manufacturer",
  product_type: "p.product_type",
  part_number: "p.part_number",
};

/**
 * Các toán tử được phép.
 */
const FILTER_OPERATORS = {
  "=": "=",
  "!=": "<>",
  "<>": "<>",
  ">": ">",
  ">=": ">=",
  "<": "<",
  "<=": "<=",
};

/**
 * Chuyển giá trị thành chuỗi an toàn để tìm kiếm.
 */
function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, "\\$&");
}

/**
 * Đọc và kiểm tra filter JSON.
 *
 * Ví dụ:
 * [
 *   { key: "category_name", operator: "=", value: "Engine" },
 *   { key: "manufacturer", operator: "=", value: "CFM INTL" }
 * ]
 */
function parseFilters(rawFilter) {
  if (rawFilter === undefined || rawFilter === null || rawFilter === "") {
    return [];
  }

  let filters;

  try {
    filters = typeof rawFilter === "string"
      ? JSON.parse(rawFilter)
      : rawFilter;
  } catch {
    const error = new Error("Tham số filter phải là JSON hợp lệ.");
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(filters)) {
    const error = new Error("Tham số filter phải là một JSON array.");
    error.statusCode = 400;
    throw error;
  }

  if (filters.length > 10) {
    const error = new Error("Chỉ được phép gửi tối đa 10 bộ lọc.");
    error.statusCode = 400;
    throw error;
  }

  return filters.map((filter) => {
    if (!filter || typeof filter !== "object" || Array.isArray(filter)) {
      const error = new Error("Một phần tử trong filter không hợp lệ.");
      error.statusCode = 400;
      throw error;
    }

    const { key, operator = "=", value } = filter;

    if (!Object.prototype.hasOwnProperty.call(FILTER_COLUMNS, key)) {
      const error = new Error(`Không hỗ trợ bộ lọc: ${key}`);
      error.statusCode = 400;
      throw error;
    }

    if (!Object.prototype.hasOwnProperty.call(FILTER_OPERATORS, operator)) {
      const error = new Error(`Không hỗ trợ toán tử: ${operator}`);
      error.statusCode = 400;
      throw error;
    }

    if (
      value === undefined ||
      value === null ||
      typeof value === "object"
    ) {
      const error = new Error(`Giá trị filter không hợp lệ cho ${key}.`);
      error.statusCode = 400;
      throw error;
    }

    return {
      column: FILTER_COLUMNS[key],
      operator: FILTER_OPERATORS[operator],
      value,
    };
  });
}

/**
 * Chuẩn hóa query params của Marketplace V1.
 *
 * Hỗ trợ:
 * - q hoặc search
 * - per_page hoặc limit
 * - page
 * - sort=product_name
 * - sort=-product_name
 * - sort=part_number
 * - filter=[{key, operator, value}]
 */
function normalizeProductQuery(query = {}) {
  const search = String(query.q ?? query.search ?? "").trim();

  const rawPage = Number(query.page ?? 1);
  const rawLimit = Number(query.per_page ?? query.limit ?? 12);

  if (!Number.isInteger(rawPage) || rawPage < 1) {
    const error = new Error("page phải là số nguyên lớn hơn hoặc bằng 1.");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(rawLimit) || rawLimit < 1) {
    const error = new Error("per_page/limit phải là số nguyên dương.");
    error.statusCode = 400;
    throw error;
  }

  const page = rawPage;
  const limit = Math.min(rawLimit, 100);
  const offset = (page - 1) * limit;

  const rawSort = String(query.sort ?? "product_name").trim();
  const descending = rawSort.startsWith("-");
  const sortField = descending ? rawSort.slice(1) : rawSort;

  const sortColumns = {
    product_name: "p.product_name",
    part_number: "p.part_number",
  };

  if (!Object.prototype.hasOwnProperty.call(sortColumns, sortField)) {
    const error = new Error(
      "sort chỉ hỗ trợ product_name, -product_name hoặc part_number."
    );
    error.statusCode = 400;
    throw error;
  }

  return {
    search,
    page,
    limit,
    offset,
    sortColumn: sortColumns[sortField],
    sortDirection: descending ? "DESC" : "ASC",
    filters: parseFilters(query.filter),
  };
}

/**
 * Tạo WHERE và parameters dùng chung cho câu query dữ liệu và đếm tổng.
 */
function buildProductWhere({ search, filters }) {
  const conditions = ["p.is_active = TRUE"];
  const values = [];

  function addParameter(value) {
    values.push(value);
    return `$${values.length}`;
  }

  if (search) {
    const parameter = addParameter(`%${escapeLike(search)}%`);

    conditions.push(`
            (
                p.product_name ILIKE ${parameter} ESCAPE '\\'
                OR p.part_number ILIKE ${parameter} ESCAPE '\\'
                OR p.manufacturer ILIKE ${parameter} ESCAPE '\\'
                OR COALESCE(p.technical_specs::text, '') ILIKE ${parameter} ESCAPE '\\'
            )
        `);
  }

  for (const filter of filters) {
    const parameter = addParameter(filter.value);

    conditions.push(
      `${filter.column} ${filter.operator} ${parameter}`
    );
  }

  return {
    whereSQL: conditions.join(" AND "),
    values,
  };
}

/**
 * API LEGACY:
 * GET /api/products
 *
 * Giữ nguyên tên hàm và mục đích endpoint cũ:
 * lấy danh sách sản phẩm active cùng thông tin tổng hợp.
 *
 * Không áp dụng pagination V1 vào endpoint này.
 */
async function getAllProducts() {
  const result = await pool.query(`
    SELECT
      p.product_id,
      p.product_name,
      p.manufacturer,
      p.part_number,
      p.product_type,
      p.description,
      p.technical_specs,
      p.is_active,
      c.category_name,
      COALESCE(COUNT(DISTINCT sl.listing_id), 0)::int AS listing_count,
      MIN(sl.price) AS min_price,
      MAX(sl.price) AS max_price,
      COALESCE(SUM(sl.stock_quantity), 0)::int AS total_stock,
      COALESCE(STRING_AGG(DISTINCT sl.condition::text, ', '), '') AS conditions,
      COALESCE(STRING_AGG(DISTINCT comp.company_name, ', '), '') AS suppliers,
      COALESCE(STRING_AGG(DISTINCT em.model_name, ', '), '') AS compatible_engines
    FROM products p
    JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN seller_listings sl ON p.product_id = sl.product_id AND sl.status = 'ACTIVE'
    LEFT JOIN suppliers sup ON sl.supplier_id = sup.supplier_id
    LEFT JOIN companies comp ON sup.company_id = comp.company_id
    LEFT JOIN product_engine_compatibility pec ON p.product_id = pec.product_id
    LEFT JOIN engine_models em ON pec.engine_model_id = em.engine_model_id
    WHERE p.is_active = TRUE
    GROUP BY p.product_id, c.category_name
    ORDER BY p.product_id;
  `);

  return result.rows;
}

/**
 * API V1:
 * GET /api/v1/products
 *
 * Trả về danh sách có phân trang, tìm kiếm, lọc và sắp xếp.
 */
async function getProductsV1(query = {}) {
  const normalized = normalizeProductQuery(query);

  const {
    search,
    page,
    limit,
    offset,
    sortColumn,
    sortDirection,
    filters,
  } = normalized;

  const { whereSQL, values } = buildProductWhere({
    search,
    filters,
  });

  const countQuery = `
        SELECT COUNT(*)::int AS total_items
        FROM products p
        LEFT JOIN categories c
            ON c.category_id = p.category_id
        WHERE ${whereSQL};
    `;

  const countResult = await pool.query(countQuery, values);
  const totalItems = countResult.rows[0].total_items;
  const totalPages = Math.ceil(totalItems / limit);

  const dataQuery = `
        SELECT
            p.product_id,
            p.product_name,
            p.manufacturer,
            p.part_number,
            p.product_type,
            p.description,
            p.technical_specs,
            p.created_at,

            c.category_id,
            c.category_name,

            COALESCE(listing_stats.listing_count, 0)::int AS listing_count,
            listing_stats.min_price,
            listing_stats.max_price,
            COALESCE(listing_stats.total_stock, 0)::int AS total_stock,
            COALESCE(listing_stats.conditions, ARRAY[]::text[]) AS conditions,

            COALESCE(supplier_stats.suppliers, '[]'::json) AS suppliers,
            COALESCE(engine_stats.compatible_engines, '[]'::json)
                AS compatible_engines,
            COALESCE(related_stats.related_products, '[]'::json)
                AS related_products

        FROM products p

        LEFT JOIN categories c
            ON c.category_id = p.category_id

        LEFT JOIN LATERAL (
            SELECT
                COUNT(*)::int AS listing_count,
                MIN(sl.price) AS min_price,
                MAX(sl.price) AS max_price,
                SUM(sl.stock_quantity)::int AS total_stock,
                ARRAY_AGG(DISTINCT sl.condition::text ORDER BY sl.condition::text)
                    AS conditions
            FROM seller_listings sl
            JOIN suppliers s
                ON s.supplier_id = sl.supplier_id
            WHERE
                sl.product_id = p.product_id
                AND sl.status = 'ACTIVE'
                AND s.status = 'APPROVED'
        ) listing_stats ON TRUE

        LEFT JOIN LATERAL (
            SELECT
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'supplier_id', s.supplier_id,
                        'store_name', s.store_name,
                        'company_name', co.company_name
                    )
                    ORDER BY s.store_name
                ) AS suppliers
            FROM seller_listings sl
            JOIN suppliers s
                ON s.supplier_id = sl.supplier_id
            JOIN companies co
                ON co.company_id = s.company_id
            WHERE
                sl.product_id = p.product_id
                AND sl.status = 'ACTIVE'
                AND s.status = 'APPROVED'
        ) supplier_stats ON TRUE

        LEFT JOIN LATERAL (
            SELECT
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'engine_model_id', em.engine_model_id,
                        'manufacturer', em.manufacturer,
                        'model_name', em.model_name,
                        'engine_family', em.engine_family,
                        'engine_type', em.engine_type
                    )
                    ORDER BY em.manufacturer, em.model_name
                ) AS compatible_engines
            FROM product_engine_compatibility pec
            JOIN engine_models em
                ON em.engine_model_id = pec.engine_model_id
            WHERE pec.product_id = p.product_id
        ) engine_stats ON TRUE

        LEFT JOIN LATERAL (
            SELECT
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'product_id', rp.product_id,
                        'product_name', rp.product_name,
                        'part_number', rp.part_number,
                        'manufacturer', rp.manufacturer,
                        'product_type', rp.product_type,
                        'category_name', rc.category_name,
                        'price', r_stats.min_price
                    )
                ) AS related_products
            FROM (
                SELECT p2.product_id, p2.product_name, p2.part_number, p2.manufacturer, p2.product_type, p2.category_id
                FROM products p2
                WHERE (p2.category_id = p.category_id OR p2.manufacturer = p.manufacturer)
                    AND p2.product_id <> p.product_id
                    AND p2.is_active = TRUE
                ORDER BY (p2.category_id = p.category_id) DESC, p2.product_id ASC
                LIMIT 3
            ) rp
            LEFT JOIN categories rc
                ON rc.category_id = rp.category_id
            LEFT JOIN LATERAL (
                SELECT MIN(sl2.price) AS min_price
                FROM seller_listings sl2
                WHERE sl2.product_id = rp.product_id
                    AND sl2.status = 'ACTIVE'
            ) r_stats ON TRUE
        ) related_stats ON TRUE

        WHERE ${whereSQL}

        ORDER BY ${sortColumn} ${sortDirection}, p.product_id ASC
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2};
    `;

  const dataResult = await pool.query(dataQuery, [
    ...values,
    limit,
    offset,
  ]);

  return {
    data: dataResult.rows,
    meta: {
      page,
      per_page: limit,
      total_items: totalItems,
      total_pages: totalPages,
    },
    pagination: {
      page,
      limit,
      total: totalItems,
      totalPages,
    },
  };
}

/**
 * Lấy dữ liệu cho dropdown bộ lọc.
 */
async function getProductFilterOptions() {
  const [
    categoriesResult,
    manufacturersResult,
    productTypesResult,
    conditionsResult,
    engineModelsResult,
  ] = await Promise.all([
    pool.query(`
            SELECT category_name
            FROM categories
            ORDER BY category_name ASC;
        `),

    pool.query(`
            SELECT DISTINCT manufacturer
            FROM products
            WHERE is_active = TRUE
                AND manufacturer IS NOT NULL
                AND manufacturer <> ''
            ORDER BY manufacturer ASC;
        `),

    pool.query(`
            SELECT DISTINCT product_type
            FROM products
            WHERE is_active = TRUE
                AND product_type IS NOT NULL
            ORDER BY product_type ASC;
        `),

    pool.query(`
            SELECT DISTINCT condition::text AS condition
            FROM seller_listings
            WHERE status = 'ACTIVE'
            ORDER BY condition ASC;
        `),

    pool.query(`
            SELECT
                engine_model_id,
                manufacturer,
                model_name,
                engine_family,
                engine_type
            FROM engine_models
            ORDER BY manufacturer ASC, model_name ASC;
        `),
  ]);

  return {
    categories: categoriesResult.rows.map((row) => row.category_name),
    manufacturers: manufacturersResult.rows.map((row) => row.manufacturer),
    product_types: productTypesResult.rows.map((row) => row.product_type),
    conditions: conditionsResult.rows.map((row) => row.condition),
    engine_models: engineModelsResult.rows,
  };
}

/**
 * Lấy chi tiết một sản phẩm theo ID.
 */
async function getProductById(productId) {
  const query = `
        SELECT
            p.product_id,
            p.product_name,
            p.manufacturer,
            p.part_number,
            p.product_type,
            p.description,
            p.technical_specs,
            p.created_at,

            c.category_id,
            c.category_name,

            COALESCE(listing_stats.listing_count, 0)::int AS listing_count,
            listing_stats.min_price,
            listing_stats.max_price,
            COALESCE(listing_stats.total_stock, 0)::int AS total_stock,
            COALESCE(listing_stats.conditions, ARRAY[]::text[]) AS conditions,

            COALESCE(supplier_stats.suppliers, '[]'::json) AS suppliers,
            COALESCE(engine_stats.compatible_engines, '[]'::json)
                AS compatible_engines,
            COALESCE(related_stats.related_products, '[]'::json)
                AS related_products

        FROM products p

        LEFT JOIN categories c
            ON c.category_id = p.category_id

        LEFT JOIN LATERAL (
            SELECT
                COUNT(*)::int AS listing_count,
                MIN(sl.price) AS min_price,
                MAX(sl.price) AS max_price,
                SUM(sl.stock_quantity)::int AS total_stock,
                ARRAY_AGG(DISTINCT sl.condition::text ORDER BY sl.condition::text)
                    AS conditions
            FROM seller_listings sl
            JOIN suppliers s
                ON s.supplier_id = sl.supplier_id
            WHERE
                sl.product_id = p.product_id
                AND sl.status = 'ACTIVE'
                AND s.status = 'APPROVED'
        ) listing_stats ON TRUE

        LEFT JOIN LATERAL (
            SELECT
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'supplier_id', s.supplier_id,
                        'store_name', s.store_name,
                        'company_name', co.company_name
                    )
                    ORDER BY s.store_name
                ) AS suppliers
            FROM seller_listings sl
            JOIN suppliers s
                ON s.supplier_id = sl.supplier_id
            JOIN companies co
                ON co.company_id = s.company_id
            WHERE
                sl.product_id = p.product_id
                AND sl.status = 'ACTIVE'
                AND s.status = 'APPROVED'
        ) supplier_stats ON TRUE

        LEFT JOIN LATERAL (
            SELECT
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'engine_model_id', em.engine_model_id,
                        'manufacturer', em.manufacturer,
                        'model_name', em.model_name,
                        'engine_family', em.engine_family,
                        'engine_type', em.engine_type
                    )
                    ORDER BY em.manufacturer, em.model_name
                ) AS compatible_engines
            FROM product_engine_compatibility pec
            JOIN engine_models em
                ON em.engine_model_id = pec.engine_model_id
            WHERE pec.product_id = p.product_id
        ) engine_stats ON TRUE

        LEFT JOIN LATERAL (
            SELECT
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'product_id', rp.product_id,
                        'product_name', rp.product_name,
                        'part_number', rp.part_number,
                        'manufacturer', rp.manufacturer,
                        'product_type', rp.product_type,
                        'category_name', rc.category_name,
                        'price', r_stats.min_price
                    )
                ) AS related_products
            FROM (
                SELECT p2.product_id, p2.product_name, p2.part_number, p2.manufacturer, p2.product_type, p2.category_id
                FROM products p2
                WHERE (p2.category_id = p.category_id OR p2.manufacturer = p.manufacturer)
                    AND p2.product_id <> p.product_id
                    AND p2.is_active = TRUE
                ORDER BY (p2.category_id = p.category_id) DESC, p2.product_id ASC
                LIMIT 3
            ) rp
            LEFT JOIN categories rc
                ON rc.category_id = rp.category_id
            LEFT JOIN LATERAL (
                SELECT MIN(sl2.price) AS min_price
                FROM seller_listings sl2
                WHERE sl2.product_id = rp.product_id
                    AND sl2.status = 'ACTIVE'
            ) r_stats ON TRUE
        ) related_stats ON TRUE

        WHERE
            p.product_id = $1
            AND p.is_active = TRUE;
    `;

  const result = await pool.query(query, [productId]);
  return result.rows[0] || null;
}

module.exports = {
  getAllProducts,
  getProductsV1,
  getProductFilterOptions,
  getProductById,
};