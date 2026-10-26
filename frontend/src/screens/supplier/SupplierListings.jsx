
import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { getSupplierListings } from "../../services/supplierService";

export default function SupplierListings() {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getSupplierListings()
      .then((data) => {
        setListings(data);
      })
      .catch(() => {
        setError("Unable to load supplier listings.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredListings = listings.filter((listing) => {
    const keyword = search.toLowerCase();

    return (
      listing.seller_sku.toLowerCase().includes(keyword) ||
      listing.product_name.toLowerCase().includes(keyword)
    );
  });

  function formatPrice(price) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Supplier Portal"
        title="My Listings"
        description="View and manage your aviation parts offers."
      />

      <p
        role="note"
        className="mb-5 rounded-lg bg-accent-50 p-3 text-sm text-primary-800"
      >
        Demo mode: Listing data is not yet connected
        to the backend.
      </p>

      <section aria-labelledby="listings-heading">
        <div className="card p-4 sm:p-6">
          <h2
            id="listings-heading"
            className="text-xl font-semibold text-primary-800"
          >
            Supplier Listings
          </h2>

          <label
            htmlFor="listing-search"
            className="label mt-5"
          >
            Search listings
          </label>

          <input
            id="listing-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by SKU or product name"
            className="input"
          />

          {loading && (
            <p role="status" className="mt-5 text-neutral-500">
              Loading listings...
            </p>
          )}

          {error && (
            <p role="alert" className="mt-5 text-critical">
              {error}
            </p>
          )}

          {!loading && !error && (
            <div className="mt-6">
              <p className="mb-4 text-sm text-neutral-500">
                {filteredListings.length} listings found
              </p>

              {filteredListings.length === 0 ? (
                <EmptyState
                  title="No listings found"
                  description="Try another product name or SKU."
                />
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {filteredListings.map((listing) => (
                    <article
                      key={listing.listing_id}
                      className="rounded-xl border border-neutral-200 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="break-all font-mono text-xs text-neutral-500">
                          {listing.seller_sku}
                        </p>

                        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                          {listing.status}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-semibold text-primary-800">
                        {listing.product_name}
                      </h3>

                      <p className="mt-2 text-sm text-neutral-500">
                        Condition: {listing.condition}
                      </p>

                      <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-neutral-200 pt-4">
                        <div>
                          <p className="text-xs text-neutral-500">
                            Price
                          </p>
                          <p className="font-semibold text-primary-800">
                            {formatPrice(listing.price)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-neutral-500">
                            Stock
                          </p>
                          <p className="font-semibold text-primary-800">
                            {listing.stock_quantity} units
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-neutral-500">
                            Lead time
                          </p>
                          <p className="font-semibold text-primary-800">
                            {listing.lead_time_days} days
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
