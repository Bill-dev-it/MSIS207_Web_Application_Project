import { useEffect, useState } from "react";
import { getProductOffers } from "../../services/supplierOfferService";

export default function SupplierOffers({ productId }) {
  const [offers, setOffers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");
    setOffers([]);
    setSelectedId(null);

    getProductOffers(productId, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setOffers(data);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

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

  return (
    <section aria-labelledby="supplier-offers-heading">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="supplier-offers-heading"
          className="text-lg font-semibold text-primary-800"
        >
          Supplier Offers
        </h2>

        {!loading && !error && (
          <span className="text-xs text-neutral-500">
            {offers.length} offers
          </span>
        )}
      </div>

      <p
        role="note"
        className="mt-4 rounded-lg bg-accent-50 p-3 text-xs text-primary-800"
      >
        Supplier listings are loaded from the AeroRUL database.
        Current catalog data is for educational demonstration.
        Availability must be confirmed before checkout.
      </p>

      {loading && (
        <p role="status" className="mt-4 text-sm text-neutral-500">
          Loading supplier offers...
        </p>
      )}

      {!loading && error && (
        <p role="alert" className="mt-4 text-sm text-critical">
          Unable to load supplier offers: {error}
        </p>
      )}

      {!loading && !error && offers.length === 0 && (
        <div className="mt-5 rounded-lg border border-neutral-200 p-4">
          <p className="font-medium text-primary-800">
            No supplier offers available
          </p>

          <p className="mt-2 text-sm text-neutral-500">
            There are currently no active listings from
            approved suppliers for this product.
          </p>
        </div>
      )}

      {!loading && !error && offers.length > 0 && (
        <>
          <div className="mt-5 space-y-3">
            {offers.map((offer) => {
              const isSelected =
                String(selectedId) === String(offer.listing_id);

              return (
                <label
                  key={offer.listing_id}
                  className={
                    "block cursor-pointer rounded-xl border p-4 " +
                    (isSelected
                      ? "border-accent-600 bg-accent-50"
                      : "border-neutral-200")
                  }
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="supplier-offer"
                      value={offer.listing_id}
                      checked={isSelected}
                      onChange={() => setSelectedId(offer.listing_id)}
                      className="mt-1"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="break-words font-semibold text-primary-800">
                        {offer.store_name}
                      </p>

                      <p className="mt-1 break-all font-mono text-xs text-neutral-500">
                        {offer.seller_sku}
                      </p>

                      <p className="mt-3 text-xl font-bold text-primary-800">
                        {formatPrice(offer.price)}
                      </p>

                      <p className="mt-2 text-sm text-neutral-500">
                        Condition: {offer.condition}
                      </p>

                      <p className="text-sm text-neutral-500">
                        Stock: {offer.stock_quantity} units
                      </p>

                      <p className="text-sm text-neutral-500">
                        Lead time: {offer.lead_time_days} days
                      </p>

                      {offer.stock_quantity === 0 && (
                        <p className="mt-2 text-sm font-medium text-critical">
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
              className="mt-5 rounded-lg border border-neutral-200 p-4"
            >
              <p className="text-sm font-semibold text-primary-800">
                Selected Offer
              </p>

              <p className="mt-2 text-sm text-neutral-500">
                {selectedOffer.store_name}
              </p>

              <p className="mt-1 font-semibold text-primary-800">
                {formatPrice(selectedOffer.price)}
              </p>
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary mt-5 w-full"
            disabled
          >
            Add to Cart — Coming Soon
          </button>

          <p className="mt-3 text-xs text-neutral-500">
            Cart and checkout require buyer authentication
            and backend integration.
          </p>
        </>
      )}
    </section>
  );
}
