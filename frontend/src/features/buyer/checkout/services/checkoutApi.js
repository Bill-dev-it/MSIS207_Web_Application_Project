import { buyerRequest } from "../../../../services/buyerApi";

export const checkoutApi = {
  async getAddresses({ signal } = {}) {
    return (await buyerRequest("/v1/checkout/addresses", { signal })).data;
  },
  async addAddress(addressData) {
    return (await buyerRequest("/v1/checkout/addresses", {
      method: "POST",
      body: addressData,
    })).data;
  },
  async getDeliveryMethods({ signal } = {}) {
    return (await buyerRequest("/v1/checkout/delivery-methods", { signal })).data;
  },
  async getCompany({ signal } = {}) {
    return (await buyerRequest("/v1/checkout/company", { signal })).data;
  },
  async placeOrder(orderPayload) {
    return (await buyerRequest("/v1/checkout/orders", {
      method: "POST",
      body: orderPayload,
    })).data;
  },
};

export default checkoutApi;
