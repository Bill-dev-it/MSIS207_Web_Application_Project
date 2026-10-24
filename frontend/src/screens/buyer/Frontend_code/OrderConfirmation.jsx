import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { fetchOrderConfirmation } from "../../../services/buyerService";

/**
 * Data Mapper: converts raw order confirmation data to view-model
 */
function mapConfirmationToViewModel(raw) {
  return {
    orderNumber: raw.order_number,
    purchaseReference: raw.purchase_reference,
    grandTotal: raw.grand_total,
    currency: raw.currency || "USD",
    paymentMethod: raw.payment?.payment_method || "Demo payment",
    paymentStatus: raw.payment?.status || "Succeeded",
    recipientCompany: raw.shipping_address?.recipient_name || raw.company_name_snapshot,
    cityState: `${raw.shipping_address?.city || "Dallas"}, ${raw.shipping_address?.state || "TX"}`,
    confirmationNotice: raw.confirmation_notice,
    flowSteps: raw.flow_steps || [
      { name: "Placed", description: "Order recorded & simulation processed" },
      { name: "Confirmed", description: "Suppliers verify availability" },
      { name: "Processing", description: "Warehouse picking & packing" },
      { name: "Shipped", description: "Air courier dispatched with tracking" },
      { name: "Delivered", description: "Receiving inspection & completion" },
    ],
  };
}

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Pick orderId from URL search param or location state if provided
  const queryOrderId = searchParams.get("order") || location.state?.orderId || "ORD-1004";

  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderConfirmation(queryOrderId)
      .then((data) => {
        setConfirmation(mapConfirmationToViewModel(data));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load order confirmation");
        setLoading(false);
      });
  }, [queryOrderId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0B1F3A] border-t-transparent" />
          <p className="text-sm font-medium text-neutral-500">Verifying order confirmation...</p>
        </div>
      </div>
    );
  }

  if (error || !confirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
        <div className="card max-w-md p-6 text-center">
          <p className="text-base font-semibold text-rose-600">Order confirmation not found</p>
          <p className="mt-2 text-sm text-neutral-500">{error || "No recent order."}</p>
          <Link to="/buyer/orders" className="btn btn-primary mt-4">
            View My Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0B1F3A] antialiased">
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

            <Link
              to="/buyer/orders"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Orders
            </Link>
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white px-8">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[#64748B]">Checkout Confirmation</span>
          </div>

          <Link
            to="/buyer/orders"
            className="text-xs font-semibold text-accent hover:underline"
          >
            Go to Orders list →
          </Link>
        </header>

        {/* Centered Confirmation Page Content */}
        <main className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-2xl rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
            {/* Green Checkmark Badge */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50 text-emerald-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Title & Subtitle */}
            <div className="mt-5 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3A]">Order placed</h1>
              <p className="mt-1.5 text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
                {confirmation.confirmationNotice}
              </p>
            </div>

            {/* Order Highlight Box */}
            <div className="mt-8 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                    ORDER ID
                  </span>
                  <span className="font-mono text-xl font-extrabold text-[#0B1F3A]">
                    {confirmation.orderNumber}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Placed
                </span>
              </div>

              {/* Grid Details */}
              <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                <div>
                  <span className="text-[#94A3B8]">Total Amount</span>
                  <p className="font-mono font-bold text-[#0B1F3A] mt-0.5">
                    ${confirmation.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <span className="text-[#94A3B8]">Payment</span>
                  <p className="font-medium text-[#0B1F3A] mt-0.5">
                    {confirmation.paymentMethod} · {confirmation.paymentStatus}
                  </p>
                </div>

                <div>
                  <span className="text-[#94A3B8]">Purchase Ref</span>
                  <p className="font-mono font-medium text-[#0B1F3A] mt-0.5">
                    {confirmation.purchaseReference}
                  </p>
                </div>

                <div>
                  <span className="text-[#94A3B8]">Shipping To</span>
                  <p className="font-medium text-[#0B1F3A] mt-0.5 truncate" title={confirmation.recipientCompany}>
                    {confirmation.recipientCompany}, {confirmation.cityState}
                  </p>
                </div>
              </div>
            </div>

            {/* What Happens Next Card */}
            <div className="mt-6 rounded-xl border border-[#E2E8F0] bg-white p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A]">
                What happens next
              </h2>

              <div className="mt-3 flex items-center justify-between text-xs text-[#475569] font-medium border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px]">1</span>
                  <span>Placed</span>
                </div>
                <span className="text-neutral-300">→</span>
                <div className="flex items-center gap-1.5 text-[#0B1F3A]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F1F5F9] text-[10px]">2</span>
                  <span>Confirmed</span>
                </div>
                <span className="text-neutral-300">→</span>
                <div className="flex items-center gap-1.5 text-[#64748B]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F1F5F9] text-[10px]">3</span>
                  <span>Processing</span>
                </div>
                <span className="text-neutral-300">→</span>
                <div className="flex items-center gap-1.5 text-[#64748B]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F1F5F9] text-[10px]">4</span>
                  <span>Shipped</span>
                </div>
                <span className="text-neutral-300">→</span>
                <div className="flex items-center gap-1.5 text-[#64748B]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F1F5F9] text-[10px]">5</span>
                  <span>Delivered</span>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-[#64748B] leading-relaxed">
                You will receive real-time notifications at each milestone. Each certified supplier will dispatch their allocated components directly to your designated receiving facility.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate(`/buyer/orders/${confirmation.orderNumber}`)}
                className="flex-1 rounded-xl bg-[#0B1F3A] py-3 text-xs font-bold text-white shadow-sm hover:bg-[#132A4A] transition text-center"
              >
                Track order
              </button>

              <button
                onClick={() => navigate("/marketplace")}
                className="flex-1 rounded-xl border border-[#CBD5E1] bg-white py-3 text-xs font-bold text-[#0B1F3A] hover:bg-[#F8FAFC] transition text-center"
              >
                Continue shopping
              </button>
            </div>

            {/* Simulation subtext */}
            <p className="mt-6 text-center text-[11px] text-[#94A3B8]">
              This is a demo checkout. No real payment was taken.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
