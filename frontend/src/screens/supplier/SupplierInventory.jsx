
import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { getSupplierListings } from "../../services/supplierService";

export default function SupplierInventory() {
  const [listings, setListings] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getSupplierListings()
      .then((data) => setListings(data))
      .catch(() => setError("Unable to load inventory."))
      .finally(() => setLoading(false));
  }, []);

  // Stock classification
  function getStockStatus(quantity) {
    if (quantity === 0) return "OUT OF STOCK";
    if (quantity <= 5) return "LOW STOCK";
    return "IN STOCK";
  }

  // Summary
  const totalListings = listings.length;
  const inStock = listings.filter(
    (item) => item.stock_quantity > 5
  ).length;
  const lowStock = listings.filter(
    (item) => item.stock_quantity > 0 &&
      item.stock_quantity <= 5
  ).length;
  const outOfStock = listings.filter(
    (item) => item.stock_quantity === 0
  ).length;

  // Search and filter
  const filteredListings = listings.filter((item) => {
    const keyword = search.toLowerCase();

    const matchesSearch =
      item.product_name.toLowerCase().includes(keyword) ||
      item.seller_sku.toLowerCase().includes(keyword);

    const matchesFilter =
      filter === "ALL" ||
      getStockStatus(item.stock_quantity) === filter;

    return matchesSearch && matchesFilter;
  });

  const filters = [
    { value: "ALL", label: "All", count: totalListings },
    { value: "IN STOCK", label: "In Stock", count: inStock },
    { value: "LOW STOCK", label: "Low Stock", count: lowStock },
    { value: "OUT OF STOCK", label: "Out of Stock", count: outOfStock },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Supplier Portal"
        title="Inventory Management"
        description="Monitor stock availability across your listings."
      />

      <p
        role="note"
        className="mb-6 rounded-lg bg-accent-50 p-3 text-sm text-primary-800"
      >
        Demo mode: Inventory data is not yet connected
        to the backend. Stock updates are not enabled.
      </p>

      {loading && (
        <p role="status" className="text-neutral-500">
          Loading inventory...
        </p>
      )}

      {!loading && error && (
        <p role="alert" className="text-critical">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          {/* Inventory summary */}
          <section
            aria-label="Inventory summary"
            className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            {filters.map((item) => (
              <div key={item.value} className="card p-4">
                <p className="text-xs text-neutral-500">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-primary-800">
                  {item.count}
                </p>
              </div>
            ))}
          </section>

          <section aria-labelledby="inventory-title" className="card p-4 sm:p-6">
            <h2
              id="inventory-title"
              className="text-xl font-semibold text-primary-800"
            >
              Stock Overview
            </h2>

            <label htmlFor="inventory-search" className="label mt-5">
              Search inventory
            </label>

            <input
              id="inventory-search"
              type="search"
              className="input"
              placeholder="Search by product or SKU"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <div
              className="mt-4 flex flex-wrap gap-2"
              role="group"
              aria-label="Filter stock status"
            >
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={filter === item.value}
                  onClick={() => setFilter(item.value)}
                  className={
                    filter === item.value
                      ? "btn btn-primary"
                      : "btn btn-secondary"
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>

            <p className="my-5 text-sm text-neutral-500">
              {filteredListings.length} listings found
            </p>

            {filteredListings.length === 0 ? (
              <EmptyState
                title="No inventory found"
                description="Try another search term or stock filter."
              />
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredListings.map((item) => {
                  const stockStatus = getStockStatus(
                    item.stock_quantity
                  );

                  return (
                    <article
                      key={item.listing_id}
                      className="rounded-xl border border-neutral-200 p-4"
                    >
                      <p className="break-all font-mono text-xs text-neutral-500">
                        {item.seller_sku}
                      </p>

                      <h3 className="mt-2 text-lg font-semibold text-primary-800">
                        {item.product_name}
                      </h3>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-neutral-500">
                            Available quantity
                          </p>
                          <p className="text-xl font-bold text-primary-800">
                            {item.stock_quantity} units
                          </p>
                        </div>

                        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                          {stockStatus}
                        </span>
                      </div>

                      <p className="mt-4 text-xs text-neutral-500">
                        Listing status: {item.status}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
