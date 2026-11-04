import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as cartApi from "../services/cartApi";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], subtotal: 0, total_items: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await cartApi.getCart();
      setCart(data || { items: [], subtotal: 0, total_items: 0 });
    } catch (err) {
      console.error("[useCart] refreshCart error:", err);
      setError(err.message || "Failed to load cart.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = async (listingId, quantity = 1) => {
    try {
      setError("");
      const updated = await cartApi.addItemToCart(listingId, quantity);
      setCart(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    try {
      setError("");
      const updated = await cartApi.updateCartItemQuantity(cartItemId, quantity);
      setCart(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      setError("");
      const updated = await cartApi.removeCartItem(cartItemId);
      setCart(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const clear = async () => {
    try {
      setError("");
      const updated = await cartApi.clearCart();
      setCart(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const items = cart?.items || [];
  const itemCount = cart?.total_items ?? items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  const subtotal = Number(cart?.subtotal) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        itemCount,
        cartCount: itemCount,
        subtotal,
        loading,
        error,
        refreshCart,
        addItem,
        updateQuantity,
        removeItem,
        clearCart: clear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    // Graceful fallback if rendered outside CartProvider
    return {
      cart: { items: [], subtotal: 0, total_items: 0 },
      items: [],
      itemCount: 0,
      cartCount: 0,
      subtotal: 0,
      loading: false,
      error: "",
      refreshCart: async () => {},
      addItem: async () => {},
      updateQuantity: async () => {},
      removeItem: async () => {},
      clearCart: async () => {},
    };
  }
  return context;
}


