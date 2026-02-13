import { useMemo, useState } from "react";
import "./style.css";
import axios from "axios";

function sanitizeUrl(raw) {
  if (!raw) return "";

  let s = raw.trim();
  s = s.replace(/\s+/g, "");

  if (!/^https?:\/\//i.test(s)) {
    s = "https://" + s;
  }

  return s;
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState("");

  const sanitized = useMemo(() => sanitizeUrl(input), [input]);
  const valid = sanitized.length === 0 ? true : isValidHttpUrl(sanitized);

  const error =
    sanitized.length > 0 && !valid
      ? "Please enter a valid http(s) URL (example: https://google.com)"
      : "";

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
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setResult({
        original: sanitized,
        short: res.data.fullShortUrl,
        code: res.data.code,
      });
    } catch (err) {
      setApiError("Something went wrong. Please try again.");
      console.error(err);
    }
  }

  return (
    <div className="page">
      <div className="card">
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

          {sanitized && valid && (
            <p className="hint">
              Sanitized: <span>{sanitized}</span>
            </p>
          )}
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