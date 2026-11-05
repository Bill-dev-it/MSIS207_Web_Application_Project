import { buyerRequest } from "../../../../services/buyerApi";

export async function getCart({ signal } = {}) {
  return (await buyerRequest("/v1/cart", { signal })).data;
}

export async function addItemToCart(listingId, quantity = 1) {
  return (await buyerRequest("/v1/cart/items", {
    method: "POST",
    body: { listing_id: String(listingId), quantity: Number(quantity) },
  })).data;
}

export async function updateCartItemQuantity(cartItemId, quantity) {
  return (await buyerRequest(`/v1/cart/items/${encodeURIComponent(cartItemId)}`, {
    method: "PUT",
    body: { quantity: Number(quantity) },
  })).data;
}

export async function removeCartItem(cartItemId) {
  return (await buyerRequest(`/v1/cart/items/${encodeURIComponent(cartItemId)}`, {
    method: "DELETE",
  })).data;
}

export async function clearCart() {
  return (await buyerRequest("/v1/cart", { method: "DELETE" })).data;
}

export default { getCart, addItemToCart, updateCartItemQuantity, removeCartItem, clearCart };
