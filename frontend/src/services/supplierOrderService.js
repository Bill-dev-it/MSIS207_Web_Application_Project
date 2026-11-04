import { SUPPLIER_DEMO_MODE } from "../features/supplier/api";
import { demoOrders } from "../mocks/supplierOrders";
import { fetchOrders, fetchOrder, advanceOrderStatus } from "../features/supplier/orders/orderApi";


export async function getSupplierOrders() {
  return SUPPLIER_DEMO_MODE ? demoOrders : fetchOrders();
}

export async function getSupplierOrderById(id) {
  if (!SUPPLIER_DEMO_MODE) return fetchOrder(id);
  return demoOrders.find((order) => String(order.seller_order_id) === String(id)) || null;
}

export async function updateSupplierOrderStatus(id, status) {
  if (SUPPLIER_DEMO_MODE) return null;
  return advanceOrderStatus(id, status);
}
