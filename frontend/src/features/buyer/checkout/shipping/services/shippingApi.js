import checkoutApi from "../../services/checkoutApi";

export const shippingApi = {
  getAddresses: checkoutApi.getAddresses,
  addAddress: checkoutApi.addAddress,
  getDeliveryMethods: checkoutApi.getDeliveryMethods,
  getCompany: checkoutApi.getCompany,
};

export default shippingApi;

