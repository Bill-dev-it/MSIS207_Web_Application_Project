import { useState, useEffect, useCallback } from "react";
import orderConfirmationApi from "../services/orderConfirmationApi";

export function useOrderConfirmation(orderId) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadConfirmation = useCallback(async (signal) => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await orderConfirmationApi.getOrderConfirmation(orderId, { signal });
      if (signal?.aborted) return;
      setOrder(res);
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message || "Failed to load order confirmation.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    const controller = new AbortController();
    loadConfirmation(controller.signal);
    return () => controller.abort();
  }, [loadConfirmation]);

  return {
    order,
    loading,
    error,
    refetch: loadConfirmation,
  };
}

export default useOrderConfirmation;
