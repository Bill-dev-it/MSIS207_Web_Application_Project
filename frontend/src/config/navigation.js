/**
 * Single source of truth for Portal Navigation.
 * All paths map to real, registered routes.
 */

export const BUYER_NAV = [
  {
    to: "/buyer",
    label: "Overview",
    icon: "Dashboard",
    end: true,
  },
  {
    to: "/buyer/engines",
    label: "Fleet & Engines",
    icon: "Engine",
  },
  {
    to: "/buyer/recommendations",
    label: "Replacement Parts",
    icon: "Recommendation",
  },
  {
    to: "/buyer/orders",
    label: "Purchase Orders",
    icon: "Order",
  },
];

export const ADMIN_NAV = [
  {
    to: "/admin/dashboard",
    label: "Mission Dashboard",
    icon: "Dashboard",
  },
  {
    to: "/admin/moderation",
    label: "Part Moderation",
    icon: "Shield",
  },
  {
    to: "/admin/rul-status",
    label: "RUL Telemetry & AI",
    icon: "Activity",
  },
  {
    to: "/admin/recommendations",
    label: "Recommendations",
    icon: "Recommendation",
  },
];
