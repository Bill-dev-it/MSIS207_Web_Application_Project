export default function OrderStatusBadge({ status = "CONFIRMED" }) {
  const normStatus = String(status || "").toUpperCase();

  let styles = "bg-slate-100 text-slate-700 border-slate-200";
  let label = normStatus;

  switch (normStatus) {
    case "CONFIRMED":
      styles = "bg-blue-50 text-blue-700 border-blue-200";
      label = "Confirmed";
      break;
    case "PROCESSING":
      styles = "bg-amber-50 text-amber-700 border-amber-200";
      label = "Processing";
      break;
    case "SHIPPED":
      styles = "bg-purple-50 text-purple-700 border-purple-200";
      label = "In Transit";
      break;
    case "DELIVERED":
      styles = "bg-emerald-50 text-emerald-700 border-emerald-200";
      label = "Delivered";
      break;
    case "CANCELLED":
      styles = "bg-rose-50 text-rose-700 border-rose-200";
      label = "Cancelled";
      break;
    default:
      styles = "bg-slate-50 text-slate-700 border-slate-200";
      label = normStatus;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {label}
    </span>
  );
}

