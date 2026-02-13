import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./style.css";

export default function Login() {
  const navigate = useNavigate();

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
      setError("Please enter a valid email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("http://localhost:8080/login", {
        username: email.trim().toLowerCase(),
        password,
      });

      localStorage.setItem("token", res.data.token);
      navigate("/");
    } catch {
      setError("Invalid credentials.");
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
          <h1>Login</h1>
          <p>Welcome back. Let’s shorten some links.</p>
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
              placeholder="Your password"
              type="password"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button className="btn btn-full" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button className="btn btn-ghost btn-full" onClick={handleGoogleLogin}>
          Continue with Google
        </button>

        <p className="auth-footer">
          Don’t have an account?{" "}
          <span className="link" onClick={() => navigate("/register")} role="button">
            Register
          </span>
        </p>
      </div>
    </div>
  );
}