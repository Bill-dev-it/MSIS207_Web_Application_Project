import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../../auth/AuthContext";
import * as cartApi from "../services/cartApi";

const EMPTY_CART = { items: [], subtotal: 0, total_items: 0 };
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { status, user } = useAuth();
  const isBuyer = status === "authenticated" && user?.role === "BUYER";
  const userId = isBuyer ? String(user.user_id) : null;
  const previousUserId = useRef(userId);
  const [cart, setCart] = useState(EMPTY_CART);
  const [cartOwnerId, setCartOwnerId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const refreshCart = useCallback(async (signal) => {
    if (!isBuyer || !userId) {
      setCart(EMPTY_CART);
      setCartOwnerId(null);
      setLoading(false);
      setError("");
      return EMPTY_CART;
    }
    setLoading(true);
    setError("");
    try {
      const next = await cartApi.getCart({ signal });
      if (!signal?.aborted) {
        setCart(next || EMPTY_CART);
        setCartOwnerId(userId);
      }
      return next;
    } catch (err) {
      if (!signal?.aborted && err?.name !== "AbortError") {
        setError(err.message || "Failed to load cart.");
      }
      return null;
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [isBuyer, userId]);

  useEffect(() => {
    if (previousUserId.current !== userId) {
      for (const key of [
        "aerorul_checkout_address_id",
        "aerorul_checkout_delivery_id",
        "aerorul_checkout_payment_id",
        "aerorul_checkout_key",
        "aerorul_po_reference",
      ]) {
        sessionStorage.removeItem(key);
      }
      previousUserId.current = userId;
    }
    if (!isBuyer || !userId) {
      setCart(EMPTY_CART);
      setCartOwnerId(null);
      setLoading(false);
      setError("");
      return undefined;
    }
    setCart(EMPTY_CART);
    setCartOwnerId(null);
    const controller = new AbortController();
    refreshCart(controller.signal);
    return () => controller.abort();
  }, [isBuyer, userId, refreshCart]);

  const runMutation = useCallback(async (action, itemId = null) => {
    if (!isBuyer || !userId) throw new Error("Sign in with a Buyer account to use the cart.");
    setUpdatingItemId(itemId);
    setError("");
    try {
      const next = await action();
      setCart(next);
      setCartOwnerId(userId);
      return next;
    } catch (err) {
      setError(err.message || "Unable to update cart.");
      throw err;
    } finally {
      setUpdatingItemId(null);
    }
  }, [isBuyer, userId]);

  const addItem = useCallback((listingId, quantity = 1) =>
    runMutation(() => cartApi.addItemToCart(listingId, quantity)), [runMutation]);
  const updateQuantity = useCallback((cartItemId, quantity) =>
    runMutation(() => cartApi.updateCartItemQuantity(cartItemId, quantity), cartItemId), [runMutation]);
  const removeItem = useCallback((cartItemId) =>
    runMutation(() => cartApi.removeCartItem(cartItemId), cartItemId), [runMutation]);
  const clearCart = useCallback(() => runMutation(() => cartApi.clearCart()), [runMutation]);

  const currentCart = isBuyer && cartOwnerId === userId ? cart : EMPTY_CART;
  const items = currentCart.items;
  const itemCount = currentCart.total_items ?? items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const subtotal = Number(currentCart.subtotal) || 0;
  const value = useMemo(() => ({
    cart: currentCart,
    items,
    itemCount,
    cartCount: itemCount,
    subtotal,
    loading: isBuyer ? loading : false,
    error: isBuyer ? error : "",
    updatingItemId,
    refreshCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  }), [currentCart, items, itemCount, subtotal, isBuyer, loading, error,
    updatingItemId, refreshCart, addItem, updateQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside <CartProvider>.");
  return value;
}
