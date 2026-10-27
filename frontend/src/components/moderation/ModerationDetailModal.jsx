import { useState } from "react";

export function ModerationDetailModal({ item, onClose, onDecision, isSubmitting }) {
  const [note, setNote] = useState("");
  const [activeTab, setActiveTab] = useState("specifications");

  if (!item) return null;

  const part = item.product || {};
  const supplier = item.supplier || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl rounded-2xl bg-[#091024] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              LISTING #{item.listingId}
            </span>
            <h2 className="text-base font-bold text-white truncate max-w-md">
              {item.productName || part.productName || "Aviation Component"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-mono">
            <div>
              <div className="text-slate-500 text-[10px]">LIST PRICE</div>
              <div className="text-lg font-bold text-white mt-0.5">
                ${Number(item.price || item.unitPrice || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">STOCK ON HAND</div>
              <div className="text-lg font-bold text-cyan-400 mt-0.5">
                {item.quantityAvailable ?? item.stock ?? 0} units
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">CONDITION</div>
              <div className="text-sm font-semibold text-slate-300 mt-1">
                {item.condition || "New / FAA 8130-3"}
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">CURRENT STATUS</div>
              <div className="text-xs font-bold text-amber-400 mt-1 uppercase">
                {item.status || "DRAFT"}
              </div>
            </div>
          </div>

          {/* Supplier Context */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
              SUPPLIER CREDENTIALS
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-sm">
                  {supplier.storeName || item.supplierName || "Aero Supplier"}
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5 font-mono">
                  Supplier ID: #{item.supplierId} · {supplier.verified ? "FAA Certified Distributor" : "Standard Registered"}
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold ${
                supplier.verified
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-800 text-slate-400"
              }`}>
                {supplier.verified ? "VERIFIED SUPPLIER" : "UNVERIFIED"}
              </span>
            </div>
          </div>

          {/* Part Specs & Compatibility */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              TECHNICAL SPECIFICATIONS & TRACEABILITY
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-[11px]">
              <div>
                <span className="text-slate-500">Part Number: </span>
                <span className="text-cyan-300 font-bold">{part.partNumber || item.partNumber || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500">Seller SKU: </span>
                <span className="text-slate-300">{item.sellerSku || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500">Lead Time: </span>
                <span className="text-slate-300">{item.leadTimeDays || 3} business days</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed pt-2 border-t border-slate-800/60 font-sans">
              {part.description || item.description || "Certified replacement component adhering to aerospace airworthiness and material traceability standards."}
            </p>
          </div>

          {/* Reviewer Note Input */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2">
              ADMIN AUDIT NOTES (Stored in Audit Log):
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Verified 8130-3 airworthiness certificate and part serial match. Approved for marketplace publication."
              rows={3}
              className="w-full p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDecision(item.listingId, "REJECTED", note)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-mono text-xs font-bold disabled:opacity-50 transition"
            >
              Reject Listing
            </button>
            <button
              onClick={() => onDecision(item.listingId, "APPROVED", note)}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition"
            >
              {isSubmitting ? "Processing..." : "Approve & Publish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
