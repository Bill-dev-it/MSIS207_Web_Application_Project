import { useState, useEffect, useCallback } from "react";
import orderDetailApi from "../services/orderDetailApi";

export function useOrderDetail(orderId) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrderDetail = useCallback(async (signal) => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await orderDetailApi.getOrderDetail(orderId, { signal });
      if (signal?.aborted) return;
      setOrder(res);
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message || "Failed to load order details.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    const controller = new AbortController();
    loadOrderDetail(controller.signal);
    return () => controller.abort();
  }, [loadOrderDetail]);

  return {
    order,
    loading,
    error,
    refetch: loadOrderDetail,
  };
}

export default useOrderDetail;
