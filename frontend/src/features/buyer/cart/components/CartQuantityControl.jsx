export default function CartQuantityControl({
  quantity,
  stockQuantity,
  onQuantityChange,
  disabled = false,
}) {
  const current = Number(quantity) || 1;
  const parsedMax = Number(stockQuantity);
  const max = Number.isFinite(parsedMax) && parsedMax >= 0 ? parsedMax : current;

  return (
    <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
      <button
        type="button"
        disabled={disabled || current <= 1}
        onClick={() => onQuantityChange(current - 1)}
        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-sm"
        aria-label="Decrease quantity"
      >
        −
      </button>

      <span className="w-10 text-center font-bold text-sm text-slate-900 select-none">
        {current}
      </span>

      <button
        type="button"
        disabled={disabled || current >= max}
        onClick={() => onQuantityChange(current + 1)}
        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-sm"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
