import { useNavigate } from "react-router-dom";
import "./ExpiredPage.css";

export default function ExpiredPage() {
  const navigate = useNavigate();

  return (
    <div className="status-page">
      <div className="card status-card">
        <h1 className="status-title">Link expired</h1>
        <p className="status-subtitle">The shortened URL you tried to access is no longer active.</p>

        <div className="status-actions">
          <button className="btn btn-primary" onClick={() => navigate("/", { replace: true })}>Go Home</button>
          <button className="btn btn-secondary" onClick={() => navigate("/login")}>Login</button>
        </div>

        <p className="status-hint">If you own this link, log in to manage it in your dashboard.</p>
      </div>
    </div>
  );
}
