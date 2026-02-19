import { useNavigate } from "react-router-dom";
import "./style.css";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="nf-page">
      <div className="nf-card">
        <div className="nf-title">404 — Link not found</div>
        <div className="nf-subtitle">
          The shortened URL you tried to access doesn’t exist (or was deleted).
        </div>

        <div className="nf-actions">
          <button
            className="btn"
            type="button"
            onClick={() => navigate("/", { replace: true })}
          >
            Go Home
          </button>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>

        <div className="nf-hint">
          If you own this link, log in to check your dashboard.
        </div>
      </div>
    </div>
  );
}