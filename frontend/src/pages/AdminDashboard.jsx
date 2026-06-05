/**
 * AdminDashboard.jsx
 * ------------------
 * Admin panel with stats, user list, and analysis list tabs.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Loader from "../components/Loader";

const API_BASE = import.meta.env.VITE_API_URL || "https://ai-resume-analyzer-mduy.onrender.com";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  const adminToken = localStorage.getItem("adminToken");

  const adminApi = axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  useEffect(() => {
    if (!adminToken) {
      navigate("/admin");
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, analysesRes] = await Promise.all([
        adminApi.get("/admin/stats"),
        adminApi.get("/admin/users"),
        adminApi.get("/admin/analyses"),
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      setAnalyses(analysesRes.data.analyses);
    } catch (err) {
      console.error("Admin fetch error:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin");
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return "#10b981";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  if (!adminToken) return null;

  if (loading) {
    return (
      <div className="page-container">
        <Loader message="Loading admin dashboard..." />
      </div>
    );
  }

  return (
    <div className="page-container-wide">
      <div className="dashboard-header">
        <h1>
          🔐 Admin <span>Dashboard</span>
        </h1>
        <p>Manage users and view all resume analyses</p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="admin-stats animate-fade-in-up">
          <div className="stat-card glass-card-static">
            <div className="stat-value">{stats.total_users}</div>
            <div className="stat-title">Registered Users</div>
          </div>
          <div className="stat-card glass-card-static">
            <div className="stat-value">{stats.total_analyses}</div>
            <div className="stat-title">Total Analyses</div>
          </div>
          <div className="stat-card glass-card-static">
            <div className="stat-value">{stats.average_ats_score}</div>
            <div className="stat-title">Average ATS Score</div>
          </div>
          <div className="stat-card glass-card-static">
            <div className="stat-value">
              {stats.top_roles && stats.top_roles.length > 0
                ? stats.top_roles[0].role
                : "N/A"}
            </div>
            <div className="stat-title">Most Selected Role</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${tab === "stats" ? "active" : ""}`}
          onClick={() => setTab("stats")}
        >
          📊 Stats
        </button>
        <button
          className={`admin-tab ${tab === "users" ? "active" : ""}`}
          onClick={() => setTab("users")}
        >
          👥 Users
        </button>
        <button
          className={`admin-tab ${tab === "analyses" ? "active" : ""}`}
          onClick={() => setTab("analyses")}
        >
          📋 Analyses
        </button>
      </div>

      {/* Tab Content */}
      <div className="glass-card-static animate-fade-in">
        {tab === "stats" && stats && (
          <div>
            <h3 style={{ marginBottom: "1rem" }}>🏆 Most Selected Job Roles</h3>
            {stats.top_roles && stats.top_roles.length > 0 ? (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Job Role</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top_roles.map((r, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{r.role}</td>
                        <td>{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)" }}>No analyses yet</p>
            )}
          </div>
        )}

        {tab === "users" && (
          <div>
            <h3 style={{ marginBottom: "1rem" }}>
              👥 All Registered Users ({users.length})
            </h3>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span
                          className={`status-badge ${u.role === "admin" ? "found" : ""}`}
                          style={
                            u.role !== "admin"
                              ? { background: "rgba(59,130,246,0.15)", color: "var(--accent-blue)" }
                              : {}
                          }
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {new Date(u.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "analyses" && (
          <div>
            <h3 style={{ marginBottom: "1rem" }}>
              📋 All Analyses ({analyses.length})
            </h3>
            {analyses.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No analyses yet</p>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Candidate</th>
                      <th>Role</th>
                      <th>ATS Score</th>
                      <th>Match %</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyses.map((a) => (
                      <tr key={a.id}>
                        <td>{a.id}</td>
                        <td>{a.candidate_name || "N/A"}</td>
                        <td>{a.selected_role}</td>
                        <td>
                          <span style={{ color: getScoreColor(a.ats_score), fontWeight: 700 }}>
                            {a.ats_score}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: getScoreColor(a.job_match_percentage), fontWeight: 700 }}>
                            {a.job_match_percentage}%
                          </span>
                        </td>
                        <td>
                          {new Date(a.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
