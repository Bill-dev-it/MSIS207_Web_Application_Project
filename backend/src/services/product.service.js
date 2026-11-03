const pool = require("../config/db");

// Fields returned by both the collection and product-detail endpoints.
const productFields = `
  p.product_id, p.product_name, p.manufacturer, p.part_number,
  p.product_type, p.description, p.technical_specs, p.is_active,
  c.category_name
`;

async function getAllProducts() {
  const result = await pool.query(`
    SELECT ${productFields}
    FROM products p
    JOIN categories c ON p.category_id = c.category_id
    WHERE p.is_active = TRUE
    ORDER BY p.product_id;
  `);
  return result.rows;
}

async function getProductById(productId) {
  const result = await pool.query(`
    SELECT ${productFields}
    FROM products p
    JOIN categories c ON p.category_id = c.category_id
    WHERE p.product_id = $1 AND p.is_active = TRUE
  `, [productId]);
  return result.rows[0] || null;
}

async function getProductsCollection({ q = "", filter = [], sort = "product_name", page = 1, perPage = 12 }) {
  const values = [];
  const conditions = ["p.is_active = TRUE"];

  if (q && typeof q === "string" && q.trim()) {
    values.push(`%${q.trim()}%`);
    const parameter = `$${values.length}`;
    conditions.push(`(
      p.product_name ILIKE ${parameter} OR p.part_number ILIKE ${parameter}
      OR p.manufacturer ILIKE ${parameter} OR p.description ILIKE ${parameter}
    )`);
  }

  // Dynamic SQL identifiers must only come from these fixed mappings.
  const filterColumns = {
    category_name: "c.category_name",
    manufacturer: "p.manufacturer",
    product_type: "p.product_type",
  };

  for (const item of Array.isArray(filter) ? filter : []) {
    if (!item || typeof item !== "object" || !filterColumns[item.key]) continue;

    const isLike = item.operator === "LIKE";
    const value = String(item.value ?? "");
    values.push(isLike ? `%${value}%` : value);
    conditions.push(`${filterColumns[item.key]} ${isLike ? "ILIKE" : "="} $${values.length}`);
  }

  const sortColumns = {
    product_name: "p.product_name",
    part_number: "p.part_number",
    manufacturer: "p.manufacturer",
    category_name: "c.category_name",
  };

  const orderParts = String(sort)
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean)
    .map((field) => {
      const column = sortColumns[field.replace(/^[-+]/, "")];
      return column ? `${column} ${field.startsWith("-") ? "DESC" : "ASC"}` : null;
    })
    .filter(Boolean);

  if (orderParts.length === 0) orderParts.push("p.product_name ASC");
  orderParts.push("p.product_id ASC");

  const whereClause = conditions.join(" AND ");
  const countResult = await pool.query(`
    SELECT COUNT(*) AS total
    FROM products p
    JOIN categories c ON p.category_id = c.category_id
    WHERE ${whereClause}
  `, values);

  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safePerPage = Number(perPage) > 0 ? Number(perPage) : 12;
  const offset = (safePage - 1) * safePerPage;

  const result = await pool.query(`
    SELECT ${productFields}
    FROM products p
    JOIN categories c ON p.category_id = c.category_id
    WHERE ${whereClause}
    ORDER BY ${orderParts.join(", ")}
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}
  `, [...values, safePerPage, offset]);

  return {
    products: result.rows,
    totalItems: Number(countResult.rows[0].total),
  };
}

async function getProductFilterOptions() {
  const categories = await pool.query(`
    SELECT DISTINCT c.category_name
    FROM products p
    JOIN categories c ON p.category_id = c.category_id
    WHERE p.is_active = TRUE
    ORDER BY c.category_name
  `);

  const manufacturers = await pool.query(`
    SELECT DISTINCT manufacturer
    FROM products
    WHERE is_active = TRUE AND manufacturer IS NOT NULL
    ORDER BY manufacturer
  `);

  return {
    categories: categories.rows.map((row) => row.category_name),
    manufacturers: manufacturers.rows.map((row) => row.manufacturer),
  };
}

module.exports = {
  getAllProducts,
  getProductById,
  getProductsCollection,
  getProductFilterOptions,
};
