/**
 * ScoreCard.jsx
 * -------------
 * ATS score circle visualization with animated progress ring.
 */

export default function ScoreCard({ score, maxScore = 100, breakdown }) {
  const radius = 75;
  const circumference = 2 * Math.PI * radius;
  const percentage = (score / maxScore) * 100;
  const offset = circumference - (percentage / 100) * circumference;

  // Color based on score
  const getColor = (pct) => {
    if (pct >= 75) return "#10b981";
    if (pct >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const color = getColor(percentage);

  const getBarColor = (score, max) => {
    const pct = (score / max) * 100;
    if (pct >= 80) return "#10b981";
    if (pct >= 50) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="score-container">
      {/* Circular progress */}
      <div className="score-circle">
        <svg viewBox="0 0 170 170">
          <circle
            className="circle-bg"
            cx="85"
            cy="85"
            r={radius}
          />
          <circle
            className="circle-progress"
            cx="85"
            cy="85"
            r={radius}
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="score-text">
          <span className="score-number" style={{ color }}>
            {score}
          </span>
          <span className="score-label">out of {maxScore}</span>
        </div>
      </div>

      {/* Breakdown bars */}
      {breakdown && (
        <div className="score-breakdown">
          {Object.entries(breakdown).map(([section, vals]) => {
            const sectionScore = vals.score ?? vals;
            const sectionMax = vals.max ?? 10;
            const widthPct = (sectionScore / sectionMax) * 100;
            return (
              <div className="breakdown-item" key={section}>
                <span className="breakdown-label">{section}</span>
                <div className="breakdown-bar">
                  <div
                    className="breakdown-bar-fill"
                    style={{
                      width: `${widthPct}%`,
                      background: getBarColor(sectionScore, sectionMax),
                    }}
                  />
                </div>
                <span className="breakdown-score">
                  {sectionScore}/{sectionMax}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
