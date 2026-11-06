import { Link, useParams } from "react-router-dom";
import OrderConfirmationSummary from "../../features/buyer/orders/order-confirmation/components/OrderConfirmationSummary";
import NextStepsInformation from "../../features/buyer/orders/order-confirmation/components/NextStepsInformation";
import { useOrderConfirmation } from "../../features/buyer/orders/order-confirmation/hooks/useOrderConfirmation";

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const { order, loading, error } = useOrderConfirmation(orderId);

  return (
    <div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Loading Spinner */}
        {loading && (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-600">
              Loading the recorded order confirmation...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm text-center">
            <span className="text-2xl block mb-2">⚠️</span>
            <h2 className="font-bold text-base text-rose-900 mb-1">Confirmation Unavailable</h2>
            <p className="text-xs text-rose-700 mb-4">{error}</p>
            <Link
              to="/orders"
              className="px-4 py-2 bg-rose-700 text-white rounded-lg text-xs font-bold hover:bg-rose-800 transition"
            >
              View My Orders
            </Link>
          </div>
        )}

        {/* Main Success Content */}
        {!loading && !error && order && (
          <>
            {/* Hero Banner */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Order Recorded
              </h1>
              <p className="text-sm text-slate-600 max-w-lg mx-auto">
                Your order was recorded as <strong className="font-mono text-slate-900">{order.order_number}</strong>. This confirmation does not indicate shipment or delivery.
              </p>
            </div>

            {/* Order Confirmation Summary */}
            <OrderConfirmationSummary order={order} />

            {/* Next Steps */}
            <NextStepsInformation order={order} />

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                to={`/orders/${order.order_id}`}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center gap-2"
              >
                <span>View Order Details</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>

              <Link
                to="/marketplace"
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition border border-slate-200"
              >
                Continue Browsing Catalog
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
