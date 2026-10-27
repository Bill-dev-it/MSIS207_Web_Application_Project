import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import { fetchBuyerRecommendations, addToCart } from "../../../services/buyerService";
import { fetchReplacementRecommendations } from "../../../services/adminService";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { useToast } from "../../../components/ui/Toast";

export default function Recommendations() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const engineIdParam = searchParams.get("engineId");

  const [enginesWithRecs, setEnginesWithRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingId, setAddingId] = useState(null);

  const isBuyer = user?.role === "BUYER";

  useEffect(() => {
    let active = true;
    async function loadRecs() {
      try {
        setLoading(true);
        if (isBuyer) {
          const list = await fetchBuyerRecommendations(engineIdParam);
          if (active) setEnginesWithRecs(list);
        } else {
          const data = await fetchReplacementRecommendations(engineIdParam);
          if (active) setEnginesWithRecs(data.items || []);
        }
      } catch (err) {
        if (active) setError(err.message || "Failed to load replacement recommendations");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadRecs();
    return () => { active = false; };
  }, [isBuyer, engineIdParam]);

  const handleAddToCart = async (listingId) => {
    if (!isBuyer) return;
    setAddingId(listingId);
    try {
      await addToCart(listingId, 1);
      addToast("Certified spare part added to requisition cart.", "success");
    } catch (err) {
      addToast(err.message || "Failed to add part to cart", "error");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            AI-Ranked Replacement Recommendations
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Prescriptive spare part matching for engines reaching maintenance urgency thresholds.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          FAA &amp; Gold Fitment Matrix Verified
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Matching engine models with seller inventory...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-center text-xs font-mono">
          {error}
        </div>
      ) : enginesWithRecs.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#0D1829]/90 border border-slate-800 text-center space-y-3">
          <div className="text-lg font-bold text-white">No Urgent Engines Currently Registered</div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All fleet engines currently operate within normal RUL cycles. Recommendations are triggered when an engine reaches PREPARE or PRIORITIZE status.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {enginesWithRecs.map((item, idx) => {
            // Normalize structure between buyer and admin views
            const engine = item.engine || item;
            const recs = item.recommendations || [item];

            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-[#0D1829]/90 border border-slate-800 space-y-6 shadow-2xl backdrop-blur-xl"
              >
                {/* Engine context bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black font-mono text-cyan-400">
                      {engine.engineCode || `Engine #${engine.engineId}`}
                    </span>
                    <StatusBadge status={engine.urgency} />
                    <span className="text-xs font-sans text-slate-300 font-medium">
                      {engine.modelName}
                    </span>
                    {engine.airlineName && (
                      <span className="text-xs text-slate-400 font-mono">
                        ({engine.airlineName})
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                    <span>Predicted RUL:</span>
                    <span className="text-amber-400 font-bold text-sm">
                      {engine.predictedRul} cycles
                    </span>
                  </div>
                </div>

                {/* Recommendations table for this engine */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#091024] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Replacement Part</th>
                        <th className="py-3 px-4">Part Number</th>
                        <th className="py-3 px-4">Supplier</th>
                        <th className="py-3 px-4">Condition</th>
                        <th className="py-3 px-4">Lead Time</th>
                        <th className="py-3 px-4 text-right">Price</th>
                        {isBuyer && <th className="py-3 px-4 text-right">Procure</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {recs.map((rec) => {
                        const part = rec.part || rec;
                        return (
                          <tr key={part.listingId || rec.recommendationId} className="hover:bg-slate-800/40 transition">
                            <td className="py-3.5 px-4 font-bold text-cyan-400">
                              #{rec.rank || 1}
                            </td>
                            <td className="py-3.5 px-4 font-sans font-medium text-white">
                              {part.productName}
                              <div className="text-[10px] text-slate-500 font-mono">
                                Match Score: {(rec.rankingScore ? rec.rankingScore * 100 : 95).toFixed(0)}%
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-cyan-300 font-mono">
                              {part.partNumber}
                            </td>
                            <td className="py-3.5 px-4 font-sans text-slate-300">
                              {part.supplier?.storeName || part.supplierName || "Aero Supply Network"}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                                {part.condition}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-400">
                              {part.leadTimeDays || 3} days
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-white text-sm">
                              ${Number(part.unitPrice || part.price || 0).toLocaleString()}
                            </td>
                            {isBuyer && (
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => handleAddToCart(part.listingId)}
                                  disabled={addingId === part.listingId}
                                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] shadow-md shadow-cyan-500/20 disabled:opacity-50 transition"
                                >
                                  {addingId === part.listingId ? "Adding..." : "+ Add to Cart"}
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
