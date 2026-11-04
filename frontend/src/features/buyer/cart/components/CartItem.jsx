import { Link } from "react-router-dom";
import AviationComponentIllustration from "../../marketplace/components/AviationComponentIllustration";
import CartQuantityControl from "./CartQuantityControl";
import { formatCurrency } from "../utils/cartCalculations";

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  isUpdating = false,
}) {
  return (
    <article className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
      {/* Left: Component Visual Thumbnail + Metadata */}
      <div className="flex items-start gap-5 flex-1 min-w-0">
        <Link
          to={`/marketplace/products/${item.product_id}`}
          className="w-24 h-24 bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 rounded-xl flex items-center justify-center p-2 flex-shrink-0 relative overflow-hidden group"
          title="Inspect product specification"
        >
          <AviationComponentIllustration
            category={item.category_name}
            productType={item.product_type}
            name={item.product_name}
            className="w-16 h-14 group-hover:scale-105 transition-transform"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <Link
            to={`/marketplace/products/${item.product_id}`}
            className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2 leading-snug"
          >
            {item.product_name}
          </Link>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
              P/N {item.part_number}
            </span>
          </div>

          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-700">{item.supplier_name}</span>
            <span className="text-emerald-500 font-bold">✓</span>
            <span>•</span>
            <span>Condition: <strong className="text-slate-700 font-medium">{item.condition}</strong></span>
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Unit price {formatCurrency(item.unit_price)}
          </p>

          {item.compatible_engine_names && (
            <div className="mt-2.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                <span>Recommended for {item.compatible_engine_names}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Price Total, Quantity Controls, and Remove */}
      <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 flex-shrink-0">
        <p className="text-xl font-black text-slate-900 font-mono tracking-tight">
          {formatCurrency(item.line_total)}
        </p>

        <div className="flex items-center gap-3">
          <CartQuantityControl
            quantity={item.quantity}
            stockQuantity={item.stock_quantity}
            disabled={isUpdating}
            onQuantityChange={(qty) => onUpdateQuantity(item.cart_item_id, qty)}
          />
        </div>

        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onRemove(item.cart_item_id)}
          className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline transition-colors mt-0.5"
        >
          Remove
        </button>
      </div>
    </article>
  );
}

