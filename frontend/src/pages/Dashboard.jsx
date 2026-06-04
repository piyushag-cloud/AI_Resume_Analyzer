/**
 * Dashboard.jsx
 * -------------
 * User dashboard showing welcome, quick actions, and recent analyses.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import Loader from "../components/Loader";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/history/${user.id}`);
      setAnalyses(res.data.analyses || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (analysisId) => {
    if (!window.confirm("Are you sure you want to delete this analysis?")) return;
    try {
      await api.delete(`/analysis/${analysisId}`);
      setAnalyses(analyses.filter((a) => a.id !== analysisId));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete analysis.");
    }
  };

  if (!user) return null;

  const getScoreColor = (score) => {
    if (score >= 75) return "#10b981";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>
          Welcome back, <span>{user.name}</span> 👋
        </h1>
        <p>Manage your resume analyses and track your progress</p>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-actions">
        <Link to="/upload" className="action-card">
          <div className="action-icon" style={{ background: "rgba(59,130,246,0.15)" }}>
            📄
          </div>
          <div>
            <h3>Upload Resume</h3>
            <p>Analyze a new resume</p>
          </div>
        </Link>
        <Link to="/history" className="action-card">
          <div className="action-icon" style={{ background: "rgba(139,92,246,0.15)" }}>
            📋
          </div>
          <div>
            <h3>View History</h3>
            <p>See all past analyses</p>
          </div>
        </Link>
        <div className="action-card" style={{ cursor: "default" }}>
          <div className="action-icon" style={{ background: "rgba(16,185,129,0.15)" }}>
            📊
          </div>
          <div>
            <h3>Total Analyses</h3>
            <p>{analyses.length} resume(s) analyzed</p>
          </div>
        </div>
      </div>

      {/* Recent Analyses */}
      <div className="glass-card-static" style={{ animation: "fadeInUp 0.5s ease 0.2s both" }}>
        <h3 style={{ marginBottom: "1rem", fontSize: "1.2rem", fontWeight: 700 }}>
          📋 Recent Analyses
        </h3>

        {loading ? (
          <Loader message="Loading your analyses..." />
        ) : analyses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>No analyses yet</h3>
            <p>Upload your first resume to get started with AI-powered analysis</p>
            <Link to="/upload" className="btn btn-primary">
              Upload Resume
            </Link>
          </div>
        ) : (
          <div className="history-list">
            {analyses.slice(0, 5).map((a) => (
              <div className="history-card" key={a.id}>
                <div className="history-info">
                  <h3>{a.candidate_name || "Unnamed"}</h3>
                  <p>
                    {a.selected_role} •{" "}
                    {new Date(a.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="history-score">
                  <span
                    className="score-badge"
                    style={{
                      background: `${getScoreColor(a.ats_score)}22`,
                      color: getScoreColor(a.ats_score),
                    }}
                  >
                    ATS: {a.ats_score}/100
                  </span>
                </div>
                <div className="history-actions">
                  <Link to={`/result/${a.id}`} className="btn btn-secondary btn-sm">
                    View
                  </Link>
                  <button 
                    className="btn btn-danger btn-sm" 
                    onClick={() => handleDelete(a.id)}
                    style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--accent-red)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {analyses.length > 5 && (
              <div style={{ textAlign: "center", marginTop: "1rem" }}>
                <Link to="/history" className="btn btn-secondary btn-sm">
                  View All ({analyses.length})
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
