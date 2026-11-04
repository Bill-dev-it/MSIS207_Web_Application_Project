import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BuyerPortalShell from "../../../../../shared/components/BuyerPortalShell";
import CheckoutStepper from "../../components/CheckoutStepper";
import CheckoutOrderSummary from "../../components/CheckoutOrderSummary";
import PaymentMethodSelector from "../components/PaymentMethodSelector";
import BillingInformation from "../components/BillingInformation";
import { useCheckoutPayment } from "../hooks/useCheckoutPayment";
import { useCart } from "../../../cart";

export default function CheckoutPaymentPage() {
  const navigate = useNavigate();
  const { items, subtotal } = useCart();
  const {
    paymentMethods,
    company,
    selectedMethodId,
    useShippingAddressForBilling,
    billingNotes,
    loading,
    error,
    selectPaymentMethod,
    setUseShippingAddressForBilling,
    updateBillingNotes,
  } = useCheckoutPayment();

  const [purchaseReference] = useState(() => {
    return sessionStorage.getItem("aerorul_po_reference") || "";
  });

  const deliveryMethodId = sessionStorage.getItem("aerorul_checkout_delivery_id") || "STANDARD";
  const shippingFee = deliveryMethodId === "EXPRESS" ? 2900 : 1250;
  const deliveryName = deliveryMethodId === "EXPRESS" ? "AOG Expedited (24-48 Hours)" : "Standard Freight (3-5 Days)";

  const handleContinue = () => {
    if (!selectedMethodId) {
      alert("Please select a commercial payment method.");
      return;
    }
    navigate("/checkout/review");
  };

  return (
    <BuyerPortalShell activeNav="cart">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stepper Step 3 */}
        <CheckoutStepper currentStep={3} />

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Commercial Payment Terms
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Select commercial invoicing terms or instant simulated escrow authorization.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-600">
              Retrieving corporate credit terms and payment channels...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm mb-6 flex items-start gap-3">
            <span className="font-bold">⚠️</span>
            <div>
              <p className="font-semibold">Unable to load payment options</p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols */}
            <div className="lg:col-span-8 space-y-6">
              <PaymentMethodSelector
                methods={paymentMethods}
                selectedMethodId={selectedMethodId}
                onSelectMethod={selectPaymentMethod}
              />

              <BillingInformation
                useShippingAddressForBilling={useShippingAddressForBilling}
                onToggleSameAsShipping={setUseShippingAddressForBilling}
                company={company}
                billingNotes={billingNotes}
                onBillingNotesChange={updateBillingNotes}
              />

              {/* Navigation */}
              <div className="pt-4 flex items-center justify-between gap-4 border-t border-slate-200">
                <Link
                  to="/checkout/shipping"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Shipping
                </Link>

                <button
                  type="button"
                  onClick={handleContinue}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Review</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Right 4 Cols */}
            <div className="lg:col-span-4">
              <CheckoutOrderSummary
                items={items}
                subtotal={subtotal}
                shippingFee={shippingFee}
                deliveryMethodName={deliveryName}
                purchaseReference={purchaseReference}
                currentStep={3}
              />
            </div>
          </div>
        )}
      </div>
    </BuyerPortalShell>
  );
}

