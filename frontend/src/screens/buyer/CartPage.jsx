import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CheckoutStepper from "../../features/buyer/checkout/components/CheckoutStepper";
import CartItemList from "../../features/buyer/cart/components/CartItemList";
import CartSummary from "../../features/buyer/cart/components/CartSummary";
import { useCart } from "../../features/buyer/cart/hooks/useCart";

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    loading,
    error,
    updatingItemId,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart,
  } = useCart();

  const [purchaseReference, setPurchaseReference] = useState(() => {
    return sessionStorage.getItem("aerorul_po_reference") || "";
  });
  const [mutationError, setMutationError] = useState("");

  const runCartAction = async (action) => {
    setMutationError("");
    try {
      await action();
    } catch (err) {
      setMutationError(err.message || "Unable to update your cart.");
    }
  };

  const retryCart = async () => {
    setMutationError("");
    await refreshCart();
  };
  const canCheckout = items.every((item) =>
    item.offer_available === true && Number(item.quantity) <= Number(item.stock_quantity)
  );

  useEffect(() => {
    sessionStorage.setItem("aerorul_po_reference", purchaseReference);
  }, [purchaseReference]);

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stepper */}
        <CheckoutStepper currentStep={1} />

        {/* Page Title & Status */}
        <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span>Shopping Cart</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono">
                {itemCount} {itemCount === 1 ? "part" : "parts"}
              </span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review selected aerospace spares and supplier offers prior to procurement dispatch.
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-600">
              Retrieving active procurement cart from secure database...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && (mutationError || error) && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm mb-6 flex items-start gap-3">
            <span className="font-bold">⚠️</span>
            <div>
              <p className="font-semibold">Unable to load cart</p>
              <p className="text-xs text-rose-700 mt-0.5">{mutationError || error}</p>
              <button type="button" onClick={retryCart} className="mt-2 font-semibold underline">
                Retry loading cart
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !mutationError && items.length === 0 && (
          <div className="py-16 px-6 bg-white border border-slate-200/90 rounded-2xl text-center max-w-xl mx-auto shadow-2xs">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Your Cart is Empty</h2>
            <p className="text-sm text-slate-500 mb-6">
              You currently have no aviation parts or supplier quotes queued for procurement.
            </p>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition shadow-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Explore Parts Catalog
            </Link>
          </div>
        )}

        {/* Main 2-Column Cart Content */}
        {!loading && !error && !mutationError && items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols: Item List */}
            <div className="lg:col-span-8">
              <CartItemList
                items={items}
                onUpdateQuantity={(itemId, quantity) => runCartAction(() => updateQuantity(itemId, quantity))}
                onRemove={(itemId) => runCartAction(() => removeItem(itemId))}
                onClearCart={() => runCartAction(clearCart)}
                isUpdating={Boolean(updatingItemId)}
              />
            </div>

            {/* Right 4 Cols: Order Summary */}
            <div className="lg:col-span-4">
              <CartSummary
                subtotal={subtotal}
                itemCount={itemCount}
                purchaseReference={purchaseReference}
                onPurchaseReferenceChange={setPurchaseReference}
                isUpdating={Boolean(updatingItemId)}
                checkoutDisabled={!canCheckout}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
