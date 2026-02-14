import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./style.css";
import { useNavigate } from "react-router-dom";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function isExpired(expiration) {
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

  const token = localStorage.getItem("token");

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

  useEffect(() => {
    // If not logged in, redirect immediately
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    async function loadUrls() {
      setLoading(true);
      setApiError("");

      try {
        const res = await axios.get(`${BACKEND_URL}account`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUrls(res.data || []);
      } catch (err) {
        // If token is invalid/expired, redirect to login
        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }

        setApiError("Could not load your URLs. Try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadUrls();
  }, [token, BACKEND_URL, navigate]);

  const sortedUrls = useMemo(() => {
    return [...urls].sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return db - da;
    });
  }, [urls]);

  const stats = useMemo(() => {
    const totalLinks = urls.length;
    const totalClicks = urls.reduce((sum, u) => sum + (u.clicksCount ?? 0), 0);

    const expiredCount = urls.filter(
      (u) => u.active === false || isExpired(u.expiration)
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
            className="btn btn-secondary"
            type="button"
            onClick={() => navigate("/")}
          >
            Home
          </button>

          <button
            className="btn btn-secondary"
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
          <div className="links-title">Your Links</div>
          <div className="links-count">{sortedUrls.length} total</div>
        </div>

        {loading && <p className="hint">Loading...</p>}
        {apiError && <p className="error">{apiError}</p>}

        {!loading && !apiError && sortedUrls.length === 0 && (
          <p className="hint">No URLs yet. Create your first one!</p>
        )}

        {!loading && !apiError && sortedUrls.length > 0 && (
          <div className="links-list">
            {sortedUrls.map((u) => {
              const expired = isExpired(u.expiration);
              const status = expired || u.active === false ? "Expired" : "Active";

              const shortLink = `${BACKEND_URL}r/${u.shortUrl}`;
              const displayShort = `r/${u.shortUrl}`;

              return (
                <div className="link-row" key={u.id}>
                  <div className="link-row-left">
                    <div className="short-row">
                      <a
                        className="short-link"
                        href={shortLink}
                        target="_blank"
                        rel="noreferrer"
                        title={shortLink}
                      >
                        {displayShort}
                      </a>

                      <button
                        className="copy-btn"
                        type="button"
                        onClick={() => copyToClipboard(shortLink, u.id)}
                      >
                        {copiedId === u.id ? "Copied!" : "Copy"}
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
                      <div className="meta-label">Expires</div>
                      <div className="meta-value">{formatDate(u.expiration)}</div>
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