import OrdersFilters from "../../features/buyer/orders/components/OrdersFilters";
import OrdersTable from "../../features/buyer/orders/components/OrdersTable";
import OrdersPagination from "../../features/buyer/orders/components/OrdersPagination";
import { useOrders } from "../../features/buyer/orders/hooks/useOrders";

export default function OrdersPage() {
  const {
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
  } = useOrders();

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Procurement Orders
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Track airline maintenance purchase orders, supplier fulfillment status, and logistics dispatch.
            </p>
          </div>
        </div>

        {/* Filters & Status Tabs */}
        <OrdersFilters
          activeStatus={activeStatus}
          counts={counts}
          search={search}
          onStatusChange={changeStatus}
          onSearchChange={changeSearch}
        />

        {/* Loading Spinner */}
        {loading && (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-600">
              Retrieving corporate procurement orders from PostgreSQL database...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm mb-6 flex items-start gap-3">
            <span className="font-bold">⚠️</span>
            <div>
              <p className="font-semibold">Unable to retrieve orders</p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Orders Table */}
        {!loading && !error && (
          <>
            <OrdersTable orders={orders} />
            <OrdersPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
