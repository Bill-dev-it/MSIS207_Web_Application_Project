import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useCart } from "../../features/buyer/cart";
import { getProductOffers } from "../../services/supplierOfferService";

export default function SupplierOffers({ productId }) {
  const [offers, setOffers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [adding, setAdding] = useState(false);
  const { status, user } = useAuth();
  const { addItem } = useCart();
  const isBuyer = status === "authenticated" && user?.role === "BUYER";

  useEffect(() => {
    const controller = new AbortController();

    async function fetchOffers() {
      setLoading(true);
      setError("");
      setOffers([]);
      setSelectedId(null);
      try {
        const data = await getProductOffers(productId, { signal: controller.signal });
        if (!controller.signal.aborted) {
          setOffers(data);
        }
      } catch (err) {
        if (!controller.signal.aborted && err.name !== "AbortError") {
          setError(err.message || "Failed to load supplier offers");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchOffers();
    return () => controller.abort();
  }, [productId]);

  function formatPrice(price) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  }

  const selectedOffer = offers.find(
    (offer) => String(offer.listing_id) === String(selectedId)
  );

  async function handleAddToCart() {
    if (!selectedOffer || !isBuyer) return;
    setAdding(true);
    setCartMessage("");
    try {
      await addItem(selectedOffer.listing_id, 1);
      setCartMessage("Added to your cart.");
    } catch (err) {
      setCartMessage(err.message || "Unable to add this offer to your cart.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <section aria-labelledby="supplier-offers-heading">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <h2
          id="supplier-offers-heading"
          className="text-sm font-bold uppercase tracking-wider text-slate-900"
        >
          Supplier Offers
        </h2>

        {!loading && !error && (
          <span className="text-xs font-semibold text-slate-500">
            {offers.length} {offers.length === 1 ? "offer" : "offers"}
          </span>
        )}
      </div>

      <p
        role="note"
        className="mt-3 rounded-lg bg-sky-50 border border-sky-100 p-2.5 text-[11px] text-sky-800 leading-relaxed"
      >
        Verified supplier listings from the AeroRUL database. Current catalog pricing and stock are educational demonstrations.
      </p>

      {loading && (
        <p role="status" className="mt-4 text-xs text-slate-500">
          Loading supplier offers...
        </p>
      )}

      {!loading && error && (
        <p role="alert" className="mt-4 text-xs text-rose-600 font-medium">
          Unable to load supplier offers: {error}
        </p>
      )}

      {!loading && !error && offers.length === 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 p-4 bg-slate-50/50 text-center">
          <p className="font-semibold text-slate-800 text-xs">
            No supplier offers available
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            There are currently no active listings from approved suppliers for this component.
          </p>
        </div>
      )}

      {!loading && !error && offers.length > 0 && (
        <>
          <div className="mt-4 space-y-2.5">
            {offers.map((offer) => {
              const isSelected =
                String(selectedId) === String(offer.listing_id);

              return (
                <label
                  key={offer.listing_id}
                  className={`block cursor-pointer rounded-xl border p-3.5 transition-all ${
                    isSelected
                      ? "border-[#0B1F3A] bg-sky-50/40 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="supplier-offer"
                      value={offer.listing_id}
                      checked={isSelected}
                      onChange={() => setSelectedId(offer.listing_id)}
                      className="mt-1 text-[#0B1F3A] focus:ring-[#0B1F3A]"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-bold text-xs text-slate-900 truncate">
                          {offer.store_name}
                        </p>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {offer.condition}
                        </span>
                      </div>

                      <p className="mt-0.5 font-mono text-[11px] text-slate-400 truncate">
                        SKU: {offer.seller_sku}
                      </p>

                      <p className="mt-2 text-base font-extrabold text-[#0B1F3A] font-mono">
                        {formatPrice(offer.price)}
                      </p>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Stock: <strong className="text-slate-800 font-mono">{offer.stock_quantity}</strong></span>
                        <span>Lead: <strong className="text-slate-800 font-mono">{offer.lead_time_days}d</strong></span>
                      </div>

                      {offer.stock_quantity === 0 && (
                        <p className="mt-1.5 text-[11px] font-bold text-rose-600">
                          Out of stock
                        </p>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {selectedOffer && (
            <div
              role="status"
              className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Selected Offer
              </p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {selectedOffer.store_name}
                </span>
                <span className="font-mono text-sm font-bold text-[#0B1F3A]">
                  {formatPrice(selectedOffer.price)}
                </span>
              </div>
            </div>
          )}

          {isBuyer ? (
            <button
              type="button"
              className="w-full mt-4 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#0B1F3A] text-white hover:bg-slate-800 disabled:opacity-40 transition-colors shadow-xs"
              onClick={handleAddToCart}
              disabled={!selectedOffer || Number(selectedOffer.stock_quantity) < 1 || adding}
            >
              {adding ? "Adding to Cart..." : "Add Selected Offer to Cart"}
            </button>
          ) : status === "anonymous" ? (
            <p className="mt-4 text-xs text-slate-600 text-center">
              <Link className="font-bold text-[#0B1F3A] underline" to="/login">
                Sign in as a Buyer
              </Link>{" "}
              to add parts to procurement cart.
            </p>
          ) : (
            <p className="mt-4 text-xs text-slate-500 text-center">
              Cart procurement is reserved for registered Buyer accounts.
            </p>
          )}

          {cartMessage && (
            <p className="mt-2 text-xs font-semibold text-emerald-700 text-center" role="status">
              {cartMessage}
            </p>
          )}
        </>
      )}
    </section>
  );
}
