import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { checkAuth } from "../utils/auth";

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, loading, logout } = useAuth();
  const location = useLocation();
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    checkAuth().then((ok) => {
      if (!cancelled) {
        if (!ok) logout();
        setVerified(ok);
        setChecking(false);
      }
    });
    return () => { cancelled = true; };
  }, [location.pathname, logout]);

  if (loading || checking) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!isLoggedIn || !verified) return <Navigate to="/login" replace />;

  return children;
}