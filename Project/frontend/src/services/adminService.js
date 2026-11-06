import apiClient from "./apiClient";

/**
 * Admin and Analytics Service
 * 
 * Provides real-time and mock data aligned with the project's Gold datasets:
 * - data/etl/gold/products.csv
 * - data/etl/gold/suppliers.csv
 * - data/etl/gold/companies.csv
 * - data/etl/gold/engines.csv
 * - data/etl/gold/engine_models.csv
 * - database/schema/01_schema.sql (rul_predictions, replacement_recommendations)
 */

export const MODERATION_QUEUE = [
  {
    id: "MOD-001",
    title: "CFM56-7B HPT Stage 1 Blade Set",
    partNumber: "340-001-402-0",
    supplier: "Safran Certified Aerospace",
    supplierVerified: true,
    supplierRating: 4.9,
    supplierStatus: "Approved",
    listedPrice: 62400.0,
    timeAgo: "45m ago",
    condition: "New",
    stock: 4,
    status: "Awaiting admin decision",
    category: "Product approvals",
    description:
      "High-pressure turbine stage 1 blade set, matched and flow balanced. Sealed packaging with trace documentation from the supplier.",
    compatibleEngines: ["CFM56-7B24", "CFM56-7B26", "CFM56-7B27"],
    attachedDocuments: [
      { name: "Release certificate", format: "PDF", size: "2.4 MB" },
      { name: "Material test report", format: "PDF", size: "840 KB" },
    ],
    infoComplete: true,
    priceReasonable: true,
    documentsAttached: false,
    reviewerNotes: "",
  },
  {
    id: "MOD-002",
    title: "High Pressure Fuel Nozzle Set",
    partNumber: "1849M22P06",
    supplier: "Delta TechOps Surplus",
    supplierVerified: true,
    supplierRating: 4.8,
    supplierStatus: "Approved",
    listedPrice: 28900.0,
    timeAgo: "2h ago",
    condition: "Refurbished",
    stock: 2,
    status: "Awaiting admin decision",
    category: "Product approvals",
    description:
      "Dual orifice high pressure fuel nozzle assembly with calibrated spray pattern. Overhaul records and dual release FAA 8130-3 included.",
    compatibleEngines: ["CFM56-7B22", "CFM56-7B24", "CFM56-7B26"],
    attachedDocuments: [
      { name: "FAA 8130-3 Form", format: "PDF", size: "1.2 MB" },
      { name: "Bench Test Flow Calibration", format: "PDF", size: "620 KB" },
    ],
    infoComplete: true,
    priceReasonable: true,
    documentsAttached: true,
    reviewerNotes: "",
  },
  {
    id: "MOD-003",
    title: "Variable Stator Vane Set",
    partNumber: "RRD-T1K-881",
    supplier: "Aero Parts Exchange",
    supplierVerified: false,
    supplierRating: 4.6,
    supplierStatus: "Pending",
    listedPrice: 16800.0,
    timeAgo: "4h ago",
    condition: "Serviceable",
    stock: 5,
    status: "Awaiting admin decision",
    category: "Product approvals",
    description:
      "Stage 1-3 compressor variable stator vane assembly. Non-destructive inspection completed with zero surface cracks detected.",
    compatibleEngines: ["CFM56-5B4", "CFM56-7B27"],
    attachedDocuments: [
      { name: "NDI Inspection Log", format: "PDF", size: "3.1 MB" },
    ],
    infoComplete: false,
    priceReasonable: true,
    documentsAttached: false,
    reviewerNotes: "",
  },
  {
    id: "MOD-004",
    title: "CFM56 Oil Scavenge Pump",
    partNumber: "301-789-204-0",
    supplier: "Honeywell Aerospace",
    supplierVerified: true,
    supplierRating: 4.95,
    supplierStatus: "Approved",
    listedPrice: 8450.0,
    timeAgo: "Yesterday",
    condition: "Overhauled",
    stock: 3,
    status: "Awaiting admin decision",
    category: "Product approvals",
    description:
      "Engine lube and scavenge pump assembly with new gerotor gear set and seals. Warranty 18 months standard.",
    compatibleEngines: ["CFM56-3C1", "CFM56-7B26", "CFM56-7B27"],
    attachedDocuments: [
      { name: "Overhaul Certification Certificate", format: "PDF", size: "1.8 MB" },
    ],
    infoComplete: true,
    priceReasonable: true,
    documentsAttached: true,
    reviewerNotes: "",
  },
];

