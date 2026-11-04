import apiClient from "../../../../../shared/services/apiClient";

export const orderDetailApi = {
  async getOrderDetail(orderId) {
    const res = await apiClient.get(`/v1/orders/${orderId}`);
    return res.data;
  },
};

export default orderDetailApi;

