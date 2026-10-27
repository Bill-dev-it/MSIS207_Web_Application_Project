import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { fetchOrderConfirmation } from "../../../services/buyerService";

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderNumber = searchParams.get("orderNumber");

  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadConfirmation() {
      try {
        const data = await fetchOrderConfirmation(orderNumber);
        if (active) setConfirmation(data);
      } catch (err) {
        // fallback
      } finally {
        if (active) setLoading(false);
      }
    }
    loadConfirmation();
    return () => { active = false; };
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-slate-400 gap-3">
        <div className="w-8 h-8 border-3 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
        <span className="font-mono text-xs uppercase tracking-wider text-cyan-400">Verifying Settlement...</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-3xl mx-auto space-y-8 text-center font-sans">
      <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-3">
          ORDER AUTHORIZED &amp; RECORDED
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">Requisition Confirmed</h2>
        <p className="text-sm text-slate-400 mt-2 font-mono">
          Order Identifier: <span className="text-cyan-400 font-bold">{confirmation?.orderNumber || orderNumber}</span>
        </p>
      </div>

      {/* Confirmation Card */}
      <div className="p-6 rounded-3xl bg-[#0D1829]/90 border border-slate-800 text-left space-y-6 shadow-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-800 text-xs font-mono">
          <div>
            <div className="text-slate-500 uppercase text-[10px]">Grand Total</div>
            <div className="text-lg font-bold text-white mt-1">
              ${Number(confirmation?.grandTotal || 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-slate-500 uppercase text-[10px]">Consignments</div>
            <div className="text-lg font-bold text-cyan-400 mt-1">
              {confirmation?.sellerOrders?.length || 1} Supplier(s)
            </div>
          </div>
          <div>
            <div className="text-slate-500 uppercase text-[10px]">Payment</div>
            <div className="text-sm font-semibold text-emerald-400 mt-1.5">
              Simulation Paid
            </div>
          </div>
          <div>
            <div className="text-slate-500 uppercase text-[10px]">Destination</div>
            <div className="text-sm font-semibold text-slate-300 mt-1.5 truncate">
              {confirmation?.shippingAddress?.city || "Airlines Base"}
            </div>
          </div>
        </div>

        {/* Milestone Steps */}
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-4">
            Order Fulfillment Pipeline
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {confirmation?.flowSteps?.map((step, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-[#091024] border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${step.status === "complete" ? "bg-emerald-400" : step.status === "active" ? "bg-cyan-400 animate-pulse" : "bg-slate-600"}`}></span>
                  {step.name}
                </div>
                <div className="text-[11px] text-slate-400 leading-tight">{step.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={() => navigate(`/buyer/orders/${confirmation?.orderNumber || orderNumber}`)}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition"
        >
          Inspect Order Dossier →
        </button>
        <Link
          to="/marketplace"
          className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition"
        >
          Return to Marketplace Catalog
        </Link>
      </div>
    </div>
  );
}
