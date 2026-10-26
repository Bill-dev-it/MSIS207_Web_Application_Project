
/*
 * Supplier Service
 * Temporary demo data for frontend development.
 * Later, this file will call the Express API.
 */

const demoListings = [
  {
    listing_id: 1,
    supplier_id: 1,
    product_id: 1,
    seller_sku: "DEMO-S01-P0001",
    product_name: "Engine Ignition Lead",
    condition: "NEW",
    price: 320,
    stock_quantity: 12,
    lead_time_days: 3,
    status: "ACTIVE",
  },
  {
    listing_id: 2,
    supplier_id: 1,
    product_id: 2,
    seller_sku: "DEMO-S01-P0002",
    product_name: "Fuel System Component",
    condition: "REFURBISHED",
    price: 540,
    stock_quantity: 0,
    lead_time_days: 7,
    status: "DRAFT",
  },
  {
    listing_id: 3,
    supplier_id: 1,
    product_id: 3,
    seller_sku: "DEMO-S01-P0003",
    product_name: "Aircraft Oil Filter",
    condition: "NEW",
    price: 145,
    stock_quantity: 25,
    lead_time_days: 2,
    status: "ACTIVE",
  },
];

export async function getSupplierListings() {
  return demoListings;
}

export async function getSupplierListingById(listingId) {
  const listings = await getSupplierListings();

  return listings.find(
    (listing) => String(listing.listing_id) === String(listingId)
  ) || null;
}
