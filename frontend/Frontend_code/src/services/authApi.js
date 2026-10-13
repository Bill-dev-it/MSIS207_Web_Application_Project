import { delay } from "./mockData";

const STORAGE_KEY = "aerorul_mock_user";

const DEMO_ACCOUNTS = {
  buyer: { id: "buyer-1", name: "ABC Airlines", role: "buyer", companyName: "ABC Airlines" },
  supplier: { id: "sup-1", name: "SkyForge Aero Parts", role: "supplier", companyName: "SkyForge Aero Parts" },
  admin: { id: "admin-1", name: "Marketplace Admin", role: "admin", companyName: "AeroRUL Operations" },
};

// TODO(backend): replace the bodies below with apiClient calls to
// POST /auth/login, POST /auth/register, GET /auth/me, POST /auth/logout.
export const authApi = {
  async login(email, _password, role) {
    await delay();
    const account = DEMO_ACCOUNTS[role] || DEMO_ACCOUNTS.buyer;
    const user = { ...account, email };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  async register(payload) {
    await delay();
    const user = {
      id: `${payload.role}-new`,
      name: payload.companyName || payload.name,
      role: payload.role,
      companyName: payload.companyName,
      email: payload.email,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  async getCurrentUser() {
    await delay(100);
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  logout() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
