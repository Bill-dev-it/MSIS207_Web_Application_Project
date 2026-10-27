import { describe, it, expect } from "vitest";
import { BUYER_NAV, ADMIN_NAV } from "../config/navigation";
import { APP_ROUTES } from "../app/router";

describe("Navigation & Route Integrity", () => {
  it("ensures every link in BUYER_NAV points to a declared route", () => {
    for (const item of BUYER_NAV) {
      const matches = APP_ROUTES.some((p) => {
        if (p === item.to) return true;
        const normalized = p.replace(/\/:[^/]+/g, "");
        return item.to.startsWith(normalized);
      });
      expect(matches, `BUYER_NAV link ${item.to} has no matching registered route`).toBe(true);
    }
  });

  it("ensures every link in ADMIN_NAV points to a declared route", () => {
    for (const item of ADMIN_NAV) {
      const matches = APP_ROUTES.some((p) => {
        if (p === item.to) return true;
        const normalized = p.replace(/\/:[^/]+/g, "");
        return item.to.startsWith(normalized);
      });
      expect(matches, `ADMIN_NAV link ${item.to} has no matching registered route`).toBe(true);
    }
  });

  it("verifies Buyer nav does NOT contain any /admin/* links", () => {
    for (const item of BUYER_NAV) {
      expect(item.to.startsWith("/admin")).toBe(false);
    }
  });

  it("verifies 404 catch-all route is present", () => {
    const hasCatchAll = APP_ROUTES.includes("*");
    expect(hasCatchAll).toBe(true);
  });
});
