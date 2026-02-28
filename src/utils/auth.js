import axios from "axios";
import { API_BASE } from "./api";

/**
 * Check if the current session cookie is still valid
 * by hitting a protected endpoint.
 */
export async function checkAuth() {
  try {
    const res = await axios.get(`${API_BASE}/account`);
    return res.status === 200;
  } catch {
    return false;
  }
}

/**
 * Ask the backend to clear the session cookie.
 */
export async function logout() {
  try {
    await axios.post(`${API_BASE}/logout`);
  } catch {
    // silent — cookie may already be gone
  }
}