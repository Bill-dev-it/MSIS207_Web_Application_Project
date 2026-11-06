import checkoutApi from "../../services/checkoutApi";

export const reviewApi = {
  getAddresses: checkoutApi.getAddresses,
  getDeliveryMethods: checkoutApi.getDeliveryMethods,
  getCompany: checkoutApi.getCompany,
  placeOrder: checkoutApi.placeOrder,
};

export default reviewApi;

