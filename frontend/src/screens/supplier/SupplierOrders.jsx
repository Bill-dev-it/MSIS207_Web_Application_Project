import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { getSupplierOrders } from "../../services/supplierOrderService";

const statuses = [
  "ALL",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

export default function SupplierOrders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getSupplierOrders()
      .then((data) => setOrders(data))
      .catch(() => setError("Unable to load orders."))
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = orders.filter((order) => {
    const keyword = search.toLowerCase().trim();

    const matchesSearch =
      order.order_number.toLowerCase().includes(keyword) ||
      order.buyer_name.toLowerCase().includes(keyword) ||
      (order.purchase_reference || "")
        .toLowerCase()
        .includes(keyword);

    const matchesStatus =
      status === "ALL" || order.status === status;

    return matchesSearch && matchesStatus;
  });

  function formatMoney(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Supplier Portal"
        title="Incoming Orders"
        description="View buyer orders assigned to your supplier account."
      />

      <p role="note" className="mb-6 rounded-lg bg-accent-50 p-4 text-sm text-primary-800">
        Demo mode: These orders are sample data.
        No real orders or fulfillment actions are connected.
      </p>

      <section className="card p-4 sm:p-6" aria-labelledby="orders-heading">
        <h2 id="orders-heading" className="text-xl font-semibold text-primary-800">
          Order Management
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="order-search" className="label">
              Search orders
            </label>
            <input
              id="order-search"
              type="search"
              className="input"
              placeholder="Order number or buyer"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="order-status" className="label">
              Order status
            </label>
            <select
              id="order-status"
              className="input"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item === "ALL" ? "All statuses" : item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <p role="status" className="mt-6">
            Loading orders...
          </p>
        )}

        {!loading && error && (
          <p role="alert" className="mt-6 text-critical">
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="mt-6">
            <p className="mb-4 text-sm text-neutral-500">
              {filteredOrders.length} orders found
            </p>

            {filteredOrders.length === 0 ? (
              <EmptyState
                title="No orders found"
                description="Try another search term or status."
              />
            ) : (
              <div className="grid gap-4">
                {filteredOrders.map((order) => (
                  <article
                    key={order.seller_order_id}
                    className="rounded-xl border border-neutral-200 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-primary-800">
                          {order.order_number}
                        </h3>
                        <p className="mt-1 text-sm text-neutral-500">
                          {order.buyer_name}
                        </p>
                      </div>

                      <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                        {order.status}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4 border-t border-neutral-200 pt-4 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-neutral-500">Placed</p>
                        <p className="text-sm font-medium">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-neutral-500">Items</p>
                        <p className="text-sm font-medium">
                          {order.items.reduce(
                            (sum, item) => sum + item.quantity, 0
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-neutral-500">Total</p>
                        <p className="font-semibold">
                          {formatMoney(order.grand_total)}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/supplier/orders/${order.seller_order_id}`}
                      className="btn btn-secondary mt-5"
                    >
                      View Details
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
