import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";

import SummaryReviewModal from "./SummaryReviewModal";
import VariantModalContent from "./VariantModalContent";
import RemoveTagButton from "../Form/RemoveTagButton";
import ToggleButton from "../Form/ToggleButton";
import { getAuthHeader } from "@/utils/auth";

import API from "@/utils/api";
import { useCredits } from "@/components/CreditsContext";

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const createSessionRequestId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const normalizeOptions = (list) => {
  const arr = Array.isArray(list) ? list : [];
  return arr
    .slice()
    .sort((a, b) => Number(a?.sort_order || 0) - Number(b?.sort_order || 0))
    .map((opt) => ({
      id: opt?.id ?? null,
      key: opt?.key ?? opt?.label ?? "",
      label: opt?.label ?? String(opt?.key ?? ""),
    }))
    .filter((opt) => String(opt.key || "").trim().length > 0);
};

const makeTooltipId = (value) => {
  const base = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
  return `${base || "field"}-tooltip`;
};

const Labeled = ({ label, required, children, help, tooltipId, tooltipContent, styles }) => {
  const tooltipText = tooltipContent ?? help;
  const resolvedTooltipId = tooltipId || makeTooltipId(label);

  return (
    <div className="col-12 col-md-6">
      <div style={styles.formGroup}>
        <label style={styles.label}>
          {label} {required ? <span style={{ color: "#ef4444" }}>*</span> : null}
          {tooltipText ? (
            <span style={styles.infoIcon} data-tooltip-id={resolvedTooltipId} data-tooltip-content={tooltipText}>
              i
            </span>
          ) : null}
        </label>
        {tooltipText ? <Tooltip style={styles.toolTip} id={resolvedTooltipId} /> : null}
        {children}
        {help ? <div style={{ marginTop: "8px", fontSize: "12px", color: "#94a3b8" }}>{help}</div> : null}
      </div>
    </div>
  );
};

const PredefinedCustom = ({
  modeKey,
  valueKey,
  customKey,
  label,
  required,
  options,
  placeholder,
  help,
  customInputProps,
  formData,
  setFormData,
  styles,
}) => {
  const mode = formData[modeKey];

  const handleCustomChange = (e) => {
    let next = e.target.value;
    if (customInputProps?.type === "number") {
      if (next === "") {
        setFormData((p) => ({ ...p, [customKey]: "" }));
        return;
      }

      const parsed = Math.floor(Number(next));
      if (Number.isNaN(parsed)) return;

      let clamped = parsed;
      if (typeof customInputProps.min === "number") clamped = Math.max(customInputProps.min, clamped);
      if (typeof customInputProps.max === "number") clamped = Math.min(customInputProps.max, clamped);

      next = String(clamped);
    }

    setFormData((p) => ({ ...p, [customKey]: next }));
  };

  return (
    <Labeled label={label} required={required} help={help} styles={styles}>
      <div style={styles.radioGroup}>
        <label style={styles.radioItem}>
          <input
            type="radio"
            name={modeKey}
            value="predefined"
            checked={mode === "predefined"}
            onChange={() => setFormData((p) => ({ ...p, [modeKey]: "predefined" }))}
          />
          <span>Predefined</span>
        </label>
        <label style={styles.radioItem}>
          <input
            type="radio"
            name={modeKey}
            value="custom"
            checked={mode === "custom"}
            onChange={() => setFormData((p) => ({ ...p, [modeKey]: "custom" }))}
          />
          <span>Custom</span>
        </label>
      </div>

      {mode === "predefined" ? (
        <select
          style={{ ...styles.select, marginTop: "8px" }}
          value={formData[valueKey]}
          onChange={(e) => setFormData((p) => ({ ...p, [valueKey]: e.target.value }))}
          required={required}
        >
          {(Array.isArray(options) ? options : []).map((o) => {
            const key = typeof o === "string" ? o : o?.key;
            const label = typeof o === "string" ? o : o?.label;
            return (
              <option key={key} value={key}>
                {label}
              </option>
            );
          })}
        </select>
      ) : (
        <input
          style={{ ...styles.input, marginTop: "12px" }}
          value={formData[customKey]}
          onChange={handleCustomChange}
          placeholder={placeholder}
          required={required}
          {...(customInputProps || {})}
        />
      )}
    </Labeled>
  );
};

