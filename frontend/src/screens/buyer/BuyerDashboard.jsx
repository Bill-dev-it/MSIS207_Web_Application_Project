import { useDashboard } from "../../features/buyer/dashboard/hooks/useDashboard";
import { DashboardHeader } from "../../features/buyer/dashboard/components/DashboardHeader";
import { DashboardStatCard } from "../../features/buyer/dashboard/components/DashboardStatCard";
import { RulAlertCard } from "../../features/buyer/dashboard/components/RulAlertCard";
import { EngineHealthOverview } from "../../features/buyer/dashboard/components/EngineHealthOverview";
import { RecentOrders } from "../../features/buyer/dashboard/components/RecentOrders";

export default function BuyerDashboard() {
  const { summary, engineHealth, recentOrders, loading, error, refresh } =
    useDashboard();

  if (loading && !summary) {
    return (
      <div>
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-sm font-semibold text-slate-600">
            Loading Buyer Operations Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="p-8 bg-red-50 border border-red-200 rounded-xl text-center max-w-lg mx-auto my-12">
          <p className="font-bold text-red-800">Failed to load dashboard</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const stats = summary?.stats || {
    totalEngines: 0,
    activeOrders: 0,
    rulAlerts: 0,
    wishlistCount: 0,
  };

  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <DashboardHeader company={summary?.company} />

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardStatCard
            title="Total Engines"
            value={stats.totalEngines}
            subtitle="Engines registered to your company"
            icon="⚙"
            highlight
          />
          <DashboardStatCard
            title="Active Orders"
            value={stats.activeOrders}
            subtitle="Orders with active supplier fulfillment"
            icon="📦"
          />
          <DashboardStatCard
            title="RUL Alerts"
            value={stats.rulAlerts}
            subtitle="From stored successful predictions"
            icon="⚠"
            alert={stats.rulAlerts > 0}
          />
          <DashboardStatCard
            title="Saved Parts"
            value={stats.wishlistCount}
            subtitle="Bookmarked marketplace items"
            icon="★"
          />
        </div>

        {/* Middle Section: Critical RUL Alert Banner/Card */}
        <RulAlertCard alert={summary?.criticalAlert} />

        {/* Bottom Grid: Engine Health Overview & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EngineHealthOverview engines={engineHealth} />
          </div>
          <div className="lg:col-span-1">
            <RecentOrders orders={recentOrders} />
          </div>
        </div>
      </div>
    </div>
  );
}
