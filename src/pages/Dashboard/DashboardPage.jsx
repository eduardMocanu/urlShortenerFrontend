import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_SLASH } from "../../utils/api";
import "./DashboardPage.css";

/* ── helpers ── */
function fmt(value) {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleString();
}

function isExpired(u) {
  if (u.active === false) return true;
  if (!u.expiration) return false;
  return new Date(u.expiration).getTime() < Date.now();
}

/* ══════════════════════════════════════ */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [copiedId, setCopiedId] = useState(null);
  const [invalidatingId, setInvalidatingId] = useState(null);

  /* filters */
  const [statusFilter, setStatusFilter] = useState("all");
  const [clickSort, setClickSort] = useState("none");

  /* extend modal */
  const [extendOpenId, setExtendOpenId] = useState(null);
  const [extendDays, setExtendDays] = useState(7);
  const [extendingId, setExtendingId] = useState(null);

  /* ── actions ── */
  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  async function copyLink(text, id) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {
      alert("Copy failed — your browser blocked clipboard access.");
    }
  }

  async function loadUrls() {
    setLoading(true);
    setApiError("");
    try {
      const res = await axios.get(`${API_BASE_SLASH}account`);
      setUrls(res.data || []);
    } catch (err) {
      if (err?.response?.status === 401) {
        await logout();
        navigate("/login", { replace: true });
        return;
      }
      setApiError("Could not load your URLs. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function invalidateUrl(id) {
    setInvalidatingId(id);
    setApiError("");
    try {
      await axios.put(`${API_BASE_SLASH}invalidate/${id}`, {});
      setUrls((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, active: false, expiration: new Date().toISOString() } : u
        )
      );
    } catch (err) {
      if (err?.response?.status === 401) {
        await logout();
        navigate("/login", { replace: true });
        return;
      }
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Could not invalidate the URL.";
      setApiError(typeof msg === "string" ? msg : "Could not invalidate the URL.");
    } finally {
      setInvalidatingId(null);
    }
  }

  function openExtend(id) {
    setApiError("");
    setExtendDays(7);
    setExtendOpenId(id);
  }
  function closeExtend() {
    setExtendOpenId(null);
    setExtendDays(7);
  }

  async function extendUrl(id, days) {
    setExtendingId(id);
    setApiError("");
    try {
      const res = await axios.put(`${API_BASE_SLASH}url/${id}/extend`, { days }, {
        headers: { "Content-Type": "application/json" },
      });
      const dto = res.data;
      setUrls((prev) =>
        prev.map((u) =>
          u.id === id
            ? {
                ...u,
                expiration: dto.expiration ?? u.expiration,
                extensions: dto.extensions ?? u.extensions ?? 0,
                maximumExtensions: dto.maximumExtensions ?? u.maximumExtensions ?? 5,
              }
            : u
        )
      );
      closeExtend();
    } catch (err) {
      if (err?.response?.status === 401) {
        await logout();
        navigate("/login", { replace: true });
        return;
      }
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Could not extend the URL.";
      setApiError(typeof msg === "string" ? msg : "Could not extend the URL.");
    } finally {
      setExtendingId(null);
    }
  }

  useEffect(() => {
    loadUrls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── derived data ── */
  const visibleUrls = useMemo(() => {
    const filtered = urls.filter((u) => {
      const exp = isExpired(u);
      if (statusFilter === "active") return !exp;
      if (statusFilter === "expired") return exp;
      return true;
    });

    const copy = [...filtered];
    copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (clickSort !== "none") {
      copy.sort((a, b) => {
        const ca = a.clicksCount ?? 0;
        const cb = b.clicksCount ?? 0;
        if (ca === cb) return new Date(b.createdAt) - new Date(a.createdAt);
        return clickSort === "asc" ? ca - cb : cb - ca;
      });
    }
    return copy;
  }, [urls, statusFilter, clickSort]);

  const stats = useMemo(() => {
    const totalLinks = urls.length;
    const totalClicks = urls.reduce((s, u) => s + (u.clicksCount ?? 0), 0);
    const expiredCount = urls.filter(isExpired).length;
    return { totalLinks, totalClicks, active: totalLinks - expiredCount, expired: expiredCount };
  }, [urls]);

  /* ══════════════════════════════════════ */
  return (
    <div className="dash">
      {/* ── Extend modal ── */}
      {extendOpenId != null && (
        <div className="modal-overlay" onClick={closeExtend}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const sel = urls.find((u) => u.id === extendOpenId);
              const used = sel?.extensions ?? 0;
              const max = sel?.maximumExtensions ?? 5;
              const left = Math.max(0, max - used);
              const exhausted = left <= 0;

              return (
                <>
                  <h2 className="modal-title">Extend expiration</h2>
                  <p className="modal-sub">Choose up to <b>7</b> days.</p>

                  <div className="modal-meta-row">
                    <span className="modal-label">Extensions used</span>
                    <span className="ext-badge">{used}/{max}</span>
                  </div>

                  <div className="slider-box">
                    <div className="slider-head">
                      <span>Days</span>
                      <span className="slider-val">{extendDays}</span>
                    </div>
                    <input
                      className="slider"
                      type="range" min="1" max="7" step="1"
                      value={extendDays}
                      disabled={exhausted || extendingId === extendOpenId}
                      onChange={(e) => setExtendDays(Number(e.target.value))}
                    />
                    <div className="slider-hints"><span>+1</span><span>+7</span></div>
                    {exhausted && <p className="error">No extensions left for this URL.</p>}
                  </div>

                  <div className="modal-actions">
                    <button className="btn btn-secondary" type="button" onClick={closeExtend} disabled={extendingId === extendOpenId}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" type="button" disabled={exhausted || extendingId === extendOpenId} onClick={() => extendUrl(extendOpenId, extendDays)}>
                      {extendingId === extendOpenId ? "Extending…" : `Extend +${extendDays}d`}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Top bar ── */}
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Your Dashboard</h1>
          <p className="dash-subtitle">Manage your shortened links and track clicks.</p>
        </div>
        <div className="dash-actions">
          <button className="btn btn-primary" onClick={() => navigate("/")}>Home</button>
          <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* ── Stats ── */}
      <div className="stats-grid">
        {[
          ["Total links", stats.totalLinks],
          ["Total clicks", stats.totalClicks],
          ["Active", stats.active],
          ["Expired", stats.expired],
        ].map(([label, val]) => (
          <div className="card stat-card" key={label}>
            <span className="stat-label">{label}</span>
            <span className="stat-value">{val}</span>
          </div>
        ))}
      </div>

      {/* ── Links panel ── */}
      <div className="card links-panel">
        <div className="links-head">
          <div>
            <h2 className="links-title">Your Links</h2>
            <span className="links-count">{visibleUrls.length} shown</span>
          </div>

          <div className="links-controls">
            <div className="seg-group">
              {["all", "active", "expired"].map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`seg-btn ${statusFilter === v ? "active" : ""}`}
                  onClick={() => setStatusFilter(v)}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>

            <div className="seg-group">
              {[
                ["none", "Newest"],
                ["asc", "Clicks ↑"],
                ["desc", "Clicks ↓"],
              ].map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  className={`seg-btn ${clickSort === v ? "active" : ""}`}
                  onClick={() => setClickSort(v)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && <div className="spinner" />}
        {apiError && <p className="error">{apiError}</p>}

        {!loading && !apiError && visibleUrls.length === 0 && (
          <p className="hint">No URLs match this filter.</p>
        )}

        {!loading && !apiError && visibleUrls.length > 0 && (
          <div className="links-list">
            {visibleUrls.map((u) => {
              const exp = isExpired(u);
              const status = exp ? "Expired" : "Active";
              const shortLink = `${API_BASE_SLASH}r/${u.shortUrl}`;
              const display = `r/${u.shortUrl}`;
              const used = u.extensions ?? 0;
              const max = u.maximumExtensions ?? 5;
              const left = Math.max(0, max - used);

              return (
                <div className={`link-row ${exp ? "link-row--expired" : ""}`} key={u.id}>
                  <div className="link-main">
                    <div className="link-top">
                      {exp ? (
                        <span className="mono-link mono-link--disabled">{display}</span>
                      ) : (
                        <a className="mono-link" href={shortLink} target="_blank" rel="noreferrer">{display}</a>
                      )}
                      <span className={`pill ${exp ? "pill-bad" : "pill-ok"}`}>{status}</span>
                    </div>

                    <a className="orig-url" href={u.url} target="_blank" rel="noreferrer" title={u.url}>
                      {u.url}
                    </a>

                    <div className="link-actions">
                      <button className="action-btn action-copy" disabled={exp} onClick={() => !exp && copyLink(shortLink, u.id)}>
                        {exp ? "Unavailable" : copiedId === u.id ? "Copied!" : "Copy"}
                      </button>
                      <button className="action-btn action-invalidate" disabled={u.active === false || invalidatingId === u.id} onClick={() => invalidateUrl(u.id)}>
                        {invalidatingId === u.id ? "Invalidating…" : "Invalidate"}
                      </button>
                      <button
                        className="action-btn action-extend"
                        disabled={exp || left <= 0 || extendingId === u.id}
                        onClick={() => openExtend(u.id)}
                        title={exp ? "Cannot extend expired URL" : left <= 0 ? "No extensions left" : "Extend"}
                      >
                        Extend <span className="ext-chip">{used}/{max}</span>
                      </button>
                      <button className="action-btn action-analytics" onClick={() => navigate(`/analytics/${u.id}`)}>
                        Analytics
                      </button>
                    </div>
                  </div>

                  <div className="link-meta-grid">
                    <div className="meta-cell"><span className="meta-label">Clicks</span><span className="meta-val">{u.clicksCount ?? 0}</span></div>
                    <div className="meta-cell"><span className="meta-label">Created</span><span className="meta-val">{fmt(u.createdAt)}</span></div>
                    <div className="meta-cell"><span className="meta-label">{exp ? "Expired" : "Expires"}</span><span className="meta-val">{fmt(u.expiration)}</span></div>
                    <div className="meta-cell"><span className="meta-label">Last access</span><span className="meta-val">{fmt(u.lastAccessed)}</span></div>
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
