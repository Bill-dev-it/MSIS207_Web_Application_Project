
export const NAVIGATION_CONFIG = {
    PUBLIC: [
        { label: "Home", path: "/" },
        { label: "Marketplace", path: "/marketplace" },
    ],

    BUYER: [
        { label: "Dashboard", path: "/buyer" },
    ],

    ADMIN: [
        { label: "Dashboard", path: "/admin" },
        { label: "Suppliers", path: "/admin/moderation" },
        { label: "Companies / Buyers", path: "/admin/companies" },
        { label: "Users", path: "/admin/users" },
        { label: "Orders", path: "/admin/orders" },
        { label: "Reviews / Reports", path: "/admin/reports" },
        { label: "RUL System Status", path: "/admin/rul-status" },
        { label: "System Settings", path: "/admin/settings" },
    ],

    SUPPLIER: [
        { label: "Dashboard", path: "/supplier" },
    ],
};
