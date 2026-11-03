import { SUPPLIER_DEMO_MODE } from "../features/supplier/api";
import { demoListings } from "../mocks/supplierListings";
import { fetchListings, fetchListing, createListing, updateListing, hideListing } from "../features/supplier/listings/listingApi";
import { fetchInventory, saveStock } from "../features/supplier/inventory/inventoryApi";


export async function getSupplierListings() {
  return SUPPLIER_DEMO_MODE ? demoListings : fetchListings();
}

/**
 * @returns {Promise<{
 *   summary: { total_listings: number, in_stock: number, low_stock: number, out_of_stock: number },
 *   items: Array<{
 *     listing_id: string | number,
 *     seller_sku: string,
 *     product_id: string | number,
 *     product_name: string,
 *     stock_quantity: number,
 *     status: string,
 *     updated_at?: string
 *   }>
 * }>}
 */
export async function getSupplierInventory() {
  if (!SUPPLIER_DEMO_MODE) return fetchInventory();

  const items = demoListings;
  const summary = { total_listings: items.length, in_stock: 0, low_stock: 0, out_of_stock: 0 };
  for (const item of items) {
    if (item.stock_quantity === 0) summary.out_of_stock++;
    else if (item.stock_quantity <= 5) summary.low_stock++;
    else summary.in_stock++;
  }
  return { summary, items };
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
