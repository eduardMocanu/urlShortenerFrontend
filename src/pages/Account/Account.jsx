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

  // Extend UI state
  const [extendOpenId, setExtendOpenId] = useState(null);
  const [extendDays, setExtendDays] = useState(7);
  const [extendingId, setExtendingId] = useState(null);

  const token = getValidToken();

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
            ? { ...u, active: false, expiration: new Date().toISOString() }
            : u
        )
      );
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Could not invalidate the URL.";

      setApiError(typeof msg === "string" ? msg : "Could not invalidate the URL.");
    } finally {
      setInvalidatingId(null);
    }
  }

  function openExtendMenu(urlId) {
    setApiError("");
    setExtendDays(7);
    setExtendOpenId(urlId);
  }

  function closeExtendMenu() {
    setExtendOpenId(null);
    setExtendDays(7);
  }

  async function extendUrl(id, days) {
    setExtendingId(id);
    setApiError("");

    const freshToken = getValidToken();
    if (!freshToken) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const res = await axios.put(
        `${BACKEND_URL}url/${id}/extend`,
        { days },
        {
          headers: {
            Authorization: `Bearer ${freshToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const dto = res.data; // { id, extensions, expiration, maximumExtensions }

      setUrls((prev) =>
        prev.map((u) =>
          u.id === id
            ? {
                ...u,
                expiration: dto.expiration ?? u.expiration,
                extensions: dto.extensions ?? u.extensions ?? 0,
                maximumExtensions:
                  dto.maximumExtensions ?? u.maximumExtensions ?? 5,
              }
            : u
        )
      );

      closeExtendMenu();
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      console.error("Extend failed:", err);

      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Could not extend the URL.";

      setApiError(typeof msg === "string" ? msg : "Could not extend the URL.");
    } finally {
      setExtendingId(null);
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
    copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // click sort overrides
    if (clickSort !== "none") {
      copy.sort((a, b) => {
        const ca = a.clicksCount ?? 0;
        const cb = b.clicksCount ?? 0;

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
      {/* Extend modal */}
      {extendOpenId != null && (
        <div className="modal-overlay" onClick={closeExtendMenu}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const selected = urls.find((u) => u.id === extendOpenId);
              const used = selected?.extensions ?? 0;
              const max = selected?.maximumExtensions ?? 5;
              const left = Math.max(0, max - used);
              const exhausted = left <= 0;

              return (
                <>
                  <div className="modal-title">Extend expiration</div>
                  <div className="modal-subtitle">
                    Choose up to <b>7</b> days.
                  </div>

                  <div className="modal-row">
                    <div className="modal-label">Extensions</div>
                    <div className="ext-badge">
                      {used}/{max} used
                    </div>
                  </div>

                  <div className="slider-wrap">
                    <div className="slider-top">
                      <span className="slider-label">Days</span>
                      <span className="slider-value">{extendDays}</span>
                    </div>

                    <input
                      className="slider"
                      type="range"
                      min="1"
                      max="7"
                      step="1"
                      value={extendDays}
                      disabled={exhausted || extendingId === extendOpenId}
                      onChange={(e) => setExtendDays(Number(e.target.value))}
                    />

                    <div className="slider-hints">
                      <span>+1</span>
                      <span>+7</span>
                    </div>

                    {exhausted && (
                      <div className="modal-hint error">
                        No extensions left for this URL.
                      </div>
                    )}
                  </div>

                  <div className="modal-actions">
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={closeExtendMenu}
                      disabled={extendingId === extendOpenId}
                    >
                      Cancel
                    </button>

                    <button
                      className="btn btn-home"
                      type="button"
                      disabled={exhausted || extendingId === extendOpenId}
                      onClick={() => extendUrl(extendOpenId, extendDays)}
                    >
                      {extendingId === extendOpenId
                        ? "Extending..."
                        : `Extend +${extendDays}d`}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <div className="dash-topbar">
        <div>
          <div className="dash-title">Your Dashboard</div>
          <div className="dash-subtitle">
            Manage your shortened links and track clicks.
          </div>
        </div>

        <div className="dash-actions">
          <button className="btn btn-home" type="button" onClick={() => navigate("/")}>
            Home
          </button>

          <button className="btn btn-logout" type="button" onClick={handleLogout}>
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
                className={`seg-btn ${statusFilter === "active" ? "active" : ""}`}
                onClick={() => setStatusFilter("active")}
                type="button"
              >
                Active
              </button>

              <button
                className={`seg-btn ${statusFilter === "expired" ? "active" : ""}`}
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

              const disableInvalidate = u.active === false || invalidatingId === u.id;

              const used = u.extensions ?? 0;
              const max = u.maximumExtensions ?? 5;
              const left = Math.max(0, max - used);
              const disableExtend = isExpired || left <= 0 || extendingId === u.id;

              return (
                <div className="link-row" key={u.id}>
                  <div className="link-row-left">
                    <div className="short-row">
                      {isExpired ? (
                        <span className="short-link short-link-disabled" title="This link is expired">
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
                          if (!isExpired) copyToClipboard(shortLink, u.id);
                        }}
                      >
                        {isExpired ? "Unavailable" : copiedId === u.id ? "Copied!" : "Copy"}
                      </button>

                      <button
                        className="invalidate-btn"
                        type="button"
                        disabled={disableInvalidate}
                        onClick={() => invalidateUrl(u.id)}
                      >
                        {invalidatingId === u.id ? "Invalidating..." : "Invalidate"}
                      </button>

                      <button
                        className="extend-btn"
                        type="button"
                        disabled={disableExtend}
                        onClick={() => openExtendMenu(u.id)}
                        title={
                          isExpired
                            ? "Cannot extend expired URL"
                            : left <= 0
                            ? "No extensions left"
                            : "Extend expiration"
                        }
                      >
                        Extend <span className="extend-chip">{used}/{max}</span>
                      </button>

                      <button
                        className="analytics-btn"
                        type="button"
                        onClick={() => navigate(`/analytics/${u.id}`)}
                      >
                        Analytics
                      </button>

                      <span className={`pill ${status === "Active" ? "pill-ok" : "pill-bad"}`}>
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
                      <div className="meta-value">{formatDate(u.lastAccessed)}</div>
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