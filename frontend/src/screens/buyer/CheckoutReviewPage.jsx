import { Link, useNavigate } from "react-router-dom";
import CheckoutStepper from "../../features/buyer/checkout/components/CheckoutStepper";
import CheckoutOrderSummary from "../../features/buyer/checkout/components/CheckoutOrderSummary";
import ReviewItems from "../../features/buyer/checkout/review/components/ReviewItems";
import ReviewShipping from "../../features/buyer/checkout/review/components/ReviewShipping";
import ReviewPayment from "../../features/buyer/checkout/review/components/ReviewPayment";
import PlaceOrderButton from "../../features/buyer/checkout/review/components/PlaceOrderButton";
import { useCheckoutReview } from "../../features/buyer/checkout/review/hooks/useCheckoutReview";

export default function CheckoutReviewPage() {
  const navigate = useNavigate();
  const {
    items,
    subtotal,
    address,
    deliveryMethod,
    company,
    paymentMethodId,
    purchaseReference,
    loading,
    error,
    isSubmitting,
    submitError,
    placeOrder,
  } = useCheckoutReview();

  const handlePlaceOrder = async () => {
    const order = await placeOrder();
    if (order && order.order_id) {
      navigate(`/orders/${order.order_id}/confirmation`);
    }
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stepper Step 4 */}
        <CheckoutStepper currentStep={4} />

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Review & Place Procurement Order
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Carefully verify parts consignment breakdown, destination facility, and commercial settlement terms.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-600">
              Loading your saved checkout details...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm mb-6 flex items-start gap-3">
            <span className="font-bold">⚠️</span>
            <div>
              <p className="font-semibold">Unable to load review details</p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {submitError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm mb-6 flex items-start gap-3">
            <span className="font-bold">🚫</span>
            <div>
              <p className="font-semibold">Order Submission Failed</p>
              <p className="text-xs text-rose-700 mt-0.5">{submitError}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols */}
            <div className="lg:col-span-8 space-y-6">
              <ReviewItems items={items} />

              <ReviewShipping address={address} deliveryMethod={deliveryMethod} />

              <ReviewPayment
                company={company}
                paymentMethodId={paymentMethodId}
                purchaseReference={purchaseReference}
              />

              <PlaceOrderButton
                onPlaceOrder={handlePlaceOrder}
                isSubmitting={isSubmitting}
                disabled={items.length === 0}
                paymentMethodId={paymentMethodId}
              />

              {/* Navigation Back */}
              <div className="pt-2 flex items-center justify-between">
                <Link
                  to="/checkout/payment"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Payment
                </Link>
              </div>
            </div>

            {/* Right 4 Cols */}
            <div className="lg:col-span-4">
              <CheckoutOrderSummary
                items={items}
                subtotal={subtotal}
                shippingFee={deliveryMethod?.cost || 1250}
                deliveryMethodName={deliveryMethod?.name || "Standard Freight"}
                purchaseReference={purchaseReference}
                currentStep={4}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
