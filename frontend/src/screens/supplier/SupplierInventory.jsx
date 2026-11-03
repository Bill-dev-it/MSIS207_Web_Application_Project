
import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { getSupplierInventory } from "../../services/supplierService";
import { SUPPLIER_DEMO_MODE } from "../../features/supplier/api";
import StockEditor from "../../features/supplier/inventory/StockEditor";

export default function SupplierInventory() {
  const [inventory, setInventory] = useState({
    summary: { total_listings: 0, in_stock: 0, low_stock: 0, out_of_stock: 0 },
    items: [],
  });
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getSupplierInventory()
      .then((data) => {
        if (active) setInventory(data);
      })
      .catch((err) => {
        if (active) setError(err.message || "Unable to load inventory.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  function getStockStatus(quantity) {
    if (quantity === 0) return "OUT OF STOCK";
    if (quantity <= 5) return "LOW STOCK";
    return "IN STOCK";
  }

  const filteredListings = inventory.items.filter((item) => {
    const keyword = search.toLowerCase().trim();

    const matchesSearch =
      item.product_name.toLowerCase().includes(keyword) ||
      item.seller_sku.toLowerCase().includes(keyword);

    const matchesFilter =
      filter === "ALL" ||
      getStockStatus(item.stock_quantity) === filter;

    return matchesSearch && matchesFilter;
  });

  const filters = [
    { value: "ALL", label: "All", count: inventory.summary.total_listings },
    { value: "IN STOCK", label: "In Stock", count: inventory.summary.in_stock },
    { value: "LOW STOCK", label: "Low Stock", count: inventory.summary.low_stock },
    { value: "OUT OF STOCK", label: "Out of Stock", count: inventory.summary.out_of_stock },
  ];

  function updateStockSummary(previousSummary, previousQuantity, nextQuantity) {
    const previousStatus = getStockStatus(previousQuantity);
    const nextStatus = getStockStatus(nextQuantity);
    if (previousStatus === nextStatus) return previousSummary;

    const summaryKey = {
      "IN STOCK": "in_stock",
      "LOW STOCK": "low_stock",
      "OUT OF STOCK": "out_of_stock",
    };
    return {
      ...previousSummary,
      [summaryKey[previousStatus]]: previousSummary[summaryKey[previousStatus]] - 1,
      [summaryKey[nextStatus]]: previousSummary[summaryKey[nextStatus]] + 1,
    };
  }

  return (
    <div>
      <PageHeader
        eyebrow="Supplier Portal"
        title="Inventory Management"
        description="Monitor stock availability across your listings."
      />

      {SUPPLIER_DEMO_MODE && <p
        role="note"
        className="mb-6 rounded-lg bg-accent-50 p-3 text-sm text-primary-800"
      >
        Demo mode: Inventory data is not yet connected
        to the backend. Stock updates are not enabled.
      </p>}

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
                title={inventory.items.length === 0 ? "No inventory yet" : "No inventory found"}
                description={inventory.items.length === 0
                  ? "Inventory will appear here after you add supplier listings."
                  : "Try another search term or stock filter."}
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

                      {!SUPPLIER_DEMO_MODE && (
                        <StockEditor listingId={item.listing_id} quantity={item.stock_quantity}
                          onSaved={(quantity) => setInventory((current) => {
                            const currentItem = current.items.find((row) => row.listing_id === item.listing_id);
                            if (!currentItem) return current;
                            return {
                              ...current,
                              summary: updateStockSummary(current.summary, currentItem.stock_quantity, quantity),
                              items: current.items.map((row) =>
                                row.listing_id === item.listing_id
                                  ? { ...row, stock_quantity: quantity }
                                  : row
                              ),
                            };
                          })} />
                      )}
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
