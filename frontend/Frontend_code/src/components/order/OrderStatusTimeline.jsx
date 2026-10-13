const STAGES = ["Placed", "Confirmed", "Processing", "Shipped", "Delivered"];

export default function OrderStatusTimeline({ status }) {
  const currentIdx = STAGES.indexOf(status);
  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {STAGES.map((stage, idx) => {
        const done = idx <= currentIdx;
        return (
          <li key={stage} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${done ? "bg-accent" : "bg-neutral-200"}`} />
            <span className={done ? "font-medium text-primary-800" : "text-neutral-500"}>{stage}</span>
            {idx < STAGES.length - 1 && <span className="mx-1 h-px w-6 bg-neutral-200" />}
          </li>
        );
      })}
    </ol>
  );
}
