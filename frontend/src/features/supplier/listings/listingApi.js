import { supplierRequest } from "../api";

export async function fetchListings() {
  return (await supplierRequest("/listings")).data;
}
export async function fetchListing(id) {
  return (await supplierRequest(`/listings/${encodeURIComponent(id)}`)).data;
}
export async function createListing(form) {
  return (await supplierRequest("/listings", { method: "POST", body: form })).data;
}
export async function updateListing(id, form) {
  return (await supplierRequest(`/listings/${encodeURIComponent(id)}`, { method: "PATCH", body: form })).data;
}
export async function hideListing(id) {
  return supplierRequest(`/listings/${encodeURIComponent(id)}`, { method: "DELETE" });
}
