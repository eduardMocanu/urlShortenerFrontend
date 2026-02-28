const raw = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

/** Base URL without trailing slash — e.g. "http://localhost:8080" */
export const API_BASE = raw.endsWith("/") ? raw.slice(0, -1) : raw;

/** Base URL with trailing slash — e.g. "http://localhost:8080/" */
export const API_BASE_SLASH = API_BASE + "/";
