import { useMemo, useState, useEffect } from "react";
import "./style.css";
import axios from "axios";
import isUrl from "is-url";
import { useNavigate } from "react-router-dom";

function sanitizeUrl(value) {
  if (!value) return "";
  return value.trim();
}

function isValidHttpUrl(value) {
  return isUrl(value);
}

export default function App() {
  const navigate = useNavigate();

  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState("");
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const isLoggedIn = !!token;

  useEffect(() => {
    function syncToken() {
      setToken(localStorage.getItem("token"));
    }

    window.addEventListener("storage", syncToken);
    return () => window.removeEventListener("storage", syncToken);
  }, []);

  const sanitized = useMemo(() => sanitizeUrl(input), [input]);
  const valid = sanitized.length === 0 ? true : isValidHttpUrl(sanitized);

  const error =
    sanitized.length > 0 && !valid
      ? "Please enter a valid http(s) URL (example: https://www.google.com)"
      : "";

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
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
      const res = await axios.post(
        "http://localhost:8080/shorten",
        { urlAddress: sanitized },
        {
          headers: isLoggedIn
            ? { Authorization: `Bearer ${token}` }
            : undefined,
        }
      );

      setResult({
        original: sanitized,
        short: res.data.fullShortUrl,
        code: res.data.code,
      });
    } catch (err) {
      if (err?.response?.status === 401) {
        setApiError("You need to log in to shorten URLs.");
      } else {
        setApiError("Something went wrong. Please try again.");
      }
      console.error(err);
    }
  }

  return (
    <div className="page">
      <div className="card">
        <div className="card-top">
          <div className="auth-buttons">
            {!isLoggedIn ? (
              <>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => navigate("/login")}
                >
                  Login
                </button>

                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => navigate("/register")}
                >
                  Register
                </button>
              </>
            ) : (
              <button
                className="btn btn-secondary"
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            )}
          </div>
        </div>

        <div className="header">
          <h1>Shorten your link</h1>
          <p>Paste any URL and get a clean short link in seconds.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="label">Enter a URL</label>

          <div className="row">
            <input
              className={`input ${error ? "input-error" : ""}`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://example.com"
            />

            <button
              className="btn"
              type="submit"
              disabled={!sanitized || !valid}
            >
              Shorten
            </button>
          </div>

          {error && <p className="error">{error}</p>}
          {apiError && <p className="error">{apiError}</p>}
        </form>

        {result && (
          <div className="result">
            <div className="result-title">Short link</div>

            <a
              className="result-value"
              href={result.short}
              target="_blank"
              rel="noreferrer"
            >
              {result.short}
            </a>

            <div className="result-sub">
              Original: <span>{result.original}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}