import { useMemo, useState } from "react";
import axios from "axios";
import isUrl from "is-url";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_BASE } from "../../utils/api";
import "./HomePage.css";

function sanitize(v) {
  return v ? v.trim() : "";
}

export default function HomePage() {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();

  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState("");

  const sanitized = useMemo(() => sanitize(input), [input]);
  const valid = sanitized.length === 0 || isUrl(sanitized);

  const validationError =
    sanitized.length > 0 && !valid
      ? "Enter a valid URL — e.g. https://example.com"
      : "";

  async function handleLogout() {
    await logout();
    setApiError("");
    setResult(null);
    navigate("/login");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError("");
    setResult(null);

    if (!sanitized || !valid) return;

    try {
      const res = await axios.post(`${API_BASE}/shorten`, {
        urlAddress: sanitized,
      });

      setResult({
        original: sanitized,
        short: res.data.fullShortUrl,
        code: res.data.code,
      });
    } catch (err) {
      if (err?.response?.status === 401) {
        await logout();
        setApiError("Session expired — please log in again.");
      } else {
        setApiError("Something went wrong. Please try again.");
      }
      console.error(err);
    }
  }

  return (
    <div className="home-page">
      {/* Top-right nav */}
      <nav className="home-nav">
        {isLoggedIn ? (
          <>
            <button className="btn btn-secondary" onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>
            <button className="btn btn-danger" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-primary" onClick={() => navigate("/login")}>
              Login
            </button>
            <button className="btn btn-secondary" onClick={() => navigate("/register")}>
              Register
            </button>
          </>
        )}
      </nav>

      {/* Hero card */}
      <div className="card home-card">
        <h1 className="home-title">Shorten your link</h1>
        <p className="home-subtitle">Paste any URL and get a clean short link in seconds.</p>

        <form onSubmit={handleSubmit} className="home-form">
          <label className="label" htmlFor="url-input">Enter a URL</label>

          <div className="home-row">
            <input
              id="url-input"
              className={`input ${validationError ? "input-error" : ""}`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://example.com"
            />
            <button
              className="btn btn-primary"
              type="submit"
              disabled={!sanitized || !valid}
            >
              Shorten
            </button>
          </div>

          {validationError && <p className="error">{validationError}</p>}
          {apiError && <p className="error">{apiError}</p>}
        </form>

        {result && (
          <div className="home-result">
            <span className="home-result-label">Short link</span>
            <a
              className="home-result-url"
              href={result.short}
              target="_blank"
              rel="noreferrer"
            >
              {result.short}
            </a>
            <p className="home-result-orig">
              Original: <span>{result.original}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
