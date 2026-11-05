import { buyerRequest } from "../../../../../services/buyerApi";

export const orderConfirmationApi = {
  async getOrderConfirmation(orderId, { signal } = {}) {
    return (await buyerRequest(`/v1/orders/${encodeURIComponent(orderId)}/confirmation`, { signal })).data;
  },
};

export default orderConfirmationApi;
