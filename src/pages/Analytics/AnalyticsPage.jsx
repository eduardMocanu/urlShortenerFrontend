import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_SLASH } from "../../utils/api";
import "../Dashboard/DashboardPage.css";
import "./AnalyticsPage.css";

import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function buildLast12Days(raw) {
  const map = new Map((raw || []).map((r) => [r.date, r.clicksCount ?? 0]));
  const out = [];
  const today = new Date();

  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    out.push({ date: iso, clicksCount: map.get(iso) ?? 0 });
  }
  return out;
}

export default function AnalyticsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_BASE_SLASH}analytics/${id}`);
        setData(res.data);
      } catch (err) {
        if (err?.response?.status === 401) {
          await logout();
          navigate("/login", { replace: true });
          return;
        }
        setApiError("Could not load analytics.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const chartData = useMemo(() => {
    if (!data?.analyticsChart) return [];
    return buildLast12Days(data.analyticsChart);
  }, [data]);

  const totalClicks = useMemo(
    () => chartData.reduce((s, p) => s + (p.clicksCount ?? 0), 0),
    [chartData]
  );

  return (
    <div className="dash">
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Analytics</h1>
          <p className="dash-subtitle">
            {data?.url?.shortUrl ? `${API_BASE_SLASH}r/${data.url.shortUrl}` : ""}
          </p>
        </div>
        <div className="dash-actions">
          <button className="btn btn-primary" onClick={() => navigate("/dashboard")}>Back</button>
        </div>
      </header>

      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
        <div className="card stat-card">
          <span className="stat-label">Total clicks (12 days)</span>
          <span className="stat-value">{totalClicks}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Days displayed</span>
          <span className="stat-value">{chartData.length}</span>
        </div>
      </div>

      <div className="card links-panel">
        <h2 className="links-title">Last 12 Days</h2>

        {loading && <div className="spinner" />}
        {apiError && <p className="error">{apiError}</p>}

        {!loading && chartData.length === 0 && <p className="hint">No analytics data yet.</p>}

        {!loading && chartData.length > 0 && (
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" allowDecimals={false} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    color: "white",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="clicksCount"
                  stroke="var(--accent)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
