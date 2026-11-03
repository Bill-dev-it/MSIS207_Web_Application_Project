import { supplierRequest } from "../api";

export async function fetchOrders() {
  return (await supplierRequest("/orders")).data;
}
export async function fetchOrder(id) {
  return (await supplierRequest(`/orders/${encodeURIComponent(id)}`)).data;
}
export async function advanceOrderStatus(id, status) {
  return (await supplierRequest(`/orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH", body: { status },
  })).data;
}
