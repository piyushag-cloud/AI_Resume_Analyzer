/**
 * Result.jsx
 * ----------
 * Full analysis result page showing ATS score, skills, sections,
 * formatting/spelling suggestions, and download option.
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api";
import ScoreCard from "../components/ScoreCard";
import Loader from "../components/Loader";

export default function Result() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addText, setAddText] = useState("");
  const [addingText, setAddingText] = useState(false);
  const [addSuccess, setAddSuccess] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchResult();
  }, [id]);

  const fetchResult = async () => {
    try {
      const res = await api.get(`/result/${id}`);
      setResult(res.data.analysis);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load result.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/download-report/${id}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `resume_analysis_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download PDF report. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadCorrected = async () => {
    setDownloadingDocx(true);
    try {
      const res = await api.get(`/download-corrected-resume/${id}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ATS_Template_${id}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download corrected resume template. Please try again.");
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handleAddText = async (e) => {
    e.preventDefault();
    if (!addText.trim()) return;
    
    setAddingText(true);
    setAddSuccess("");
    try {
      await api.post(`/append-resume-info/${id}`, { text: addText });
      setAddSuccess("Successfully added! You can now download your updated ATS Template.");
      setAddText("");
      setTimeout(() => {
        setShowAddForm(false);
        setAddSuccess("");
      }, 4000);
    } catch (err) {
      alert("Failed to add information. Please try again.");
    } finally {
      setAddingText(false);
    }
  };

  const parseField = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return []; }
  };

  const parseObj = (val) => {
    if (!val) return {};
    if (typeof val === "object" && !Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return {}; }
  };

  const getMatchClass = (pct) => {
    if (pct >= 75) return "high";
    if (pct >= 50) return "medium";
    return "low";
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="page-container">
        <Loader message="Loading analysis result..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="glass-card-static" style={{ textAlign: "center", padding: "3rem" }}>
          <h3 style={{ color: "var(--accent-red)", marginBottom: "1rem" }}>⚠️ {error}</h3>
          <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const detectedSkills = parseField(result.detected_skills);
  const matchedSkills = parseField(result.matched_skills);
  const missingSkills = parseField(result.missing_skills);
  const languages = parseField(result.languages_known);
  const fmtSuggestions = parseField(result.formatting_suggestions);
  const spellSuggestions = parseField(result.spelling_suggestions);
  const finalSuggestions = parseField(result.final_suggestions);
  const breakdown = parseObj(result.score_breakdown);

  return (
    <div className="page-container-wide">
      {/* Header */}
      <div className="result-header">
        <h1>📊 Analysis Report</h1>
        <p>
          {result.candidate_name || "Candidate"} • {result.selected_role} •{" "}
          {new Date(result.created_at).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric",
          })}
        </p>
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            className="btn btn-success"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? "Downloading..." : "📥 Download PDF Report"}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleDownloadCorrected}
            disabled={downloadingDocx}
          >
            {downloadingDocx ? "Downloading..." : "📄 Download ATS Template"}
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? "✕ Cancel Add" : "➕ Add to Resume"}
          </button>
          <Link to="/upload" className="btn btn-secondary">
            📄 Analyze Another
          </Link>
          <Link to="/dashboard" className="btn btn-secondary">
            ← Dashboard
          </Link>
        </div>

        {/* Add Form Area */}
        {showAddForm && (
          <div className="glass-card-static" style={{ marginTop: "1.5rem", textAlign: "left", padding: "1.5rem", animation: "fadeInUp 0.3s ease-out" }}>
            <h3 style={{ marginBottom: "0.5rem", fontSize: "1.15rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.3rem" }}>📝</span> Append Missing Information
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "1rem" }}>
              Type exactly as you want it to appear (e.g. <b>PROJECTS</b> followed by your project details). 
              This will be appended to your resume before the <b>ATS Template</b> is generated.
            </p>
            {addSuccess && <div className="auth-success" style={{ marginBottom: "1rem", padding: "0.75rem", borderRadius: "8px" }}>{addSuccess}</div>}
            <form onSubmit={handleAddText}>
              <textarea
                className="form-input"
                style={{ minHeight: "150px", resize: "vertical", fontFamily: "monospace", fontSize: "0.95rem", padding: "14px", background: "rgba(0,0,0,0.15)" }}
                placeholder="EXPERIENCE&#10;Software Engineer Intern - Example Corp&#10;• Developed new features using React and Node.js&#10;• Improved database query performance by 20%"
                value={addText}
                onChange={(e) => setAddText(e.target.value)}
                disabled={addingText}
              />
              <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!addText.trim() || addingText}>
                  {addingText ? "Updating..." : "Update ATS Template"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Result Grid */}
      <div className="result-grid">
        {/* ATS Score */}
        <div className="glass-card-static result-section">
          <h3>
            <span className="section-icon" style={{ background: "rgba(59,130,246,0.15)" }}>📊</span>
            ATS Score
          </h3>
          <ScoreCard
            score={result.ats_score || 0}
            maxScore={100}
            breakdown={breakdown}
          />
        </div>

        {/* Candidate Info */}
        <div className="glass-card-static result-section">
          <h3>
            <span className="section-icon" style={{ background: "rgba(139,92,246,0.15)" }}>👤</span>
            Candidate Information
          </h3>
          <div className="info-row">
            <span className="info-label">Name</span>
            <span className="info-value">{result.candidate_name || "N/A"}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Email</span>
            <span className="info-value">{result.candidate_email || "N/A"}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Phone</span>
            <span className="info-value">{result.candidate_phone || "N/A"}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Job Role</span>
            <span className="info-value">{result.selected_role}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Job Match</span>
            <span className={`match-badge ${getMatchClass(result.job_match_percentage)}`}>
              {result.job_match_percentage}%
            </span>
          </div>

          {/* Resume sections presence */}
          <div style={{ marginTop: "1rem" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              Resume Sections
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <span className={`status-badge ${result.education_found ? "found" : "not-found"}`}>
                {result.education_found ? "✓" : "✕"} Education
              </span>
              <span className={`status-badge ${result.experience_found ? "found" : "not-found"}`}>
                {result.experience_found ? "✓" : "✕"} Experience
              </span>
              <span className={`status-badge ${result.projects_found ? "found" : "not-found"}`}>
                {result.projects_found ? "✓" : "✕"} Projects
              </span>
              <span className={`status-badge ${result.certifications_found ? "found" : "not-found"}`}>
                {result.certifications_found ? "✓" : "✕"} Certifications
              </span>
            </div>
          </div>
        </div>

        {/* Matched Skills */}
        <div className="glass-card-static result-section">
          <h3>
            <span className="section-icon" style={{ background: "rgba(16,185,129,0.15)" }}>✅</span>
            Matched Skills ({matchedSkills.length})
          </h3>
          <div className="skill-tags">
            {matchedSkills.length > 0 ? (
              matchedSkills.map((s) => (
                <span key={s} className="skill-tag matched">{s}</span>
              ))
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No matching skills found</p>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="glass-card-static result-section">
          <h3>
            <span className="section-icon" style={{ background: "rgba(239,68,68,0.15)" }}>❌</span>
            Missing Skills ({missingSkills.length})
          </h3>
          <div className="skill-tags">
            {missingSkills.length > 0 ? (
              missingSkills.map((s) => (
                <span key={s} className="skill-tag missing">{s}</span>
              ))
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>All required skills found! 🎉</p>
            )}
          </div>
        </div>

        {/* All Detected Skills */}
        <div className="glass-card-static result-section">
          <h3>
            <span className="section-icon" style={{ background: "rgba(59,130,246,0.15)" }}>🔍</span>
            All Detected Skills ({detectedSkills.length})
          </h3>
          <div className="skill-tags">
            {detectedSkills.length > 0 ? (
              detectedSkills.map((s) => (
                <span key={s} className="skill-tag detected">{s}</span>
              ))
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No skills detected</p>
            )}
          </div>
        </div>

        {/* Languages Known */}
        <div className="glass-card-static result-section">
          <h3>
            <span className="section-icon" style={{ background: "rgba(139,92,246,0.15)" }}>🌐</span>
            Languages Known ({languages.length})
          </h3>
          <div className="skill-tags">
            {languages.length > 0 ? (
              languages.map((l) => (
                <span key={l} className="skill-tag language">{l}</span>
              ))
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No languages detected</p>
            )}
          </div>
        </div>

        {/* Formatting Suggestions */}
        <div className="glass-card-static result-section full-width">
          <h3>
            <span className="section-icon" style={{ background: "rgba(245,158,11,0.15)" }}>📝</span>
            Formatting Suggestions ({fmtSuggestions.length})
          </h3>
          {fmtSuggestions.length > 0 ? (
            <div className="suggestion-list">
              {fmtSuggestions.map((s, i) => (
                <div key={i} className="suggestion-item">
                  <span className="suggestion-icon">⚡</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--accent-green)", fontSize: "0.9rem" }}>
              ✓ No formatting issues detected
            </p>
          )}
        </div>

        {/* Spelling Suggestions */}
        <div className="glass-card-static result-section full-width">
          <h3>
            <span className="section-icon" style={{ background: "rgba(236,72,153,0.15)" }}>🔤</span>
            Spelling Suggestions ({spellSuggestions.length})
          </h3>
          {spellSuggestions.length > 0 ? (
            <div className="suggestion-list">
              {spellSuggestions.map((s, i) => (
                <div key={i} className="suggestion-item">
                  <span className="suggestion-icon">📌</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--accent-green)", fontSize: "0.9rem" }}>
              ✓ No spelling issues detected
            </p>
          )}
        </div>

        {/* Final Improvement Suggestions */}
        <div className="glass-card-static result-section full-width">
          <h3>
            <span className="section-icon" style={{ background: "rgba(6,182,212,0.15)" }}>💡</span>
            Improvement Suggestions
          </h3>
          {finalSuggestions.length > 0 ? (
            <div className="suggestion-list">
              {finalSuggestions.map((s, i) => (
                <div key={i} className="suggestion-item">
                  <span className="suggestion-icon">💡</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--accent-green)", fontSize: "0.9rem" }}>
              ✓ Your resume looks great!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
