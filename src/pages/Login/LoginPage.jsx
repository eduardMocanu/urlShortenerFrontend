import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { API_BASE } from "../../utils/api";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailOk = email.trim().length > 0 && email.includes("@");
  const passwordOk = password.length >= 6;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!emailOk || !passwordOk) {
      setError("Please enter a valid email and password (min 6 chars).");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_BASE}/login`, {
        username: email.trim().toLowerCase(),
        password,
      });
      login();
      navigate("/");
    } catch {
      setError("Invalid credentials.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href = `${API_BASE}/oauth2/authorization/google`;
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Log in to manage your short links.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label className="label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className={`input ${error && !emailOk ? "input-error" : ""}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="login-pw">Password</label>
            <input
              id="login-pw"
              className={`input ${error && !passwordOk ? "input-error" : ""}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              type="password"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>

        <div className="divider"><span>or</span></div>

        <button className="btn btn-ghost btn-full" type="button" onClick={handleGoogleLogin}>
          Continue with Google
        </button>

        <p className="auth-footer">
          Don't have an account?{" "}
          <span className="link" onClick={() => navigate("/register")} role="button">
            Register
          </span>
        </p>
      </div>
    </div>
  );
}
