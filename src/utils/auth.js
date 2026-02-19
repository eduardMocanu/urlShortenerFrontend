import { jwtDecode } from "jwt-decode";

export function isTokenValid(token) {
  try {
    const decoded = jwtDecode(token);

    // exp is in seconds
    if (!decoded?.exp) return false;

    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function getValidToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  if (!isTokenValid(token)) {
    localStorage.removeItem("token");
    return null;
  }

  return token;
}