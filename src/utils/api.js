const raw = import.meta.env.VITE_BACKEND_URL || "https://api.minurl.xyz";

/** Base URL without trailing slash — e.g. "https://api.minurl.xyz" */
export const API_BASE = raw.endsWith("/") ? raw.slice(0, -1) : raw;

/** Base URL with trailing slash — e.g. "https://api.minurl.xyz/" */
export const API_BASE_SLASH = API_BASE + "/";
