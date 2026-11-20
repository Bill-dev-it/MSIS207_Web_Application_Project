"use strict";

const productService = require("../services/product.service");

const MAX_BIGINT_ID = 9223372036854775807n;
const MAX_PER_PAGE = 100;
const MAX_SEARCH_LENGTH = 200;
const MAX_SORT_FIELDS = 4;
const MAX_FILTERS = 10;
const MAX_FILTER_VALUE_LENGTH = 200;

// Sort and filter allowlists match the SQL mappings inside product.service.js.
const ALLOWED_SORTS = ["product_name", "part_number", "manufacturer", "category_name"];
const ALLOWED_FILTER_KEYS = ["category_name", "manufacturer", "product_type"];
const ALLOWED_FILTER_OPERATORS = ["=", "LIKE"];

function sendError(res, status, code, message) {
  return res.status(status).json({
    success: false,
    error: { code, message },
  });
}

function isPositiveBigIntId(value) {
  return typeof value === "string" && /^[1-9]\d*$/.test(value) && BigInt(value) <= MAX_BIGINT_ID;
}

// Express parses repeated query keys (e.g. ?page=1&page=2) as arrays; reject non-strings early.
function readProductCollectionQuery(query) {
  const {
    q = "",
    sort = "product_name",
    filter = "[]",
    page = "1",
    per_page = "12",
  } = query;

  if ([q, sort, filter, page, per_page].some((value) => typeof value !== "string")) {
    return { error: { code: "INVALID_QUERY", message: "Query parameters must be strings." } };
  }

  return { q, sort, filter, page, per_page };
}

// Validate pagination before querying PostgreSQL so OFFSET math cannot overflow safe integers.
function validatePagination(page, perPage) {
  const pageNumber = Number(page);
  const perPageNumber = Number(perPage);
  const valid =
    /^[1-9]\d*$/.test(page) &&
    /^[1-9]\d*$/.test(perPage) &&
    Number.isSafeInteger(pageNumber) &&
    Number.isSafeInteger(perPageNumber) &&
    perPageNumber <= MAX_PER_PAGE &&
    (pageNumber - 1) * perPageNumber <= Number.MAX_SAFE_INTEGER;

  if (!valid) {
    return { error: { code: "INVALID_PAGINATION", message: "page must be positive and per_page must be 1–100." } };
  }

  return { pageNumber, perPageNumber };
}

function validateSearchQuery(q) {
  if (q.length > MAX_SEARCH_LENGTH) {
    return { code: "INVALID_SEARCH", message: "Search text must not exceed 200 characters." };
  }
  return null;
}

// Only accept whitelisted sort fields; raw user input must never become a SQL column identifier.
function validateSort(sort) {
  const sortFields = sort.split(",");
  const hasInvalidField = sortFields.some(
    (field) => !ALLOWED_SORTS.includes(field.replace(/^[-+]/, ""))
  );

  if (sortFields.length > MAX_SORT_FIELDS || hasInvalidField) {
    return { code: "INVALID_SORT", message: "Unsupported sorting field." };
  }
  return null;
}

function isValidFilterItem(item) {
  return (
    Boolean(item) &&
    typeof item === "object" &&
    !Array.isArray(item) &&
    ALLOWED_FILTER_KEYS.includes(item.key) &&
    ALLOWED_FILTER_OPERATORS.includes(item.operator) &&
    typeof item.value === "string" &&
    item.value.length <= MAX_FILTER_VALUE_LENGTH
  );
}

function parseProductFilters(filterJson) {
  let filters;
  try {
    filters = JSON.parse(filterJson);
  } catch {
    return { error: { code: "INVALID_FILTER", message: "filter must be a valid JSON array." } };
  }

  if (!Array.isArray(filters) || filters.length > MAX_FILTERS || !filters.every(isValidFilterItem)) {
    return { error: { code: "INVALID_FILTER", message: "Unsupported filter field, operator or value." } };
  }

  return { filters };
}

// Legacy /api/products handler retained alongside /api/v1/products for compatibility.
async function getProducts(req, res) {
  try {
    const products = await productService.getAllProducts();
    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Get products failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve products",
    });
  }
}

async function getProductsV1(req, res) {
  const queryResult = readProductCollectionQuery(req.query);
  if (queryResult.error) {
    return sendError(res, 400, queryResult.error.code, queryResult.error.message);
  }

  const paginationResult = validatePagination(queryResult.page, queryResult.per_page);
  if (paginationResult.error) {
    return sendError(res, 400, paginationResult.error.code, paginationResult.error.message);
  }

  const searchError = validateSearchQuery(queryResult.q);
  if (searchError) {
    return sendError(res, 400, searchError.code, searchError.message);
  }

  const sortError = validateSort(queryResult.sort);
  if (sortError) {
    return sendError(res, 400, sortError.code, sortError.message);
  }

  const filterResult = parseProductFilters(queryResult.filter);
  if (filterResult.error) {
    return sendError(res, 400, filterResult.error.code, filterResult.error.message);
  }

  try {
    const { products, totalItems } = await productService.getProductsCollection({
      q: queryResult.q.trim(),
      sort: queryResult.sort,
      filter: filterResult.filters,
      page: paginationResult.pageNumber,
      perPage: paginationResult.perPageNumber,
    });

    return res.status(200).json({
      success: true,
      count: products.length,
      meta: {
        page: paginationResult.pageNumber,
        per_page: paginationResult.perPageNumber,
        total_items: totalItems,
        total_pages: Math.ceil(totalItems / paginationResult.perPageNumber),
      },
      data: products,
    });
  } catch (error) {
    console.error("Get products collection failed:", error);
    return sendError(res, 500, "INTERNAL_SERVER_ERROR", "Unable to retrieve products.");
  }
}

async function getProductFilterOptions(req, res) {
  try {
    const data = await productService.getProductFilterOptions();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get filter options failed:", error);
    return sendError(res, 500, "INTERNAL_SERVER_ERROR", "Unable to retrieve filter options.");
  }
}

async function getProductById(req, res) {
  const { productId } = req.params;
  if (!isPositiveBigIntId(productId)) {
    return sendError(res, 400, "INVALID_PRODUCT_ID", "Product ID must be a valid positive integer.");
  }

  try {
    const product = await productService.getProductById(productId);
    if (!product) {
      return sendError(res, 404, "PRODUCT_NOT_FOUND", "Product not found.");
    }
    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("Get product by ID failed:", error);
    return sendError(res, 500, "INTERNAL_SERVER_ERROR", "Unable to retrieve product.");
  }
}

module.exports = {
  getProducts,
  getProductsV1,
  getProductFilterOptions,
  getProductById,
};
