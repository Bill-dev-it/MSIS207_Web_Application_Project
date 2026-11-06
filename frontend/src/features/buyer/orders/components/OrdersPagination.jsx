export default function OrdersPagination({
  currentPage = 1,
  totalPages = 1,
  total = 0,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
      <p>
        Showing page <span className="font-bold text-slate-900">{currentPage}</span> of{" "}
        <span className="font-bold text-slate-900">{totalPages}</span> ({total} total orders)
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <span className="font-mono px-2 font-bold text-slate-800">
          {currentPage}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}

