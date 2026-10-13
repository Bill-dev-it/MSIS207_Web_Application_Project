import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../../services/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  async function login(email, password, role) {
    const loggedInUser = await authApi.login(email, password, role);
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function register(payload) {
    const newUser = await authApi.register(payload);
    setUser(newUser);
    return newUser;
  }

  function logout() {
    authApi.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
