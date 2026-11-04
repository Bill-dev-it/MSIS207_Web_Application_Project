import apiClient from "../../../../shared/services/apiClient";

export async function getCart() {
  const res = await apiClient.get("/v1/cart");
  return res.data;
}

export async function addItemToCart(listingId, quantity = 1) {
  const res = await apiClient.post("/v1/cart/items", {
    listing_id: String(listingId),
    quantity: Number(quantity),
  });
  return res.data;
}

export async function updateCartItemQuantity(cartItemId, quantity) {
  const res = await apiClient.put(`/v1/cart/items/${cartItemId}`, {
    quantity: Number(quantity),
  });
  return res.data;
}

export async function removeCartItem(cartItemId) {
  const res = await apiClient.delete(`/v1/cart/items/${cartItemId}`);
  return res.data;
}

export async function clearCart() {
  const res = await apiClient.delete("/v1/cart");
  return res.data;
}

const cartApi = {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};

export default cartApi;

