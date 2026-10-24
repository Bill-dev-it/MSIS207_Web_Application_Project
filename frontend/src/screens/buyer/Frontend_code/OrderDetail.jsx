import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchBuyerOrderDetail } from "../../../services/buyerService";

/**
 * Data Mapper: converts raw order detail to view-model
 */
function mapOrderDetailToViewModel(raw) {
  return {
    orderId: raw.order_id,
    orderNumber: raw.order_number,
    companyName: raw.company_name_snapshot,
    purchaseReference: raw.purchase_reference,
    createdDate: new Date(raw.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    rawDate: raw.created_at,
    orderStatus: raw.order_status,
    currency: raw.currency || "USD",
    subtotal: raw.subtotal,
    shippingTotal: raw.shipping_total,
    grandTotal: raw.grand_total,
    stepHistory: raw.step_history || [],
    shippingAddress: raw.shipping_address,
    payment: raw.payment,
    sellerOrders: (raw.seller_orders || []).map((so) => ({
      sellerOrderId: so.seller_order_id,
      supplierId: so.supplier_id,
      supplierName: so.supplier_name_snapshot,
      isVerified: so.supplier_verified,
      status: so.status,
      subtotal: so.subtotal,
      shippingFee: so.shipping_fee,
      grandTotal: so.grand_total,
      shipment: so.shipment,
      items: (so.items || []).map((item) => ({
        itemId: item.order_item_id,
        listingId: item.listing_id,
        name: item.product_name_snapshot,
        partNumber: item.part_number_snapshot,
        sku: item.seller_sku_snapshot,
        condition: item.condition_snapshot,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        lineTotal: item.line_total,
      })),
    })),
  };
}

export default function OrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copyNotice, setCopyNotice] = useState("");

  useEffect(() => {
    fetchBuyerOrderDetail(orderId)
      .then((data) => {
        setOrder(mapOrderDetailToViewModel(data));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load order detail");
        setLoading(false);
      });
  }, [orderId]);

  const handleCopy = (text, label) => {
    navigator.clipboard?.writeText(text);
    setCopyNotice(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopyNotice(""), 3000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0B1F3A] border-t-transparent" />
          <p className="text-sm font-medium text-neutral-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
        <div className="card max-w-md p-6 text-center">
          <p className="text-base font-semibold text-rose-600">Failed to load order</p>
          <p className="mt-2 text-sm text-neutral-500">{error || "Order not found."}</p>
          <Link to="/buyer/orders" className="btn btn-primary mt-4">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0B1F3A] antialiased">
      {/* Toast Notification */}
      {copyNotice && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-primary-800 px-4 py-3 text-xs font-semibold text-white shadow-xl animate-fade-in">
          <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {copyNotice}
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-[#E2E8F0] bg-white px-4 py-6 shadow-sm">
        <div className="flex flex-col gap-6">
          {/* Brand Logo */}
          <Link to="/" className="px-2 text-2xl font-bold tracking-tight text-[#0B1F3A]">
            Aero<span className="text-accent">RUL</span>
          </Link>

          {/* Fleet Status Badge */}
          <div className="rounded-xl bg-[#EEF4FB] px-3.5 py-2.5">
            <p className="text-[11px] font-semibold tracking-wider text-[#64748B] uppercase">FLEET STATUS</p>
            <p className="mt-0.5 text-sm font-bold text-[#0B1F3A]">24 engines active</p>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1 text-[13px] font-medium text-[#475569]">
            <Link
              to="/buyer"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </Link>

            <Link
              to="/marketplace"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Marketplace
            </Link>

            <Link
              to="/buyer/engines"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              My Engines
            </Link>

            <Link
              to="/admin/rul-status"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              RUL Analysis
            </Link>

            <Link
              to="/buyer/recommendations"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Replacement Recommendations
            </Link>

            {/* Active Link: Orders */}
            <div className="flex items-center gap-3 rounded-xl bg-[#0B1F3A] px-3.5 py-2.5 font-semibold text-white shadow-sm">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>Orders</span>
            </div>
          </nav>
        </div>

        {/* Bottom Workspace & User Section */}
        <div className="flex flex-col gap-4 border-t border-[#E2E8F0] pt-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-wider text-[#94A3B8] uppercase">SWITCH WORKSPACE</span>
            <div className="flex items-center justify-between rounded-lg bg-[#F1F5F9] px-2.5 py-1.5 text-xs font-semibold text-[#0B1F3A]">
              <span>Demo Horizon Airlines</span>
              <svg className="h-3.5 w-3.5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] p-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B1F3A] font-bold text-white text-xs">
              DP
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-xs font-bold text-[#0B1F3A]">Demo Procurement 1</span>
              <span className="truncate text-[11px] text-[#64748B]">demo.buyer@horizon.aero</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Header Breadcrumbs / Nav */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white px-8">
          <div className="flex items-center gap-3">
            <Link
              to="/buyer/orders"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0B1F3A] transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Orders</span>
            </Link>
            <span className="text-neutral-300">/</span>
            <span className="font-mono text-xs font-bold text-[#0B1F3A]">{order.orderNumber}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-semibold text-[#0B1F3A] shadow-sm hover:bg-[#F8FAFC] transition"
            >
              <svg className="h-4 w-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Order
            </button>
          </div>
        </header>

        {/* Order Detail Content */}
        <main className="p-8">
          {/* Order Header Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-3xl font-extrabold tracking-tight text-[#0B1F3A]">
                {order.orderNumber}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/20">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                {order.orderStatus}
              </span>
            </div>

            <div className="text-right text-xs text-[#64748B]">
              <span>Placed {order.createdDate}</span>
              <span className="mx-2">·</span>
              <span className="font-medium text-[#0B1F3A]">Estimated delivery in 3–5 business days</span>
            </div>
          </div>

          {/* Stepper Status Tracker */}
          <div className="mt-8 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="grid grid-cols-5 gap-2 text-center">
              {order.stepHistory.map((step, idx) => {
                const isPassed = step.completed;
                const isCurrent = step.current;

                return (
                  <div key={idx} className="flex flex-col items-center relative">
                    {/* Connecting line between steps */}
                    {idx < order.stepHistory.length - 1 && (
                      <div
                        className={`absolute top-4 left-1/2 w-full h-0.5 -z-0 ${
                          isPassed ? "bg-emerald-500" : "bg-[#E2E8F0]"
                        }`}
                      />
                    )}

                    {/* Step Icon / Circle */}
                    <div
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                        isPassed
                          ? "bg-emerald-600 text-white shadow-sm"
                          : isCurrent
                          ? "bg-[#0B1F3A] text-white ring-4 ring-blue-100"
                          : "border-2 border-[#CBD5E1] bg-white text-[#94A3B8]"
                      }`}
                    >
                      {isPassed ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    <span className={`mt-3 text-xs font-bold ${isCurrent || isPassed ? "text-[#0B1F3A]" : "text-[#94A3B8]"}`}>
                      {step.step}
                    </span>
                    <span className="mt-0.5 text-[10px] text-[#64748B] max-w-[120px]">
                      {step.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2-Column Content: Left Shipments by Supplier, Right Order Summary */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left 8 Cols: Shipments grouped by Supplier */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {order.sellerOrders.map((so, soIdx) => (
                <div
                  key={so.sellerOrderId}
                  className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm"
                >
                  {/* Supplier Shipment Header */}
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                        Shipment {soIdx + 1} of {order.sellerOrders.length}
                      </span>
                      <span className="text-neutral-300">·</span>
                      <span className="text-sm font-bold text-[#0B1F3A]">{so.supplierName}</span>
                      {so.isVerified && (
                        <svg className="h-4 w-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        so.status === "SHIPPED"
                          ? "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20"
                          : so.status === "DELIVERED"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                          : "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                      }`}
                    >
                      {so.status === "SHIPPED" && <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />}
                      {so.status}
                    </span>
                  </div>

                  {/* Items in this shipment */}
                  <div className="divide-y divide-[#E2E8F0] px-6">
                    {so.items.map((item) => (
                      <div key={item.itemId} className="flex items-center justify-between py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-[#0B1F3A]">{item.name}</span>
                          <div className="flex items-center gap-2 text-xs text-[#64748B]">
                            <span className="font-mono">P/N {item.partNumber}</span>
                            <span>·</span>
                            <span className="rounded bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-medium text-[#475569]">
                              {item.condition}
                            </span>
                            <span>·</span>
                            <span>Qty {item.quantity}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-base font-bold text-[#0B1F3A]">
                            ${item.lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                          <p className="text-[11px] text-[#94A3B8]">
                            ${item.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })} each
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tracking details if shipped */}
                  {so.shipment && (
                    <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-[#CBD5E1] text-[#0B1F3A]">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                            </svg>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold uppercase text-[#64748B]">
                              Tracking ({so.shipment.carrier})
                            </span>
                            <span className="font-mono text-xs font-bold text-[#0B1F3A]">
                              {so.shipment.tracking_number}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {so.shipment.status_note && (
                            <span className="text-xs text-[#64748B]">
                              {so.shipment.status_note}
                            </span>
                          )}
                          <button
                            onClick={() => handleCopy(so.shipment.tracking_number, "Tracking number")}
                            className="rounded-lg border border-[#CBD5E1] bg-white px-3 py-1 text-xs font-semibold text-[#0B1F3A] hover:bg-[#F1F5F9] transition"
                          >
                            Copy tracking
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shipment Footer Links */}
                  <div className="flex items-center justify-between border-t border-[#E2E8F0] px-6 py-3 text-xs text-[#64748B]">
                    <button
                      type="button"
                      onClick={() => alert(`Connecting with ${so.supplierName} support desk...`)}
                      className="font-medium text-accent hover:underline"
                    >
                      Contact supplier
                    </button>
                    <span className="text-[11px] text-[#94A3B8]">
                      Review available after delivery
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Right 4 Cols: Order Summary & Logistics Details */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Order Financial Summary */}
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  Order Summary
                </h2>

                <div className="mt-4 space-y-3 text-xs border-b border-[#E2E8F0] pb-4">
                  <div className="flex justify-between text-[#64748B]">
                    <span>Items Subtotal</span>
                    <span className="font-mono font-medium text-[#0B1F3A]">
                      ${order.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>Air Freight & Logistics</span>
                    <span className="font-mono font-medium text-[#0B1F3A]">
                      ${order.shippingTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-[#0B1F3A]">Grand Total</span>
                  <div className="text-right">
                    <span className="font-mono text-xl font-black text-[#0B1F3A]">
                      ${order.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="ml-1 text-xs font-medium text-[#64748B]">{order.currency}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Destination */}
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  Shipping To
                </h3>

                <div className="mt-3 text-xs text-[#475569] space-y-1">
                  <p className="font-bold text-[#0B1F3A]">{order.shippingAddress.recipient_name}</p>
                  <p>{order.shippingAddress.street}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.postal_code}, {order.shippingAddress.country}
                  </p>
                  <p className="pt-2 text-[11px] text-[#64748B]">
                    Attn: {order.shippingAddress.contact_person} · {order.shippingAddress.phone}
                  </p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  Payment Method
                </h3>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#0B1F3A]">{order.payment.payment_method}</span>
                    <span className="inline-flex items-center rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                      {order.payment.status}
                    </span>
                  </div>

                  <div className="pt-1 text-[11px] text-[#64748B]">
                    <span>Purchase Ref: </span>
                    <span className="font-mono font-medium text-[#0B1F3A]">{order.purchaseReference}</span>
                  </div>

                  <p className="text-[11px] text-[#94A3B8] italic">
                    {order.payment.note}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
