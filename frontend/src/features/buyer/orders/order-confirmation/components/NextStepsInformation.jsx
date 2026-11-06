export default function NextStepsInformation({ order }) {
  const paymentMethod = order?.payment_method ?? order?.payment?.payment_method ?? null;
  const paymentStatus = order?.payment_status ?? order?.payment?.status ?? null;
  const isPendingBankTransfer =
    paymentMethod === "BANK_TRANSFER" && paymentStatus === "PENDING";
  const isCancelled = paymentStatus === "CANCELLED";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
        Order status and fulfillment
      </h2>
      <p className="mt-3 text-sm text-slate-600">
        {isPendingBankTransfer
          ? "This order is recorded with payment PENDING under Bank Transfer (Demo). Supplier processing and shipment transitions are blocked until an administrator confirms the payment in the demonstration system."
          : isCancelled
          ? "Payment for this order was cancelled. The order cannot proceed to Supplier fulfillment."
          : "This confirmation records the order and its demonstration payment status. Supplier processing, shipment, and tracking details appear in Order Details only when those statuses and records are provided by the backend."}
      </p>
    </section>
  );
}
