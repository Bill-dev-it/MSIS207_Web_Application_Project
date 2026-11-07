import { useState } from "react";
import { useEngines } from "../../../features/buyer/engines/hooks/useEngines";
import { EngineToolbar } from "../../../features/buyer/engines/components/EngineToolbar";
import { EngineTable } from "../../../features/buyer/engines/components/EngineTable";
import { EngineCards } from "../../../features/buyer/engines/components/EngineCards";

export default function MyEngines() {
  const [viewMode, setViewMode] = useState("table");
  const {
    engines,
    counts,
    pagination,
    search,
    setSearch,
    urgency,
    setUrgency,
    page,
    setPage,
    loading,
    error,
    refresh,
  } = useEngines();

  return (
    <div>
      <div className="space-y-6">
        <EngineToolbar
          search={search}
          onSearchChange={setSearch}
          urgency={urgency}
          onUrgencyChange={setUrgency}
          counts={counts}
          viewMode={viewMode}
          onViewModeToggle={setViewMode}
        />

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-xs font-semibold text-slate-500">
              Retrieving fleet engines...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 bg-red-50 border border-red-200 rounded-xl text-center max-w-lg mx-auto">
            <p className="font-bold text-red-800">Failed to load engines fleet</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button
              onClick={refresh}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : viewMode === "table" ? (
          <EngineTable engines={engines} />
        ) : (
          <EngineCards engines={engines} />
        )}

        {/* Pagination controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500">
              Showing page <span className="font-bold text-slate-800">{page}</span> of{" "}
              <span className="font-bold text-slate-800">{pagination.totalPages}</span> ({pagination.total} total engines)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
