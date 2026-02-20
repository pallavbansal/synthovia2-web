import React from "react";
import { useCredits } from "@/components/CreditsContext";

const CreditsBadge = ({ className = "", style = {} }) => {
  const { trialRemaining = 0, realRemaining = 0, isFreeTrial = false } = useCredits() || {};

  const pillStyle = {
    background: "#0f172a",
    color: "#e2e8f0",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid rgba(148,163,184,0.25)",
    whiteSpace: "nowrap",
  };

  const freeStyle = {
    background: "#0ea5e9",
    color: "#0b1727",
    padding: "2px 6px",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 10,
  };

  return (
    <div
      className={`d-none d-lg-flex align-items-center ${className}`}
      style={{ gap: 8, ...style }}
      aria-label="User credits"
    >
      <div style={pillStyle} title="Trial credits remaining">
        <span style={{ opacity: 0.85 }}>Trial:</span>
        <strong>{trialRemaining}</strong>
        {isFreeTrial ? <span style={freeStyle}>Free Trial</span> : null}
      </div>
      <div style={pillStyle} title="Paid credits remaining">
        <span style={{ opacity: 0.85 }}>Credits:</span>
        <strong>{realRemaining}</strong>
      </div>
    </div>
  );
};

export default CreditsBadge;
