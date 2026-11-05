import { Link } from "react-router-dom";
import CartItem from "./CartItem";

export default function CartItemList({
  items,
  onUpdateQuantity,
  onRemove,
  onClearCart,
  isUpdating = false,
}) {
  return (
    <div className="space-y-4">
      <div className="hidden sm:flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
        <span>Part & Supplier Details</span>
        <span>Line Total & Quantity</span>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <CartItem
            key={item.cart_item_id}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
            isUpdating={isUpdating}
          />
        ))}
      </div>

      <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Continue Shopping
        </Link>

        {items.length > 0 && (
          <button
            type="button"
            disabled={isUpdating}
            onClick={onClearCart}
            className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors"
          >
            Clear Entire Cart
          </button>
        )}
      </div>
    </div>
  );
}
