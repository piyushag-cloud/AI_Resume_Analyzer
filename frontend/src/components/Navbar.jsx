/**
 * Navbar.jsx
 * ----------
 * Navigation bar with auth-aware links.
 */

import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const adminToken = localStorage.getItem("adminToken");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="brand-icon">📄</div>
        <span className="brand-text">AI Resume Analyzer</span>
      </Link>

      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/upload">Upload</Link>
            <Link to="/history">History</Link>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : adminToken ? (
          <>
            <Link to="/admin/dashboard">Admin Panel</Link>
            <button className="btn-logout" onClick={handleAdminLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
            <Link to="/admin">Admin</Link>
          </>
        )}
      </div>
    </nav>
  );
}
