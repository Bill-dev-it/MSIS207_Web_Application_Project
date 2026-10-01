const { HttpError } = require("../utils/errors");

/** Wrap async route handlers so rejections reach the error middleware (Express 5 does it too; kept explicit). */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found`, code: "ROUTE_NOT_FOUND" });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
    });
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed JSON body", code: "BAD_REQUEST" });
  }
  // PostgreSQL constraint violations → client errors rather than 500
  if (err?.code === "23505") return res.status(409).json({ error: "Duplicate value", code: "CONFLICT" });
  if (err?.code === "23503") return res.status(409).json({ error: "Referenced record missing", code: "FK_VIOLATION" });
  if (err?.code === "23514") return res.status(422).json({ error: "Value violates a database rule", code: "CHECK_VIOLATION" });

  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
}

module.exports = { asyncHandler, notFoundHandler, errorHandler };
