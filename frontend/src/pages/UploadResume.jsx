/**
 * UploadResume.jsx
 * ----------------
 * Resume upload page with drag-and-drop, file validation, job role selector,
 * and analysis trigger.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Loader from "../components/Loader";

export default function UploadResume() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [file, setFile] = useState(null);
  const [role, setRole] = useState("");
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await api.get("/roles");
      setRoles(res.data.roles || []);
    } catch {
      // Fallback roles
      setRoles([
        "Data Analyst", "Data Scientist", "Business Analyst",
        "Machine Learning Engineer", "AI Engineer", "Python Developer",
        "Java Developer", "Software Developer", "Frontend Developer",
        "Backend Developer", "Full Stack Developer", "Web Developer",
        "Android Developer", "UI/UX Designer", "Cloud Engineer",
        "DevOps Engineer", "Cyber Security Analyst", "Database Administrator",
        "System Administrator", "Network Engineer", "QA Tester",
        "Automation Tester", "Digital Marketing Executive", "Content Writer",
        "Graphic Designer", "Project Manager", "Product Manager",
        "HR Executive", "Finance Analyst",
      ]);
    }
  };

  const validateFile = (f) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const allowedExts = [".pdf", ".docx"];
    const ext = f.name.toLowerCase().substring(f.name.lastIndexOf("."));

    if (!allowedTypes.includes(f.type) && !allowedExts.includes(ext)) {
      setError("Invalid file type. Only PDF and DOCX files are accepted.");
      return false;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      return false;
    }
    return true;
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f && validateFile(f)) {
      setFile(f);
      setError("");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && validateFile(f)) {
      setFile(f);
      setError("");
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please upload a resume file.");
      return;
    }
    if (!role) {
      setError("Please select a target job role.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("role", role);

      const res = await api.post("/upload-resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const analysisId = res.data.analysis_id;
      navigate(`/result/${analysisId}`);
    } catch (err) {
      setError(err.response?.data?.error || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="page-container">
        <Loader message="Analyzing your resume... This may take a moment." />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: "700px" }}>
      <div className="glass-card-static animate-fade-in-up">
        <h2
          style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            marginBottom: "0.5rem",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Upload Your Resume
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
          Upload a PDF or DOCX resume and select your target job role
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* File upload area */}
          <div
            className={`upload-area ${dragOver ? "drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              id="resume-file"
            />
            <div className="upload-icon">📁</div>
            <h3>Drag & drop your resume here</h3>
            <p>or click to browse • PDF, DOCX • Max 5MB</p>
          </div>

          {/* Selected file info */}
          {file && (
            <div className="file-info">
              <div className="file-icon">
                {file.name.endsWith(".pdf") ? "📕" : "📘"}
              </div>
              <div className="file-details">
                <div className="file-name">{file.name}</div>
                <div className="file-size">{formatFileSize(file.size)}</div>
              </div>
              <button type="button" className="remove-file" onClick={handleRemoveFile}>
                ✕
              </button>
            </div>
          )}

          {/* Job role selector */}
          <div className="form-group" style={{ marginTop: "1.5rem" }}>
            <label className="form-label" htmlFor="job-role">
              🎯 Target Job Role
            </label>
            <select
              id="job-role"
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Select a job role...</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={!file || !role}
            style={{ marginTop: "1.5rem" }}
          >
            🔍 Analyze Resume
          </button>
        </form>
      </div>
    </div>
  );
}
