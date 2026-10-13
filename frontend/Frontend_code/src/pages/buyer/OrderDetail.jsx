import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { orderApi } from "../../services/orderApi";
import OrderStatusTimeline from "../../components/order/OrderStatusTimeline";
import Breadcrumb from "../../components/common/Breadcrumb";
import { formatCurrency, formatDate } from "../../utils/format";

export default function OrderDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    orderApi.getById(id).then(setOrder);
  }, [id]);

  if (!order) return <p className="text-sm text-neutral-500">Loading order…</p>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Orders", to: "/buyer/orders" }, { label: order.id }]} />

      {params.get("justPlaced") && (
        <div className="card border-success/30 bg-success/5 p-4 text-sm text-success">
          Order placed successfully. You'll get shipment updates as the supplier processes it.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-primary-800">{order.id}</h1>
        <span className="text-sm text-neutral-500">Placed {formatDate(order.placedAt)}</span>
      </div>

      <div className="card p-4">
        <OrderStatusTimeline status={order.status} />
      </div>

      <div className="card divide-y divide-neutral-200">
        {order.items.map((item) => (
          <div key={item.productId} className="flex items-center justify-between p-4 text-sm">
            <div>
              <p className="font-medium text-primary-800">{item.product?.name}</p>
              <p className="text-neutral-500">Qty {item.quantity}</p>
            </div>
            <p className="font-medium text-primary-800">{formatCurrency(item.price * item.quantity)}</p>
          </div>
        ))}
        <div className="flex items-center justify-between p-4 font-semibold text-primary-800">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>

      <div className="card p-4 text-sm text-neutral-500">
        Need help with this order? Contact support or request a cancellation/refund from here.
      </div>
    </div>
  );
}
