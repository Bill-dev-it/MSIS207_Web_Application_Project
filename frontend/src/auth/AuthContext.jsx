import { createContext, useContext, useEffect, useState } from "react";
import * as authService from "./authService";
import { onUnauthorized } from "../services/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function initAuth() {
      try {
        const u = await authService.getCurrentUser();
        if (mounted) setUser(u);
      } catch (err) {
        // Not logged in or expired session
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    initAuth();

    const unsubscribe = onUnauthorized(() => {
      if (mounted) setUser(null);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const u = await authService.login({ email, password });
    setUser(u);
    return u;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    isLoading: loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
