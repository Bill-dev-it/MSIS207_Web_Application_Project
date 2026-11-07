
export const NAVIGATION_CONFIG = {
    PUBLIC: [
        { label: "Home", path: "/" },
        { label: "Marketplace", path: "/marketplace" },
    ],

    BUYER: [
        { label: "Dashboard", path: "/buyer" },
    ],

    ADMIN: [
        {
            label: "Dashboard",
            path: "/admin/dashboard",
            matchPaths: ["/admin", "/admin/dashboard"],
            icon: "dashboard",
        },
        {
            label: "Users",
            path: "/admin/users",
            matchPaths: ["/admin/users"],
            icon: "users",
        },
        {
            label: "Companies / Buyers",
            path: "/admin/companies",
            matchPaths: ["/admin/companies"],
            icon: "companies",
        },
        {
            label: "Suppliers",
            path: "/admin/suppliers",
            matchPaths: ["/admin/suppliers"],
            icon: "suppliers",
        },
        {
            label: "Products",
            path: "/admin/moderation",
            matchPaths: ["/admin/moderation", "/admin/products"],
            icon: "products",
        },
        {
            label: "Orders",
            path: "/admin/orders",
            matchPaths: ["/admin/orders"],
            icon: "orders",
        },
        {
            label: "Reviews / Reports",
            path: "/admin/reports",
            matchPaths: ["/admin/reports"],
            icon: "reports",
        },
        {
            label: "RUL System Status",
            path: "/admin/rul-status",
            matchPaths: ["/admin/rul-status"],
            icon: "rulStatus",
            showStatusDot: true,
        },
        {
            label: "System Settings",
            path: "/admin/settings",
            matchPaths: ["/admin/settings"],
            icon: "settings",
        },
    ],

    SUPPLIER: [
        { label: "Dashboard", path: "/supplier" },
    ],
};
