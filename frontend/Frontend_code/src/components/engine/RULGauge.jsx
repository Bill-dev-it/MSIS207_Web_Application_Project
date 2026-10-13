function toneFor(rul) {
  if (rul <= 20) return "#EB5757";
  if (rul <= 50) return "#F2C94C";
  return "#27AE60";
}

export default function RULGauge({ rul, max = 100 }) {
  const pct = Math.max(0, Math.min(100, (rul / max) * 100));
  const color = toneFor(rul);
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="110" height="110" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E7EB" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="47" textAnchor="middle" className="mono" fontSize="22" fontWeight="700" fill="#0B1F3A">
          {rul}
        </text>
        <text x="50" y="63" textAnchor="middle" fontSize="9" fill="#64748B">
          cycles left
        </text>
      </svg>
    </div>
  );
}
