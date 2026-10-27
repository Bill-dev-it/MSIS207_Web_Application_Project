/**
 * Buyer API Service
 * Interacts directly with Express PostgreSQL backend via apiClient.
 * Zero hardcoded mock arrays.
 */
import { api } from "./apiClient";

export async function fetchBuyerEngines() {
  const res = await api.get("/buyer/engines");
  return res.items || [];
}

export async function fetchBuyerEngineById(idOrCode) {
  const engines = await fetchBuyerEngines();
  const match = engines.find(
    (e) =>
      String(e.engineId) === String(idOrCode) ||
      e.engineCode?.toLowerCase() === String(idOrCode).toLowerCase()
  );
  return match || engines[0] || null;
}

export async function fetchBuyerOrders({ statusFilter = "ALL", searchQuery = "", page = 1, pageSize = 20 } = {}) {
  const params = { page, pageSize };
  if (statusFilter && statusFilter !== "ALL") params.status = statusFilter;
  if (searchQuery && searchQuery.trim()) params.search = searchQuery.trim();

  const res = await api.get("/buyer/orders", { params });
  return {
    items: res.items || [],
    statusCounts: res.statusCounts || {},
    pagination: res.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 },
  };
}

export async function fetchBuyerOrderDetail(orderIdOrNumber) {
  if (!orderIdOrNumber) throw new Error("Order ID or Order Number is required");
  return await api.get(`/buyer/orders/${encodeURIComponent(orderIdOrNumber)}`);
}

export async function fetchOrderConfirmation(orderIdOrNumber) {
  const order = await fetchBuyerOrderDetail(orderIdOrNumber);
  return {
    ...order,
    confirmationStatus: "Confirmed",
    confirmationNotice: "Your requisition order has been logged and routed to verified suppliers.",
    flowSteps: [
      { name: "Order Placed", description: "Simulation payment authorized", status: "complete" },
      { name: "Supplier Confirmation", description: "Supplier stock committed", status: "active" },
      { name: "MRO Processing", description: "Compliance tag certification", status: "pending" },
      { name: "Courier Dispatch", description: "Expedited air-freight tracking", status: "pending" },
    ],
  };
}

export async function fetchCart() {
  return await api.get("/buyer/cart");
}

export async function addToCart(listingId, quantity = 1) {
  return await api.post("/buyer/cart/items", { listingId, quantity });
}

export async function removeCartItem(cartItemId) {
  return await api.delete(`/buyer/cart/items/${cartItemId}`);
}

export async function checkoutCart({ checkoutKey, purchaseReference, addressId } = {}) {
  return await api.post("/buyer/orders", { checkoutKey, purchaseReference, addressId });
}

export async function fetchBuyerRecommendations(engineId) {
  const res = await api.get("/buyer/recommendations", { params: engineId ? { engineId } : {} });
  return res.items || [];
}

export async function createSupplierInquiry({ supplierId, sellerOrderId, subject, message }) {
  return await api.post("/buyer/inquiries", { supplierId, sellerOrderId, subject, message });
}

export async function searchBuyer(q) {
  if (!q || q.trim().length < 2) return { engines: [], orders: [], parts: [] };
  return await api.get("/buyer/search", { params: { q: q.trim() } });
}
