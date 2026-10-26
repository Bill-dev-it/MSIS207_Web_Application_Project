
/*
 * Supplier Offers Service
 *
 * Frontend demo only.
 * Future API:
 * GET /api/v1/products/:productId/listings
 *
 * This data is not from PostgreSQL.
 */

const demoOffers = [
  {
    listing_id: 1,
    product_id: 1,
    supplier_id: 1,
    store_name: "Demo Aero Parts",
    seller_sku: "DEMO-S01-P0001",
    condition: "NEW",
    price: 320,
    stock_quantity: 12,
    lead_time_days: 3,
    status: "ACTIVE",
  },
  {
    listing_id: 4,
    product_id: 1,
    supplier_id: 2,
    store_name: "Demo Aviation Supply",
    seller_sku: "DEMO-S02-P0001",
    condition: "REFURBISHED",
    price: 295,
    stock_quantity: 5,
    lead_time_days: 7,
    status: "ACTIVE",
  },
];

export async function getProductOffers(productId) {
  // Only return offers for the matching product.
  return demoOffers.filter(
    (offer) =>
      String(offer.product_id) === String(productId) &&
      offer.status === "ACTIVE"
  );
}
