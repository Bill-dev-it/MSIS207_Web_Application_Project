import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { searchBuyer } from "../../services/buyerService";

export function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ engines: [], orders: [], parts: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults({ engines: [], orders: [], parts: [] });
      return;
    }

    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const res = await searchBuyer(query.trim());
          setResults(res || { engines: [], orders: [], parts: [] });
        } catch {
          setResults({ engines: [], orders: [], parts: [] });
        } finally {
          setLoading(false);
        }
      } else {
        setResults({ engines: [], orders: [], parts: [] });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (url) => {
    onClose();
    navigate(url);
  };

  const hasResults =
    (results.engines && results.engines.length > 0) ||
    (results.orders && results.orders.length > 0) ||
    (results.parts && results.parts.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-[#091024] border border-cyan-500/30 shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-900/60">
          <svg className="w-4 h-4 text-cyan-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search engines, orders, part numbers, SKUs..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
          />
          <kbd className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {loading && (
            <div className="py-6 text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border border-cyan-400 border-t-transparent animate-spin"></span>
              Scanning PostgreSQL tables...
            </div>
          )}

          {!loading && query.trim().length >= 2 && !hasResults && (
            <div className="py-8 text-center text-xs font-mono text-slate-500">
              No matching engines, orders, or parts found for "{query}".
            </div>
          )}

          {!loading && query.trim().length < 2 && (
            <div className="py-6 text-center text-xs font-mono text-slate-500">
              Type at least 2 characters to search across registered fleet & marketplace...
            </div>
          )}

          {/* Engines Section */}
          {results.engines && results.engines.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 mb-1.5">
                FLEET ENGINES
              </div>
              <div className="space-y-1">
                {results.engines.map((eng) => (
                  <button
                    key={eng.engineId}
                    onClick={() => handleSelect(`/buyer/engines`)}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-800/60 text-left transition flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-mono font-bold text-cyan-400 text-xs">
                        {eng.engineCode}
                      </span>
                      <span className="text-slate-300 text-xs ml-2 font-sans">
                        {eng.modelName || "Turbofan"}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        Serial: {eng.serialNumber}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyan-400">
                      View Fleet →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Orders Section */}
          {results.orders && results.orders.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 mb-1.5">
                ORDERS & REQUISITIONS
              </div>
              <div className="space-y-1">
                {results.orders.map((ord) => (
                  <button
                    key={ord.orderId}
                    onClick={() => handleSelect(`/buyer/orders/${ord.orderId}`)}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-800/60 text-left transition flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-mono font-bold text-white text-xs">
                        {ord.orderNumber}
                      </span>
                      <span className="text-cyan-300 text-xs ml-2 font-mono">
                        ${Number(ord.grandTotal).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        Status: {ord.orderStatus}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyan-400">
                      Inspect →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Parts Section */}
          {results.parts && results.parts.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 mb-1.5">
                PARTS & SELLER LISTINGS
              </div>
              <div className="space-y-1">
                {results.parts.map((p) => (
                  <button
                    key={p.listingId}
                    onClick={() => handleSelect(`/buyer/recommendations`)}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-800/60 text-left transition flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-mono font-bold text-cyan-300 text-xs">
                        {p.partNumber}
                      </span>
                      <span className="text-white text-xs ml-2 font-sans truncate">
                        {p.productName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        ${Number(p.price).toLocaleString()} · {p.condition}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyan-400">
                      Inspect →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>Navigate with mouse or keyboard</span>
          <div className="flex items-center gap-2">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">ESC</kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
