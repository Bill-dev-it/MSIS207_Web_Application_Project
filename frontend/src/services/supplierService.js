import { SUPPLIER_DEMO_MODE } from "../features/supplier/api";
import { demoListings } from "../mocks/supplierListings";
import { fetchListings, fetchListing, createListing, updateListing, hideListing } from "../features/supplier/listings/listingApi";
import { saveStock } from "../features/supplier/inventory/inventoryApi";


export async function getSupplierListings() {
  return SUPPLIER_DEMO_MODE ? demoListings : fetchListings();
}

export async function getSupplierListingById(listingId) {
  if (!SUPPLIER_DEMO_MODE) return fetchListing(listingId);
  return demoListings.find((item) => String(item.listing_id) === String(listingId)) || null;
}

export async function saveSupplierListing(listingId, form) {
  if (SUPPLIER_DEMO_MODE) return null;
  const body = {
    product_id: form.product_id,
    seller_sku: form.seller_sku.trim(), condition: form.condition,
    price: form.price, stock_quantity: Number(form.stock_quantity),
    lead_time_days: Number(form.lead_time_days), status: form.status,
  };
  return listingId ? updateListing(listingId, body) : createListing(body);
}

export async function hideSupplierListing(listingId) {
  if (SUPPLIER_DEMO_MODE) return null;
  return hideListing(listingId);
}

export async function updateSupplierStock(listingId, stockQuantity) {
  if (SUPPLIER_DEMO_MODE) return null;
  return saveStock(listingId, stockQuantity);
}
