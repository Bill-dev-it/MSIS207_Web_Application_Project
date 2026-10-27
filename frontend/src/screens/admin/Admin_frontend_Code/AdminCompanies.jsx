import { useState, useEffect } from "react";
import { api } from "../../../services/apiClient";

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/companies")
      .then((data) => setCompanies(data.items || []))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-white tracking-tight">Registered Aviation Organizations</h2>
        <p className="text-xs text-slate-400 font-mono">47 Verified aviation companies sourced from Gold database.</p>
      </div>

      <div className="bg-[#0D1829]/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#091024] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Company ID</th>
                <th className="py-3.5 px-4">Organization Name</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Country</th>
                <th className="py-3.5 px-4">Fleet Aircraft</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Loading companies...</td>
                </tr>
              ) : companies.map((c) => (
                <tr key={c.companyId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-cyan-400">#{c.companyId}</td>
                  <td className="py-3 px-4 text-white font-sans font-medium">{c.companyName}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      {c.companyType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{c.countryCode}</td>
                  <td className="py-3 px-4 text-amber-400 font-bold">{c.aircraftCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
