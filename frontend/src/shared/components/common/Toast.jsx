
const TOAST_STYLES = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
};

export default function Toast({
    type = "info",
    title,
    message,
    onClose,
}) {
    const safeType = TOAST_STYLES[type] ? type : "info";

    return (
        <div
            role={safeType === "error" ? "alert" : "status"}
            aria-live={safeType === "error" ? "assertive" : "polite"}
            className={[
                "flex items-start justify-between gap-4",
                "rounded-xl border p-4 shadow-card",
                TOAST_STYLES[safeType],
            ].join(" ")}
        >
            <div>
                {title && (
                    <p className="text-sm font-semibold">{title}</p>
                )}

                {message && (
                    <p className="mt-1 text-sm">{message}</p>
                )}
            </div>

            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close notification"
                    className="rounded px-2 text-lg leading-none hover:bg-black/5"
                >
                    ×
                </button>
            )}
        </div>
    );
}
