class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const badRequest = (msg, details) => new HttpError(400, "BAD_REQUEST", msg, details);
const validation = (msg, details) => new HttpError(422, "VALIDATION_ERROR", msg, details);
const unauthorized = (msg = "Authentication required") => new HttpError(401, "UNAUTHENTICATED", msg);
const forbidden = (msg = "You do not have permission to access this resource") =>
  new HttpError(403, "FORBIDDEN", msg);
const notFound = (msg = "Resource not found") => new HttpError(404, "NOT_FOUND", msg);
const conflict = (code, msg, details) => new HttpError(409, code, msg, details);

module.exports = { HttpError, badRequest, validation, unauthorized, forbidden, notFound, conflict };
