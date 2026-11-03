import { supplierRequest } from "../api";

export async function fetchInventory() {
  return (await supplierRequest("/inventory")).data;
}
export async function saveStock(listingId, stockQuantity) {
  return (await supplierRequest(`/inventory/${encodeURIComponent(listingId)}`, {
    method: "PATCH", body: { stock_quantity: stockQuantity },
  })).data;
}
