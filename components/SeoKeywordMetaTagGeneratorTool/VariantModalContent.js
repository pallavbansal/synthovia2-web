import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import SurfingLoading from "./SurfingLoading";

const VariantModalContent = ({
  variants,
  onClose,
  inputs,
  onRequestRegenerate,
  showNotification,
  isLoading,
  isHistoryView = false,
}) => {
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const processContent = (content) => {
    if (!content) return "";

    const normalized = String(content)
      .replace(/<strong>(.*?)<\/strong>/g, "**$1**")
      .replace(/<b>(.*?)<\/b>/g, "**$1**");

    const toHeadingIfBoldOnly = (line) => {
      const match = line.match(/^\s*\*\*(.+?)\*\*\s*$/);
      if (!match) return line;
      const title = String(match[1] || "").trim();
      if (!title) return line;
      return `## ${title}`;
    };

    const isHeading = (line) => /^\s*#{1,6}\s+/.test(line);
    const isListLine = (line) => /^\s*([-*+])\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line);
    const isFenceOrTableOrQuote = (line) => /^\s*```/.test(line) || /^\s*\|/.test(line) || /^\s*>/.test(line);
    const looksLikeSectionTitle = (line) => {
      const t = String(line || "").trim();
      if (!t) return false;
      if (isHeading(t) || isListLine(t) || isFenceOrTableOrQuote(t)) return false;
      if (t.length > 80) return false;
      return /:\s*$/.test(t);
    };
    const isPlainItemLine = (line) => {
      const t = String(line || "").trim();
      if (!t) return false;
      if (isHeading(t) || isListLine(t) || isFenceOrTableOrQuote(t)) return false;
      return true;
    };

    const lines = normalized.split(/\r?\n/).map(toHeadingIfBoldOnly);
    const out = [];

    const collectPlainItems = (startIndex) => {
      let j = startIndex;
      while (j < lines.length && !String(lines[j] ?? "").trim()) j += 1;

      const items = [];
      let k = j;
      while (k < lines.length) {
        const l = String(lines[k] ?? "");
        const t = l.trim();
        if (!t) {
          k += 1;
          continue;
        }
        if (isHeading(t) || isListLine(t) || isFenceOrTableOrQuote(t) || looksLikeSectionTitle(t)) break;
        if (!isPlainItemLine(t)) break;
        items.push(t);
        k += 1;
      }

      return { items, endIndex: k };
    };

    for (let i = 0; i < lines.length; i += 1) {
      const raw = lines[i] ?? "";
      const line = String(raw);
      const trimmed = line.trim();

      if (looksLikeSectionTitle(trimmed)) {
        out.push(`## ${trimmed}`);

        const { items, endIndex } = collectPlainItems(i + 1);
        if (items.length >= 2) {
          items.forEach((it) => out.push(`- ${it}`));
          i = endIndex - 1;
        }
        continue;
      }

      if (isHeading(trimmed)) {
        out.push(trimmed);

        const { items, endIndex } = collectPlainItems(i + 1);
        if (items.length >= 2) {
          items.forEach((it) => out.push(`- ${it}`));
          i = endIndex - 1;
        }

        continue;
      }

      out.push(line);
    }

    return out
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\n\s*\n(?=\s*[-*+]\s)/g, "\n")
      .replace(/\n\s*\n(?=\s*\d+[.)]\s)/g, "\n");
  };

  const markdownComponents = {
    h1: ({ children, ...props }) => (
      <h1
        style={{
          color: "#111827",
          fontSize: "28px",
          lineHeight: 1.2,
          fontWeight: 700,
          margin: "0 0 10px 0",
        }}
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        style={{
          color: "#111827",
          fontSize: "22px",
          lineHeight: 1.25,
          fontWeight: 700,
          margin: "14px 0 8px 0",
        }}
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        style={{
          color: "#111827",
          fontSize: "18px",
          lineHeight: 1.3,
          fontWeight: 700,
          margin: "12px 0 6px 0",
        }}
        {...props}
      >
        {children}
      </h3>
    ),
    p: ({ children, ...props }) => (
      <p
        style={{
          margin: 0,
          lineHeight: 1.5,
        }}
        {...props}
      >
        {children}
      </p>
    ),
    ul: ({ children, ...props }) => (
      <ul
        style={{
          margin: "4px 0 8px 18px",
          padding: 0,
        }}
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        style={{
          margin: "4px 0 8px 18px",
          padding: 0,
        }}
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li
        style={{
          margin: 0,
          lineHeight: 1.5,
        }}
        {...props}
      >
        {children}
      </li>
    ),
    pre: ({ children, ...props }) => (
      <pre
        style={{
          margin: "6px 0 10px 0",
          padding: 0,
          background: "transparent",
          color: "#1f2937",
          fontFamily: "inherit",
          whiteSpace: "pre-wrap",
        }}
        {...props}
      >
        {children}
      </pre>
    ),
    code: ({ inline, children, ...props }) => (
      <code
        style={{
          background: "transparent",
          color: "#1f2937",
          fontFamily: inline ? "inherit" : "inherit",
          padding: 0,
        }}
        {...props}
      >
        {children}
      </code>
    ),
  };

  useEffect(() => {
    if (variants?.length > 0) setExpandedIndex(0);
  }, [variants?.length]);

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth <= 480);
    };

    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    return () => window.removeEventListener("resize", updateIsMobile);
  }, []);

  const toggleExpand = (index) => {
    setExpandedIndex(index === expandedIndex ? null : index);
  };

  const handleCopy = (text, variantNumber) => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showNotification?.(`Variant ${variantNumber} copied to clipboard!`, "success");
    } catch {
      showNotification?.("Failed to copy text.", "error");
    }
  };

  const handleDownload = (variant, index) => {
    if (!variant || !variant.content) {
      showNotification?.("No content available to download for this variant.", "error");
      return;
    }

    try {
      const blob = new Blob([variant.content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const brand =
        typeof inputs?.brandName === "string"
          ? inputs.brandName
          : inputs?.brandName?.value || inputs?.brandName?.label || "Brand";

      link.href = url;
      link.download = `seo_variant_${index + 1}_${brand}.txt`.replace(/\s+/g, "_");

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      showNotification?.("Failed to download variant as a file.", "error");
    }
  };

  const handleRegenerate = async (variantId) => {
    if (!onRequestRegenerate) return;

    setRegeneratingId(variantId);

    const indexToExpand = (variants || []).findIndex((v) => v?.id === variantId);
    if (indexToExpand !== -1) setExpandedIndex(indexToExpand);

    try {
      await onRequestRegenerate(variantId);
    } finally {
      setRegeneratingId(null);
    }
  };

  const modalStyles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "transparent",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: isMobile ? "12px" : "20px",
    },
    modal: {
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
      width: "95%",
      maxWidth: "900px",
      maxHeight: "95vh",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      overflowY: "hidden",
      ...(isMobile
        ? {
            width: "100%",
            maxWidth: "100%",
            maxHeight: "90vh",
            height: "auto",
          }
        : null),
    },
    header: {
      padding: isMobile ? "14px 16px" : "20px 24px",
      borderBottom: "1px solid #e0e7ff",
      backgroundColor: "#f1f5f9",
      color: "#1e293b",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      zIndex: 10,
      flexShrink: 0,
    },
    body: {
      padding: isMobile ? "14px" : "24px",
      backgroundColor: "white",
      flexGrow: 1,
      overflowY: "auto",
    },
    card: {
      marginBottom: "16px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      overflow: "hidden",
      transition: "all 0.3s ease-in-out",
    },
    cardHeader: {
      padding: "16px 20px",
      fontWeight: "600",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: "1px solid transparent",
      gap: "10px",
      ...(isMobile
        ? {
            flexWrap: "wrap",
            alignItems: "flex-start",
            padding: "12px 14px",
          }
        : null),
    },
    cardContent: {
      padding: "20px",
      whiteSpace: "pre-wrap",
      fontSize: "14px",
      color: "#1f2937",
      backgroundColor: "#f9fafb",
      borderTop: "1px solid #e5e7eb",
    },
    title: {
      fontSize: "1.25rem",
      margin: 0,
      color: "#1e293b",
    },
    actionButton: {
      padding: "6px 12px",
      fontSize: "13px",
      fontWeight: "500",
      borderRadius: "4px",
      border: "1px solid #d1d5db",
      cursor: "pointer",
      marginLeft: isMobile ? "0px" : "8px",
      transition: "background-color 0.15s ease-in-out",
    },
  };

  if (isLoading) {
    return (
      <div style={modalStyles.overlay}>
        <div
          style={{
            ...modalStyles.modal,
            maxWidth: "500px",
            maxHeight: "400px",
            padding: 0,
            overflow: "hidden",
            height: "auto",
            flexShrink: 1,
          }}
        >
          <SurfingLoading mode={isHistoryView ? "history" : "generate"} />
        </div>
      </div>
    );
  }

  if (!variants || variants.length === 0) return null;

  const isUILocked = regeneratingId !== null;

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>Generated SEO Variants ({variants.length})</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: isUILocked ? "not-allowed" : "pointer",
              color: "#4b5563",
              padding: "4px",
              lineHeight: 1,
            }}
            disabled={isUILocked}
          >
            &times;
          </button>
        </div>

        <div style={modalStyles.body}>
          <p style={{ marginBottom: "20px", color: "#475569", fontSize: "14px" }}>
            Click on any variant card to expand and view the full SEO output.
            {isUILocked && (
              <span style={{ color: "#f97316", marginLeft: "8px" }}>(Wait for generation to complete)</span>
            )}
          </p>

          {variants.filter((v) => v?.show_variant !== false).map((variant, index) => {
            const isExpanded = index === expandedIndex;
            const isRegenerating = regeneratingId === variant.id;
            const isVariantStreaming = Boolean(variant?.is_streaming || variant?.isStreaming);
            const isInteractionDisabled = isUILocked;

            const contentToRender = processContent(variant?.content || "");

            return (
              <div
                key={variant?.client_id || variant?.id || index}
                style={{
                  ...modalStyles.card,
                  border: isExpanded ? "1px solid #3b82f6" : "1px solid #e5e7eb",
                  boxShadow: isExpanded ? "0 4px 8px -2px rgba(59, 130, 246, 0.2)" : "0 1px 3px rgba(0,0,0,0.05)",
                  opacity: isRegenerating ? 0.6 : 1,
                }}
              >
                <div
                  style={{
                    ...modalStyles.cardHeader,
                    backgroundColor: isExpanded ? "#e0f2fe" : "#ffffff",
                    borderBottom: isExpanded ? "1px solid #93c5fd" : "1px solid transparent",
                    color: isExpanded ? "#0369a1" : "#1f2937",
                    cursor: isInteractionDisabled ? "wait" : "pointer",
                    pointerEvents: isInteractionDisabled ? "none" : "auto",
                  }}
                  onClick={() => toggleExpand(index)}
                >
                  <span style={{ flexGrow: 1 }}>Variant {index + 1}</span>

                  {isVariantStreaming && (!contentToRender || contentToRender.trim().length === 0) && (
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Generating...</span>
                  )}

                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: isMobile ? "wrap" : "nowrap",
                      gap: isMobile ? "8px" : "0px",
                      width: isMobile ? "100%" : "auto",
                      justifyContent: isMobile ? "flex-start" : "flex-end",
                    }}
                  >
                    <button
                      style={{
                        ...modalStyles.actionButton,
                        backgroundColor: "#10b981",
                        color: "white",
                        border: "none",
                      }}
                      onClick={() => handleCopy(contentToRender, index + 1)}
                      disabled={isInteractionDisabled || isVariantStreaming}
                    >
                      Copy
                    </button>

                    {onRequestRegenerate && (
                      <button
                        style={{
                          ...modalStyles.actionButton,
                          backgroundColor: isInteractionDisabled ? "#9ca3af" : "#f97316",
                          color: "white",
                          border: "none",
                          cursor: isInteractionDisabled ? "wait" : "pointer",
                        }}
                        onClick={() => handleRegenerate(variant.id)}
                        disabled={isInteractionDisabled || isVariantStreaming || !variant?.id}
                      >
                        {isRegenerating ? "Regenerating..." : "Regenerate"}
                      </button>
                    )}

                    <button
                      style={{
                        ...modalStyles.actionButton,
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "none",
                        cursor: isInteractionDisabled ? "default" : "pointer",
                      }}
                      onClick={() => handleDownload({ ...variant, content: contentToRender }, index)}
                      disabled={isInteractionDisabled || isVariantStreaming}
                    >
                      Download
                    </button>
                  </div>

                  <span style={{ opacity: isInteractionDisabled ? 0.3 : 1 }}>{isExpanded ? "▲" : "▼"}</span>
                </div>

                {isExpanded && (
                  <div style={modalStyles.cardContent}>
                    {isVariantStreaming && (!contentToRender || contentToRender.trim().length === 0) ? (
                      <SurfingLoading mode="generate" embedded={true} />
                    ) : (
                      <div style={{ margin: 0, fontFamily: "inherit", whiteSpace: "pre-wrap", color: "#1f2937" }}>
                        <ReactMarkdown components={markdownComponents}>{contentToRender}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
            <button
              onClick={onClose}
              style={{
                ...modalStyles.actionButton,
                padding: "10px 20px",
                backgroundColor: "#f9fafb",
                color: "#4b5563",
                border: "1px solid #d1d5db",
              }}
              disabled={isUILocked}
            >
              Close Modal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariantModalContent;
