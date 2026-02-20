import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { getValidToken } from "../../utils/auth";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function isTimeExpired(expiration) {
  if (!expiration) return false;
  return new Date(expiration).getTime() < Date.now();
}

function normalizeBaseUrl(url) {
  if (!url) return "";
  return url.endsWith("/") ? url : url + "/";
}

export default function Account() {
  const navigate = useNavigate();
  const BACKEND_URL = normalizeBaseUrl(import.meta.env.VITE_BACKEND_URL);

  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [copiedId, setCopiedId] = useState(null);
  const [invalidatingId, setInvalidatingId] = useState(null);

  // filter + sorting
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | expired
  const [clickSort, setClickSort] = useState("none"); // none | asc | desc

  // IMPORTANT: valid token only
  const token = getValidToken();

  function authHeaders() {
    return { Authorization: `Bearer ${token}` };
  }

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  }

  async function copyToClipboard(text, id) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch (err) {
      console.error("Copy failed:", err);
      alert("Copy failed. Your browser blocked clipboard access.");
    }
  }

  async function loadUrls() {
    setLoading(true);
    setApiError("");

    const freshToken = getValidToken();

    // token expired between renders
    if (!freshToken) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const res = await axios.get(`${BACKEND_URL}account`, {
        headers: { Authorization: `Bearer ${freshToken}` },
      });

      setUrls(res.data || []);
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      console.error(err);
      setApiError("Could not load your URLs. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function invalidateUrl(id) {
    setInvalidatingId(id);
    setApiError("");

    const freshToken = getValidToken();

    if (!freshToken) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      await axios.put(
        `${BACKEND_URL}invalidate/${id}`,
        {},
        { headers: { Authorization: `Bearer ${freshToken}` } }
      );

      setUrls((prev) =>
        prev.map((u) =>
          u.id === id
            ? {
                ...u,
                active: false,
                expiration: new Date().toISOString(),
              }
            : u
        )
      );
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      console.error("Invalidate failed:", err);

      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Could not invalidate the URL.";

      setApiError(
        typeof msg === "string" ? msg : "Could not invalidate the URL."
      );
    } finally {
      setInvalidatingId(null);
    }
  }

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    loadUrls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, BACKEND_URL, navigate]);

  const visibleUrls = useMemo(() => {
    const filtered = urls.filter((u) => {
      const expired = u.active === false || isTimeExpired(u.expiration);

      if (statusFilter === "active") return !expired;
      if (statusFilter === "expired") return expired;
      return true;
    });

    const copy = [...filtered];

    // default sort: newest
    copy.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return db - da;
    });

    // click sort overrides
    if (clickSort !== "none") {
      copy.sort((a, b) => {
        const ca = a.clicksCount ?? 0;
        const cb = b.clicksCount ?? 0;

        // tie-breaker: newest
        const da = new Date(a.createdAt).getTime();
        const db = new Date(b.createdAt).getTime();

        if (ca === cb) return db - da;

        return clickSort === "asc" ? ca - cb : cb - ca;
      });
    }

    return copy;
  }, [urls, statusFilter, clickSort]);

  const stats = useMemo(() => {
    const totalLinks = urls.length;
    const totalClicks = urls.reduce((sum, u) => sum + (u.clicksCount ?? 0), 0);

    const expiredCount = urls.filter(
      (u) => u.active === false || isTimeExpired(u.expiration)
    ).length;

    const activeCount = totalLinks - expiredCount;

    return { totalLinks, totalClicks, activeCount, expiredCount };
  }, [urls]);

  return (
    <div className="dashboard">
      <div className="dash-topbar">
        <div>
          <div className="dash-title">Your Dashboard</div>
          <div className="dash-subtitle">
            Manage your shortened links and track clicks.
          </div>
        </div>

        <div className="dash-actions">
          <button
            className="btn btn-home"
            type="button"
            onClick={() => navigate("/")}
          >
            Home
          </button>

          <button
            className="btn btn-logout"
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total links</div>
          <div className="stat-value">{stats.totalLinks}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total clicks</div>
          <div className="stat-value">{stats.totalClicks}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value">{stats.activeCount}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Expired</div>
          <div className="stat-value">{stats.expiredCount}</div>
        </div>
      </div>

      <div className="links-panel">
        <div className="links-header">
          <div>
            <div className="links-title">Your Links</div>
            <div className="links-count">{visibleUrls.length} shown</div>
          </div>

          <div className="links-controls">
            <div className="segmented">
              <button
                className={`seg-btn ${statusFilter === "all" ? "active" : ""}`}
                onClick={() => setStatusFilter("all")}
                type="button"
              >
                All
              </button>

              <button
                className={`seg-btn ${
                  statusFilter === "active" ? "active" : ""
                }`}
                onClick={() => setStatusFilter("active")}
                type="button"
              >
                Active
              </button>

              <button
                className={`seg-btn ${
                  statusFilter === "expired" ? "active" : ""
                }`}
                onClick={() => setStatusFilter("expired")}
                type="button"
              >
                Expired
              </button>
            </div>

            <div className="segmented">
              <button
                className={`seg-btn ${clickSort === "none" ? "active" : ""}`}
                onClick={() => setClickSort("none")}
                type="button"
              >
                Newest
              </button>

              <button
                className={`seg-btn ${clickSort === "asc" ? "active" : ""}`}
                onClick={() => setClickSort("asc")}
                type="button"
              >
                Clicks ↑
              </button>

              <button
                className={`seg-btn ${clickSort === "desc" ? "active" : ""}`}
                onClick={() => setClickSort("desc")}
                type="button"
              >
                Clicks ↓
              </button>
            </div>
          </div>
        </div>

        {loading && <p className="hint">Loading...</p>}
        {apiError && <p className="error">{apiError}</p>}

        {!loading && !apiError && visibleUrls.length === 0 && (
          <p className="hint">No URLs match this filter.</p>
        )}

        {!loading && !apiError && visibleUrls.length > 0 && (
          <div className="links-list">
            {visibleUrls.map((u) => {
              const expiredByTime = isTimeExpired(u.expiration);
              const expiredByInactive = u.active === false;

              const isExpired = expiredByTime || expiredByInactive;
              const status = isExpired ? "Expired" : "Active";

              const shortLink = `${BACKEND_URL}r/${u.shortUrl}`;
              const displayShort = `r/${u.shortUrl}`;

              const expiresLabel = status === "Active" ? "Expires" : "Expired";
              const expiresValue = formatDate(u.expiration);

              const disableInvalidate =
                u.active === false || invalidatingId === u.id;

              return (
                <div className="link-row" key={u.id}>
                  <div className="link-row-left">
                    <div className="short-row">
                      {isExpired ? (
                        <span
                          className="short-link short-link-disabled"
                          title="This link is expired"
                        >
                          {displayShort}
                        </span>
                      ) : (
                        <a
                          className="short-link"
                          href={shortLink}
                          target="_blank"
                          rel="noreferrer"
                          title={shortLink}
                        >
                          {displayShort}
                        </a>
                      )}

                      <button
                        className="copy-btn"
                        type="button"
                        disabled={isExpired}
                        onClick={() => {
                          if (!isExpired) {
                            copyToClipboard(shortLink, u.id);
                          }
                        }}
                      >
                        {isExpired
                          ? "Unavailable"
                          : copiedId === u.id
                          ? "Copied!"
                          : "Copy"}
                      </button>

                      <button
                        className="invalidate-btn"
                        type="button"
                        disabled={disableInvalidate}
                        onClick={() => invalidateUrl(u.id)}
                      >
                        {invalidatingId === u.id
                          ? "Invalidating..."
                          : "Invalidate"}
                      </button>

                      <button
                        className="analytics-btn"
                        type="button"
                        onClick={() => navigate(`/analytics/${u.id}`)}
                      >
                        Analytics
                      </button>

                      <span
                        className={`pill ${
                          status === "Active" ? "pill-ok" : "pill-bad"
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    <a
                      className="original-url"
                      href={u.url}
                      target="_blank"
                      rel="noreferrer"
                      title={u.url}
                    >
                      {u.url}
                    </a>
                  </div>

                  <div className="link-row-right">
                    <div className="meta">
                      <div className="meta-label">Clicks</div>
                      <div className="meta-value">{u.clicksCount ?? 0}</div>
                    </div>

                    <div className="meta">
                      <div className="meta-label">Created</div>
                      <div className="meta-value">{formatDate(u.createdAt)}</div>
                    </div>

                    <div className="meta">
                      <div className="meta-label">{expiresLabel}</div>
                      <div className="meta-value">{expiresValue}</div>
                    </div>

                    <div className="meta">
                      <div className="meta-label">Last Access</div>
                      <div className="meta-value">
                        {formatDate(u.lastAccessed)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}