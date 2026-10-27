import { useState, useEffect } from "react";
import { api } from "../../../services/apiClient";

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/suppliers")
      .then((data) => setSuppliers(data.items || []))
      .catch(() => setSuppliers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-white tracking-tight">Suppliers &amp; MRO Distribution Network</h2>
        <p className="text-xs text-slate-400 font-mono">40 Approved marketplace suppliers from Gold dataset.</p>
      </div>

      <div className="bg-[#0D1829]/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#091024] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Supplier ID</th>
                <th className="py-3.5 px-4">Store Name</th>
                <th className="py-3.5 px-4">Parent Company</th>
                <th className="py-3.5 px-4">Active Listings</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Loading suppliers network...</td>
                </tr>
              ) : suppliers.map((s) => (
                <tr key={s.supplierId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-cyan-400">#{s.supplierId}</td>
                  <td className="py-3 px-4 text-white font-sans font-medium">{s.storeName}</td>
                  <td className="py-3 px-4 text-slate-300 font-sans">{s.companyName}</td>
                  <td className="py-3 px-4 text-cyan-300 font-bold">{s.listingCount}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      s.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
