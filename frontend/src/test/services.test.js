import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, ApiError } from "../services/apiClient";
import * as buyerService from "../services/buyerService";
import * as adminService from "../services/adminService";

describe("Frontend Services & API Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("ApiError contains status, code, and details", () => {
    const err = new ApiError("Access Denied", { status: 403, code: "FORBIDDEN", details: { requiredRole: "ADMIN" } });
    expect(err.message).toBe("Access Denied");
    expect(err.status).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
    expect(err.details).toEqual({ requiredRole: "ADMIN" });
  });

  it("buyerService.fetchBuyerEngines calls /api/buyer/engines without mock hardcoding", async () => {
    const mockEngines = [
      { engineId: 1, engineCode: "ENG-001", modelName: "CFM56-7B27", urgency: "NORMAL" }
    ];
    vi.spyOn(api, "get").mockResolvedValueOnce({ items: mockEngines });

    const result = await buyerService.fetchBuyerEngines();
    expect(api.get).toHaveBeenCalledWith("/buyer/engines");
    expect(result).toEqual(mockEngines);
  });

  it("buyerService.fetchBuyerOrders properly sets query params for status and pagination", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      items: [],
      statusCounts: { ALL: 0 },
      pagination: { page: 2, pageSize: 10, total: 0, totalPages: 1 },
    });

    await buyerService.fetchBuyerOrders({ statusFilter: "DELIVERED", searchQuery: "Boeing", page: 2, pageSize: 10 });
    expect(api.get).toHaveBeenCalledWith("/buyer/orders", {
      params: {
        page: 2,
        pageSize: 10,
        status: "DELIVERED",
        search: "Boeing",
      },
    });
  });

  it("buyerService.addToCart calls POST /buyer/cart/items", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({ success: true, cartItemId: 12 });

    const res = await buyerService.addToCart(42, 2);
    expect(api.post).toHaveBeenCalledWith("/buyer/cart/items", { listingId: 42, quantity: 2 });
    expect(res.cartItemId).toBe(12);
  });

  it("adminService.fetchAdminDashboard calls /admin/dashboard", async () => {
    const mockDashboard = {
      engines: { total: 24 },
      listings: { total: 936, active: 850, pendingModeration: 86 },
      orders: { total: 10, revenue: 150000 },
      suppliers: { total: 40, approved: 35, pendingApproval: 5 },
    };
    vi.spyOn(api, "get").mockResolvedValueOnce(mockDashboard);

    const data = await adminService.fetchAdminDashboard();
    expect(api.get).toHaveBeenCalledWith("/admin/dashboard");
    expect(data.engines.total).toBe(24);
  });

  it("adminService.submitModerationDecision calls PATCH /admin/moderation/:id", async () => {
    vi.spyOn(api, "patch").mockResolvedValueOnce({
      listingId: 88,
      status: "APPROVED",
      decision: "APPROVED",
      note: "FAA 8130-3 Verified",
    });

    const res = await adminService.submitModerationDecision(88, "APPROVED", "FAA 8130-3 Verified");
    expect(api.patch).toHaveBeenCalledWith("/admin/moderation/88", {
      decision: "APPROVED",
      note: "FAA 8130-3 Verified",
    });
    expect(res.status).toBe("APPROVED");
  });

  it("adminService.checkRULSystemHealth calls POST /admin/rul-status/check", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      service: "rul-service",
      status: "HEALTHY",
      latencyMs: 14,
    });

    const res = await adminService.checkRULSystemHealth();
    expect(api.post).toHaveBeenCalledWith("/admin/rul-status/check", {});
    expect(res.status).toBe("HEALTHY");
    expect(res.latencyMs).toBe(14);
  });
});
