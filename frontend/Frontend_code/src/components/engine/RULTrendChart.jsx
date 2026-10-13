import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function RULTrendChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-neutral-500">No RUL history yet for this engine.</p>;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="cycle" tick={{ fontSize: 12, fill: "#64748B" }} />
          <YAxis tick={{ fontSize: 12, fill: "#64748B" }} label={{ value: "RUL (cycles)", angle: -90, position: "insideLeft", fontSize: 11, fill: "#64748B" }} />
          <Tooltip />
          <Line type="monotone" dataKey="rul" stroke="#2D9CDB" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
