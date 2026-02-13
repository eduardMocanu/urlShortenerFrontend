import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./style.css";

export default function Register() {
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

    if (!emailOk) {
      setError("Please enter a valid email.");
      return;
    }

    if (!passwordOk) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!matchOk) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await axios.post("http://localhost:8080/register", {
        username: email.trim().toLowerCase(),
        password,
      });

      // After successful register, go to login
      navigate("/login");
    } catch {
      setError("Registration failed. Email may already exist.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  }

  return (
    <div className="page">
      <div className="card card-auth">
        <div className="header auth-header">
          <h1>Create account</h1>
          <p>Register to start shortening links.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label className="label">Email</label>
            <input
              className={`input ${error && !emailOk ? "input-error" : ""}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label className="label">Password</label>
            <input
              className={`input ${error && !passwordOk ? "input-error" : ""}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              type="password"
              autoComplete="new-password"
            />
          </div>

          <div className="field">
            <label className="label">Confirm password</label>
            <input
              className={`input ${error && !matchOk ? "input-error" : ""}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              type="password"
              autoComplete="new-password"
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button className="btn btn-full" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Register"}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button className="btn btn-ghost btn-full" onClick={handleGoogleLogin}>
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