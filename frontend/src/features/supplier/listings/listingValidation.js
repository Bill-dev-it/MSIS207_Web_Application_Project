// Validate the existing Supplier Listing form before sending data to the API.
// This does not save data; the backend must validate again on submission.
export function validateListing(form) {
  const productId = Number(form.product_id);
  const price = Number(form.price);
  const stock = Number(form.stock_quantity);
  const leadTime = Number(form.lead_time_days);

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return "Product ID must be a positive integer.";
  }

  const sku = form.seller_sku.trim();
  if (!sku || sku.length > 100) {
    return "SKU must contain 1 to 100 characters.";
  }

  if (
    form.price.trim() === "" ||
    !/^\d+(\.\d{1,2})?$/.test(form.price) ||
    !Number.isFinite(price) ||
    price > 9999999999999999.99
  ) {
    return "Enter a valid non-negative price with up to 2 decimals.";
  }

  if (
    !Number.isSafeInteger(stock) || stock < 0 ||
    !Number.isSafeInteger(leadTime) || leadTime < 0
  ) {
    return "Stock and lead time must be non-negative integers.";
  }

  if (stock > 2147483647 || leadTime > 2147483647) {
    return "Stock and lead time exceed database limits.";
  }

  if (
    !["NEW", "USED", "REFURBISHED"].includes(form.condition) ||
    !["DRAFT", "ACTIVE", "HIDDEN"].includes(form.status)
  ) {
    return "Invalid condition or listing status.";
  }

  return "";
}
