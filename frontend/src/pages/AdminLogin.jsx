/**
 * AdminLogin.jsx
 * --------------
 * Admin login page.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/admin/login", form);
      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminUser", JSON.stringify(res.data.user));
      // Clear regular user session if present
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/admin/dashboard");
    } catch (err) {
      if (!err.response) {
        setError("Cannot connect to the backend server. Please make sure the Flask server is running at http://127.0.0.1:5000.");
      } else {
        setError(err.response.data?.error || "Admin login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-card-static">
        <h2>🔐 Admin Panel</h2>
        <p>Sign in with admin credentials</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-email">Admin Email</label>
            <input
              id="admin-email"
              className="form-input"
              type="email"
              name="email"
              placeholder="admin@resumeanalyzer.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              className="form-input"
              type="password"
              name="password"
              placeholder="Enter admin password"
              value={form.password}
              onChange={handleChange}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? "Signing In..." : "🔐 Admin Login"}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: "1.5rem" }}>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Default: admin@resumeanalyzer.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
