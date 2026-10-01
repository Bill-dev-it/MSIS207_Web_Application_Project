const { validation } = require("./errors");

function intParam(value, name, { min = 1, max = Number.MAX_SAFE_INTEGER, required = true } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) throw validation(`${name} is required`, { field: name });
    return undefined;
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw validation(`${name} must be an integer between ${min} and ${max}`, { field: name });
  }
  return n;
}

function enumParam(value, name, allowed, { required = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) throw validation(`${name} is required`, { field: name });
    return undefined;
  }
  if (!allowed.includes(value)) {
    throw validation(`${name} must be one of: ${allowed.join(", ")}`, { field: name });
  }
  return value;
}

function stringParam(value, name, { max = 200, required = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) throw validation(`${name} is required`, { field: name });
    return undefined;
  }
  if (typeof value !== "string" || value.length > max) {
    throw validation(`${name} must be a string up to ${max} characters`, { field: name });
  }
  return value.trim();
}

/** Standard pagination: ?page=1&pageSize=20 (max 100). */
function parsePagination(query, { defaultSize = 20, maxSize = 100 } = {}) {
  const page = intParam(query.page, "page", { required: false }) ?? 1;
  const pageSize = intParam(query.pageSize, "pageSize", { required: false, max: maxSize }) ?? defaultSize;
  return { page, pageSize, limit: pageSize, offset: (page - 1) * pageSize };
}

const pageMeta = ({ page, pageSize }, total) => ({
  page,
  pageSize,
  total,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
});

/** Escape LIKE wildcards so user text is matched literally. */
const likePattern = (s) => `%${s.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

module.exports = { intParam, enumParam, stringParam, parsePagination, pageMeta, likePattern };
