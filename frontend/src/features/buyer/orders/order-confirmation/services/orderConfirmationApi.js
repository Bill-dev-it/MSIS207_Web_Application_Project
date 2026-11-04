import apiClient from "../../../../../shared/services/apiClient";

export const orderConfirmationApi = {
  async getOrderConfirmation(orderId) {
    const res = await apiClient.get(`/v1/orders/${orderId}/confirmation`);
    return res.data;
  },
};

export default orderConfirmationApi;

