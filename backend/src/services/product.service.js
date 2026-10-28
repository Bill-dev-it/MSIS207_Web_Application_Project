const pool = require("../config/db");

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
      c.category_name
    FROM products p
    JOIN categories c
      ON p.category_id = c.category_id
    WHERE p.is_active = TRUE
    ORDER BY p.product_id;
  `);

  return result.rows;
}

async function getProductById(productId) {
  const sql = `
    SELECT
      p.product_id,
      p.product_name,
      p.manufacturer,
      p.part_number,
      p.product_type,
      p.description,
      p.technical_specs,
      p.is_active,
      c.category_name
    FROM products p
    JOIN categories c
      ON p.category_id = c.category_id
    WHERE p.product_id = $1
      AND p.is_active = TRUE
  `;
  const result = await pool.query(sql, [productId]);

  return result.rows[0] || null;
}

async function getProductsCollection(options) {
  const { q = "", filter = [], sort = "product_name", page = 1, perPage = 12 } = options;

  const conditions = ["p.is_active = TRUE"];
  const values = [];

  if (q && typeof q === "string" && q.trim()) {
    values.push(`%${q.trim()}%`);
    const n = values.length;

    conditions.push(`(
      p.product_name ILIKE $${n}
      OR p.part_number ILIKE $${n}
      OR p.manufacturer ILIKE $${n}
      OR p.description ILIKE $${n}
    )`);
  }

  const filterColumns = {
    category_name: "c.category_name",
    manufacturer: "p.manufacturer",
    product_type: "p.product_type",
  };

  const normalizedFilter = Array.isArray(filter) ? filter : [];

  for (const item of normalizedFilter) {
    if (!item || typeof item !== "object") continue;

    const column = filterColumns[item.key];
    if (!column) continue;

    const resolvedValue = item.operator === "LIKE"
      ? `%${String(item.value ?? "")}%`
      : String(item.value ?? "");

    values.push(resolvedValue);
    const n = values.length;

    if (item.operator === "LIKE") {
      conditions.push(`${column} ILIKE $${n}`);
    } else {
      conditions.push(`${column} = $${n}`);
    }
  }

  const whereClause = conditions.join(" AND ");

  const sortColumns = {
    product_name: "p.product_name",
    part_number: "p.part_number",
    manufacturer: "p.manufacturer",
    category_name: "c.category_name",
  };

  const sortFields = String(sort)
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);

  const orderParts = sortFields.map((field) => {
    const descending = field.startsWith("-");
    const name = field.replace(/^[-+]/, "");
    const column = sortColumns[name];

    return column ? `${column} ${descending ? "DESC" : "ASC"}` : null;
  }).filter(Boolean);

  if (orderParts.length === 0) {
    orderParts.push("p.product_name ASC");
  }

  orderParts.push("p.product_id ASC");

  const orderClause = orderParts.join(", ");

  const countSql = `
    SELECT COUNT(*) AS total
    FROM products p
    JOIN categories c ON p.category_id = c.category_id
    WHERE ${whereClause}
  `;

  const countResult = await pool.query(countSql, values);
  const totalItems = Number(countResult.rows[0].total);

  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safePerPage = Number(perPage) > 0 ? Number(perPage) : 12;
  const offset = (safePage - 1) * safePerPage;

  const limitPosition = values.length + 1;
  const offsetPosition = values.length + 2;

  const dataSql = `
    SELECT
      p.product_id,
      p.product_name,
      p.manufacturer,
      p.part_number,
      p.product_type,
      p.description,
      p.technical_specs,
      p.is_active,
      c.category_name
    FROM products p
    JOIN categories c ON p.category_id = c.category_id
    WHERE ${whereClause}
    ORDER BY ${orderClause}
    LIMIT $${limitPosition}
    OFFSET $${offsetPosition}
  `;

  const dataResult = await pool.query(
    dataSql,
    [...values, safePerPage, offset]
  );

  return {
    products: dataResult.rows,
    totalItems,
  };
}

module.exports = {
  getAllProducts,
  getProductById,
  getProductsCollection,
};