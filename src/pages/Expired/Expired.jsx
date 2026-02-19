import { useNavigate } from "react-router-dom";
import "./style.css";

export default function Expired() {
  const navigate = useNavigate();

  return (
    <div className="expired-page">
      <div className="expired-card">
        <div className="expired-title">This link has expired</div>
        <div className="expired-subtitle">
          The shortened URL you tried to access is no longer active.
        </div>

        <div className="expired-actions">
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

        <div className="expired-hint">
          If you own this link, log in to manage it in your dashboard.
        </div>
      </div>
    </div>
  );
}