import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../../pages/Account/style.css";
import "./style.css";
import { getValidToken } from "../../utils/auth";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function normalizeBaseUrl(url) {
  if (!url) return "";
  return url.endsWith("/") ? url : url + "/";
}

// Build last 12 days including missing dates with 0 clicks
function buildLast12DaysSeries(rawData) {
  const result = [];
  const today = new Date();

  const dataMap = new Map(
    (rawData || []).map((item) => [
      item.date,
      item.clicksCount ?? 0
    ])
  );

  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);

    const isoDate = d.toISOString().split("T")[0];

    result.push({
      date: isoDate,
      clicksCount: dataMap.get(isoDate) ?? 0
    });
  }

  return result;
}

export default function Analytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const BACKEND_URL = normalizeBaseUrl(import.meta.env.VITE_BACKEND_URL);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const token = getValidToken();

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    async function loadAnalytics() {
      try {
        const res = await axios.get(
          `${BACKEND_URL}analytics/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setData(res.data);
      } catch (err) {
        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }

        console.error(err);
        setApiError("Could not load analytics.");
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [id, token, navigate]);

  // Build normalized chart data (always 12 days)
  const chartData = useMemo(() => {
    if (!data?.analyticsChart) return [];
    return buildLast12DaysSeries(data.analyticsChart);
  }, [data]);

  // Total clicks from normalized data
  const totalClicks = useMemo(() => {
    return chartData.reduce(
      (sum, point) => sum + (point.clicksCount ?? 0),
      0
    );
  }, [chartData]);

  return (
    <div className="dashboard">
      <div className="dash-topbar">
        <div>
          <div className="dash-title">Analytics</div>
          <div className="dash-subtitle">
            {data?.url?.shortUrl
              ? `${BACKEND_URL}r/${data.url.shortUrl}`
              : ""}
          </div>
        </div>

        <div className="dash-actions">
          <button
            className="btn btn-home"
            onClick={() => navigate("/account")}
          >
            Back
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Clicks (12 days)</div>
          <div className="stat-value">{totalClicks}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Days Displayed</div>
          <div className="stat-value">{chartData.length}</div>
        </div>
      </div>

      <div className="links-panel">
        <div className="links-title">Last 12 Days</div>

        {loading && <p className="hint">Loading...</p>}
        {apiError && <p className="error">{apiError}</p>}

        {!loading && chartData.length === 0 && (
          <p className="hint">No analytics data yet.</p>
        )}

        {!loading && chartData.length > 0 && (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.08)"
                />

                <XAxis
                  dataKey="date"
                  stroke="#ffffffaa"
                />

                <YAxis
                  stroke="#ffffffaa"
                  allowDecimals={false}
                />

                <Tooltip
                  contentStyle={{
                    background: "#111a2e",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "12px",
                    color: "white"
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="clicksCount"
                  stroke="#6d5efc"
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