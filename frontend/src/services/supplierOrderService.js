/*
 * Supplier Orders Service
 * Demo only. No database connection yet.
 */

const demoOrders = [
  {
    seller_order_id: 101,
    order_id: 201,
    order_number: "ORD-2026-0201",
    purchase_reference: "PO-AIR-001",
    supplier_id: 1,
    buyer_name: "Demo Horizon Airlines",
    status: "CONFIRMED",
    created_at: "2026-10-20T09:30:00Z",
    subtotal: 640,
    shipping_fee: 35,
    grand_total: 675,
    currency: "USD",
    items: [
      {
        order_item_id: 301,
        listing_id: 1,
        product_name_snapshot: "Engine Ignition Lead",
        part_number_snapshot: "DEMO-PART-00001",
        seller_sku_snapshot: "DEMO-S01-P0001",
        condition_snapshot: "NEW",
        quantity: 2,
        unit_price: 320,
        line_total: 640,
      },
    ],
  },
  {
    seller_order_id: 102,
    order_id: 202,
    order_number: "ORD-2026-0202",
    purchase_reference: "PO-AIR-002",
    supplier_id: 1,
    buyer_name: "Demo Pacific Air",
    status: "PROCESSING",
    created_at: "2026-10-21T13:15:00Z",
    subtotal: 290,
    shipping_fee: 20,
    grand_total: 310,
    currency: "USD",
    items: [
      {
        order_item_id: 302,
        listing_id: 3,
        product_name_snapshot: "Aircraft Oil Filter",
        part_number_snapshot: "DEMO-PART-00003",
        seller_sku_snapshot: "DEMO-S01-P0003",
        condition_snapshot: "NEW",
        quantity: 2,
        unit_price: 145,
        line_total: 290,
      },
    ],
  },
];

export async function getSupplierOrders() {
  return demoOrders;
}

export async function getSupplierOrderById(id) {
  const orders = await getSupplierOrders();

  return orders.find(
    (order) => String(order.seller_order_id) === String(id)
  ) || null;
}
