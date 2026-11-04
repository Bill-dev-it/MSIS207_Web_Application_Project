import apiClient from "../../../../shared/services/apiClient";

export const checkoutApi = {
  async getAddresses() {
    const res = await apiClient.get("/v1/checkout/addresses");
    return res.data || [];
  },

  async addAddress(addressData) {
    const res = await apiClient.post("/v1/checkout/addresses", addressData);
    return res.data;
  },

  async getDeliveryMethods() {
    const res = await apiClient.get("/v1/checkout/delivery-methods");
    return res.data || [];
  },

  async getCompany() {
    const res = await apiClient.get("/v1/checkout/company");
    return res.data || null;
  },

  async placeOrder(orderPayload) {
    const res = await apiClient.post("/v1/checkout/orders", orderPayload);
    return res.data;
  },
};

export default checkoutApi;