export const RUL_SYSTEM_METRICS = {
  service: "Operational",
  lastCheck: "Last check 1 min ago",
  modelVersion: "v2.3",
  deployedDate: "Deployed Sep 20",
  predictionsToday: 148,
  avgLatency: "Avg 640 ms",
  failedRuns7d: 3,
  failureRate: "0.4% of runs",
  urgencyDistribution: [
    { label: "Normal", count: 142, tone: "normal" },
    { label: "Monitor", count: 61, tone: "monitor" },
    { label: "Prepare", count: 23, tone: "prepare" },
    { label: "Prioritize", count: 9, tone: "prioritize" },
  ],
  volumeHistory: [
    { day: "D1", volume: 62 },
    { day: "D2", volume: 75 },
    { day: "D3", volume: 58 },
    { day: "D4", volume: 110 },
    { day: "D5", volume: 88 },
    { day: "D6", volume: 80 },
    { day: "D7", volume: 135 },
    { day: "D8", volume: 125 },
    { day: "D9", volume: 112 },
    { day: "D10", volume: 152 },
    { day: "D11", volume: 132 },
    { day: "D12", volume: 138 },
    { day: "D13", volume: 118 },
    { day: "D14", volume: 168 },
  ],
  recentRuns: [
    {
      time: "10:42",
      engine: "#ENG-037",
      company: "Demo Horizon Airlines",
      rul: 18,
      urgency: "Prioritize",
      result: "OK",
    },
    {
      time: "10:15",
      engine: "#ENG-022",
      company: "Demo Horizon Airlines",
      rul: 94,
      urgency: "Normal",
      result: "OK",
    },
    {
      time: "09:58",
      engine: "#ENG-114",
      company: "Demo Pacific Air",
      rul: 46,
      urgency: "Monitor",
      result: "OK",
    },
  ],
};

export const RECOMMENDATIONS_DATA = {
  engineId: "ENG-037",
  engineModel: "CFM56-7B",
  predictedRul: 18,
  urgency: "Prioritize",
  contextMessage:
    "Compatible with CFM56-7B and ranked by availability, price, delivery time and supplier rating. The prediction does not identify a specific failed component.",
  topRecommendation: {
    rank: 1,
    title: "CFM56-7B HPT Stage 1 Blade Set",
    partNumber: "340-001-402-0",
    condition: "New",
    stock: 4,
    delivery: "3-5 days",
    warranty: "12 months",
    price: 62400,
    currency: "USD",
    supplier: {
      name: "Safran Certified Aerospace",
      initial: "S",
      verified: true,
      rating: 4.9,
      reviewsCount: 128,
    },
    specs: {
      price: "$62,400.00",
      compatibility: "Compatible with CFM56-7B",
      stock: "4 units",
      delivery: "3-5 business days",
      condition: "New",
      supplierRating: "4.9 (128 reviews)",
    },
  },
  alternatives: [
    {
      optionKey: "Option B",
      rank: 2,
      partNumber: "340-001-402-0-OH",
      title: "CFM56-7B Overhauled HPT Blade Set",
      supplier: {
        name: "Delta TechOps Surplus",
        verified: true,
        rating: 4.8,
        reviewsCount: 84,
      },
      condition: "Refurbished",
      stock: 2,
      delivery: "3-5 days",
      price: 41500,
      specs: {
        price: "$41,500.00",
        compatibility: "Compatible with CFM56-7B",
        stock: "2 units",
        delivery: "3-5 business days",
        condition: "Refurbished",
        supplierRating: "4.8 (84 reviews)",
      },
    },
    {
      optionKey: "Option C",
      rank: 3,
      partNumber: "340-002-100-EX",
      title: "HPT Rotor Module Assembly",
      supplier: {
        name: "GE Aviation Fleet Services",
        verified: true,
        rating: 4.9,
        reviewsCount: 96,
      },
      condition: "Refurbished",
      stock: 6,
      delivery: "2-4 days",
      price: 38000,
      specs: {
        price: "$38,000.00",
        compatibility: "Compatible with CFM56-7B",
        stock: "6 units",
        delivery: "2-4 business days",
        condition: "Refurbished",
        supplierRating: "4.9 (96 reviews)",
      },
    },
  ],
};