const SeoKeywordMetaTagGeneratorForm = () => {
  const { setTrialRemaining, fetchCredits, setShowGateModal, setGateFromPayload } = useCredits() || {};
  const timersRef = useRef([]);
  const streamAbortMapRef = useRef(new Map());
  const sessionRequestIdRef = useRef(null);

  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });
  const [showSummary, setShowSummary] = useState(false);
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApiLoading, setIsApiLoading] = useState(false);

  const [generatedVariantsData, setGeneratedVariantsData] = useState({ variants: [], inputs: {} });

  const isGateError = useCallback((payload) => {
    if (!payload) return false;
    const dataPayload = payload?.data || payload;
    const code = dataPayload.code ?? dataPayload.error_code ?? payload?.code ?? payload?.error_code;
    const statusCode = dataPayload.status_code ?? payload?.status_code;
    return code === 'subscription_required' || code === 'trial_exhausted' || statusCode === 2;
  }, []);

  const showGateFromPayload = useCallback((payload) => {
    const handled = setGateFromPayload?.(payload);
    if (!handled) {
      try { setShowGateModal?.(true); } catch {}
    }
  }, [setGateFromPayload, setShowGateModal]);

  const audienceSuggestions = {
    Demographics: ["Women 25-34", "Men 35-44", "Parents of Toddlers"],
    Interests: ["Fitness Enthusiasts", "Tech Early Adopters", "Travel Lovers"],
    Professions: ["Marketing Managers", "Small Business Owners", "Software Engineers"],
  };

  const keywordSuggestions = {
    Intent: ["buy", "pricing", "best", "top", "near me", "online", "for small business"],
    Modifiers: ["tool", "software", "platform", "service", "solution", "automation", "template"],
    Qualifiers: ["secure", "fast", "easy", "affordable", "enterprise", "beginner", "advanced"],
  };

  const [audienceInput, setAudienceInput] = useState("");
  const [includeKeywordInput, setIncludeKeywordInput] = useState("");
  const [excludeKeywordInput, setExcludeKeywordInput] = useState("");

  const [showAudienceSuggestions, setShowAudienceSuggestions] = useState(false);
  const [showIncludeKeywordSuggestions, setShowIncludeKeywordSuggestions] = useState(false);
  const [showExcludeKeywordSuggestions, setShowExcludeKeywordSuggestions] = useState(false);

  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleAdvanced = () => {
    setShowAdvanced((prev) => !prev);
  };

  const [formData, setFormData] = useState({
    pageTopicSummary: "",
    pageGoal: "",
    pageGoalMode: "predefined",
    pageGoalCustom: "",
    targetAudience: [],

    toneMode: "predefined",
    tone: "",
    toneCustom: "",

    keywordFocusTypeMode: "predefined",
    keywordFocusType: "",
    keywordFocusTypeCustom: "",

    keywordDifficulty: 40,
    searchVolumePriority: "",

    metaTitleStyleMode: "predefined",
    metaTitleStyle: "",
    metaTitleStyleCustom: "",

    brandName: "",
    competitorUrl: "",

    languageMode: "predefined",
    language: "",
    languageCustom: "",

    schemaTypeMode: "predefined",
    schemaType: "",
    schemaTypeCustom: "",

    outputDepth: "",
    outputFormat: "",

    includeKeywords: [],
    excludeKeywords: [],

    complianceGuidelinesMode: "predefined",
    complianceGuidelines: "",
    complianceGuidelinesCustom: "",

    textLengthMode: "predefined",
    textLength: "short",
    textLengthCustom: "",

    variantsCount: 3,
  });

  useEffect(() => {
    return () => {
      try {
        const controllers = Array.from(streamAbortMapRef.current.values());
        controllers.forEach((c) => {
          try {
            c?.abort?.();
          } catch {
          }
        });
        streamAbortMapRef.current.clear();
      } catch {
      }

      timersRef.current.forEach((t) => {
        try {
          clearInterval(t);
          clearTimeout(t);
        } catch {
        }
      });
      timersRef.current = [];
    };
  }, []);

  const abortAllStreams = () => {
    const controllers = Array.from(streamAbortMapRef.current.values());
    controllers.forEach((c) => {
      try {
        c?.abort?.();
      } catch {
      }
    });
    streamAbortMapRef.current.clear();
  };

  const showToast = (message, type = "success") => {
    setNotification({ show: true, message, type });
    const t = setTimeout(() => setNotification((p) => ({ ...p, show: false })), 4000);
    timersRef.current.push(t);
  };

  const clearTimers = () => {
    timersRef.current.forEach((t) => {
      try {
        clearInterval(t);
        clearTimeout(t);
      } catch {
      }
    });
    timersRef.current = [];
  };

  const getOptionByKey = (fieldKey, selectedKey) => {
    const list = fieldOptions?.[fieldKey] || [];
    return list.find((o) => String(o?.key) === String(selectedKey)) || null;
  };

  const selectionToApiObject = ({ fieldKey, mode, selectedKey, customValue }) => {
    if (mode === "custom") {
      return { type: "custom", id: null, value: String(customValue || "").trim() };
    }

    const opt = getOptionByKey(fieldKey, selectedKey);
    const value = opt?.label || getLabelFromOptions(fieldKey, selectedKey);
    return { type: "predefined", id: opt?.id ?? null, value };
  };

  const buildGeneratePayload = (variantCount) => {
    return {
      page_topic_summary: String(formData.pageTopicSummary || "").trim(),
      page_goal_intent: selectionToApiObject({
        fieldKey: "page_goal_intent",
        mode: formData.pageGoalMode,
        selectedKey: formData.pageGoal,
        customValue: formData.pageGoalCustom,
      }),
      target_audience_region: Array.isArray(formData.targetAudience) ? formData.targetAudience : [],
      tone: selectionToApiObject({
        fieldKey: "tone",
        mode: formData.toneMode,
        selectedKey: formData.tone,
        customValue: formData.toneCustom,
      }),
      keyword_focus_type: selectionToApiObject({
        fieldKey: "keyword_focus_type",
        mode: formData.keywordFocusTypeMode,
        selectedKey: formData.keywordFocusType,
        customValue: formData.keywordFocusTypeCustom,
      }),
      keyword_difficulty_preference: clamp(Number(formData.keywordDifficulty) || 0, 0, 100),
      search_volume_priority: selectionToApiObject({
        fieldKey: "search_volume_priority",
        mode: "predefined",
        selectedKey: formData.searchVolumePriority,
        customValue: "",
      }),
      meta_title_style: selectionToApiObject({
        fieldKey: "meta_title_style",
        mode: formData.metaTitleStyleMode,
        selectedKey: formData.metaTitleStyle,
        customValue: formData.metaTitleStyleCustom,
      }),
      brand_website_name: String(formData.brandName || "").trim(),
      competitor_url: String(formData.competitorUrl || "").trim(),
      language: selectionToApiObject({
        fieldKey: "language",
        mode: formData.languageMode,
        selectedKey: formData.language,
        customValue: formData.languageCustom,
      }),
      schema_rich_result_type: selectionToApiObject({
        fieldKey: "schema_rich_result_type",
        mode: formData.schemaTypeMode,
        selectedKey: formData.schemaType,
        customValue: formData.schemaTypeCustom,
      }),
      output_depth: selectionToApiObject({
        fieldKey: "output_depth",
        mode: "predefined",
        selectedKey: formData.outputDepth,
        customValue: "",
      }),
      output_format: selectionToApiObject({
        fieldKey: "output_format",
        mode: "predefined",
        selectedKey: formData.outputFormat,
        customValue: "",
      }),
      include_keywords: Array.isArray(formData.includeKeywords) ? formData.includeKeywords : [],
      exclude_keywords: Array.isArray(formData.excludeKeywords) ? formData.excludeKeywords : [],
      compliance_guidelines: selectionToApiObject({
        fieldKey: "compliance_guidelines",
        mode: formData.complianceGuidelinesMode,
        selectedKey: formData.complianceGuidelines,
        customValue: formData.complianceGuidelinesCustom,
      }),
      primary_text_length: selectionToApiObject({
        fieldKey: "primary_text_length",
        mode: formData.textLengthMode,
        selectedKey: formData.textLength,
        customValue: formData.textLengthCustom,
      }),
      number_of_variants: Number(variantCount) || 1,
      model: "gpt-4o-mini",
    };
  };

  const appendVariantDelta = (variantIndex, delta) => {
    const safeDelta = String(delta || "");
    if (!safeDelta) return;

    setGeneratedVariantsData((prev) => {
      const next = [...(prev?.variants || [])];
      if (!next[variantIndex]) return prev;
      next[variantIndex] = {
        ...next[variantIndex],
        content: String(next[variantIndex]?.content || "") + safeDelta,
      };
      return { ...prev, variants: next };
    });
  };

  const markVariantDone = (variantIndex) => {
    setGeneratedVariantsData((prev) => {
      const next = [...(prev?.variants || [])];
      if (!next[variantIndex]) return prev;
      next[variantIndex] = { ...next[variantIndex], is_streaming: false };
      return { ...prev, variants: next };
    });
  };

  const setVariantContent = (variantIndex, content) => {
    setGeneratedVariantsData((prev) => {
      const next = [...(prev?.variants || [])];
      if (!next[variantIndex]) return prev;
      next[variantIndex] = { ...next[variantIndex], content: String(content || "") };
      return { ...prev, variants: next };
    });
  };

  const runGenerateStream = async ({ payload, variantCount, targetVariantIndex = null }) => {
    const key = targetVariantIndex === null ? "__all__" : String(targetVariantIndex);
    let controller;

    try {
      try {
        const prev = streamAbortMapRef.current.get(key);
        prev?.abort?.();
      } catch {
      }

      controller = new AbortController();
      streamAbortMapRef.current.set(key, controller);

      if (targetVariantIndex !== null) {
        setGeneratedVariantsData((prev) => {
          const next = [...(prev?.variants || [])];
          if (!next[targetVariantIndex]) return prev;
          next[targetVariantIndex] = { ...next[targetVariantIndex], content: "", is_streaming: true };
          return { ...prev, variants: next };
        });
      }

      const res = await fetch(API.SEO_KEYWORD_GENERATE_STREAM, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: getAuthHeader(),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const contentType = String(res.headers.get("content-type") || "").toLowerCase();
      const isSse = contentType.includes("text/event-stream");

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        if (errJson && isGateError(errJson)) {
          try { showGateFromPayload(errJson); } catch {}
          try {
            setIsGenerating(false);
            setIsApiLoading(false);
            setShowVariantsModal(false);
          } catch {}
          return;
        }
        throw new Error(errJson?.message || `Failed to generate (${res.status})`);
      }

      if (!res.body) {
        const text = await res.text().catch(() => "");
        const idx = targetVariantIndex ?? 0;
        setVariantContent(idx, text);
        markVariantDone(idx);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      let activeVariant = targetVariantIndex ?? 0;

      const parsePossiblyMultipleJsonObjects = (raw) => {
        const trimmed = String(raw || "").trim();
        if (!trimmed) return [];

        try {
          return [JSON.parse(trimmed)];
        } catch {
        }

        const parts = trimmed.split(/}\s*{/);
        if (parts.length <= 1) return [];

        const objs = [];
        for (let i = 0; i < parts.length; i++) {
          const chunk = i === 0 ? `${parts[i]}}` : i === parts.length - 1 ? `{${parts[i]}` : `{${parts[i]}}`;
          try {
            objs.push(JSON.parse(chunk));
          } catch {
          }
        }
        return objs;
      };

      const handleParsedObject = (obj) => {
        if (!obj || typeof obj !== "object") return;

        // Subscription gating via SSE
        if (obj.type === 'error' && isGateError(obj)) {
          try {
            if (obj.trial_credits_remaining != null) {
              const t = Number(obj.trial_credits_remaining);
              if (!Number.isNaN(t)) setTrialRemaining?.(t);
            }
          } catch {}
          try { fetchCredits?.(); } catch {}
          try { showGateFromPayload(obj); } catch {}
          try { controller?.abort?.(); } catch {}
          try {
            setIsGenerating(false);
            setIsApiLoading(false);
            setShowVariantsModal(false);
          } catch {}
          return;
        }

        const idxRaw = obj.variant_index ?? obj.variantIndex ?? obj.variant_number ?? obj.variantNumber;
        const idx = idxRaw !== undefined && idxRaw !== null ? Number(idxRaw) : activeVariant;
        const safeIdx = Number.isFinite(idx) ? idx : activeVariant;

        if (obj.type === "meta") {
          try {
            if (obj.trial_credits_remaining != null) {
              const t = Number(obj.trial_credits_remaining);
              if (!Number.isNaN(t)) setTrialRemaining?.(t);
            }
          } catch {}
          return;
        }

        if (obj.type === "delta" && typeof obj.content === "string") {
          appendVariantDelta(safeIdx, obj.content);
          return;
        }

        if (obj.type === "done") {
          if (typeof obj.content === "string") setVariantContent(safeIdx, obj.content);
          markVariantDone(safeIdx);
          return;
        }

        const delta =
          obj.delta ??
          obj.content_delta ??
          obj.text_delta ??
          obj.message_delta ??
          obj?.choices?.[0]?.delta?.content ??
          obj?.choices?.[0]?.delta?.text;

        const full =
          obj.content ??
          obj.text ??
          obj.message ??
          obj?.choices?.[0]?.message?.content ??
          obj?.choices?.[0]?.text;

        if (typeof delta === "string") {
          appendVariantDelta(safeIdx, delta);
        } else if (typeof full === "string") {
          setVariantContent(safeIdx, full);
        }

        if (obj.done === true || obj.is_done === true || obj.event === "done" || obj.event === "completed") {
          markVariantDone(safeIdx);
        }

        if (obj.event === "variant_end" || obj.done_variant === true) {
          markVariantDone(safeIdx);
          if (targetVariantIndex === null) {
            activeVariant = Math.min(variantCount - 1, safeIdx + 1);
          }
        }
      };

      const handleTextDelta = (text) => {
        const safe = String(text || "");
        if (!safe) return;
        appendVariantDelta(activeVariant, safe);
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        if (isSse) {
          const parts = buffer.split(/\n\n/);
          buffer = parts.pop() || "";

          for (const part of parts) {
            const lines = part.split(/\n/);
            const dataLines = lines
              .map((l) => l.trim())
              .filter((l) => l.startsWith("data:"))
              .map((l) => l.replace(/^data:\s?/, ""));

            if (dataLines.length === 0) continue;
            const data = dataLines.join("\n");
            if (data === "[DONE]" || data === "DONE") {
              if (targetVariantIndex === null) {
                for (let i = 0; i < variantCount; i++) markVariantDone(i);
              } else {
                markVariantDone(targetVariantIndex);
              }
              return;
            }

            const asJson = (() => {
              try {
                return JSON.parse(data);
              } catch {
                return null;
              }
            })();

            if (asJson) {
              handleParsedObject(asJson);
              continue;
            }

            const multi = parsePossiblyMultipleJsonObjects(data);
            if (multi.length > 0) {
              multi.forEach(handleParsedObject);
            } else {
              handleTextDelta(data);
            }
          }
        } else {
          const lines = buffer.split(/\n/);
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = String(line || "").trim();
            if (!trimmed) continue;

            const asJson = (() => {
              try {
                return JSON.parse(trimmed);
              } catch {
                return null;
              }
            })();

            if (asJson) {
              handleParsedObject(asJson);
              continue;
            }

            const multi = parsePossiblyMultipleJsonObjects(trimmed);
            if (multi.length > 0) {
              multi.forEach(handleParsedObject);
            } else {
              handleTextDelta(trimmed + "\n");
            }
          }
        }
      }

      if (buffer.trim()) {
        const asJson = (() => {
          try {
            return JSON.parse(buffer.trim());
          } catch {
            return null;
          }
        })();

        if (asJson) {
          handleParsedObject(asJson);
        } else {
          const multi = parsePossiblyMultipleJsonObjects(buffer);
          if (multi.length > 0) multi.forEach(handleParsedObject);
          else handleTextDelta(buffer);
        }
      }

      if (targetVariantIndex === null) {
        for (let i = 0; i < variantCount; i++) markVariantDone(i);
      } else {
        markVariantDone(targetVariantIndex);
      }
    } catch (err) {
      if (targetVariantIndex !== null) {
        markVariantDone(targetVariantIndex);
      }
      throw err;
    } finally {
      if (controller && streamAbortMapRef.current.get(key) === controller) {
        streamAbortMapRef.current.delete(key);
      }
    }
  };

  const addTag = (key, rawValue) => {
    const next = String(rawValue || "").trim();
    if (!next) return;

    setFormData((prev) => {
      const list = Array.isArray(prev[key]) ? prev[key] : [];
      if (list.includes(next)) return prev;
      return { ...prev, [key]: [...list, next] };
    });
  };

  const removeTag = (key, value) => {
    setFormData((prev) => {
      const list = Array.isArray(prev[key]) ? prev[key] : [];
      return { ...prev, [key]: list.filter((x) => x !== value) };
    });
  };

  const getModeValue = (modeKey, valueKey, customKey) => {
    if (formData[modeKey] === "custom") return String(formData[customKey] || "").trim();
    return String(formData[valueKey] || "").trim();
  };

  const fallbackFieldOptions = useMemo(() => {
    const toObj = (v) => ({ id: null, key: v, label: v });
    return {
      page_goal_intent: [
        "Inform / Educate",
        "Promote a Product or Service",
        "Generate Lead",
        "E-commerce",
        "Blog or News Content",
        "Portfolio",
        "Landing Page",
        "Brand Awareness / Company Intro",
      ].map(toObj),
      tone: [
        "Professional / Corporate",
        "Friendly / Conversational",
        "Inspirational / Motivational",
        "Playful / Creative",
        "Luxury / Premium",
        "Informative / Educational",
        "Empathetic / Caring",
        "Bold / Confident",
        "Calm / Neutral",
        "Witty / Clever",
        "Authoritative / Expert",
        "Storytelling / Narrative",
        "Inclusive / Community Tone",
      ].map(toObj),
      keyword_focus_type: ["Short-Tail", "Long-Tail", "Mixed / Balanced", "Branded Keywords", "Competitor-Focused"].map(toObj),
      search_volume_priority: ["High Volume", "Moderate / Balanced", "Niche / Low Volume", "Auto-Detect"].map(toObj),
      meta_title_style: [
        "Informational",
        "Benefit-Driven",
        "Question-Based",
        "Curiosity-Driven",
        "Numeric Hook",
        "Brand Mix",
        "Localized",
        "Auto-Detect",
      ].map(toObj),
      language: ["English", "Hindi", "Spanish", "French", "German", "Italian", "Portuguese", "Japanese", "Arabic", "Other (Custom Input)"].map(toObj),
      schema_rich_result_type: [
        "None",
        "Article / BlogPosting",
        "Product",
        "SoftwareApplication",
        "Organization / LocalBusiness",
        "FAQPage",
        "HowTo",
        "Event",
        "Review",
        "BreadcrumbList",
        "VideoObject",
        "WebPage (CollectionPage)",
      ].map(toObj),
      output_depth: ["Basic", "Extended", "Professional"].map(toObj),
      output_format: [
        "On-Screen Preview",
        "Plain Text Copy",
        "CSV Export",
        "JSON (API-Ready)",
        "Google Sheet / Excel Sync",
        "Email Export",
      ].map(toObj),
      compliance_guidelines: ["None", "General", "Healthcare", "Finance", "Legal", "Education", "E-commerce", "Custom"].map(toObj),
      primary_text_length: [
        { id: null, key: "short", label: "Short" },
        { id: null, key: "medium", label: "Medium" },
        { id: null, key: "long", label: "Long" },
      ],
    };
  }, []);

  const [fieldOptions, setFieldOptions] = useState(fallbackFieldOptions);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);

  const getLabelFromOptions = (fieldKey, selectedKey) => {
    const list = fieldOptions?.[fieldKey] || [];
    const found = list.find((o) => String(o?.key) === String(selectedKey));
    return found?.label || selectedKey || "";
  };

  const getDefaultKeyFromOptions = (fieldKey, fallback = "") => {
    const list = fieldOptions?.[fieldKey] || [];
    return (list[0] && list[0].key) ? String(list[0].key) : fallback;
  };

  const normalizeOptionsOnce = (list) => {
    const arr = Array.isArray(list) ? list : [];
    const normalized = arr
      .slice()
      .sort((a, b) => Number(a?.sort_order || 0) - Number(b?.sort_order || 0))
      .map((opt) => ({
        id: opt?.id ?? null,
        key: opt?.key ?? opt?.label ?? "",
        label: opt?.label ?? String(opt?.key ?? ""),
      }))
      .filter((opt) => String(opt.key || "").trim().length > 0);
    return normalized;
  };

  useEffect(() => {
    let cancelled = false;
    const fetchOptions = async () => {
      setIsOptionsLoading(true);
      try {
        const res = await fetch(API.SEO_KEYWORD_OPTIONS, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: getAuthHeader(),
          },
        });

        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.message || `Failed to fetch options (${res.status})`);
        if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to fetch options");

        const data = json?.data || {};
        const next = {
          ...fallbackFieldOptions,
          page_goal_intent: normalizeOptionsOnce(data.page_goal_intent) || fallbackFieldOptions.page_goal_intent,
          tone: normalizeOptionsOnce(data.tone) || fallbackFieldOptions.tone,
          keyword_focus_type: normalizeOptionsOnce(data.keyword_focus_type) || fallbackFieldOptions.keyword_focus_type,
          search_volume_priority: normalizeOptionsOnce(data.search_volume_priority) || fallbackFieldOptions.search_volume_priority,
          meta_title_style: normalizeOptionsOnce(data.meta_title_style) || fallbackFieldOptions.meta_title_style,
          language: normalizeOptionsOnce(data.language) || fallbackFieldOptions.language,
          schema_rich_result_type: normalizeOptionsOnce(data.schema_rich_result_type) || fallbackFieldOptions.schema_rich_result_type,
          output_depth: normalizeOptionsOnce(data.output_depth) || fallbackFieldOptions.output_depth,
          output_format: normalizeOptionsOnce(data.output_format) || fallbackFieldOptions.output_format,
          compliance_guidelines: normalizeOptionsOnce(data.compliance_guidelines) || fallbackFieldOptions.compliance_guidelines,
          primary_text_length: normalizeOptionsOnce(data.primary_text_length)?.length
            ? normalizeOptionsOnce(data.primary_text_length).filter((opt) => {
                const key = String(opt?.key || '').toLowerCase();
                const label = String(opt?.label || '').toLowerCase();
                return key !== 'auto' && label !== 'auto' && label !== 'auto-detect';
              })
            : fallbackFieldOptions.primary_text_length,
        };

        if (!cancelled) {
          setFieldOptions(next);

          setFormData((prev) => ({
            ...prev,
            pageGoal: prev.pageGoal || next.page_goal_intent?.[0]?.key || "",
            tone: prev.tone || next.tone?.[0]?.key || "",
            keywordFocusType: prev.keywordFocusType || next.keyword_focus_type?.[0]?.key || "",
            searchVolumePriority: prev.searchVolumePriority || next.search_volume_priority?.[0]?.key || "",
            metaTitleStyle: prev.metaTitleStyle || next.meta_title_style?.[0]?.key || "",
            language: prev.language || next.language?.[0]?.key || "",
            schemaType: prev.schemaType || next.schema_rich_result_type?.[0]?.key || "",
            outputDepth: prev.outputDepth || next.output_depth?.[0]?.key || "",
            outputFormat: prev.outputFormat || next.output_format?.[0]?.key || "",
            complianceGuidelines: prev.complianceGuidelines || next.compliance_guidelines?.[0]?.key || "",
            textLength: prev.textLength || next.primary_text_length?.[0]?.key || "short",
          }));
        }
      } catch (err) {
        if (!cancelled) {
          showToast(err?.message || "Failed to load dropdown options", "error");
        }
      } finally {
        if (!cancelled) setIsOptionsLoading(false);
      }
    };

    fetchOptions();
    return () => {
      cancelled = true;
    };
  }, [fallbackFieldOptions]);

  const inputsForReview = useMemo(() => {
    return {
      ...formData,
      pageGoal:
        formData.pageGoalMode === "custom"
          ? String(formData.pageGoalCustom || "").trim()
          : getLabelFromOptions("page_goal_intent", formData.pageGoal),
      tone: formData.toneMode === "custom" ? String(formData.toneCustom || "").trim() : getLabelFromOptions("tone", formData.tone),
      keywordFocusType:
        formData.keywordFocusTypeMode === "custom"
          ? String(formData.keywordFocusTypeCustom || "").trim()
          : getLabelFromOptions("keyword_focus_type", formData.keywordFocusType),
      metaTitleStyle:
        formData.metaTitleStyleMode === "custom"
          ? String(formData.metaTitleStyleCustom || "").trim()
          : getLabelFromOptions("meta_title_style", formData.metaTitleStyle),
      searchVolumePriority: getLabelFromOptions("search_volume_priority", formData.searchVolumePriority),
      language:
        formData.languageMode === "custom" ? String(formData.languageCustom || "").trim() : getLabelFromOptions("language", formData.language),
      schemaType:
        formData.schemaTypeMode === "custom"
          ? String(formData.schemaTypeCustom || "").trim()
          : getLabelFromOptions("schema_rich_result_type", formData.schemaType),
      outputDepth: getLabelFromOptions("output_depth", formData.outputDepth),
      outputFormat: getLabelFromOptions("output_format", formData.outputFormat),
      complianceGuidelines:
        formData.complianceGuidelinesMode === "custom"
          ? String(formData.complianceGuidelinesCustom || "").trim()
          : getLabelFromOptions("compliance_guidelines", formData.complianceGuidelines),
      textLength:
        formData.textLengthMode === "custom" ? String(formData.textLengthCustom || "").trim() : getLabelFromOptions("primary_text_length", formData.textLength),
      variantsCount: clamp(Number(formData.variantsCount) || 1, 1, 5),
      keywordDifficulty: clamp(Number(formData.keywordDifficulty) || 0, 0, 100),
      pageGoalKey: formData.pageGoal,
      toneKey: formData.tone,
      keywordFocusTypeKey: formData.keywordFocusType,
      searchVolumePriorityKey: formData.searchVolumePriority,
      metaTitleStyleKey: formData.metaTitleStyle,
      languageKey: formData.language,
      schemaTypeKey: formData.schemaType,
      outputDepthKey: formData.outputDepth,
      outputFormatKey: formData.outputFormat,
      complianceGuidelinesKey: formData.complianceGuidelines,
      textLengthKey: formData.textLength,
    };
  }, [formData, fieldOptions]);

  const validateForm = () => {
    const missing = [];
    if (!String(formData.pageTopicSummary || "").trim()) missing.push("Page Topic / Content Summary");
    if (!String(inputsForReview.pageGoal || "").trim()) missing.push("Page Goal / Intent");
    if (!Array.isArray(formData.targetAudience) || formData.targetAudience.length === 0) missing.push("Target Audience / Region");
    if (!inputsForReview.tone) missing.push("Tone");
    if (!inputsForReview.keywordFocusType) missing.push("Keyword Focus Type");
    if (Number.isNaN(Number(inputsForReview.keywordDifficulty))) missing.push("Keyword Difficulty Preference");
    if (!String(formData.searchVolumePriority || "").trim()) missing.push("Search Volume Priority");
    if (!String(inputsForReview.textLength || "").trim()) missing.push("Text Length");
    if (Number.isNaN(Number(inputsForReview.variantsCount)) || Number(inputsForReview.variantsCount) < 1) missing.push("Number of Variants");
    return missing;
  };

  const buildVariantOutput = ({ variantNumber, inputs }) => {
    const topic = String(inputs.pageTopicSummary || "").trim();
    const base = topic.split(/\s+/).filter(Boolean).slice(0, 8).join(" ");

    const brand = String(inputs.brandName || "").trim();
    const brandSuffix = brand ? ` | ${brand}` : "";

    const include = Array.isArray(inputs.includeKeywords) ? inputs.includeKeywords : [];
    const exclude = Array.isArray(inputs.excludeKeywords) ? inputs.excludeKeywords : [];

    const metaTitle = `${base}${brandSuffix}`.slice(0, 60);

    const audience = (inputs.targetAudience || []).slice(0, 4).join(", ") || "General";
    const metaDescription = (`(${inputs.tone}) ${inputs.pageGoal}. Keyword focus: ${inputs.keywordFocusType}. Audience: ${audience}.`).slice(0, 160);

    const keywordSeeds = [base, `${base} guide`, `${base} tips`, `best ${base}`, `${inputs.pageGoal} ${base}`].filter(Boolean);
    const keywords = [...include, ...keywordSeeds].filter(Boolean).slice(0, 12);

    return (
      `SEO Keyword & Meta Tag Generator — Variant ${variantNumber}\n` +
      `===========================================\n\n` +
      `PAGE CONTEXT\n` +
      `- Topic: ${topic}\n` +
      `- Intent: ${inputs.pageGoal}\n` +
      `- Audience/Region: ${(inputs.targetAudience || []).join(", ") || "General"}\n\n` +
      `STRATEGY\n` +
      `- Tone: ${inputs.tone}\n` +
      `- Keyword focus: ${inputs.keywordFocusType}\n` +
      `- Difficulty preference: ${inputs.keywordDifficulty}/100\n` +
      `- Search volume priority: ${inputs.searchVolumePriority}\n` +
      `- Language: ${inputs.language || "English"}\n` +
      `- Schema type: ${inputs.schemaType || "None"}\n\n` +
      `META TAGS\n` +
      `- Meta title: ${metaTitle}\n` +
      `- Meta description: ${metaDescription}\n\n` +
      `KEYWORD CLUSTER\n` +
      `${keywords.map((k) => `- ${k}`).join("\n")}\n\n` +
      (exclude.length ? `EXCLUDE\n${exclude.map((k) => `- ${k}`).join("\n")}\n\n` : "") +
      `OUTPUT SETTINGS\n` +
      `- Output depth: ${inputs.outputDepth || "Professional"}\n` +
      `- Output format: ${inputs.outputFormat || "On-Screen Preview"}\n` +
      `- Text length: ${inputs.textLength || "Auto"}\n\n` +
      `NOTE\n` +
      `- Backend API wiring pending for real generation/streaming.\n`
    );
  };

  const startSimulatedStreaming = ({ inputs, count }) => {
    clearTimers();

    const placeholders = Array.from({ length: count }).map((_, i) => ({
      id: `seo-variant-${Date.now()}-${i}`,
      content: "",
      show_variant: true,
      is_streaming: true,
    }));

    setGeneratedVariantsData({ variants: placeholders, inputs });

    placeholders.forEach((_, variantIndex) => {
      const fullText = buildVariantOutput({ variantNumber: variantIndex + 1, inputs });
      let cursor = 0;

      const interval = setInterval(() => {
        cursor += 30;
        setGeneratedVariantsData((prev) => {
          const next = [...(prev?.variants || [])];
          if (!next[variantIndex]) return prev;
          next[variantIndex] = { ...next[variantIndex], content: fullText.slice(0, cursor) };
          return { ...prev, variants: next };
        });

        if (cursor >= fullText.length) {
          clearInterval(interval);
          setGeneratedVariantsData((prev) => {
            const next = [...(prev?.variants || [])];
            if (!next[variantIndex]) return prev;
            next[variantIndex] = { ...next[variantIndex], is_streaming: false };
            return { ...prev, variants: next };
          });
        }
      }, 35);

      timersRef.current.push(interval);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const missing = validateForm();
    if (missing.length > 0) {
      showToast(`Please fill all required fields: ${missing.join(", ")}`, "error");
      return;
    }

    setShowSummary(true);
  };

  const handleGenerate = async () => {
    try { fetchCredits?.(); } catch {}
    const missing = validateForm();
    if (missing.length > 0) {
      showToast(`Please fill all required fields: ${missing.join(", ")}`, "error");
      return;
    }

    sessionRequestIdRef.current = createSessionRequestId();

    const count = clamp(Number(inputsForReview.variantsCount) || 1, 1, 5);

    setShowVariantsModal(true);

    setShowSummary(false);

    setIsApiLoading(false);
    setIsGenerating(true);

    try {
      const placeholders = Array.from({ length: count }).map((_, i) => ({
        id: `seo-variant-${Date.now()}-${i}`,
        content: "",
        show_variant: true,
        is_streaming: true,
      }));

      setGeneratedVariantsData({
        variants: placeholders,
        inputs: {
          ...inputsForReview,
          session_request_id: sessionRequestIdRef.current,
        },
      });

      const tasks = Array.from({ length: count }).map((_, i) => {
        const payload = {
          ...buildGeneratePayload(1),
          session_request_id: sessionRequestIdRef.current,
        };
        return runGenerateStream({ payload, variantCount: 1, targetVariantIndex: i });
      });

      const results = await Promise.allSettled(tasks);
      const failed = results.filter((r) => r.status === "rejected" && String(r.reason?.name || "").toLowerCase() !== "aborterror");
      const aborted = results.some((r) => r.status === "rejected" && String(r.reason?.name || "").toLowerCase() === "aborterror");

      if (aborted) {
        showToast("Generation cancelled.", "info");
        return;
      }

      if (failed.length > 0) {
        showToast("Some variants failed to generate.", "error");
        return;
      }

      showToast("SEO variants generation completed.", "success");
    } catch (err) {
      if (String(err?.name || "").toLowerCase() === "aborterror") {
        showToast("Generation cancelled.", "info");
        return;
      }
      showToast(err?.message || "Failed to generate SEO variants", "error");
      setShowVariantsModal(false);
    } finally {
      setIsApiLoading(false);
      setIsGenerating(false);
      try { fetchCredits?.(); } catch {}
    }
  };

  const handleRequestRegenerate = async (variantId) => {
    const variants = Array.isArray(generatedVariantsData?.variants) ? generatedVariantsData.variants : [];
    const idx = variants.findIndex((v) => v?.id === variantId);

    if (idx < 0) {
      showToast("Unable to regenerate: variant not found.", "error");
      return;
    }

    if (!sessionRequestIdRef.current) {
      sessionRequestIdRef.current = createSessionRequestId();
    }

    const payload = {
      ...buildGeneratePayload(1),
      session_request_id: sessionRequestIdRef.current,
    };

    setIsApiLoading(false);
    setIsGenerating(true);
    try {
      await runGenerateStream({ payload, variantCount: 1, targetVariantIndex: idx });
    } catch (err) {
      if (String(err?.name || "").toLowerCase() !== "aborterror") {
        showToast(err?.message || "Failed to regenerate variant", "error");
      }
    } finally {
      setIsApiLoading(false);
      setIsGenerating(false);
    }
  };

  const handleCloseVariantsModal = () => {
    clearTimers();
    abortAllStreams();
    setShowVariantsModal(false);
    setIsApiLoading(false);
    setIsGenerating(false);
  };

  const handleReset = () => {
    clearTimers();

    abortAllStreams();

    setAudienceInput("");
    setIncludeKeywordInput("");
    setExcludeKeywordInput("");

    setShowAudienceSuggestions(false);
    setShowIncludeKeywordSuggestions(false);
    setShowExcludeKeywordSuggestions(false);

    setShowAdvanced(false);

    setShowSummary(false);
    setShowVariantsModal(false);
    setGeneratedVariantsData({ variants: [], inputs: {} });

    setFormData({
      pageTopicSummary: "",
      pageGoal: getDefaultKeyFromOptions("page_goal_intent", ""),
      pageGoalMode: "predefined",
      pageGoalCustom: "",
      targetAudience: [],

      toneMode: "predefined",
      tone: getDefaultKeyFromOptions("tone", ""),
      toneCustom: "",

      keywordFocusTypeMode: "predefined",
      keywordFocusType: getDefaultKeyFromOptions("keyword_focus_type", ""),
      keywordFocusTypeCustom: "",

      keywordDifficulty: 40,
      searchVolumePriority: getDefaultKeyFromOptions("search_volume_priority", ""),

      metaTitleStyleMode: "predefined",
      metaTitleStyle: getDefaultKeyFromOptions("meta_title_style", ""),
      metaTitleStyleCustom: "",

      brandName: "",
      competitorUrl: "",

      languageMode: "predefined",
      language: getDefaultKeyFromOptions("language", ""),
      languageCustom: "",

      schemaTypeMode: "predefined",
      schemaType: getDefaultKeyFromOptions("schema_rich_result_type", ""),
      schemaTypeCustom: "",

      outputDepth: getDefaultKeyFromOptions("output_depth", ""),
      outputFormat: getDefaultKeyFromOptions("output_format", ""),

      includeKeywords: [],
      excludeKeywords: [],

      complianceGuidelinesMode: "predefined",
      complianceGuidelines: getDefaultKeyFromOptions("compliance_guidelines", ""),
      complianceGuidelinesCustom: "",

      textLengthMode: "predefined",
      textLength: getDefaultKeyFromOptions("primary_text_length", "short"),
      textLengthCustom: "",

      variantsCount: 3,
    });

    showToast("Form has been reset", "info");
  };

  const styles = {
    container: {
      maxWidth: '1100px',
      margin: "0 auto",
      padding: "10px",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      backgroundColor: "#0a0e1a",
      minHeight: "100vh",
    },
    card: {
      backgroundColor: "#141b2d",
      borderRadius: "12px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
      overflow: "hidden",
      border: "1px solid #1e293b",
    },
    header: {
      padding: "24px 32px",
    },
    title: {
      margin: 0,
      fontSize: "24px",
      fontWeight: "600",
      color: "#f8fafc",
    },
    subtitle: {
      margin: "6px 0 0",
      fontSize: "15px",
      color: "#94a3b8",
    },
    // formGroup: { marginBottom: "20px" },
    label: {
      display: "block",
      marginBottom: "6px",
      fontSize: "16px",
      fontWeight: "500",
      color: "#e2e8f0",
    },
    input: {
      width: "100%",
      padding: "10px 14px",
      fontSize: "14px",
      lineHeight: "1.5",
      color: "#e2e8f0",
      backgroundColor: "#1e293b",
      border: "1px solid #334155",
      borderRadius: "6px",
      transition: "all 0.15s ease-in-out",
      boxSizing: "border-box",
    },
    select: {
      width: "100%",
      height: "42px",
      padding: "10px 14px",
      fontSize: "14px",
      lineHeight: "1.5",
      color: "#e2e8f0",
      backgroundColor: "#1e293b",
      border: "1px solid #334155",
      borderRadius: "6px",
      transition: "all 0.15s ease-in-out",
      boxSizing: "border-box",
      appearance: "none",
      backgroundImage:
        "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 10px center",
      backgroundSize: "20px",
      paddingRight: "40px",
      cursor: "pointer",
    },
    textarea: {
      width: "100%",
      padding: "10px 14px",
      fontSize: "14px",
      lineHeight: "1.5",
      color: "#e2e8f0",
      backgroundColor: "#1e293b",
      border: "1px solid #334155",
      borderRadius: "6px",
      transition: "all 0.15s ease-in-out",
      boxSizing: "border-box",
      resize: "vertical",
      minHeight: "80px",
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "6px 12px",
      fontSize: "13px",
      fontWeight: "500",
      borderRadius: "6px",
      gap: "6px",
    },
    badgePrimary: { backgroundColor: "#3b82f6", color: "white" },
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
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
    },
    btnOutline: { backgroundColor: "transparent", color: "#94a3b8", border: "1px solid #334155" },
    removeBtn: {
      background: "rgba(255,255,255,0.2)",
      border: "none",
      color: "white",
      width: "18px",
      height: "18px",
      borderRadius: "50%",
      cursor: "pointer",
      fontSize: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 0,
    },
    rangeInput: { width: "100%", height: "6px", borderRadius: "3px", background: "#334155", outline: "none" },
    radioGroup: { display: "flex", gap: "16px", marginTop: "8px" },
    radioItem: { display: "flex", alignItems: "center", gap: "8px", color: "#e2e8f0" },
    infoIcon: {
      display: "inline-block",
      width: "16px",
      height: "16px",
      borderRadius: "50%",
      backgroundColor: "#3b82f6",
      color: "white",
      textAlign: "center",
      lineHeight: "16px",
      fontSize: "11px",
      cursor: "help",
      marginLeft: "6px",
    },
    toolTip: {
      width: "40%",
    },
    toast: {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "16px 24px",
      color: "white",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 9999,
    },
  };

  const Toast = () => {
    if (!notification.show) return null;

    return (
      <div
        style={{
          ...styles.toast,
          backgroundColor: notification.type === "error" ? "#fef2f2" : "#f0fdf4",
          border: `1px solid ${notification.type === "error" ? "#fecaca" : "#bbf7d0"}`,
          color: notification.type === "error" ? "#b91c1c" : "#166534",
        }}
      >
        {notification.message}
        <button
          onClick={() => setNotification((p) => ({ ...p, show: false }))}
          style={{ background: "none", border: "none", color: "inherit", marginLeft: "10px", cursor: "pointer", fontSize: "18px" }}
        >
          &times;
        </button>
      </div>
    );
  };

  const renderTagInput = ({
    label,
    required,
    valueKey,
    inputValue,
    setInputValue,
    help,
    suggestions,
    showSuggestions,
    setShowSuggestions,
  }) => {
    const tags = Array.isArray(formData[valueKey]) ? formData[valueKey] : [];
    const suggestionMap = suggestions && typeof suggestions === "object" ? suggestions : {};
    const flatSuggestions = Object.values(suggestionMap).flat();

    return (
      <div className="col-12 col-md-6">
        <div style={styles.formGroup}>
          <label style={styles.label}>
            {label} {required ? <span style={{ color: "#ef4444" }}>*</span> : null}
            {help ? (
              <span style={styles.infoIcon} data-tooltip-id={makeTooltipId(label)} data-tooltip-content={help}>
                i
              </span>
            ) : null}
          </label>

          {help ? <Tooltip style={styles.toolTip} id={makeTooltipId(label)} /> : null}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "8px",
              minHeight: "40px",
              alignItems: "center",
              padding: "4px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              backgroundColor: tags.length > 0 ? "#f9fafb" : "white",
            }}
          >
            {tags.length === 0 && (
              <span style={{ color: "#9ca3af", fontSize: "14px", marginLeft: "8px" }}>Type and press Enter to add tags</span>
            )}
            {tags.map((chip, index) => (
              <span
                key={index}
                style={{
                  ...styles.badge,
                  ...styles.badgePrimary,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                }}
              >
                {chip}
                <RemoveTagButton style={styles.removeBtn} onClick={() => removeTag(valueKey, chip)} />
              </span>
            ))}
          </div>

          <div style={{ position: "relative" }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                const val = e.target.value;
                setInputValue(val);
                setShowSuggestions?.(String(val || "").trim().length > 0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && String(inputValue || "").trim()) {
                  e.preventDefault();
                  addTag(valueKey, String(inputValue || "").trim());
                  setInputValue("");
                  setShowSuggestions?.(false);
                }
              }}
              onBlur={() => {
                if (String(inputValue || "").trim()) {
                  addTag(valueKey, String(inputValue || "").trim());
                  setInputValue("");
                  setShowSuggestions?.(false);
                }
              }}
              style={{
                ...styles.input,
                marginBottom: 0,
                borderBottomLeftRadius: showSuggestions ? "0" : "6px",
                borderBottomRightRadius: showSuggestions ? "0" : "6px",
              }}
              placeholder={tags.length === 0 ? "Type and press Enter to add" : "Type and press Enter to add another"}
              required={required && tags.length === 0}
              inputMode="text"
            />

            {showSuggestions && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "white",
                  border: "1px solid #d1d5db",
                  borderTop: "none",
                  borderBottomLeftRadius: "6px",
                  borderBottomRightRadius: "6px",
                  zIndex: 1000,
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {Object.entries(suggestionMap).map(([category, list]) => {
                  const filtered = (Array.isArray(list) ? list : []).filter(
                    (s) => String(s).toLowerCase().includes(String(inputValue || "").toLowerCase()) && !tags.includes(s)
                  );

                  if (filtered.length === 0) return null;

                  return (
                    <div key={category}>
                      <div
                        style={{
                          padding: "8px 12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#4b5563",
                          backgroundColor: "#f3f4f6",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {category}
                      </div>
                      {filtered.map((suggestion, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            addTag(valueKey, suggestion);
                            setInputValue("");
                            setShowSuggestions?.(false);
                          }}
                          style={{ padding: "8px 16px", cursor: "pointer" }}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  );
                })}

                {String(inputValue || "").trim() &&
                  !flatSuggestions.some((s) => String(s).toLowerCase() === String(inputValue || "").trim().toLowerCase()) && (
                    <div
                      onClick={() => {
                        addTag(valueKey, String(inputValue || "").trim());
                        setInputValue("");
                        setShowSuggestions?.(false);
                      }}
                      style={{
                        padding: "8px 16px",
                        cursor: "pointer",
                        backgroundColor: "#f8fafc",
                        borderTop: "1px solid #e5e7eb",
                        color: "#3b82f6",
                        fontWeight: 500,
                      }}
                    >
                      Add **"{String(inputValue || "").trim()}"** as custom
                    </div>
                  )}
              </div>
            )}
          </div>

          {help ? <div style={{ marginTop: "8px", fontSize: "12px", color: "#94a3b8" }}>{help}</div> : null}
        </div>
      </div>
    );
  };

  return (
    <>
      <Toast />

      <div style={styles.container} className="seo-keyword-meta-form">
         <div style={styles.header}>
            <h2 style={styles.title}>SEO Keyword & Meta Tag Generator</h2>
            <p style={styles.subtitle}>Generate keyword clusters, meta tags, and schema guidance for your page.</p>
          </div>
        <div style={styles.card}>
         

          <div style={{ padding: "32px" }}>
            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                {!showAdvanced && (
                  <>
                    <div className="col-12">
                      <div style={styles.formGroup}>
                        <label style={styles.label}>
                          Page Topic / Content Summary <span style={{ color: "#ef4444" }}>*</span>
                          <span
                            style={styles.infoIcon}
                            data-tooltip-id="pageTopicSummary-tooltip"
                            data-tooltip-content="Brief semantic summary so AI can infer keyword themes."
                          >
                            i
                          </span>
                        </label>
                        <Tooltip style={styles.toolTip} id="pageTopicSummary-tooltip" />
                        <textarea
                          value={formData.pageTopicSummary}
                          onChange={(e) => setFormData((p) => ({ ...p, pageTopicSummary: e.target.value }))}
                          placeholder="Brief semantic summary so AI can infer keyword themes"
                          required
                          style={styles.textarea}
                        />
                        {/* <div style={{ marginTop: "8px", fontSize: "12px", color: "#94a3b8" }}>
                          Brief semantic summary so AI can infer keyword themes.
                        </div> */}
                      </div>
                    </div>

                    <Labeled label="Page Goal / Intent" required help="Defines objective of the page for SEO targeting." styles={styles}>
                      <div style={styles.radioGroup}>
                        <label style={styles.radioItem}>
                          <input
                            type="radio"
                            name="pageGoalMode"
                            value="predefined"
                            checked={formData.pageGoalMode === "predefined"}
                            onChange={() => setFormData((p) => ({ ...p, pageGoalMode: "predefined" }))}
                          />
                          <span>Predefined</span>
                        </label>
                        <label style={styles.radioItem}>
                          <input
                            type="radio"
                            name="pageGoalMode"
                            value="custom"
                            checked={formData.pageGoalMode === "custom"}
                            onChange={() => setFormData((p) => ({ ...p, pageGoalMode: "custom" }))}
                          />
                          <span>Custom</span>
                        </label>
                      </div>

                      {formData.pageGoalMode === "predefined" ? (
                        <select
                          style={{ ...styles.select,marginTop: "8px" }}
                          value={formData.pageGoal}
                          onChange={(e) => setFormData((p) => ({ ...p, pageGoal: e.target.value }))}
                          required
                        >
                          <option value="">Select goal</option>
                          {(fieldOptions?.page_goal_intent || []).map((opt) => (
                            <option key={opt.key} value={opt.key}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          style={{ ...styles.input, marginTop: "12px" }}
                          value={formData.pageGoalCustom}
                          onChange={(e) => setFormData((p) => ({ ...p, pageGoalCustom: e.target.value }))}
                          placeholder="Describe your custom page goal / intent"
                          required
                        />
                      )}
                    </Labeled>

                    <PredefinedCustom
                      label="Tone"
                      required
                      modeKey="toneMode"
                      valueKey="tone"
                      customKey="toneCustom"
                      options={fieldOptions?.tone || []}
                      placeholder="Enter custom tone"
                      help="Narration/writing style for meta & keyword strategy."
                      formData={formData}
                      setFormData={setFormData}
                      styles={styles}
                    />

                    <PredefinedCustom
                      label="Keyword Focus Type"
                      required
                      modeKey="keywordFocusTypeMode"
                      valueKey="keywordFocusType"
                      customKey="keywordFocusTypeCustom"
                      options={fieldOptions?.keyword_focus_type || []}
                      placeholder="Enter custom focus type"
                      help="Granularity & clustering strategy for keywords."
                      formData={formData}
                      setFormData={setFormData}
                      styles={styles}
                    />

                    <PredefinedCustom
                      label="Text Length"
                      required
                      modeKey="textLengthMode"
                      valueKey="textLength"
                      customKey="textLengthCustom"
                      options={fieldOptions?.primary_text_length || []}
                      placeholder="Enter text length (1-500)"
                      help="Text length preference."
                      customInputProps={{ type: "number", min: 1, max: 500, step: 1 }}
                      formData={formData}
                      setFormData={setFormData}
                      styles={styles}
                    />

                    <Labeled
                      label="Keyword Difficulty Preference (0–100)"
                      required
                      help="Competitiveness of keyword suggestions (0–100)."
                      styles={styles}
                    >
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={formData.keywordDifficulty}
                        onChange={(e) => setFormData((p) => ({ ...p, keywordDifficulty: Number(e.target.value) }))}
                        style={styles.rangeInput}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#94a3b8" }}>
                        <span>0</span>
                        <span>{formData.keywordDifficulty}</span>
                        <span>100</span>
                      </div>
                    </Labeled>

                    <Labeled label="Search Volume Priority" required help="Traffic potential bias for keyword mix." styles={styles}>
                      <select
                        style={styles.select}
                        value={formData.searchVolumePriority}
                        onChange={(e) => setFormData((p) => ({ ...p, searchVolumePriority: e.target.value }))}
                        required
                      >
                        {(fieldOptions?.search_volume_priority || []).map((opt) => (
                          <option key={opt.key} value={opt.key}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Labeled>


                    {renderTagInput({
                      label: "Target Audience / Region",
                      required: true,
                      valueKey: "targetAudience",
                      inputValue: audienceInput,
                      setInputValue: setAudienceInput,
                      suggestions: audienceSuggestions,
                      showSuggestions: showAudienceSuggestions,
                      setShowSuggestions: setShowAudienceSuggestions,
                      help: "Audience segments & regions added as tags.",
                    })}

                    <div className="col-12 col-md-6">
                      <div style={styles.formGroup}>
                        <label htmlFor="variants" style={styles.label}>
                          Number of Variants: {formData.variantsCount}
                          <span
                            style={styles.infoIcon}
                            data-tooltip-id="variantsCount-tooltip"
                            data-tooltip-content="How many variations you want the AI to generate."
                          >
                            i
                          </span>
                        </label>
                        <Tooltip style={styles.toolTip} id="variantsCount-tooltip" />
                        <input
                          type="range"
                          id="variants"
                          name="variants"
                          min="1"
                          max="5"
                          value={formData.variantsCount}
                          onChange={(e) => setFormData((p) => ({ ...p, variantsCount: Number(e.target.value) }))}
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>
                  </>
                )}

              <div className="col-12" style={{ margin: "16px 0" }}>
                <ToggleButton showAdvanced={showAdvanced} onToggle={toggleAdvanced} />
              </div>

              {showAdvanced && (
                <>
                  <PredefinedCustom
                    label="Meta Title Style"
                    required={false}
                    modeKey="metaTitleStyleMode"
                    valueKey="metaTitleStyle"
                    customKey="metaTitleStyleCustom"
                    options={fieldOptions?.meta_title_style || []}
                    placeholder="Enter custom meta title style"
                    help="Creative structure of meta titles within limits."
                    formData={formData}
                    setFormData={setFormData}
                    styles={styles}
                  />

<PredefinedCustom
                    label="Schema / Rich Result Type"
                    required={false}
                    modeKey="schemaTypeMode"
                    valueKey="schemaType"
                    customKey="schemaTypeCustom"
                    options={fieldOptions?.schema_rich_result_type || []}
                    placeholder="Enter custom schema type"
                    help="JSON-LD schema for rich results."
                    formData={formData}
                    setFormData={setFormData}
                    styles={styles}
                  />

                  <Labeled label="Brand / Website Name" required={false} help="Used for branded keywords and SERP trust signals." styles={styles}>
                    <input
                      style={styles.input}
                      value={formData.brandName}
                      onChange={(e) => setFormData((p) => ({ ...p, brandName: e.target.value }))}
                      placeholder="e.g., Synthovia"
                    />
                  </Labeled>

                  <Labeled label="Competitor URL / Reference Page" required={false} help="Reference for comparison keywords and meta angles." styles={styles}>
                    <input
                      style={styles.input}
                      value={formData.competitorUrl}
                      onChange={(e) => setFormData((p) => ({ ...p, competitorUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </Labeled>

                  {/* <Labeled label="Output Format" required={false} help="Defines how generated results are displayed or exported." styles={styles}>
                    <select
                      style={styles.select}
                      value={formData.outputFormat}
                      onChange={(e) => setFormData((p) => ({ ...p, outputFormat: e.target.value }))}
                    >
                      {(fieldOptions?.output_format || []).map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Labeled> */}

                  {renderTagInput({
                    label: "Include Keywords",
                    required: false,
                    valueKey: "includeKeywords",
                    inputValue: includeKeywordInput,
                    setInputValue: setIncludeKeywordInput,
                    suggestions: keywordSuggestions,
                    showSuggestions: showIncludeKeywordSuggestions,
                    setShowSuggestions: setShowIncludeKeywordSuggestions,
                    help: "Must-use terms or phrases that AI should include.",
                  })}

                  {renderTagInput({
                    label: "Exclude Keywords",
                    required: false,
                    valueKey: "excludeKeywords",
                    inputValue: excludeKeywordInput,
                    setInputValue: setExcludeKeywordInput,
                    suggestions: keywordSuggestions,
                    showSuggestions: showExcludeKeywordSuggestions,
                    setShowSuggestions: setShowExcludeKeywordSuggestions,
                    help: "Terms or phrases that AI must avoid.",
                  })}

                 

                  <PredefinedCustom
                    label="Compliance & Content Guidelines"
                    required={false}
                    modeKey="complianceGuidelinesMode"
                    valueKey="complianceGuidelines"
                    customKey="complianceGuidelinesCustom"
                    options={fieldOptions?.compliance_guidelines || []}
                    placeholder="Enter custom compliance guidelines"
                    help="Regulatory/brand safety constraints preset."
                    formData={formData}
                    setFormData={setFormData}
                    styles={styles}
                  />

                  <Labeled label="Output Depth" required={false} help="Defines verbosity of generated SEO assets." styles={styles}>
                    <select
                      style={styles.select}
                      value={formData.outputDepth}
                      onChange={(e) => setFormData((p) => ({ ...p, outputDepth: e.target.value }))}
                    >
                      {(fieldOptions?.output_depth || []).map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Labeled>
                </>
              )}

                <div className="col-12" style={{ marginTop: "12px" }}>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      type="button"
                      style={{ ...styles.btn, ...styles.btnOutline }}
                      onClick={handleReset}
                      disabled={isGenerating || isApiLoading}
                    >
                      Reset Form
                    </button>
                    <button
                      type="submit"
                      // className="personal-info-button"
                      style={{ ...styles.btn, ...styles.btnPrimary }}
                      disabled={isGenerating || isApiLoading}
                    >
                      Review & Generate
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showSummary && (
        <SummaryReviewModal
          formData={inputsForReview}
          onGenerate={handleGenerate}
          onEdit={() => setShowSummary(false)}
          onClose={() => setShowSummary(false)}
          isGenerating={isGenerating}
        />
      )}

      {showVariantsModal && (
        <VariantModalContent
          variants={generatedVariantsData.variants}
          inputs={generatedVariantsData.inputs}
          onClose={handleCloseVariantsModal}
          onRequestRegenerate={handleRequestRegenerate}
          showNotification={showToast}
          isLoading={false}
          isHistoryView={false}
        />
      )}

      <style jsx global>{`
        .seo-keyword-meta-form input:focus,
        .seo-keyword-meta-form textarea:focus,
        .seo-keyword-meta-form select:focus {
          outline: none !important;
          border-color: var(--color-primary) !important;
          box-shadow: none !important;
        }
      `}</style>
    </>
  );
};

export default SeoKeywordMetaTagGeneratorForm;
