import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { checkAuth as checkAuthApi, logout as logoutApi } from "../utils/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // On mount, verify whether the session cookie is still valid
  useEffect(() => {
    checkAuthApi().then((ok) => {
      setIsLoggedIn(ok);
      setLoading(false);
    });
  }, []);

  const login = useCallback(() => setIsLoggedIn(true), []);

  const logout = useCallback(async () => {
    await logoutApi();
    setIsLoggedIn(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
