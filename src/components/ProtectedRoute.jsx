import { Navigate } from "react-router-dom";
import { getValidToken } from "../utils/auth";

export default function ProtectedRoute({ children }) {
  const token = getValidToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}