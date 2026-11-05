import { useState, useEffect, useCallback } from "react";
import ordersApi from "../services/ordersApi";

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError("");
      const res = await ordersApi.getOrders({
        status: activeStatus,
        search,
        page,
        limit: 10,
        signal,
      });

      setOrders(res.orders || []);
      setCounts(res.counts || {});
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message || "Failed to load orders list.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [activeStatus, search, page]);

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(controller.signal);
    return () => controller.abort();
  }, [fetchOrders]);

  const changeStatus = (status) => {
    setActiveStatus(status);
    setPage(1);
  };

  const changeSearch = (text) => {
    setSearch(text);
    setPage(1);
  };

  return {
    orders,
    counts,
    pagination,
    activeStatus,
    search,
    loading,
    error,
    changeStatus,
    changeSearch,
    setPage,
    refetch: () => fetchOrders(),
  };
}

export default useOrders;
