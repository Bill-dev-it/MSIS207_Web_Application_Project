import apiClient from "../../../../shared/services/apiClient";

export const ordersApi = {
  async getOrders({ status = "ALL", search = "", page = 1, limit = 10 } = {}) {
    const params = new URLSearchParams();
    if (status && status !== "ALL") params.append("status", status);
    if (search) params.append("search", search);
    params.append("page", String(page));
    params.append("limit", String(limit));

    const res = await apiClient.get(`/v1/orders?${params.toString()}`);
    return res.data;
  },
};

export default ordersApi;

