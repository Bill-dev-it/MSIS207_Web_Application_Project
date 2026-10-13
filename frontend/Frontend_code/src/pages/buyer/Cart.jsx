import { Link } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import { formatCurrency } from "../../utils/format";
import EmptyState from "../../components/common/EmptyState";

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Browse the marketplace or check your replacement recommendations to add parts."
        action={<Link to="/marketplace" className="btn-primary">Go to Marketplace</Link>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-primary-800">Cart</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card divide-y divide-neutral-200">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[10px] bg-neutral-100 text-2xl">✈️</div>
              <div className="min-w-[180px] flex-1">
                <p className="font-medium text-primary-800">{product.name}</p>
                <p className="mono text-xs text-neutral-500">{product.partNumber}</p>
              </div>
              <input
                type="number"
                min={1}
                className="input !w-20"
                value={quantity}
                onChange={(e) => updateQuantity(product.id, Number(e.target.value))}
              />
              <p className="w-28 text-right font-medium text-primary-800">
                {formatCurrency(product.price * quantity, product.currency)}
              </p>
              <button className="text-sm text-critical hover:underline" onClick={() => removeItem(product.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="card h-fit p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Subtotal</span>
            <span className="font-semibold text-primary-800">{formatCurrency(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">Shipping & tax calculated at checkout.</p>
          <Link to="/buyer/checkout" className="btn-primary mt-4 w-full">Proceed to Checkout</Link>
        </div>
      </div>
    </div>
  );
}
