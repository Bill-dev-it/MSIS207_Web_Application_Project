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

export const ADMIN_DASHBOARD_METRICS = {
  users: { count: 1284, change: "+42 this month" },
  suppliers: { count: 86, pending: 5 },
  orders: { count: 2931, change: "+8.4%" },
  revenue: { amount: "$9.8M", change: "+11.2%" },
  products: { count: 4120, pendingReview: 37 },
  salesTrend: [
    { month: "May", revenue: 4.2 },
    { month: "Jun", revenue: 5.1 },
    { month: "Jul", revenue: 6.3 },
    { month: "Aug", revenue: 5.8 },
    { month: "Sep", revenue: 7.2 },
    { month: "Oct", revenue: 9.8 },
  ],
  rulStatus: {
    serviceStatus: "Operational",
    modelVersion: "v2.3",
    lastPrediction: "2 min ago",
    predictionsToday: 148,
    averageLatency: "640 ms",
  },
  newSupplierRequests: [
    { id: 1, name: "Demo Aero Supply 011", date: "Applied Oct 8", status: "PENDING" },
    { id: 2, name: "Nordic Parts GmbH", date: "Applied Oct 7", status: "PENDING" },
    { id: 3, name: "Pacific MRO Trading", date: "Applied Oct 5", status: "PENDING" },
  ],
  reportedItems: [
    { id: 1, title: "Fuel Pump Assembly 2118-4471", reason: "Inaccurate description", type: "PRODUCT" },
    { id: 2, title: "Review by Demo Pacific Air", reason: "Abusive language", type: "REVIEW" },
  ],
};

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

// Async service functions simulate real API calls with fallback
export async function fetchAdminDashboard() {
  await new Promise((resolve) => setTimeout(resolve, 80));
  return ADMIN_DASHBOARD_METRICS;
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
