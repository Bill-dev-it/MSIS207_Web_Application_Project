import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getCurrentUser, loginAccount, logoutAccount } from "../services/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState({ status: "loading", user: null, error: null });
  // Prevent a slow /me response from replacing a newer Login/Logout result.
  const requestVersion = useRef(0);

  const refresh = useCallback(async (signal) => {
    const version = ++requestVersion.current;
    const isCurrent = () => !signal?.aborted && version === requestVersion.current;
    if (!isCurrent()) return;
    setSession((prior) => ({ ...prior, status: "loading", error: null }));
    try {
      const data = await getCurrentUser({ signal });
      if (isCurrent()) {
        setSession({ status: "authenticated", user: data.user, error: null });
      }
    } catch (error) {
      if (!isCurrent() || error?.name === "AbortError") return;
      // 401 is an expected signed-out state. Network/503 errors are NOT.
      if (error.status === 401) {
        setSession({ status: "anonymous", user: null, error: null });
      } else {
        setSession({ status: "error", user: null, error: error.message });
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const login = useCallback(async ({ email, password }) => {
    const data = await loginAccount({ email, password });
    requestVersion.current += 1;
    setSession({ status: "authenticated", user: data.user, error: null });
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    // Do not show a signed-out state until the server has revoked the session.
    await logoutAccount();
    requestVersion.current += 1;
    setSession({ status: "anonymous", user: null, error: null });
  }, []);

  const value = useMemo(() => ({ ...session, refresh, login, logout }), [session, refresh, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>.");
  return value;
}
