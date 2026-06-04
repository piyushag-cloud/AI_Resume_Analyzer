/**
 * Home.jsx
 * --------
 * Landing page with hero section and feature highlights.
 */

import { Link } from "react-router-dom";

export default function Home() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero-section">
        <div className="hero-badge">✨ AI-Powered Resume Analysis</div>
        <h1 className="hero-title">
          Analyze Your Resume
          <br />
          with <span>AI Precision</span>
        </h1>
        <p className="hero-subtitle">
          Upload your resume, select your target job role, and get instant ATS
          score, skill gap analysis, formatting corrections, and personalized
          improvement suggestions.
        </p>
        <div className="hero-buttons">
          {user ? (
            <Link to="/upload" className="btn btn-primary btn-lg">
              📄 Upload Resume
            </Link>
          ) : (
            <>
              <Link to="/signup" className="btn btn-primary btn-lg">
                🚀 Get Started Free
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign In
              </Link>
            </>
          )}
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="stat-number">29+</div>
            <div className="stat-label">Job Roles</div>
          </div>
          <div className="hero-stat">
            <div className="stat-number">100+</div>
            <div className="stat-label">Skills Tracked</div>
          </div>
          <div className="hero-stat">
            <div className="stat-number">20+</div>
            <div className="stat-label">Languages</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <h2>
          Everything You Need to <span>Stand Out</span>
        </h2>
        <p className="features-subtitle">
          Comprehensive resume analysis powered by intelligent text processing
        </p>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon blue">📊</div>
            <h3>ATS Score Analysis</h3>
            <p>
              Get a detailed ATS compatibility score with section-wise breakdown
              to understand exactly where your resume stands.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon purple">🎯</div>
            <h3>Skill Gap Detection</h3>
            <p>
              Compare your skills against required skills for 29+ job roles and
              identify what you need to learn.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon pink">📝</div>
            <h3>Formatting Check</h3>
            <p>
              Detect formatting issues including font sizes, spacing problems,
              missing sections, and capitalization errors.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon cyan">🔤</div>
            <h3>Spelling Correction</h3>
            <p>
              Catch common spelling mistakes in technical terms and professional
              vocabulary before recruiters do.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon green">🌐</div>
            <h3>Language Detection</h3>
            <p>
              Automatically detect 20+ languages mentioned in your resume and
              display them in your analysis report.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon amber">📥</div>
            <h3>PDF Report Download</h3>
            <p>
              Download a professional PDF report of your complete analysis to
              share with mentors or keep for reference.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
