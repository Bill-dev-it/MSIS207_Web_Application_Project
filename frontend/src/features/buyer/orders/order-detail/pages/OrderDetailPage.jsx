import { Link, useParams } from "react-router-dom";
import BuyerPortalShell from "../../../../../shared/components/BuyerPortalShell";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import OrderTimeline from "../components/OrderTimeline";
import SupplierShipmentCard from "../components/SupplierShipmentCard";
import OrderShippingInformation from "../components/OrderShippingInformation";
import OrderPaymentInformation from "../components/OrderPaymentInformation";
import { useOrderDetail } from "../hooks/useOrderDetail";
import { formatCurrency } from "../../../cart/utils/cartCalculations";

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const { order, loading, error } = useOrderDetail(orderId);

  const primaryStatus =
    order?.seller_orders?.[0]?.status || "CONFIRMED";

  return (
    <BuyerPortalShell activeNav="orders">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Back */}
        <div className="mb-6">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Procurement Orders
          </Link>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-600">
              Retrieving verified order consignment and dual-release records from database...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm mb-6 text-center max-w-lg mx-auto">
            <span className="text-2xl block mb-2">⚠️</span>
            <h2 className="font-bold text-base text-rose-900 mb-1">Order Not Found</h2>
            <p className="text-xs text-rose-700 mb-4">{error}</p>
            <Link
              to="/orders"
              className="px-4 py-2 bg-rose-700 text-white rounded-lg text-xs font-bold hover:bg-rose-800 transition"
            >
              Return to Orders List
            </Link>
          </div>
        )}

        {/* Order Details Content */}
        {!loading && !error && order && (
          <div className="space-y-6">
            {/* Top Header Card */}
            <header className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                    {order.order_number}
                  </h1>
                  <OrderStatusBadge status={primaryStatus} />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Placed on{" "}
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  by <span className="font-semibold text-slate-700">{order.placed_by_name || "Buyer Team"}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition border border-slate-200 flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print PO Summary
                </button>
              </div>
            </header>

            {/* Timeline */}
            <OrderTimeline status={primaryStatus} createdAt={order.created_at} />

            {/* 2-Column Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 8 Cols: Supplier Shipments */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">
                    Consignments by Supplier ({order.seller_orders?.length || 0})
                  </h2>
                </div>

                {order.seller_orders?.map((sellerOrder) => (
                  <SupplierShipmentCard
                    key={sellerOrder.seller_order_id}
                    sellerOrder={sellerOrder}
                  />
                ))}
              </div>

              {/* Right 4 Cols: Delivery, Billing & Financial Summary */}
              <div className="lg:col-span-4 space-y-6">
                {/* Financial Summary */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                    Commercial Statement
                  </h3>
                  <dl className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <dt>Parts Subtotal</dt>
                      <dd className="font-mono font-bold text-slate-900">
                        {formatCurrency(order.subtotal)}
                      </dd>
                    </div>

                    <div className="flex justify-between">
                      <dt>Freight & Logistics</dt>
                      <dd className="font-mono font-bold text-slate-900">
                        {formatCurrency(order.shipping_total)}
                      </dd>
                    </div>

                    <div className="flex justify-between">
                      <dt>Taxes & Regulatory Duties</dt>
                      <dd className="text-slate-500 font-medium">B2B Exempt</dd>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-between text-sm">
                      <dt className="font-bold text-slate-900">Grand Total</dt>
                      <dd className="font-mono font-black text-xl text-slate-900">
                        {formatCurrency(order.grand_total)}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Shipping Location */}
                <OrderShippingInformation
                  shippingAddressSnapshot={order.shipping_address_snapshot}
                  companyName={order.company_name_snapshot}
                />

                {/* Payment & Terms */}
                <OrderPaymentInformation
                  payment={order.payment}
                  purchaseReference={order.purchase_reference}
                  grandTotal={order.grand_total}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </BuyerPortalShell>
  );
}

