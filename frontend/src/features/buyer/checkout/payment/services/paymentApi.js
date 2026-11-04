import checkoutApi from "../../services/checkoutApi";

export const paymentApi = {
  getCompany: checkoutApi.getCompany,
  getSupportedPaymentMethods: async () => {
    return [
      {
        id: "NET_30",
        name: "Corporate Credit Account (Net 30 Terms)",
        badge: "Preferred B2B",
        description: "Direct invoicing against approved corporate credit line. Invoices payable within 30 days of release.",
        icon: "credit-line",
      },
      {
        id: "SIMULATION",
        name: "AeroRUL Simulated Escrow Authorization",
        badge: "Demo Instant",
        description: "Immediate simulated payment clearance for automated procurement validation & testing.",
        icon: "shield",
      },
      {
        id: "WIRE_TRANSFER",
        name: "Wire Transfer / International SWIFT",
        badge: "Pre-dispatch",
        description: "Official proforma invoice provided upon order confirmation. Shipment dispatched upon funds verification.",
        icon: "bank",
      },
    ];
  },
};

export default paymentApi;
