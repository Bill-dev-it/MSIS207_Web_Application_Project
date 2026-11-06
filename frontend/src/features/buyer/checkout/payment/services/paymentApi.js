import checkoutApi from "../../services/checkoutApi";

export const SUPPORTED_PAYMENT_METHODS = [
  {
    id: "SIMULATION",
    name: "Simulated Payment",
    badge: "Immediate demo success",
    description:
      "The system records a successful test payment immediately. No money is transferred.",
    notice: "No real money is transferred.",
  },
  {
    id: "BANK_TRANSFER",
    name: "Bank Transfer (Demo)",
    badge: "Pending admin confirmation",
    description:
      "Place an order with payment pending until an administrator confirms it in the demonstration system.",
    notice: "Do not transfer real money.",
  },
];

export function isSupportedPaymentMethod(methodId) {
  return SUPPORTED_PAYMENT_METHODS.some((method) => method.id === methodId);
}

export function getPaymentMethodMeta(methodId) {
  return (
    SUPPORTED_PAYMENT_METHODS.find((method) => method.id === methodId) || null
  );
}

export const paymentApi = {
  getCompany: checkoutApi.getCompany,
  getSupportedPaymentMethods: async () => SUPPORTED_PAYMENT_METHODS,
};

export default paymentApi;
