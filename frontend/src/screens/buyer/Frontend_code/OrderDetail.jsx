import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchBuyerOrderDetail, createSupplierInquiry } from "../../../services/buyerService";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { useToast } from "../../../components/ui/Toast";

export default function OrderDetail() {
  const { orderId } = useParams();
  const { addToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Contact supplier modal state
  const [inquirySupplier, setInquirySupplier] = useState(null);
  const [inquirySubject, setInquirySubject] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadDetail() {
      try {
        setLoading(true);
        const data = await fetchBuyerOrderDetail(orderId);
        if (active) setOrder(data);
      } catch (err) {
        if (active) setError(err.message || "Failed to load order dossier");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDetail();
    return () => { active = false; };
  }, [orderId]);

  const handleSendInquiry = async (e) => {
    e.preventDefault();
    if (!inquirySupplier || !inquiryMessage.trim()) return;
    setSubmittingInquiry(true);
    try {
      await createSupplierInquiry({
        supplierId: inquirySupplier.supplierId,
        sellerOrderId: inquirySupplier.sellerOrderId,
        subject: inquirySubject || `Inquiry regarding order #${order.orderNumber}`,
        message: inquiryMessage,
      });
      addToast(`Inquiry dispatched to ${inquirySupplier.supplierName} dispatch desk.`, "success");
      setInquirySupplier(null);
      setInquiryMessage("");
      setInquirySubject("");
    } catch (err) {
      addToast(err.message || "Failed to transmit inquiry", "error");
    } finally {
      setSubmittingInquiry(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-slate-400 gap-3">
        <div className="w-8 h-8 border-3 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
        <span className="font-mono text-xs uppercase tracking-wider text-cyan-400">Loading Order Dossier...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-red-400 font-mono text-sm">{error || "Order not found."}</div>
        <Link to="/buyer/orders" className="inline-block px-4 py-2 rounded-xl bg-slate-800 text-xs font-mono text-cyan-400">
          ← Return to Orders Dossier
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <Link to="/buyer/orders" className="text-xs text-slate-400 hover:text-cyan-400 font-mono">
              ← Orders
            </Link>
            <span className="text-slate-600 font-mono">/</span>
            <span className="text-lg font-black font-mono text-cyan-400">{order.orderNumber}</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Purchase Requisition Dossier
          </h2>
          <div className="text-xs text-slate-400 font-mono mt-0.5">
            Placed on {new Date(order.createdAt).toLocaleString()} • Ref: {order.purchaseReference || "Direct"}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase text-slate-400">Grand Total</div>
            <div className="text-2xl font-black text-white font-mono">
              ${Number(order.grandTotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0D1829]/90 border border-slate-800">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Shipping Destination</div>
          <div className="text-sm font-semibold text-white">{order.shippingAddress?.recipientName}</div>
          <div className="text-xs text-slate-400 mt-1">{order.shippingAddress?.addressLine}</div>
          <div className="text-xs text-slate-400 font-mono">
            {order.shippingAddress?.city}, {order.shippingAddress?.countryCode}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1829]/90 border border-slate-800">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Simulation Settlement</div>
          <div className="text-sm font-semibold text-emerald-400">Payment Authorized</div>
          <div className="text-xs text-slate-400 mt-1 font-mono">Method: {order.payment?.method || "SIMULATION"}</div>
          <div className="text-xs text-slate-500 font-mono">Status: {order.payment?.status || "SUCCEEDED"}</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1829]/90 border border-slate-800">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Requisition Split</div>
          <div className="text-sm font-semibold text-white">{order.sellerOrders?.length || 1} Supplier Sub-orders</div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            Subtotal: ${Number(order.subtotal).toLocaleString()} • Air-Freight: ${Number(order.shippingTotal).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Seller Sub-Orders Breakdown */}
      <div className="space-y-6">
        <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
          Fulfillment Routes &amp; Consignments
        </h3>

        {order.sellerOrders?.map((so) => (
          <div key={so.sellerOrderId} className="p-6 rounded-3xl bg-[#0D1829]/90 border border-slate-800 space-y-5 shadow-xl">
            {/* Sub-order header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-white">{so.supplierName}</span>
                  <StatusBadge status={so.status} type="order" />
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Route: {so.route?.originCity || "Supplier Depot"} ({so.route?.originCountry || "US"}) → {so.route?.destinationCity} ({so.route?.destinationCountry})
                </div>
              </div>

              <div className="flex items-center gap-3">
                {so.shipment?.trackingNumber && (
                  <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono">
                    Air AWB: <span className="font-bold">{so.shipment.trackingNumber}</span> ({so.shipment.carrier})
                  </div>
                )}
                <button
                  onClick={() => {
                    setInquirySupplier(so);
                    setInquirySubject(`Delivery schedule query for consignment #${so.sellerOrderId}`);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono font-medium transition"
                >
                  Contact Supplier Desk
                </button>
              </div>
            </div>

            {/* Line items table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-slate-400 border-b border-slate-800/60 pb-2">
                  <tr>
                    <th className="pb-2">Part Description</th>
                    <th className="pb-2">Part Number</th>
                    <th className="pb-2">Condition</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Unit Price</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {so.items?.map((item) => (
                    <tr key={item.orderItemId}>
                      <td className="py-2.5 font-sans font-medium text-white">{item.productName}</td>
                      <td className="py-2.5 text-cyan-400">{item.partNumber}</td>
                      <td className="py-2.5 text-slate-300">{item.condition}</td>
                      <td className="py-2.5 text-right text-slate-200">{item.quantity}</td>
                      <td className="py-2.5 text-right text-slate-400">
                        ${Number(item.unitPrice).toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right font-bold text-white">
                        ${Number(item.lineTotal).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Contact Supplier Modal */}
      {inquirySupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0D1829] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-base font-bold text-white">Inquiry to {inquirySupplier.supplierName}</h4>
                <div className="text-xs text-slate-400 font-mono">Consignment #{inquirySupplier.sellerOrderId}</div>
              </div>
              <button onClick={() => setInquirySupplier(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSendInquiry} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Subject</label>
                <input
                  type="text"
                  value={inquirySubject}
                  onChange={(e) => setInquirySubject(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#091024] border border-slate-700 text-xs text-white font-mono outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Message Body</label>
                <textarea
                  rows={4}
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  placeholder="Specify part inspection certificate, expediting request or delivery coordinate instructions..."
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#091024] border border-slate-700 text-xs text-white placeholder:text-slate-600 outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInquirySupplier(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInquiry}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {submittingInquiry ? "Transmitting..." : "Send Verified Inquiry →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
