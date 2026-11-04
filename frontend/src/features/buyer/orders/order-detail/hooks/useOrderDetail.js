import { useState, useEffect, useCallback } from "react";
import orderDetailApi from "../services/orderDetailApi";

export function useOrderDetail(orderId) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrderDetail = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError("");
      const res = await orderDetailApi.getOrderDetail(orderId);
      setOrder(res);
    } catch (err) {
      setError(err.message || "Failed to load order details.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrderDetail();
  }, [loadOrderDetail]);

  return {
    order,
    loading,
    error,
    refetch: loadOrderDetail,
  };
}

export default useOrderDetail;

