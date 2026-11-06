import { Link, useNavigate } from "react-router-dom";
import CheckoutStepper from "../../features/buyer/checkout/components/CheckoutStepper";
import CheckoutOrderSummary from "../../features/buyer/checkout/components/CheckoutOrderSummary";
import PaymentMethodSelector from "../../features/buyer/checkout/payment/components/PaymentMethodSelector";
import BillingInformation from "../../features/buyer/checkout/payment/components/BillingInformation";
import { useCheckoutPayment } from "../../features/buyer/checkout/payment/hooks/useCheckoutPayment";
import { isSupportedPaymentMethod } from "../../features/buyer/checkout/payment/services/paymentApi";
import { useCart } from "../../features/buyer/cart";

export default function CheckoutPaymentPage() {
  const navigate = useNavigate();
  const { items, subtotal } = useCart();
  const {
    paymentMethods,
    company,
    selectedMethodId,
    selectedDeliveryMethod,
    loading,
    error,
    selectPaymentMethod,
  } = useCheckoutPayment();

  const canContinue =
    isSupportedPaymentMethod(selectedMethodId) &&
    Boolean(selectedDeliveryMethod) &&
    items.length > 0;

  const handleContinue = () => {
    if (!canContinue) {
      return;
    }
    navigate("/checkout/review");
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stepper Step 3 */}
        <CheckoutStepper currentStep={3} />

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Payment Method (Demo)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Choose between Simulated Payment and Bank Transfer (Demo) and review your freight estimate.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-600">
              Loading Buyer company and delivery estimate...
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

              <BillingInformation company={company} />

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
                  disabled={!canContinue}
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
                shippingFee={selectedDeliveryMethod?.cost || 0}
                deliveryMethodName={selectedDeliveryMethod?.name || "Not selected"}
                currentStep={3}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
