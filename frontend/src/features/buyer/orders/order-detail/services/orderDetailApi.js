import { buyerRequest } from "../../../../../services/buyerApi";

export const orderDetailApi = {
  async getOrderDetail(orderId, { signal } = {}) {
    return (await buyerRequest(`/v1/orders/${encodeURIComponent(orderId)}`, { signal })).data;
  },
};

export default orderDetailApi;
