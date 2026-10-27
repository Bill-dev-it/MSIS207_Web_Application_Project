import { useState, useEffect } from "react";
import { api } from "../../../services/apiClient";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/users")
      .then((data) => setUsers(data.items || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-white tracking-tight">Authorized Operators Directory</h2>
        <p className="text-xs text-slate-400 font-mono">Live registered user accounts across all platform organizations.</p>
      </div>

      <div className="bg-[#0D1829]/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#091024] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">User ID</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Company</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Loading directory...</td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.userId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-cyan-400">#{u.userId}</td>
                  <td className="py-3 px-4 text-white font-sans font-medium">{u.fullName}</td>
                  <td className="py-3 px-4 text-slate-300">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      u.role === "ADMIN" ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-sans">{u.company?.companyName}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
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
