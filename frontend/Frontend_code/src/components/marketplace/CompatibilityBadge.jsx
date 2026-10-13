import Badge from "../common/Badge";

export default function CompatibilityBadge({ models = [], score }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {typeof score === "number" && (
        <Badge tone={score >= 95 ? "success" : score >= 85 ? "warning" : "neutral"}>
          {score}% compatible
        </Badge>
      )}
      {models.map((m) => (
        <span key={m} className="mono rounded-md bg-neutral-100 px-1.5 py-0.5 text-xs text-primary-800">
          {m}
        </span>
      ))}
    </div>
  );
}
