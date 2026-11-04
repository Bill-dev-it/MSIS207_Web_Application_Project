
const STATUS_STYLES = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
    danger: "bg-red-50 text-red-700 ring-red-600/20",
    info: "bg-sky-50 text-sky-700 ring-sky-600/20",
    neutral: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const STATUS_LABELS = {
    success: "Success",
    warning: "Warning",
    danger: "Danger",
    info: "Information",
    neutral: "Unknown",
};

export default function StatusBadge({
    status = "neutral",
    label,
    className = "",
}) {
    const safeStatus = STATUS_STYLES[status]
        ? status
        : "neutral";

    return (
        <span
            className={[
                "inline-flex items-center rounded-full px-2.5 py-1",
                "text-xs font-semibold ring-1 ring-inset",
                STATUS_STYLES[safeStatus],
                className,
            ].join(" ")}
        >
            <span
                className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current"
                aria-hidden="true"
            />
            {label || STATUS_LABELS[safeStatus]}
        </span>
    );
}
