import { Link } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import { formatCurrency } from "../../utils/format";

export default function CartDrawer() {
  const { items, isDrawerOpen, setDrawerOpen, updateQuantity, removeItem, subtotal } = useCart();

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={() => setDrawerOpen(false)}>
      <div className="flex h-full w-full max-w-sm flex-col bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-neutral-200 p-4">
          <p className="font-semibold text-primary-800">Cart ({items.length})</p>
          <button onClick={() => setDrawerOpen(false)} className="text-neutral-500 hover:text-primary-800">✕</button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {items.length === 0 && <p className="text-sm text-neutral-500">Your cart is empty.</p>}
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex gap-3 border-b border-neutral-200 pb-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] bg-neutral-100 text-xl">✈️</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-primary-800">{product.name}</p>
                <p className="text-xs text-neutral-500">{formatCurrency(product.price, product.currency)} each</p>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    className="input !w-16 !py-1"
                    value={quantity}
                    onChange={(e) => updateQuantity(product.id, Number(e.target.value))}
                  />
                  <button className="text-xs text-critical hover:underline" onClick={() => removeItem(product.id)}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-neutral-200 p-4">
          <div className="mb-3 flex items-center justify-between text-sm font-medium text-primary-800">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <Link
            to="/buyer/checkout"
            className="btn-primary w-full"
            onClick={() => setDrawerOpen(false)}
            aria-disabled={items.length === 0}
          >
            Go to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
