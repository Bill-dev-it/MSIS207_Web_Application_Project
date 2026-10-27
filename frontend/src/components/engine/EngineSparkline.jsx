import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

export function EngineSparkline({ data = [], urgency = "NORMAL" }) {
  if (!data || data.length === 0) {
    return <span className="text-[10px] text-slate-500 font-mono">No data</span>;
  }

  const strokeColor =
    urgency === "PRIORITIZE"
      ? "#EF4444"
      : urgency === "PREPARE"
      ? "#F59E0B"
      : urgency === "MONITOR"
      ? "#38BDF8"
      : "#10B981";

  const chartData = data.map((d, idx) => ({
    i: idx,
    rul: d.predictedRul,
  }));

  return (
    <div className="w-24 h-7">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={["auto", "auto"]} hide />
          <Line
            type="monotone"
            dataKey="rul"
            stroke={strokeColor}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
