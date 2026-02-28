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