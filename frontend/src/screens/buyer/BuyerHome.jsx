import { Link } from "react-router-dom";

export default function BuyerHome() {
  const buyerScreens = [
    {
      title: "Buyer Operations Dashboard",
      description:
        "Overview of company fleet health, active procurement orders, critical RUL alerts, and saved wishlist items.",
      to: "/buyer/dashboard",
      badge: "Dashboard",
      file: "BuyerDashboard.jsx",
      color: "from-blue-600 to-indigo-700",
    },
    {
      title: "My Engines Fleet",
      description:
        "Company-owned aircraft engines inventory, cycle tracking, RUL urgency filtering, and interactive table/card views.",
      to: "/buyer/engines",
      badge: "Screen 16",
      file: "MyEngines.jsx",
      color: "from-indigo-600 to-purple-700",
    },
    {
      title: "Engine Telemetry & Detail",
      description:
        "Detailed aircraft engine specifications, operating status, stored RUL prediction history, and sensor upload logs.",
      to: "/buyer/engines/1",
      badge: "Engine Detail",
      file: "EngineDetail.jsx",
      color: "from-sky-600 to-blue-800",
    },
    {
      title: "RUL Analysis & Recommendations",
      description:
        "Upload NASA C-MAPSS FD002 or synthetic sensor CSV telemetry, run iTransformer RUL inference, and view urgency-ranked replacement parts.",
      to: "/buyer/rul",
      badge: "Screen 12 & 13",
      file: "RULAnalysis.jsx",
      color: "from-purple-600 to-pink-700",
    },
    {
      title: "Procurement Orders",
      description:
        "Track airline maintenance purchase orders, filter by fulfillment status, and search across supplier shipments.",
      to: "/orders",
      badge: "Screen 17",
      file: "OrdersPage.jsx",
      color: "from-blue-600 to-indigo-700",
    },
    {
      title: "Order Detail & Fulfillment",
      description:
        "Inspect multi-supplier order splits, shipment tracking numbers, delivery timelines, and payment reconciliation status.",
      to: "/orders/1",
      badge: "Screen 18",
      file: "OrderDetailPage.jsx",
      color: "from-indigo-600 to-purple-700",
    },
    {
      title: "Order Confirmation",
      description:
        "Post-checkout order confirmation summary, recorded B2B payment instructions, and next procurement steps.",
      to: "/orders/1/confirmation",
      badge: "Screen 23",
      file: "OrderConfirmationPage.jsx",
      color: "from-emerald-600 to-teal-700",
    },
    {
      title: "Shopping Cart",
      description:
        "Review selected aviation part listings, update quantities against live supplier stock, and manage PO references.",
      to: "/cart",
      badge: "Cart",
      file: "CartPage.jsx",
      color: "from-sky-600 to-blue-800",
    },
    {
      title: "Checkout – Shipping",
      description:
        "Select or add company-scoped delivery addresses with ISO country code validation and delivery method estimates.",
      to: "/checkout/shipping",
      badge: "Checkout Step 1",
      file: "CheckoutShippingPage.jsx",
      color: "from-blue-600 to-indigo-700",
    },
    {
      title: "Checkout – Payment",
      description:
        "Choose B2B payment methods (Simulated Payment or Bank Transfer Demo) and verify company billing details.",
      to: "/checkout/payment",
      badge: "Checkout Step 2",
      file: "CheckoutPaymentPage.jsx",
      color: "from-indigo-600 to-purple-700",
    },
    {
      title: "Checkout – Review & Place Order",
      description:
        "Final verification of shipping address, payment method, supplier order splits, and atomic order placement.",
      to: "/checkout/review",
      badge: "Checkout Step 3",
      file: "CheckoutReviewPage.jsx",
      color: "from-purple-600 to-pink-700",
    },
  ];

  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-accent">
          AeroRUL Buyer Workspace Hub
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-primary-800">
          Buyer Portal & Specialized Screens
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Access high-fidelity Buyer UI/UX implementations for fleet health monitoring, predictive RUL analysis, and B2B aviation procurement.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {buyerScreens.map((screen) => (
          <Link
            key={screen.to}
            to={screen.to}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-accent hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
                  {screen.badge}
                </span>
                <span className="text-xs font-semibold text-accent group-hover:translate-x-1 transition-transform">
                  Open Screen →
                </span>
              </div>

              <h2 className="mt-4 text-xl font-bold text-primary-800 group-hover:text-accent transition-colors">
                {screen.title}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                {screen.description}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs font-bold text-primary-700">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span>Full UI_UX reproduction</span>
              </div>
              <span className="font-mono text-[11px] font-medium text-neutral-400">
                {screen.file}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

