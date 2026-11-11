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
      <div className="py-24 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-[#0B1F3A] animate-spin" />
        <p className="mt-4 text-sm font-medium text-slate-700">
          Loading Fleet &amp; Procurement Overview...
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Retrieving registered engines, stored RUL predictions, and orders
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16">
        <div className="p-8 bg-white border border-rose-200 rounded-xl text-center max-w-lg mx-auto shadow-xs">
          <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="font-semibold text-slate-900 text-sm">Unable to Load Dashboard Data</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-[#0B1F3A] text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            Retry Connection
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

  const hasAlerts = Number(stats.rulAlerts) > 0;

  return (
    <div className="space-y-6">
      {/* Section A: Header */}
      <DashboardHeader company={summary?.company} />

      {/* Section B: 4 KPI Cards (Equal height, subtle borders, no default blue highlight) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Registered Engines"
          value={stats.totalEngines}
          subtitle="Turbofan units in company fleet inventory"
          icon={
            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />

        <DashboardStatCard
          title="Active Orders"
          value={stats.activeOrders}
          subtitle="Orders currently in supplier fulfillment"
          icon={
            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />

        <DashboardStatCard
          title="RUL Alerts"
          value={stats.rulAlerts}
          subtitle={
            hasAlerts
              ? "Critical predictions needing review"
              : "No stored critical cycle thresholds"
          }
          icon={
            <svg className={`w-4 h-4 ${hasAlerts ? "text-amber-700" : "text-slate-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          alert={hasAlerts}
        />

        <DashboardStatCard
          title="Saved Parts"
          value={stats.wishlistCount}
          subtitle="Bookmarked parts in marketplace"
          icon={
            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          }
        />
      </div>

      {/* Section C: Stored RUL Alert / Fleet Status Card (Neutral empty state without false claims) */}
      <RulAlertCard alert={summary?.criticalAlert} />

      {/* Section D & E: 2/3 Engine Health Overview + 1/3 Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2">
          <EngineHealthOverview engines={engineHealth} />
        </div>
        <div className="lg:col-span-1">
          <RecentOrders orders={recentOrders} />
        </div>
      </div>
    </div>
  );
}
