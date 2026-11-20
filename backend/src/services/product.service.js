"use strict";

const pool = require("../config/db");

// Shared projection returned by both the collection and product-detail endpoints.
const PRODUCT_FIELDS = `
  p.product_id, p.product_name, p.manufacturer, p.part_number,
  p.product_type, p.description, p.technical_specs, p.is_active,
  c.category_name
`;

// Only approved column names may appear in dynamic SQL filters or ORDER BY clauses.
const FILTER_COLUMNS = {
  category_name: "c.category_name",
  manufacturer: "p.manufacturer",
  product_type: "p.product_type",
};

const SORT_COLUMNS = {
  product_name: "p.product_name",
  part_number: "p.part_number",
  manufacturer: "p.manufacturer",
  category_name: "c.category_name",
};

function buildProductFilters({ q = "", filter = [] }) {
  const values = [];
  const conditions = ["p.is_active = TRUE"];

  if (q && typeof q === "string" && q.trim()) {
    // Each filter value uses a numbered parameter instead of string interpolation.
    values.push(`%${q.trim()}%`);
    const parameter = `$${values.length}`;
    conditions.push(`(
      p.product_name ILIKE ${parameter} OR p.part_number ILIKE ${parameter}
      OR p.manufacturer ILIKE ${parameter} OR p.description ILIKE ${parameter}
    )`);
  }

  for (const item of Array.isArray(filter) ? filter : []) {
    if (!item || typeof item !== "object" || !FILTER_COLUMNS[item.key]) continue;

    const isLike = item.operator === "LIKE";
    const value = String(item.value ?? "");
    values.push(isLike ? `%${value}%` : value);
    conditions.push(`${FILTER_COLUMNS[item.key]} ${isLike ? "ILIKE" : "="} $${values.length}`);
  }

  return {
    whereClause: conditions.join(" AND "),
    values,
  };
}

function buildProductOrderBy(sort) {
  const requestedFields = String(sort).split(",");
  const orderParts = [];

  for (const rawField of requestedFields) {
    const sortField = rawField.trim();
    if (!sortField) continue;

    const direction = sortField.startsWith("-") ? "DESC" : "ASC";
    const fieldName = sortField.replace(/^[-+]/, "");
    const columnName = SORT_COLUMNS[fieldName];
    if (!columnName) continue;

    orderParts.push(`${columnName} ${direction}`);
  }

  if (orderParts.length === 0) {
    orderParts.push("p.product_name ASC");
  }

  // The product ID keeps pagination order stable when names are identical.
  orderParts.push("p.product_id ASC");
  return orderParts.join(", ");
}

async function getAllProducts() {
  const result = await pool.query(`
    SELECT ${PRODUCT_FIELDS}
    FROM products p
    JOIN categories c ON p.category_id = c.category_id
    WHERE p.is_active = TRUE
    ORDER BY p.product_id;
  `);
  return result.rows;
}

async function getProductById(productId) {
  const result = await pool.query(`
    SELECT ${PRODUCT_FIELDS}
    FROM products p
    JOIN categories c ON p.category_id = c.category_id
    WHERE p.product_id = $1 AND p.is_active = TRUE
  `, [productId]);
  return result.rows[0] || null;
}

async function getProductsCollection({ q = "", filter = [], sort = "product_name", page = 1, perPage = 12 }) {
  const { whereClause, values } = buildProductFilters({ q, filter });
  const orderByClause = buildProductOrderBy(sort);

  // Reuse the same WHERE clause and parameter values for count and page queries.
  const countResult = await pool.query(`
    SELECT COUNT(*) AS total
    FROM products p
    JOIN categories c ON p.category_id = c.category_id
    WHERE ${whereClause}
  `, values);

  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safePerPage = Number(perPage) > 0 ? Number(perPage) : 12;
  const offset = (safePage - 1) * safePerPage;

  // LIMIT and OFFSET use the next two parameter slots right after all filter values.
  const limitParam = `$${values.length + 1}`;
  const offsetParam = `$${values.length + 2}`;

  const result = await pool.query(`
    SELECT ${PRODUCT_FIELDS}
    FROM products p
    JOIN categories c ON p.category_id = c.category_id
    WHERE ${whereClause}
    ORDER BY ${orderByClause}
    LIMIT ${limitParam} OFFSET ${offsetParam}
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
