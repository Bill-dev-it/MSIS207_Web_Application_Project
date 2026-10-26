import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import { getSupplierOrderById } from "../../services/supplierOrderService";

export default function SupplierOrderDetail() {
  const { sellerOrderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    setOrder(null);

    getSupplierOrderById(sellerOrderId)
      .then((data) => {
        if (!data) {
          setError("Order not found.");
        } else {
          setOrder(data);
        }
      })
      .catch(() => setError("Unable to load order details."))
      .finally(() => setLoading(false));
  }, [sellerOrderId]);

  function money(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Supplier Portal"
        title="Order Details"
        description="Review the products and totals for this supplier order."
      />

      <Link
        to="/supplier/orders"
        className="mb-6 inline-block text-sm font-medium text-accent-600 hover:underline"
      >
        ← Back to Orders
      </Link>

      {loading && (
        <p role="status">Loading order details...</p>
      )}

      {!loading && error && (
        <p role="alert" className="mt-4 text-critical">
          {error}
        </p>
      )}

      {!loading && order && (
        <>
          <p role="note" className="mb-6 rounded-lg bg-accent-50 p-4 text-sm">
            Demo order. Fulfillment status cannot be changed yet.
          </p>

          <section className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">
                  {order.order_number}
                </h2>
                <p className="mt-2 text-sm text-neutral-500">
                  Buyer: {order.buyer_name}
                </p>
                <p className="text-sm text-neutral-500">
                  Purchase Ref: {order.purchase_reference || "N/A"}
                </p>
              </div>

              <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold">
                {order.status}
              </span>
            </div>

            <h3 className="mt-8 text-lg font-semibold">
              Order Items
            </h3>

            <div className="mt-4 space-y-3">
              {order.items.map((item) => (
                <article
                  key={item.order_item_id}
                  className="rounded-lg border border-neutral-200 p-4"
                >
                  <h4 className="font-semibold">
                    {item.product_name_snapshot}
                  </h4>

                  <p className="mt-1 break-all text-xs text-neutral-500">
                    SKU: {item.seller_sku_snapshot}
                  </p>

                  <p className="mt-2 text-sm text-neutral-500">
                    Condition: {item.condition_snapshot}
                  </p>

                  <div className="mt-3 flex flex-wrap justify-between gap-3">
                    <p className="text-sm">
                      {item.quantity} × {money(item.unit_price)}
                    </p>
                    <p className="font-semibold">
                      {money(item.line_total)}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 space-y-3 border-t border-neutral-200 pt-5">
              <div className="flex justify-between gap-3 text-sm">
                <span>Subtotal</span>
                <span>{money(order.subtotal)}</span>
              </div>

              <div className="flex justify-between gap-3 text-sm">
                <span>Shipping fee</span>
                <span>{money(order.shipping_fee)}</span>
              </div>

              <div className="flex justify-between gap-3 border-t border-neutral-200 pt-3 font-bold">
                <span>Grand Total</span>
                <span>{money(order.grand_total)}</span>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
