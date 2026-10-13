// In-memory mock data standing in for the future Node.js/Express REST API.
// Every function in services/*Api.js is written so that swapping its body
// for a real `fetch()` call to the backend does not change any calling page.

export const CATEGORIES = [
  { id: "cat-engine", name: "Engines" },
  { id: "cat-turbine", name: "Turbine Components" },
  { id: "cat-compressor", name: "Compressor Parts" },
  { id: "cat-bearing", name: "Bearings" },
  { id: "cat-sensor", name: "Sensors" },
];

export const SUPPLIERS = [
  { id: "sup-1", name: "SkyForge Aero Parts", verified: true, rating: 4.8, region: "US" },
  { id: "sup-2", name: "Meridian Turbine Supply", verified: true, rating: 4.6, region: "EU" },
  { id: "sup-3", name: "PacificAir Components", verified: false, rating: 4.2, region: "APAC" },
];

export const PRODUCTS = [
  {
    id: "prod-101",
    name: "CFM56-7B High-Pressure Turbine Blade Set",
    partNumber: "HPT-7B-3391",
    categoryId: "cat-turbine",
    price: 18450,
    currency: "USD",
    stock: 12,
    condition: "New",
    compatibility: ["CFM56-7B"],
    supplierId: "sup-1",
    rating: 4.7,
    deliveryDays: 5,
    compatibilityScore: 98,
    image: "turbine-blade",
  },
  {
    id: "prod-102",
    name: "CFM56-7B Combustor Assembly",
    partNumber: "CMB-7B-1120",
    categoryId: "cat-turbine",
    price: 42500,
    currency: "USD",
    stock: 4,
    condition: "New",
    compatibility: ["CFM56-7B"],
    supplierId: "sup-2",
    rating: 4.5,
    deliveryDays: 9,
    compatibilityScore: 95,
    image: "combustor",
  },
  {
    id: "prod-103",
    name: "CFM56-7B Main Shaft Bearing",
    partNumber: "BRG-7B-0087",
    categoryId: "cat-bearing",
    price: 6300,
    currency: "USD",
    stock: 21,
    condition: "New",
    compatibility: ["CFM56-7B", "CFM56-5B"],
    supplierId: "sup-1",
    rating: 4.9,
    deliveryDays: 3,
    compatibilityScore: 91,
    image: "bearing",
  },
  {
    id: "prod-104",
    name: "V2500 Compressor Rotor",
    partNumber: "CMP-V25-4471",
    categoryId: "cat-compressor",
    price: 51200,
    currency: "USD",
    stock: 2,
    condition: "Refurbished",
    compatibility: ["V2500"],
    supplierId: "sup-3",
    rating: 4.1,
    deliveryDays: 14,
    compatibilityScore: 88,
    image: "compressor",
  },
  {
    id: "prod-105",
    name: "CFM56-7B Vibration Sensor Kit",
    partNumber: "SNS-7B-0022",
    categoryId: "cat-sensor",
    price: 2100,
    currency: "USD",
    stock: 40,
    condition: "New",
    compatibility: ["CFM56-7B"],
    supplierId: "sup-2",
    rating: 4.6,
    deliveryDays: 2,
    compatibilityScore: 100,
    image: "sensor",
  },
  {
    id: "prod-106",
    name: "CFM56-7B Exchange Engine (Short-Term Lease)",
    partNumber: "ENG-7B-EXC",
    categoryId: "cat-engine",
    price: 1850000,
    currency: "USD",
    stock: 1,
    condition: "Exchange",
    compatibility: ["CFM56-7B"],
    supplierId: "sup-1",
    rating: 4.8,
    deliveryDays: 30,
    compatibilityScore: 96,
    image: "engine",
  },
];

export const ENGINES = [
  {
    id: "ENG-001",
    model: "CFM56-7B",
    currentCycle: 18240,
    latestRul: 92,
    urgency: "Normal",
    lastAnalysis: "2026-09-10",
  },
  {
    id: "ENG-002",
    model: "CFM56-7B",
    currentCycle: 21830,
    latestRul: 47,
    urgency: "Monitor",
    lastAnalysis: "2026-09-08",
  },
  {
    id: "ENG-037",
    model: "CFM56-7B",
    currentCycle: 27110,
    latestRul: 18,
    urgency: "Replace Soon",
    lastAnalysis: "2026-09-14",
  },
];

export const RUL_HISTORY = {
  "ENG-037": [
    { cycle: 26600, rul: 46 },
    { cycle: 26750, rul: 39 },
    { cycle: 26900, rul: 31 },
    { cycle: 27000, rul: 24 },
    { cycle: 27110, rul: 18 },
  ],
};

export const ORDERS = [
  {
    id: "ORD-1004",
    buyerId: "buyer-1",
    items: [{ productId: "prod-101", quantity: 1, price: 18450 }],
    status: "Shipped",
    placedAt: "2026-09-05",
    total: 18450,
  },
  {
    id: "ORD-1002",
    buyerId: "buyer-1",
    items: [{ productId: "prod-103", quantity: 2, price: 6300 }],
    status: "Delivered",
    placedAt: "2026-08-22",
    total: 12600,
  },
];

export function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
