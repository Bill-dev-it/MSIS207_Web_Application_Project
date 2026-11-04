import { useState, useEffect, useCallback } from "react";
import orderConfirmationApi from "../services/orderConfirmationApi";

export function useOrderConfirmation(orderId) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadConfirmation = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError("");
      const res = await orderConfirmationApi.getOrderConfirmation(orderId);
      setOrder(res);
    } catch (err) {
      setError(err.message || "Failed to load order confirmation.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadConfirmation();
  }, [loadConfirmation]);

  return {
    order,
    loading,
    error,
    refetch: loadConfirmation,
  };
}

export default useOrderConfirmation;

