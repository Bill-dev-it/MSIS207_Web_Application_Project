
import { useEffect, useState } from "react";
import { getProductOffers } from "../../../../services/supplierOfferService";

function formatPrice(price) {
  const amount = Number(price);

  if (!Number.isFinite(amount)) return "Unavailable";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function SupplierOffers({
  productId,
  onOfferSelect,
}) {
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
    onOfferSelect?.(null);

    getProductOffers(productId, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;

        setOffers(data);

        const availableOffer =
          data.find(
            (offer) => Number(offer.stock_quantity) > 0
          ) ?? data[0] ?? null;

        if (availableOffer) {
          setSelectedId(availableOffer.listing_id);
          onOfferSelect?.(availableOffer);
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

  function selectOffer(offer) {
    setSelectedId(offer.listing_id);
    onOfferSelect?.(offer);
  }

  return (
    <section
      aria-labelledby="supplier-offers-heading"
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="supplier-offers-heading"
          className="text-lg font-bold text-slate-900"
        >
          Other seller offers
        </h2>

        {!loading && !error && (
          <span className="text-xs text-slate-500">
            {offers.length} offers
          </span>
        )}
      </div>

      {loading && (
        <p role="status" className="mt-5 text-sm text-slate-500">
          Loading supplier offers...
        </p>
      )}

      {!loading && error && (
        <p role="alert" className="mt-5 text-sm text-red-600">
          Unable to load supplier offers: {error}
        </p>
      )}

      {!loading && !error && offers.length === 0 && (
        <div className="mt-5 rounded-lg bg-slate-50 p-5">
          <p className="font-semibold text-slate-800">
            No supplier offers available
          </p>
          <p className="mt-1 text-sm text-slate-500">
            No active supplier listings were returned for this product.
          </p>
        </div>
      )}

      {!loading && !error && offers.length > 0 && (
        <>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="px-3 py-3">Supplier</th>
                  <th className="px-3 py-3">Condition</th>
                  <th className="px-3 py-3">Price</th>
                  <th className="px-3 py-3">Stock</th>
                  <th className="px-3 py-3">Lead time</th>
                  <th className="px-3 py-3">Select</th>
                </tr>
              </thead>

              <tbody>
                {offers.map((offer) => {
                  const selected =
                    String(selectedId) === String(offer.listing_id);

                  return (
                    <tr
                      key={offer.listing_id}
                      className={`border-b border-slate-100 ${selected ? "bg-sky-50" : "hover:bg-slate-50"
                        }`}
                    >
                      <td className="px-3 py-4 font-medium text-slate-900">
                        {offer.store_name || "Unknown supplier"}
                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {offer.seller_sku || "No seller SKU"}
                        </p>
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {offer.condition || "Not specified"}
                      </td>

                      <td className="px-3 py-4 font-semibold text-slate-900">
                        {formatPrice(offer.price)}
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {offer.stock_quantity ?? "Unknown"}
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {offer.lead_time_days != null
                          ? `${offer.lead_time_days} days`
                          : "Not specified"}
                      </td>

                      <td className="px-3 py-4">
                        <button
                          type="button"
                          onClick={() => selectOffer(offer)}
                          aria-pressed={selected}
                          className={`rounded-lg px-3 py-2 text-xs font-semibold ${selected
                            ? "bg-slate-900 text-white"
                            : "border border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                        >
                          {selected ? "Selected" : "Select offer"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Supplier availability and delivery estimates should be
            confirmed before purchase.
          </p>
        </>
      )}
    </section>
  );
}
