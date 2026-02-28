import { useNavigate } from "react-router-dom";
import "../Expired/ExpiredPage.css"; /* reuse same status-page styles */

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="status-page">
      <div className="card status-card">
        <h1 className="status-title">404 — Not found</h1>
        <p className="status-subtitle">The shortened URL you tried to access doesn't exist or was deleted.</p>

        <div className="status-actions">
          <button className="btn btn-primary" onClick={() => navigate("/", { replace: true })}>Go Home</button>
          <button className="btn btn-secondary" onClick={() => navigate("/login")}>Login</button>
        </div>

        <p className="status-hint">If you own this link, log in to check your dashboard.</p>
      </div>
    </div>
  );
}
