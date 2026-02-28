import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../../utils/api";
import "../Login/LoginPage.css"; /* reuse same auth styles */

export default function RegisterPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailOk = email.trim().length > 0 && email.includes("@");
  const passwordOk = password.length >= 6;
  const matchOk = password === confirmPassword;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!emailOk) return setError("Please enter a valid email.");
    if (!passwordOk) return setError("Password must be at least 6 characters.");
    if (!matchOk) return setError("Passwords do not match.");

    try {
      setLoading(true);
      await axios.post(`${API_BASE}/register`, {
        username: email.trim().toLowerCase(),
        password,
      });
      navigate("/login");
    } catch {
      setError("Registration failed. Email may already exist.");
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
          <h1>Create account</h1>
          <p>Register to start shortening links.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label className="label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              className={`input ${error && !emailOk ? "input-error" : ""}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="reg-pw">Password</label>
            <input
              id="reg-pw"
              className={`input ${error && !passwordOk ? "input-error" : ""}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              type="password"
              autoComplete="new-password"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="reg-pw2">Confirm password</label>
            <input
              id="reg-pw2"
              className={`input ${error && !matchOk ? "input-error" : ""}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              type="password"
              autoComplete="new-password"
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "Creating…" : "Register"}
          </button>
        </form>

        <div className="divider"><span>or</span></div>

        <button className="btn btn-ghost btn-full" type="button" onClick={handleGoogleLogin}>
          Continue with Google
        </button>

        <p className="auth-footer">
          Already have an account?{" "}
          <span className="link" onClick={() => navigate("/login")} role="button">
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
