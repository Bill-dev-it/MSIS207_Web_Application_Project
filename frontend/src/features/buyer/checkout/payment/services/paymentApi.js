import checkoutApi from "../../services/checkoutApi";

export const paymentApi = {
  getCompany: checkoutApi.getCompany,
  getSupportedPaymentMethods: async () => {
    return [
      {
        id: "SIMULATION",
        name: "Simulated payment (development only)",
        badge: "Not a real payment",
        description: "Records a simulated payment result for integration testing. No payment is collected or transferred.",
      },
    ];
  },
};

export default paymentApi;
