/**
 * History.jsx
 * -----------
 * Full analysis history list for the current user.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import Loader from "../components/Loader";

export default function History() {
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

  const getScoreColor = (score) => {
    if (score >= 75) return "#10b981";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const handleDownload = async (analysisId) => {
    try {
      const res = await api.get(`/download-report/${analysisId}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `resume_analysis_${analysisId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download report.");
    }
  };

  const handleDownloadCorrected = async (analysisId) => {
    try {
      const res = await api.get(`/download-corrected-resume/${analysisId}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ATS_Template_${analysisId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download corrected resume template.");
    }
  };

  if (!user) return null;

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <h1>
          📋 Analysis <span>History</span>
        </h1>
        <p>View all your past resume analyses</p>
      </div>

      {loading ? (
        <Loader message="Loading history..." />
      ) : analyses.length === 0 ? (
        <div className="glass-card-static">
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>No analyses yet</h3>
            <p>Upload your first resume to see analysis history here</p>
            <Link to="/upload" className="btn btn-primary">
              Upload Resume
            </Link>
          </div>
        </div>
      ) : (
        <div className="history-list animate-fade-in-up">
          {analyses.map((a, index) => (
            <div
              className="history-card"
              key={a.id}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="history-info">
                <h3>{a.candidate_name || "Unnamed Candidate"}</h3>
                <p>
                  {a.selected_role} •{" "}
                  {new Date(a.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
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
                <span
                  className="score-badge"
                  style={{
                    background: `${getScoreColor(a.job_match_percentage)}22`,
                    color: getScoreColor(a.job_match_percentage),
                  }}
                >
                  Match: {a.job_match_percentage}%
                </span>
              </div>
              <div className="history-actions">
                <Link to={`/result/${a.id}`} className="btn btn-primary btn-sm">
                  View Result
                </Link>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDownload(a.id)}
                >
                  📥 PDF Report
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleDownloadCorrected(a.id)}
                >
                  📄 ATS Template
                </button>
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
        </div>
      )}
    </div>
  );
}
