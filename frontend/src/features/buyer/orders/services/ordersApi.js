import { buyerRequest } from "../../../../services/buyerApi";

export const ordersApi = {
  async getOrders({ status = "ALL", search = "", page = 1, limit = 10, signal } = {}) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status && status !== "ALL") params.set("status", status);
    if (search.trim()) params.set("search", search.trim());
    const response = await buyerRequest(`/v1/orders?${params}`, { signal });
    return {
      orders: response.data,
      counts: response.meta?.counts || {},
      pagination: response.meta?.pagination || { page: 1, limit, total: 0, totalPages: 0 },
    };
  },
};

export default ordersApi;
