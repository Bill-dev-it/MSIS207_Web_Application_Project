
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
        { label: "Moderation", path: "/admin/moderation" },
        { label: "Users", path: "/admin/users" },
        { label: "RUL Monitoring", path: "/admin/rul-status" },
        { label: "Recommendations", path: "/admin/recommendations" },
    ],

    SUPPLIER: [
        { label: "Dashboard", path: "/supplier" },
    ],
};
