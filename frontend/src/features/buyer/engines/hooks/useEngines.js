import { useState, useEffect, useCallback } from "react";
import { getEngines } from "../services/engineApi";

export function useEngines({ initialSearch = "", initialUrgency = "ALL" } = {}) {
  const [engines, setEngines] = useState([]);
  const [counts, setCounts] = useState({
    ALL: 0,
    PRIORITIZE: 0,
    PREPARE: 0,
    MONITOR: 0,
    NORMAL: 0,
    NOT_ANALYZED: 0,
    aircraftCount: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState(initialSearch);
  const [urgency, setUrgency] = useState(initialUrgency);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEngines = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        const json = await getEngines({
          search,
          urgency,
          page,
          limit: 10,
          signal,
        });
        setEngines(json.data);
        if (json.counts) setCounts(json.counts);
        if (json.pagination) setPagination(json.pagination);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to load engines list");
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [search, urgency, page]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchEngines(controller.signal);
    return () => controller.abort();
  }, [fetchEngines]);

  return {
    engines,
    counts,
    pagination,
    search,
    setSearch: (val) => {
      setSearch(val);
      setPage(1);
    },
    urgency,
    setUrgency: (val) => {
      setUrgency(val);
      setPage(1);
    },
    page,
    setPage,
    loading,
    error,
    refresh: () => fetchEngines(),
  };
}
