import { api } from "../services/apiClient";

export async function login({ email, password }) {
  const data = await api.post("/auth/login", { email, password });
  return data.user;
}

export async function getCurrentUser() {
  const data = await api.get("/auth/me");
  return data.user;
}

export async function logout() {
  await api.post("/auth/logout");
}