// Fetch real admin dashboard data from backend API with fallback
export async function fetchAdminDashboard() {
  const res = await apiClient.get("/v1/admin/dashboard");

  // Backend response: { success: true, data: {...} }
  if (res?.success === false) {
    throw new Error("Backend could not load Admin Dashboard data.");
  }

  const raw = res?.data ?? res;

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Invalid dashboard data received from API.");
  }

  const totalRevenue = Number(raw.revenue?.total_revenue ?? 0);
  const currentMonthRevenue = Number(
    raw.revenue?.current_month_revenue ?? 0
  );
  const previousMonthRevenue = Number(
    raw.revenue?.previous_month_revenue ?? 0
  );

  if (
    !Number.isFinite(totalRevenue) ||
    !Number.isFinite(currentMonthRevenue) ||
    !Number.isFinite(previousMonthRevenue)
  ) {
    throw new Error("Invalid revenue values received from API.");
  }

  const formatRevenue = (amount) => {
    if (amount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(1)}M`;
    }

    if (amount >= 1_000) {
      return `$${(amount / 1_000).toFixed(1)}K`;
    }

    return `$${amount.toFixed(2)}`;
  };

  // Do not claim +100% when the previous month had no revenue.
  const revenueChange =
    previousMonthRevenue > 0
      ? (() => {
        const difference =
          ((currentMonthRevenue - previousMonthRevenue) /
            previousMonthRevenue) *
          100;

        return `${difference >= 0 ? "+" : ""}${difference.toFixed(1)}%`;
      })()
      : "N/A";

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTimeAgo = (dateValue) => {
    if (!dateValue) return "Never";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "N/A";

    const differenceMs = Date.now() - date.getTime();

    if (differenceMs < 0) return "Just now";

    const minutes = Math.floor(differenceMs / 60_000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours} hours ago`;

    const days = Math.floor(hours / 24);

    return `${days} days ago`;
  };

  const latency = raw.rulStatus?.average_latency_ms;

  return {
    users: {
      count: Number(raw.users?.total ?? 0),
      change: `+${Number(raw.users?.created_this_month ?? 0)} this month`,
    },

    suppliers: {
      count: Number(raw.suppliers?.total ?? 0),
      pending: Number(raw.suppliers?.pending ?? 0),
    },

    orders: {
      count: Number(raw.orders?.total ?? 0),
      change: `${Number(raw.orders?.total ?? 0)} total`,
    },

    revenue: {
      amount: formatRevenue(totalRevenue),
      change: revenueChange,
    },

    products: {
      count: Number(raw.products?.total_products ?? 0),
      pendingReview: Number(raw.products?.draft_listings ?? 0),
    },

    // The current chart values are expressed in millions.
    salesTrend: Array.isArray(raw.salesTrend)
      ? raw.salesTrend.map((item) => ({
        month: item.month,
        revenue: Number(item.revenue ?? 0),
      }))
      : [],

    rulStatus: {
      // The dashboard API does not currently return service health.
      serviceStatus: "Unknown",

      modelVersion: raw.rulStatus?.model_version
        ? `v${raw.rulStatus.model_version}`
        : "N/A",

      lastPrediction: formatTimeAgo(
        raw.rulStatus?.last_prediction
      ),

      predictionsToday: Number(
        raw.rulStatus?.predictions_today ?? 0
      ),

      averageLatency:
        latency === null || latency === undefined
          ? "N/A"
          : `${Math.round(Number(latency))} ms`,
    },

    newSupplierRequests: Array.isArray(raw.newSupplierRequests)
      ? raw.newSupplierRequests.map((request) => ({
        id: request.id,
        name: request.name,
        date: `Applied ${formatDate(request.applied_at)}`,
        status: request.status,
      }))
      : [],

    reportedItems: Array.isArray(raw.reportedItems)
      ? raw.reportedItems
      : [],
  };
}
export async function fetchModerationQueue() {
  await new Promise((resolve) => setTimeout(resolve, 80));
  return MODERATION_QUEUE;
}

export async function fetchRULSystemStatus() {
  await new Promise((resolve) => setTimeout(resolve, 80));
  return RUL_SYSTEM_METRICS;
}

export async function fetchReplacementRecommendations(engineId = "ENG-037") {
  await new Promise((resolve) => setTimeout(resolve, 80));
  return { ...RECOMMENDATIONS_DATA, engineId };
}

/**
 * Fetch suppliers for Admin Moderation.
 *
 * GET /api/v1/admin/suppliers
 *
 * @param {Object} params
 * @param {string} params.status - PENDING, APPROVED, SUSPENDED or ALL
 * @param {string} params.search - Search keyword
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 */
export async function fetchAdminSuppliers({
    status = "PENDING",
    search = "",
    page = 1,
    limit = 10,
} = {}) {
    const queryParams = new URLSearchParams();

    if (status && status !== "ALL") {
        queryParams.set("status", status);
    }

    if (search.trim()) {
        queryParams.set("search", search.trim());
    }

    queryParams.set("page", String(page));
    queryParams.set("limit", String(limit));

    const queryString = queryParams.toString();

    return apiClient.get(
        `/v1/admin/suppliers?${queryString}`
    );
}

/**
 * Fetch detailed supplier information.
 *
 * GET /api/v1/admin/suppliers/:supplierId
 *
 * @param {string|number} supplierId
 */
export async function fetchAdminSupplierDetail(supplierId) {
    if (!supplierId) {
        throw new Error("Supplier ID is required.");
    }

    return apiClient.get(
        `/v1/admin/suppliers/${encodeURIComponent(supplierId)}`
    );
}

/**
 * Update supplier moderation status.
 *
 * PATCH /api/v1/admin/suppliers/:supplierId/status
 *
 * Allowed transitions are enforced by the Backend.
 *
 * @param {string|number} supplierId
 * @param {"APPROVED"|"SUSPENDED"} status
 */
export async function updateSupplierStatus(supplierId, status) {
    if (!supplierId) {
        throw new Error("Supplier ID is required.");
    }

    const allowedStatuses = ["APPROVED", "SUSPENDED"];

    if (!allowedStatuses.includes(status)) {
        throw new Error(`Invalid supplier target status: ${status}`);
    }

    return apiClient.patch(
        `/v1/admin/suppliers/${encodeURIComponent(supplierId)}/status`,
        { status }
    );
}
