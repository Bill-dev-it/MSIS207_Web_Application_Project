import { ORDERS, PRODUCTS, delay } from "./mockData";

// TODO(backend): replace with POST /orders (checkout), GET /orders,
// GET /orders/:id. Checkout must be a single DB transaction on the backend
// (stock check/decrement + order creation) — see project concept doc, "Transaction khi checkout".
export const orderApi = {
  async list() {
    await delay();
    return ORDERS.map((o) => ({
      ...o,
      items: o.items.map((i) => ({ ...i, product: PRODUCTS.find((p) => p.id === i.productId) })),
    }));
  },

  async getById(id) {
    await delay();
    const order = ORDERS.find((o) => o.id === id);
    if (!order) return null;
    return {
      ...order,
      items: order.items.map((i) => ({ ...i, product: PRODUCTS.find((p) => p.id === i.productId) })),
    };
  },

  async placeOrder(cartItems, shippingInfo) {
    await delay(700);
    const id = `ORD-${1000 + ORDERS.length + 1}`;
    const total = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const newOrder = {
      id,
      status: "Placed",
      placedAt: new Date().toISOString().slice(0, 10),
      total,
      shippingInfo,
      items: cartItems.map((i) => ({ productId: i.product.id, quantity: i.quantity, price: i.product.price, product: i.product })),
    };
    ORDERS.unshift(newOrder);
    return newOrder;
  },
};
