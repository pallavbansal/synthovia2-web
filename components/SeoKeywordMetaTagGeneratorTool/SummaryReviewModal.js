import React from "react";

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    zIndex: 1000,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: "50px",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "900px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
    zIndex: 1001,
    maxHeight: "85vh",
    overflowY: "auto",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  header: {
    padding: "20px 24px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#6b7280",
    padding: "4px",
    lineHeight: 1,
  },
  body: {
    padding: "24px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px 30px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#3b82f6",
    marginBottom: "10px",
    borderBottom: "2px solid #e5e7eb",
    paddingBottom: "5px",
    gridColumn: "1 / -1",
  },
  item: {
    marginBottom: "12px",
    fontSize: "14px",
    color: "#374151",
    display: "flex",
    flexDirection: "column",
  },
  itemLabel: {
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "4px",
  },
  valueBox: {
    backgroundColor: "#f3f4f6",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
    whiteSpace: "pre-wrap",
    minHeight: "40px",
    display: "flex",
    alignItems: "center",
  },
  tagContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "4px",
  },
  badge: {
    display: "inline-flex",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: "500",
    borderRadius: "4px",
  },
  badgePrimary: { backgroundColor: "#3b82f6", color: "white" },
  badgeSuccess: { backgroundColor: "#10b981", color: "white" },
  badgeSecondary: { backgroundColor: "#fcd34d", color: "#1f2937" },
  actionContainer: {
    padding: "20px 24px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },
  btn: {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "500",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.15s ease-in-out",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
  btnPrimary: {
    backgroundColor: "#3b82f6",
    color: "white",
  },
  btnOutline: {
    backgroundColor: "white",
    color: "#6b7280",
    border: "1px solid #d1d5db",
  },
};

const renderValue = (value) => {
  if (Array.isArray(value)) return value.length ? value : [];
  if (value === undefined || value === null) return "";
  return String(value);
};

const SummaryReviewModal = ({ formData, onGenerate, onEdit, onClose, isGenerating }) => {
  const tags = (value, style) => {
    const arr = renderValue(value);
    if (!Array.isArray(arr) || arr.length === 0) {
      return <span style={{ color: "#6b7280" }}>None specified</span>;
    }
    return (
      <div style={styles.tagContainer}>
        {arr.map((item, idx) => (
          <span key={idx} style={{ ...styles.badge, ...style }}>
            {item}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.overlay} onClick={onEdit}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Review Your SEO Generator Selections</h2>
          <button style={styles.closeButton} onClick={onClose || onEdit}>
            ×
          </button>
        </div>

        <div style={styles.body}>
          <h3 style={styles.sectionTitle}>Page Context</h3>

          <div style={{ ...styles.item, gridColumn: "1 / -1" }}>
            <span style={styles.itemLabel}>Page Topic / Content Summary:</span>
            <div style={styles.valueBox}>{renderValue(formData.pageTopicSummary) || "Not specified"}</div>
          </div>

          <div style={styles.item}>
            <span style={styles.itemLabel}>Page Goal / Intent:</span>
            <div style={styles.valueBox}>{renderValue(formData.pageGoal) || "Not specified"}</div>
          </div>

          <div style={styles.item}>
            <span style={styles.itemLabel}>Target Audience / Region:</span>
            {tags(formData.targetAudience, styles.badgePrimary)}
          </div>

          <h3 style={styles.sectionTitle}>Keyword Strategy</h3>

          <div style={styles.item}>
            <span style={styles.itemLabel}>Keyword Focus Type:</span>
            <div style={styles.valueBox}>{renderValue(formData.keywordFocusType) || "Not specified"}</div>
          </div>

          <div style={styles.item}>
            <span style={styles.itemLabel}>Keyword Difficulty Preference:</span>
            <div style={styles.valueBox}>{renderValue(formData.keywordDifficulty)}</div>
          </div>

          <div style={styles.item}>
            <span style={styles.itemLabel}>Search Volume Priority:</span>
            <div style={styles.valueBox}>{renderValue(formData.searchVolumePriority) || "Not specified"}</div>
          </div>

          <div style={styles.item}>
            <span style={styles.itemLabel}>Include Keywords:</span>
            {tags(formData.includeKeywords, styles.badgeSuccess)}
          </div>

          <div style={styles.item}>
            <span style={styles.itemLabel}>Exclude Keywords:</span>
            {tags(formData.excludeKeywords, styles.badgeSecondary)}
          </div>

          <h3 style={styles.sectionTitle}>Meta + Output Settings</h3>

          <div style={styles.item}>
            <span style={styles.itemLabel}>Tone:</span>
            <div style={styles.valueBox}>{renderValue(formData.tone) || "Not specified"}</div>
          </div>

          <div style={styles.item}>
            <span style={styles.itemLabel}>Meta Title Style:</span>
            <div style={styles.valueBox}>{renderValue(formData.metaTitleStyle) || "Not specified"}</div>
          </div>

          <div style={styles.item}>
            <span style={styles.itemLabel}>Schema / Rich Result Type:</span>
            <div style={styles.valueBox}>{renderValue(formData.schemaType) || "Not specified"}</div>
          </div>

          <div style={styles.item}>
            <span style={styles.itemLabel}>Language:</span>
            <div style={styles.valueBox}>{renderValue(formData.language) || "Not specified"}</div>
          </div>

          <div style={styles.item}>
            <span style={styles.itemLabel}>Output Depth:</span>
            <div style={styles.valueBox}>{renderValue(formData.outputDepth) || "Not specified"}</div>
          </div>

          <div style={styles.item}>
            <span style={styles.itemLabel}>Output Format:</span>
            <div style={styles.valueBox}>{renderValue(formData.outputFormat) || "Not specified"}</div>
          </div>

          <div style={styles.item}>
            <span style={styles.itemLabel}>Text Length:</span>
            <div style={styles.valueBox}>{renderValue(formData.textLength) || "Not specified"}</div>
          </div>

          <div style={styles.item}>
            <span style={styles.itemLabel}>Number of Variants:</span>
            <div style={styles.valueBox}>{renderValue(formData.variantsCount)}</div>
          </div>

          <div style={styles.item}>
            <span style={styles.itemLabel}>Brand / Website Name:</span>
            <div style={styles.valueBox}>{renderValue(formData.brandName) || "Not specified"}</div>
          </div>

          <div style={styles.item}>
            <span style={styles.itemLabel}>Competitor URL / Reference Page:</span>
            <div style={styles.valueBox}>{renderValue(formData.competitorUrl) || "Not specified"}</div>
          </div>

          <div style={{ ...styles.item, gridColumn: "1 / -1" }}>
            <span style={styles.itemLabel}>Compliance & Content Guidelines:</span>
            <div style={styles.valueBox}>{renderValue(formData.complianceGuidelines) || "Not specified"}</div>
          </div>
        </div>

        <div style={styles.actionContainer}>
          <button style={{ ...styles.btn, ...styles.btnOutline }} onClick={onEdit} disabled={isGenerating}>
            Edit
          </button>
          <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={onGenerate} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummaryReviewModal;
