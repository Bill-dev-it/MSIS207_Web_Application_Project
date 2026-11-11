import { useState, useEffect, useCallback } from "react";
import {
  getDashboardSummary,
  getDashboardEngineHealth,
  getDashboardRecentOrders,
} from "../services/dashboardApi";

export function useDashboard() {
  const [summary, setSummary] = useState(null);
  const [engineHealth, setEngineHealth] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const sumData = await getDashboardSummary({ signal });
      const healthData = await getDashboardEngineHealth({ limit: 5, signal });
      const ordersData = await getDashboardRecentOrders({ limit: 5, signal });
      setSummary(sumData);
      setEngineHealth(healthData);
      setRecentOrders(ordersData);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Failed to load dashboard data");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchDashboardData(controller.signal);
    return () => controller.abort();
  }, [fetchDashboardData]);

  return {
    summary,
    engineHealth,
    recentOrders,
    loading,
    error,
    refresh: () => fetchDashboardData(),
  };
}
