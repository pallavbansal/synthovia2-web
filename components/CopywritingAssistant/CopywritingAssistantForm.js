// components/CopywritingAssistant/CopywritingAssistantForm.js
import React, { useState, useEffect, useCallback } from 'react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import SummaryReviewModal from './SummaryReviewModal';
import VariantsModal from './VariantsModal';

// --- API Constants (Provided by User) ---
const BASE_URL = 'https://olive-gull-905765.hostingersite.com/public/api/v1';

const API = {
    // Fetch dropdown & predefined field options for Copy Writing Assistant
    GET_COPYWRITING_OPTIONS: `${BASE_URL}/copy-writing/options?field_type=all`,
    GENERATE_COPYWRITING: `${BASE_URL}/copy-writing/generate`,
    GET_COPYWRITING_VARIANTS: (requestId) =>
        `${BASE_URL}/copy-writing/${requestId}/variants`,
    REGENERATE_COPYWRITING_VARIANT: (variantId) =>
        `${BASE_URL}/copy-writing/variants/${variantId}/regenerate`,
    GET_VARIANTS_LOG: (requestId) => `${BASE_URL}/copy-writing/${requestId}/variants`, // Updated to match user request
    AUTH_TOKEN: '3|WwYYaSEAfSr1guYBFdPQlPtGg0dKphy1sVMDLBmX647db358',
};

const AUTH_HEADER = `Bearer ${API.AUTH_TOKEN}`;

const CopywritingAssistantForm = () => {
    // State for all form fields
    const [formData, setFormData] = useState({
        useCase: '',
        primaryGoal: '',
        targetAudience: '',
        toneMode: 'predefined',
        toneOfVoice: '',
        customTone: '',
        language: 'English',
        lengthTarget: 'medium',
        customWordCount: 180,
        keyPoints: '',
        variants: 3,
        showAdvanced: false,
        keywords: '',
        ctaStyle: '',
        referenceText: '',
        rewriteMode: false,
        readingLevel: 'standard',
        targetPlatform: '',
        brandVoice: '',
        contentStyle: '',
        formattingOptions: [],
        includeWords: [],
        excludeWords: [],
        emotionalIntent: '',
        complianceNotes: '',
        writingFramework: '',
        outputStructure: 'markdown',
        creativityLevel: 5,
        referenceUrl: '',
        proofreading: true,
        grammarStrictness: 'medium',
        submitted: false,
    });

    const [apiOptions, setApiOptions] = useState(null);

    const [showSummary, setShowSummary] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showVariantsModal, setShowVariantsModal] = useState(false);
    const [generatedVariants, setGeneratedVariants] = useState([]);
    const [requestId, setRequestId] = useState(null);
    const [modalTitle, setModalTitle] = useState("Generated Variants");
    const [isFetchingLog, setIsFetchingLog] = useState(false);

    // Helper to safely access API options by key
    const getOptions = (key) => apiOptions?.[key] || [];

    // Generic normalizer: accepts API objects or plain strings and returns { value, label }
    const normalizeOptions = (items) =>
        (items || []).map((item) => {
            if (typeof item === 'string') {
                return { value: item, label: item };
            }
            const value = item.key || item.value || item.id || '';
            const label = item.label || item.name || item.key || String(value);
            return { value, label };
        });

    // Options for dropdowns (prefer API values, fallback to static presets)
    // --- [All Options Constants remain unchanged] ---
    const useCaseOptions = normalizeOptions(
        getOptions('use_case').length
            ? getOptions('use_case')
            : [
                { key: 'blog_post', label: 'Blog Post' },
                { key: 'product_description', label: 'Product Description' },
                { key: 'email_campaign', label: 'Email Campaign' },
                { key: 'social_post', label: 'Social Media Post' },
                { key: 'landing_page', label: 'Landing Page' },
                { key: 'ad_copy', label: 'Ad Copy' },
                { key: 'press_release', label: 'Press Release' },
            ]
    );

    const toneOptions = normalizeOptions(
        getOptions('tone_of_voice').length
            ? getOptions('tone_of_voice')
            : [
                { key: 'professional', label: 'Professional' },
                { key: 'friendly', label: 'Friendly' },
                { key: 'conversational', label: 'Conversational' },
                { key: 'formal', label: 'Formal' },
                { key: 'casual', label: 'Casual' },
                { key: 'persuasive', label: 'Persuasive' },
                { key: 'informative', label: 'Informative' },
                { key: 'humorous', label: 'Humorous' },
            ]
    );

    const languageOptions = normalizeOptions(
        getOptions('language').length
            ? getOptions('language')
            : [
                { key: 'en_us', label: 'English (US)' },
                { key: 'en_uk', label: 'English (UK)' },
                { key: 'hi', label: 'Hindi' },
                { key: 'ar', label: 'Arabic' },
                { key: 'es', label: 'Spanish' },
                { key: 'fr', label: 'French' },
                { key: 'de', label: 'German' },
                { key: 'bn', label: 'Bengali' },
            ]
    );

    const lengthTargetOptions = normalizeOptions(
        getOptions('length_target').length
            ? getOptions('length_target')
            : [
                { key: 'short', label: 'Short (50-150 words)' },
                { key: 'medium', label: 'Medium (150-400 words)' },
                { key: 'long', label: 'Long (400-800 words)' },
                { key: 'custom', label: 'Custom' },
            ]
    );

    const ctaStyleOptions = normalizeOptions(
        getOptions('cta_style').length
            ? getOptions('cta_style')
            : [
                { key: 'soft', label: 'Soft CTA' },
                { key: 'direct', label: 'Direct CTA' },
                { key: 'limited_time', label: 'Limited-Time CTA' },
                { key: 'follow', label: 'Follow CTA' },
                { key: 'learn_more', label: 'Learn More CTA' },
            ]
    );

    const readingLevelOptions = normalizeOptions(
        getOptions('reading_level').length
            ? getOptions('reading_level')
            : [
                { key: 'basic', label: 'Basic' },
                { key: 'intermediate', label: 'Intermediate' },
                { key: 'professional', label: 'Professional' },
                { key: 'academic', label: 'Academic' },
            ]
    );

    const targetPlatformOptions = normalizeOptions(
        getOptions('target_platform').length
            ? getOptions('target_platform')
            : [
                { key: 'instagram', label: 'Instagram' },
                { key: 'facebook', label: 'Facebook' },
                { key: 'tiktok', label: 'TikTok' },
                { key: 'linkedin', label: 'LinkedIn' },
                { key: 'youtube', label: 'YouTube' },
                { key: 'google_ads', label: 'Google Ads' },
                { key: 'website', label: 'Website' },
                { key: 'landing_page', label: 'Landing Page' },
            ]
    );

    const contentStyleOptions = normalizeOptions(
        getOptions('content_style_preference').length
            ? getOptions('content_style_preference')
            : [
                { key: 'storytelling', label: 'Storytelling' },
                { key: 'informational', label: 'Informational' },
                { key: 'sales_focused', label: 'Sales-focused' },
                { key: 'emotional', label: 'Emotional' },
                { key: 'narrative', label: 'Narrative' },
                { key: 'humor', label: 'Humor' },
                { key: 'case_study', label: 'Case Study' },
            ]
    );

    const emotionalIntentOptions = normalizeOptions(
        getOptions('emotional_intent').length
            ? getOptions('emotional_intent')
            : [
                { key: 'motivation', label: 'Motivation' },
                { key: 'trust', label: 'Trust' },
                { key: 'curiosity', label: 'Curiosity' },
                { key: 'desire', label: 'Desire' },
                { key: 'urgency', label: 'Urgency' },
                { key: 'empathy', label: 'Empathy' },
                { key: 'fomo', label: 'FOMO' },
            ]
    );

    const writingFrameworkOptions = normalizeOptions(
        getOptions('writing_framework').length
            ? getOptions('writing_framework')
            : [
                { key: 'aida', label: 'AIDA' },
                { key: 'pas', label: 'PAS' },
                { key: 'bab', label: 'BAB' },
                { key: 'four_ps', label: '4Ps' },
                { key: 'story_framework', label: 'Story Framework' },
            ]
    );

    const outputStructureOptions = normalizeOptions(
        getOptions('output_structure_type').length
            ? getOptions('output_structure_type')
            : [
                { key: 'markdown', label: 'Markdown' },
                { key: 'plain_text', label: 'Plain Text' },
                { key: 'html', label: 'HTML' },
                { key: 'json', label: 'JSON' },
            ]
    );

    const grammarStrictnessOptions = normalizeOptions(
        getOptions('grammar_strictness').length
            ? getOptions('grammar_strictness')
            : [
                { key: 'low', label: 'Low' },
                { key: 'standard', label: 'Standard' },
                { key: 'strict', label: 'Strict' },
            ]
    );

    // Formatting options: prefer API structure, fallback to existing labels
    const formattingOptionsList = getOptions('formatting_options').length
        ? getOptions('formatting_options')
        : [
            { key: 'bold_text', label: 'Bold Text' },
            { key: 'line_breaks', label: 'Line Breaks' },
            { key: 'minimal_emojis', label: 'Minimal Emojis' },
            { key: 'structured_layout', label: 'Structured Layout' },
        ];

    // Handler functions
    const buildOptionObject = (fieldKey, value, typeMode = 'predefined') => {
        if (!value) return null;

        const list = getOptions(fieldKey);
        const match = list.find((opt) => opt.key === value || opt.value === value || opt.label === value);

        if (typeMode === 'custom' || (!match && fieldKey === 'length_target' && value === 'custom')) {
            return {
                id: null,
                value,
                type: 'custom',
            };
        }

        return {
            id: match?.id ?? null,
            value,
            type: match ? 'predefined' : 'custom',
        };
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleArrayChange = (e, field) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            e.preventDefault();
            const newItem = e.target.value.trim();
            setFormData(prev => ({
                ...prev,
                [field]: [...prev[field], newItem]
            }));
            e.target.value = '';
        }
    };

    const removeItem = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const toggleAdvanced = () => {
        setFormData(prev => ({
            ...prev,
            showAdvanced: !prev.showAdvanced
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.useCase || !formData.primaryGoal || !formData.targetAudience || !formData.keyPoints) {
            alert('Please fill in all required fields (marked with *)');
            return;
        }

        if (formData.toneMode === 'predefined' && !formData.toneOfVoice) {
            alert('Please select a Tone of Voice.');
            return;
        }

        if (formData.toneMode === 'custom' && !formData.customTone) {
            alert('Please enter a Custom Tone.');
            return;
        }

        setShowSummary(true);
    };

    const handleEdit = () => {
        setShowSummary(false);
    };

    const handleGenerate = async () => {
        if (isGenerating) return;

        const useCaseObj = buildOptionObject('use_case', formData.useCase);
        const toneType = formData.toneMode === 'custom' ? 'custom' : 'predefined';
        const toneValue = formData.toneMode === 'custom' ? formData.customTone : formData.toneOfVoice;
        const toneObj = buildOptionObject('tone_of_voice', toneValue, toneType) || {
            id: null,
            value: toneValue,
            type: toneType,
        };

        const languageObj = buildOptionObject('language', formData.language) || {
            id: null,
            value: formData.language,
            type: 'predefined',
        };

        let lengthTargetObj;
        if (formData.lengthTarget === 'custom') {
            lengthTargetObj = {
                id: null,
                value: formData.customWordCount,
                type: 'custom',
            };
        } else {
            lengthTargetObj = buildOptionObject('length_target', formData.lengthTarget) || {
                id: null,
                value: formData.lengthTarget,
                type: 'predefined',
            };
        }

        const ctaStyleObj = formData.ctaStyle
            ? buildOptionObject('cta_style', formData.ctaStyle) || {
                id: null,
                value: formData.ctaStyle,
                type: 'predefined',
            }
            : null;

        const readingLevelObj = formData.readingLevel
            ? buildOptionObject('reading_level', formData.readingLevel) || {
                id: null,
                value: formData.readingLevel,
                type: 'predefined',
            }
            : null;

        const targetPlatformObj = formData.targetPlatform
            ? buildOptionObject('target_platform', formData.targetPlatform) || {
                id: null,
                value: formData.targetPlatform,
                type: 'predefined',
            }
            : null;

        const contentStyleObj = formData.contentStyle
            ? buildOptionObject('content_style_preference', formData.contentStyle) || {
                id: null,
                value: formData.contentStyle,
                type: 'predefined',
            }
            : null;

        const emotionalIntentObj = formData.emotionalIntent
            ? buildOptionObject('emotional_intent', formData.emotionalIntent) || {
                id: null,
                value: formData.emotionalIntent,
                type: 'predefined',
            }
            : null;

        const writingFrameworkObj = formData.writingFramework
            ? buildOptionObject('writing_framework', formData.writingFramework) || {
                id: null,
                value: formData.writingFramework,
                type: 'predefined',
            }
            : null;

        const outputStructureObj = formData.outputStructure
            ? buildOptionObject('output_structure_type', formData.outputStructure) || {
                id: null,
                value: formData.outputStructure,
                type: 'predefined',
            }
            : null;

        const grammarStrictnessObj = formData.grammarStrictness
            ? buildOptionObject('grammar_strictness', formData.grammarStrictness) || {
                id: null,
                value: formData.grammarStrictness,
                type: 'predefined',
            }
            : null;

        const keywordsArray = formData.keywords
            ? formData.keywords
                .split(',')
                .map((k) => k.trim())
                .filter(Boolean)
            : [];

        const payload = {
            use_case: useCaseObj,
            primary_goal: formData.primaryGoal,
            target_audience: Array.isArray(formData.targetAudience)
                ? formData.targetAudience
                : String(formData.targetAudience)
                    .split(',')
                    .map((v) => v.trim())
                    .filter(Boolean),
            tone_of_voice: toneObj,
            language: languageObj,
            length_target: lengthTargetObj,
            key_points: formData.keyPoints,
            number_of_variants: parseInt(formData.variants, 10) || 1,
            show_advanced_features: !!formData.showAdvanced,
            keywords: keywordsArray,
            cta_style: ctaStyleObj,
            rewrite_mode: !!formData.rewriteMode,
            reference_text: formData.referenceText || null,
            reading_level: readingLevelObj,
            target_platform: targetPlatformObj,
            brand_voice_reference: formData.brandVoice
                ? {
                    id: null,
                    value: formData.brandVoice,
                    type: 'predefined',
                }
                : null,
            content_style_preference: contentStyleObj,
            formatting_options: formData.formattingOptions || [],
            include_words: formData.includeWords || [],
            exclude_words: formData.excludeWords || [],
            emotional_intent: emotionalIntentObj,
            compliance_notes: formData.complianceNotes || '',
            writing_framework: writingFrameworkObj,
            output_structure_type: outputStructureObj,
            creativity_level: Number(formData.creativityLevel) / 10,
            reference_url: formData.referenceUrl || null,
            proofreading_optimization: !!formData.proofreading,
            grammar_strictness: grammarStrictnessObj,
        };

        setIsGenerating(true);
        setModalTitle("Generated Variants"); // Reset modal title

        try {
            const response = await fetch(API.GENERATE_COPYWRITING, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: AUTH_HEADER,
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.request_id) {
                setRequestId(result.request_id);
            }

            if (result.variants && Array.isArray(result.variants) && result.variants.length > 0) {
                const structured = result.variants.map((v, index) => ({
                    id: v.id || `copy-${Date.now()}-${index}`,
                    content: v.content || v,
                    // Assuming the API response structure might contain a status/log entry if it's the full log
                    log: v.log || 'Generation successful',
                    isLog: false,
                }));

                setGeneratedVariants(structured);
                setShowVariantsModal(true);
            } else {
                console.error('Copywriting generation returned no variants:', result);
                alert('Generation failed or returned no content. Check console for details.');
            }
        } catch (err) {
            console.error('Error generating copywriting variants:', err);
            alert('An error occurred during content generation.');
        } finally {
            setIsGenerating(false);
            setShowSummary(false);
        }
    };

    const handleRegenerateVariant = async (variantId) => {
        if (!variantId) return;

        try {
            const response = await fetch(API.REGENERATE_COPYWRITING_VARIANT(variantId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: AUTH_HEADER,
                },
            });

            if (!response.ok) {
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch (e) {
                    // ignore parse error
                }
                console.error('Regenerate failed:', errorData || response.statusText);
                return;
            }

            const result = await response.json();

            setGeneratedVariants((prev) => {
                const next = [...prev];
                const idx = next.findIndex((v) => v.id === variantId || v.id === result.variant_id);
                if (idx !== -1) {
                    next[idx] = {
                        ...next[idx],
                        content: result.new_content || result.content || next[idx].content,
                        isLog: false,
                    };
                }
                return next;
            });
        } catch (err) {
            console.error('Error regenerating copywriting variant:', err);
        }
    };
    
    // --- New handleViewLog Function ---
    const handleViewLog = async () => {
  if (!requestId) {
    console.error('No previous copywriting request_id found for log viewing.');
    alert('No previous generation found to view log.');
    return;
  }

  setIsFetchingLog(true);      // so VariantsModal can show loading state if needed
  setIsGenerating(true);       // reuse existing generating flag for buttons

  try {
    const response = await fetch(API.GET_VARIANTS_LOG(requestId), {
      headers: {
        Authorization: AUTH_HEADER,
      },
    });

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {
        // ignore parse error
      }
      console.error(
        'Failed to fetch copywriting variants log:',
        errorData || response.statusText
      );
      alert('Failed to load log. Check console for details.');
      return;
    }

    const result = await response.json();

    if (result.variants && Array.isArray(result.variants) && result.variants.length > 0) {
      const structured = result.variants.map((v, index) => ({
        id: v.id || `copy-log-${Date.now()}-${index}`,
        content: v.content || v,
        log: v.log || 'Loaded from variants log',
        isLog: true,
      }));

      setModalTitle('Variants Log');  // so VariantsModal can show different heading
      setGeneratedVariants(structured);
      setShowVariantsModal(true);
    } else {
      console.error('Copywriting variants log returned no variants:', result);
      alert('No variants found in the log for this request.');
    }
  } catch (err) {
    console.error('Error while fetching copywriting variants log:', err);
    alert('Error while loading log. Check console for details.');
  } finally {
    setIsFetchingLog(false);
    setIsGenerating(false);
  }
};
    // --- End New handleViewLog Function ---


    // Fetch dropdown & predefined options from API on mount
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const response = await fetch(API.GET_COPYWRITING_OPTIONS, {
                    headers: {
                        Authorization: AUTH_HEADER,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    // If the API fails, keep using static defaults silently
                    console.error('Failed to fetch copywriting options:', response.status, response.statusText);
                    return;
                }

                const result = await response.json();
                if (result && (result.status_code === 1 || result.success) && result.data) {
                    setApiOptions(result.data);
                } else {
                    console.error('Copywriting options API returned unexpected payload:', result);
                }
            } catch (err) {
                console.error('Error while fetching copywriting options:', err);
            }
        };

        fetchOptions();
    }, []);

    // Styles (similar to AdCopyGenerator)
    const styles = {
        container: { maxWidth: '1100px', margin: '0 auto', padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', backgroundColor: '#0a0e1a', minHeight: '100vh' },
        card: { backgroundColor: '#141b2d', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid #1e293b' },
        header: { padding: '24px 32px', borderBottom: '1px solid #1e293b', backgroundColor: '#0f1624' },
        title: { margin: 0, fontSize: '24px', fontWeight: '600', color: '#f8fafc' },
        subtitle: { margin: '6px 0 0', fontSize: '14px', color: '#94a3b8' },
        formGroup: { marginBottom: '20px' },
        label: { display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#e2e8f0' },
        input: { width: '100%', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5', color: '#e2e8f0', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', transition: 'all 0.15s ease-in-out', boxSizing: 'border-box' },
        checkboxInput: {
            width: '16px',
            height: '16px',
            margin: 0,
            cursor: 'pointer',
            accentColor: '#3b82f6',
            backgroundColor: '#0f1624',
            border: '2px solid #64748b',
            borderRadius: '4px',
            outline: 'none',
            transition: 'all 0.2s ease',
        },
        select: { width: '100%', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5', color: '#e2e8f0', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', transition: 'all 0.15s ease-in-out', boxSizing: 'border-box', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '20px', paddingRight: '40px', cursor: 'pointer' },
        textarea: { width: '100%', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5', color: '#e2e8f0', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', transition: 'all 0.15s ease-in-out', boxSizing: 'border-box', resize: 'vertical', minHeight: '80px' },
        badge: { display: 'inline-flex', alignItems: 'center', padding: '6px 12px', fontSize: '13px', fontWeight: '500', borderRadius: '6px', gap: '6px' },
        badgePrimary: { backgroundColor: '#3b82f6', color: 'white' },
        badgeSecondary: { backgroundColor: '#475569', color: 'white' },
        badgeSuccess: { backgroundColor: '#10b981', color: 'white' },
        btn: { padding: '10px 20px', fontSize: '14px', fontWeight: '500', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.15s ease-in-out', display: 'inline-flex', alignItems: 'center', gap: '8px' },
        btnPrimary: { backgroundColor: '#3b82f6', color: 'white' },
        btnSuccess: { backgroundColor: '#10b981', color: 'white' },
        btnOutline: { backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155' },
        btnDanger: { backgroundColor: '#ef4444', color: 'white' },
        infoIcon: { display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', textAlign: 'center', lineHeight: '16px', fontSize: '11px', cursor: 'help', marginLeft: '6px' },
        removeBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '18px', height: '18px', borderRadius: '50%', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
        rangeInput: { width: '100%', height: '6px', borderRadius: '3px', background: '#334155', outline: 'none' },
        checkboxGroup: { display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px' },
        checkboxItem: { display: 'flex', alignItems: 'center', gap: '8px' },
        radioGroup: { display: 'flex', gap: '16px', marginTop: '8px' },
        radioItem: { display: 'flex', alignItems: 'center', gap: '8px' },
        toast: { position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', color: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999 },
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Copywriting Assistant Tool</h1>
                    <p style={styles.subtitle}>Generate high-quality copy for your needs</p>
                </div>

                <div style={{ padding: '24px' }}>
                    <form onSubmit={handleSubmit}>
                        <div className="row g-4">
                            {/* Use Case */}
                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label htmlFor="useCase" style={styles.label}>
                                        Use Case <span style={{ color: '#ef4444' }}>*</span>
                                        <span style={styles.infoIcon} data-tooltip-id="useCase-tooltip" data-tooltip-content="Select the type of content you want to create">i</span>
                                    </label>
                                    <Tooltip id="useCase-tooltip" />
                                    <select
                                        id="useCase"
                                        name="useCase"
                                        value={formData.useCase}
                                        onChange={handleChange}
                                        style={styles.input}
                                        required
                                    >
                                        <option value="">Select a use case</option>
                                        {useCaseOptions.map((option, index) => (
                                            <option key={index} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Primary Goal */}
                            <div className="col-12">
                                <div style={styles.formGroup}>
                                    <label htmlFor="primaryGoal" style={styles.label}>
                                        Primary Goal <span style={{ color: '#ef4444' }}>*</span>
                                        <span style={styles.infoIcon} data-tooltip-id="primaryGoal-tooltip" data-tooltip-content="Describe the main objective of your content (max 150 words)">i</span>
                                    </label>
                                    <Tooltip id="primaryGoal-tooltip" />
                                    <textarea
                                        id="primaryGoal"
                                        name="primaryGoal"
                                        value={formData.primaryGoal}
                                        onChange={handleChange}
                                        style={{ ...styles.textarea, minHeight: '80px' }}
                                        placeholder="What do you want to achieve with this content?"
                                        maxLength={750} // ~150 words
                                        required
                                    />
                                </div>
                            </div>

                            {/* Target Audience */}
                            <div className="col-12">
                                <div style={styles.formGroup}>
                                    <label htmlFor="targetAudience" style={styles.label}>
                                        Target Audience <span style={{ color: '#ef4444' }}>*</span>
                                        <span style={styles.infoIcon} data-tooltip-id="audience-tooltip" data-tooltip-content="Describe your target audience (max 120 words)">i</span>
                                    </label>
                                    <Tooltip id="audience-tooltip" />
                                    <textarea
                                        id="targetAudience"
                                        name="targetAudience"
                                        value={formData.targetAudience}
                                        onChange={handleChange}
                                        style={{ ...styles.textarea, minHeight: '60px' }}
                                        placeholder="Who is your target audience? (e.g., age, interests, profession)"
                                        maxLength={600} // ~120 words
                                        required
                                    />
                                </div>
                            </div>

                            {/* Tone Selection */}
                            <div className="col-12">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Tone Selection <span style={{ color: '#ef4444' }}>*</span>
                                        <span style={styles.infoIcon} data-tooltip-id="toneMode-tooltip" data-tooltip-content="Choose between predefined tones or define a custom tone">i</span>
                                    </label>
                                    <Tooltip id="toneMode-tooltip" />
                                    <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="toneMode"
                                                value="predefined"
                                                checked={formData.toneMode === 'predefined'}
                                                onChange={handleChange}
                                                style={{ marginRight: '8px' }}
                                            />
                                            Predefined
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="toneMode"
                                                value="custom"
                                                checked={formData.toneMode === 'custom'}
                                                onChange={handleChange}
                                                style={{ marginRight: '8px' }}
                                            />
                                            Custom
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Tone of Voice (shown when predefined is selected) */}
                            {formData.toneMode === 'predefined' && (
                                <div className="col-md-6">
                                    <div style={styles.formGroup}>
                                        <label htmlFor="toneOfVoice" style={styles.label}>
                                            Tone of Voice <span style={{ color: '#ef4444' }}>*</span>
                                            <span style={styles.infoIcon} data-tooltip-id="tone-tooltip" data-tooltip-content="Select the tone that best matches your brand voice">i</span>
                                        </label>
                                        <Tooltip id="tone-tooltip" />
                                        <select
                                            id="toneOfVoice"
                                            name="toneOfVoice"
                                            value={formData.toneOfVoice}
                                            onChange={handleChange}
                                            style={styles.input}
                                            required={formData.toneMode === 'predefined'}
                                        >
                                            <option value="">Select a tone</option>
                                            {toneOptions.map((tone, index) => (
                                                <option key={index} value={tone.value}>{tone.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Custom Tone (shown when custom is selected) */}
                            {formData.toneMode === 'custom' && (
                                <div className="col-md-6">
                                    <div style={styles.formGroup}>
                                        <label htmlFor="customTone" style={styles.label}>
                                            Custom Tone <span style={{ color: '#ef4444' }}>*</span>
                                            <span style={styles.infoIcon} data-tooltip-id="customTone-tooltip" data-tooltip-content="Describe your desired tone in a few words (max 12 words)">i</span>
                                        </label>
                                        <Tooltip id="customTone-tooltip" />
                                        <input
                                            type="text"
                                            id="customTone"
                                            name="customTone"
                                            value={formData.customTone}
                                            onChange={handleChange}
                                            style={styles.input}
                                            placeholder="e.g., Friendly, professional, and slightly humorous"
                                            maxLength={100}
                                            required={formData.toneMode === 'custom'}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Language */}
                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label htmlFor="language" style={styles.label}>
                                        Language <span style={{ color: '#ef4444' }}>*</span>
                                        <span style={styles.infoIcon} data-tooltip-id="language-tooltip" data-tooltip-content="Select the language for your content">i</span>
                                    </label>
                                    <Tooltip id="language-tooltip" />
                                    <select
                                        id="language"
                                        name="language"
                                        value={formData.language}
                                        onChange={handleChange}
                                        style={styles.input}
                                        required
                                    >
                                        {languageOptions.map((lang, index) => (
                                            <option key={index} value={lang.value}>{lang.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Length Target */}
                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label htmlFor="lengthTarget" style={styles.label}>
                                        Length Target <span style={{ color: '#ef4444' }}>*</span>
                                        <span style={styles.infoIcon} data-tooltip-id="length-tooltip" data-tooltip-content="Select or specify your desired word count">i</span>
                                    </label>
                                    <Tooltip id="length-tooltip" />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <select
                                            id="lengthTarget"
                                            name="lengthTarget"
                                            value={formData.lengthTarget}
                                            onChange={handleChange}
                                            style={{ ...styles.input, flex: 1 }}
                                        >
                                            {lengthTargetOptions.map((opt, index) => (
                                                <option key={index} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        {formData.lengthTarget === 'custom' && (
                                            <input
                                                type="number"
                                                name="customWordCount"
                                                value={formData.customWordCount}
                                                onChange={handleChange}
                                                min="50"
                                                max="2000"
                                                style={{ ...styles.input, width: '100px' }}
                                                placeholder="Words"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Key Points */}
                            <div className="col-12">
                                <div style={styles.formGroup}>
                                    <label htmlFor="keyPoints" style={styles.label}>
                                        Key Points <span style={{ color: '#ef4444' }}>*</span>
                                        <span style={styles.infoIcon} data-tooltip-id="keyPoints-tooltip" data-tooltip-content="List the main points to include in your content (max 1200 characters)">i</span>
                                    </label>
                                    <Tooltip id="keyPoints-tooltip" />
                                    <textarea
                                        id="keyPoints"
                                        name="keyPoints"
                                        value={formData.keyPoints}
                                        onChange={handleChange}
                                        style={{ ...styles.textarea, minHeight: '100px' }}
                                        placeholder="Enter the key points you want to cover, one per line"
                                        maxLength={1200}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Number of Variants */}
                            <div className="col-12">
                                <div style={styles.formGroup}>
                                    <label htmlFor="variants" style={styles.label}>
                                        Number of Variants: {formData.variants}
                                        <span style={styles.infoIcon} data-tooltip-id="variants-tooltip" data-tooltip-content="How many different versions of the content would you like to generate?">i</span>
                                    </label>
                                    <Tooltip id="variants-tooltip" />
                                    <input
                                        type="range"
                                        id="variants"
                                        name="variants"
                                        min="1"
                                        max="5"
                                        value={formData.variants}
                                        onChange={handleChange}
                                        style={{ width: '100%' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                        <span>1</span>
                                        <span>2</span>
                                        <span>3</span>
                                        <span>4</span>
                                        <span>5</span>
                                    </div>
                                </div>
                            </div>

                            <hr style={{ width: '100%', border: 'none', borderTop: '1px solid #e5e7eb', margin: '5px 0' }} />

                            {/* Advanced Features Toggle */}
                            <div className="col-12">
                                <button
                                    type="button"
                                    onClick={toggleAdvanced}
                                    style={{
                                        ...styles.btn,
                                        ...styles.btnOutline,
                                        padding: '8px 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {formData.showAdvanced ? '▼' : '▶'} Advanced Features
                                </button>
                            </div>

                            {/* Advanced Features */}
                            {formData.showAdvanced && (
                                <>
                                    {/* Keywords */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="keywords" style={styles.label}>
                                                Keywords
                                                <span style={styles.infoIcon} data-tooltip-id="keywords-tooltip" data-tooltip-content="Add keywords to include in your content (max 250 characters)">i</span>
                                            </label>
                                            <Tooltip id="keywords-tooltip" />
                                            <input
                                                type="text"
                                                id="keywords"
                                                name="keywords"
                                                value={formData.keywords}
                                                onChange={handleChange}
                                                style={styles.input}
                                                placeholder="e.g., digital marketing, seo, content strategy"
                                                maxLength={250}
                                            />
                                        </div>
                                    </div>

                                    {/* CTA Style */}
                                    <div className="col-md-6">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="ctaStyle" style={styles.label}>
                                                CTA Style
                                                <span style={styles.infoIcon} data-tooltip-id="cta-tooltip" data-tooltip-content="Select the style for your call-to-action">i</span>
                                            </label>
                                            <Tooltip id="cta-tooltip" />
                                            <select
                                                id="ctaStyle"
                                                name="ctaStyle"
                                                value={formData.ctaStyle}
                                                onChange={handleChange}
                                                style={styles.input}
                                            >
                                                <option value="">Select CTA Style</option>
                                                {ctaStyleOptions.map((style, index) => (
                                                    <option key={index} value={style.value}>{style.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Reference Text */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="referenceText" style={styles.label}>
                                                Reference Text
                                                <span style={styles.infoIcon} data-tooltip-id="reference-tooltip" data-tooltip-content="Add any reference text or examples (max 5000 characters)">i</span>
                                            </label>
                                            <Tooltip id="reference-tooltip" />
                                            <textarea
                                                id="referenceText"
                                                name="referenceText"
                                                value={formData.referenceText}
                                                onChange={handleChange}
                                                style={{ ...styles.textarea, minHeight: '100px' }}
                                                placeholder="Paste any reference text or examples here"
                                                maxLength={5000}
                                            />
                                        </div>
                                    </div>

                                    {/* Rewrite Mode */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    name="rewriteMode"
                                                    checked={formData.rewriteMode}
                                                    onChange={handleChange}
                                                    style={{ marginRight: '8px' }}
                                                />
                                                <span>Rewrite Mode</span>
                                                <span style={{ ...styles.infoIcon, marginLeft: '8px' }} data-tooltip-id="rewrite-tooltip" data-tooltip-content="Enable to rewrite the reference text in a different style">i</span>
                                                <Tooltip id="rewrite-tooltip" />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Reading Level */}
                                    <div className="col-md-6">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="readingLevel" style={styles.label}>
                                                Reading Level
                                                <span style={styles.infoIcon} data-tooltip-id="reading-tooltip" data-tooltip-content="Select the reading level for your content">i</span>
                                            </label>
                                            <Tooltip id="reading-tooltip" />
                                            <select
                                                id="readingLevel"
                                                name="readingLevel"
                                                value={formData.readingLevel}
                                                onChange={handleChange}
                                                style={styles.input}
                                            >
                                                {readingLevelOptions.map((opt, index) => (
                                                    <option key={index} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Target Platform */}
                                    <div className="col-md-6">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="targetPlatform" style={styles.label}>
                                                Target Platform
                                                <span style={styles.infoIcon} data-tooltip-id="platform-tooltip" data-tooltip-content="Select the platform where this content will be published">i</span>
                                            </label>
                                            <Tooltip id="platform-tooltip" />
                                            <select
                                                id="targetPlatform"
                                                name="targetPlatform"
                                                value={formData.targetPlatform}
                                                onChange={handleChange}
                                                style={styles.input}
                                            >
                                                <option value="">Any Platform</option>
                                                {targetPlatformOptions.map((opt, index) => (
                                                    <option key={index} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Brand Voice Reference */}
                                    <div className="col-md-6">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="brandVoice" style={styles.label}>
                                                Brand Voice Reference
                                                <span style={styles.infoIcon} data-tooltip-id="brand-voice-tooltip" data-tooltip-content="Select a predefined brand voice or upload your own">i</span>
                                            </label>
                                            <Tooltip id="brand-voice-tooltip" />
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <select
                                                    id="brandVoice"
                                                    name="brandVoice"
                                                    value={formData.brandVoice || ''}
                                                    onChange={handleChange}
                                                    style={{ ...styles.input, flex: 1 }}
                                                >
                                                    <option value="">Select Brand Voice</option>
                                                    {[...Array(10)].map((_, i) => (
                                                        <option key={i} value={`brand-${i + 1}`}>Brand Style {i + 1}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    style={{ ...styles.btn, ...styles.btnOutline, whiteSpace: 'nowrap' }}
                                                    onClick={() => document.getElementById('brandVoiceFile').click()}
                                                >
                                                    Upload
                                                </button>
                                                <input
                                                    type="file"
                                                    id="brandVoiceFile"
                                                    accept=".pdf,.doc,.docx,.txt"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                brandVoiceFile: e.target.files[0]
                                                            }));
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Style Preference */}
                                    <div className="col-md-6">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="contentStyle" style={styles.label}>
                                                Content Style Preference
                                                <span style={styles.infoIcon} data-tooltip-id="content-style-tooltip" data-tooltip-content="Select the preferred style for your content">i</span>
                                            </label>
                                            <Tooltip id="content-style-tooltip" />
                                            <select
                                                id="contentStyle"
                                                name="contentStyle"
                                                value={formData.contentStyle || ''}
                                                onChange={handleChange}
                                                style={styles.input}
                                            >
                                                <option value="">Select Style</option>
                                                {contentStyleOptions.map((opt, index) => (
                                                    <option key={index} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Formatting Options */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>
                                                Formatting Options
                                                <span style={styles.infoIcon} data-tooltip-id="formatting-tooltip" data-tooltip-content="Select the formatting options you want to include">i</span>
                                            </label>
                                            <Tooltip id="formatting-tooltip" />
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px' }}>
                                                {formattingOptionsList.map((option) => {
                                                    const value = typeof option === 'string'
                                                        ? option.toLowerCase().replace(/\s+/g, '-')
                                                        : option.key || option.value || (option.label || '').toLowerCase().replace(/\s+/g, '-');
                                                    const label = typeof option === 'string'
                                                        ? option
                                                        : option.label || option.name || option.key || value;

                                                    return (
                                                        <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                            <input
                                                                type="checkbox"
                                                                name="formattingOptions"
                                                                value={value}
                                                                checked={formData.formattingOptions?.includes(value)}
                                                                onChange={(e) => {
                                                                    const { value: val, checked } = e.target;
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        formattingOptions: checked
                                                                            ? [...(prev.formattingOptions || []), val]
                                                                            : (prev.formattingOptions || []).filter(item => item !== val)
                                                                    }));
                                                                }}
                                                                style={{
                                                                    width: '16px',
                                                                    height: '16px',
                                                                    margin: 0,
                                                                    cursor: 'pointer',
                                                                    accentColor: '#3b82f6',
                                                                    backgroundColor: '#0f1624',
                                                                    border: '2px solid #64748b',
                                                                    borderRadius: '4px',
                                                                    outline: 'none',
                                                                    transition: 'all 0.2s ease',
                                                                }}
                                                            />
                                                            {label}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Include Words */}
                                    <div className="col-md-6">
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>
                                                Include Words
                                                <span style={styles.infoIcon} data-tooltip-id="include-tooltip" data-tooltip-content="Words that must be included in the content (press Enter to add)">i</span>
                                            </label>
                                            <Tooltip id="include-tooltip" />
                                            <input
                                                type="text"
                                                style={styles.input}
                                                placeholder="Add a word and press Enter"
                                                onKeyPress={(e) => handleArrayChange(e, 'includeWords')}
                                            />
                                            <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '8px' }}>
                                                {formData.includeWords.map((word, index) => (
                                                    <span key={index} style={{ ...styles.badge, ...styles.badgeSecondary, marginRight: '8px', marginBottom: '8px' }}>
                                                        {word}
                                                        <button type="button" style={styles.removeBtn} onClick={() => removeItem('includeWords', index)}>×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Exclude Words */}
                                    <div className="col-md-6">
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>
                                                Exclude Words
                                                <span style={styles.infoIcon} data-tooltip-id="exclude-tooltip" data-tooltip-content="Words that should not appear in the content (press Enter to add)">i</span>
                                            </label>
                                            <Tooltip id="exclude-tooltip" />
                                            <input
                                                type="text"
                                                style={styles.input}
                                                placeholder="Add a word and press Enter"
                                                onKeyPress={(e) => handleArrayChange(e, 'excludeWords')}
                                            />
                                            <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '8px' }}>
                                                {formData.excludeWords.map((word, index) => (
                                                    <span key={index} style={{ ...styles.badge, ...styles.badgeDanger, marginRight: '8px', marginBottom: '8px' }}>
                                                        {word}
                                                        <button type="button" style={styles.removeBtn} onClick={() => removeItem('excludeWords', index)}>×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Emotional Intent */}
                                    <div className="col-md-6">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="emotionalIntent" style={styles.label}>
                                                Emotional Intent
                                                <span style={styles.infoIcon} data-tooltip-id="emotional-tooltip" data-tooltip-content="Select the emotional tone for your content">i</span>
                                            </label>
                                            <Tooltip id="emotional-tooltip" />
                                            <select
                                                id="emotionalIntent"
                                                name="emotionalIntent"
                                                value={formData.emotionalIntent}
                                                onChange={handleChange}
                                                style={styles.input}
                                            >
                                                <option value="">None (Neutral)</option>
                                                {emotionalIntentOptions.map((opt, index) => (
                                                    <option key={index} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Compliance Notes */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="complianceNotes" style={styles.label}>
                                                Compliance Notes
                                                <span style={styles.infoIcon} data-tooltip-id="compliance-tooltip" data-tooltip-content="Any legal or compliance requirements (max 200 words)">i</span>
                                            </label>
                                            <Tooltip id="compliance-tooltip" />
                                            <textarea
                                                id="complianceNotes"
                                                name="complianceNotes"
                                                value={formData.complianceNotes}
                                                onChange={handleChange}
                                                style={{ ...styles.textarea, minHeight: '80px' }}
                                                placeholder="Add any compliance requirements or legal disclaimers"
                                                maxLength={1000} // ~200 words
                                            />
                                        </div>
                                    </div>

                                    {/* Writing Framework */}
                                    <div className="col-md-6">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="writingFramework" style={styles.label}>
                                                Writing Framework
                                                <span style={styles.infoIcon} data-tooltip-id="framework-tooltip" data-tooltip-content="Select a writing framework to structure your content">i</span>
                                            </label>
                                            <Tooltip id="framework-tooltip" />
                                            <select
                                                id="writingFramework"
                                                name="writingFramework"
                                                value={formData.writingFramework}
                                                onChange={handleChange}
                                                style={styles.input}
                                            >
                                                <option value="">None (Standard Structure)</option>
                                                {writingFrameworkOptions.map((opt, index) => (
                                                    <option key={index} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Output Structure Type */}
                                    <div className="col-md-6">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="outputStructure" style={styles.label}>
                                                Output Structure
                                                <span style={styles.infoIcon} data-tooltip-id="output-tooltip" data-tooltip-content="Select the format for the generated content">i</span>
                                            </label>
                                            <Tooltip id="output-tooltip" />
                                            <select
                                                id="outputStructure"
                                                name="outputStructure"
                                                value={formData.outputStructure}
                                                onChange={handleChange}
                                                style={styles.input}
                                            >
                                                {outputStructureOptions.map((opt, index) => (
                                                    <option key={index} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Creativity Level */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="creativityLevel" style={styles.label}>
                                                Creativity Level: {formData.creativityLevel}/10
                                                <span style={styles.infoIcon} data-tooltip-id="creativity-tooltip" data-tooltip-content="Adjust how creative or conservative the output should be">i</span>
                                            </label>
                                            <Tooltip id="creativity-tooltip" />
                                            <input
                                                type="range"
                                                id="creativityLevel"
                                                name="creativityLevel"
                                                min="1"
                                                max="10"
                                                value={formData.creativityLevel}
                                                onChange={handleChange}
                                                style={{ width: '100%' }}
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                                <span>More Predictable</span>
                                                <span>More Creative</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reference URL */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="referenceUrl" style={styles.label}>
                                                Reference URL
                                                <span style={styles.infoIcon} data-tooltip-id="url-tooltip" data-tooltip-content="Add a URL for reference or to extract content from">i</span>
                                            </label>
                                            <Tooltip id="url-tooltip" />
                                            <input
                                                type="url"
                                                id="referenceUrl"
                                                name="referenceUrl"
                                                value={formData.referenceUrl}
                                                onChange={handleChange}
                                                style={styles.input}
                                                placeholder="https://example.com"
                                            />
                                        </div>
                                    </div>

                                    {/* Proofreading & Optimization */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    name="proofreading"
                                                    checked={formData.proofreading}
                                                    onChange={handleChange}
                                                    style={{ marginRight: '8px' }}
                                                />
                                                <span>Enable Proofreading & Optimization</span>
                                                <span style={{ ...styles.infoIcon, marginLeft: '8px' }} data-tooltip-id="proofreading-tooltip" data-tooltip-content="Automatically check for grammar, readability, and SEO optimization">i</span>
                                                <Tooltip id="proofreading-tooltip" />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Grammar Strictness (shown when proofreading is enabled) */}
                                    {formData.proofreading && (
                                        <div className="col-12">
                                            <div style={styles.formGroup}>
                                                <label htmlFor="grammarStrictness" style={styles.label}>
                                                    Grammar Strictness
                                                    <span style={styles.infoIcon} data-tooltip-id="grammar-tooltip" data-tooltip-content="How strictly should grammar and style rules be applied?">i</span>
                                                </label>
                                                <Tooltip id="grammar-tooltip" />
                                                <select
                                                    id="grammarStrictness"
                                                    name="grammarStrictness"
                                                    value={formData.grammarStrictness}
                                                    onChange={handleChange}
                                                    style={styles.input}
                                                >
                                                    {grammarStrictnessOptions.map((opt, index) => (
                                                        <option key={index} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Submit Button */}
                            <div className="col-12" style={{ marginTop: '20px' }}>
                                <button
                                    type="submit"
                                    style={{
                                        ...styles.btn,
                                        ...styles.btnPrimary,
                                        padding: '12px 24px',
                                        fontSize: '16px',
                                        fontWeight: '600'
                                    }}
                                >
                                    Generate Copy
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {showSummary && (
                <SummaryReviewModal
                    formData={formData}
                    useCaseOptions={useCaseOptions}
                    toneOptions={toneOptions}
                    languageOptions={languageOptions}
                    lengthTargetOptions={lengthTargetOptions}
                    ctaStyleOptions={ctaStyleOptions}
                    readingLevelOptions={readingLevelOptions}
                    targetPlatformOptions={targetPlatformOptions}
                    contentStyleOptions={contentStyleOptions}
                    emotionalIntentOptions={emotionalIntentOptions}
                    writingFrameworkOptions={writingFrameworkOptions}
                    outputStructureOptions={outputStructureOptions}
                    grammarStrictnessOptions={grammarStrictnessOptions}
                    formattingOptionsList={formattingOptionsList}
                    onGenerate={handleGenerate}
                    onEdit={handleEdit}
                    isGenerating={isGenerating}
                    onViewLog={handleViewLog} // Passing the new function
                />
            )}

            {showVariantsModal && (
                <VariantsModal
                    variants={generatedVariants}
                    onClose={() => {
                      setShowVariantsModal(false);
                      setShowSummary(true);      // reopen Review & Confirm modal
                    }}
                    onRequestRegenerate={handleRegenerateVariant}
                    modalTitle={modalTitle} // Pass the title to the modal
                    isFetchingLog={isFetchingLog} // Pass log fetching state
                />
            )}
            {/* Output Section (initially hidden) - This remains unchanged */}
            {formData.submitted && (
                <div style={{ marginTop: '40px' }}>
                    <h2 style={{ marginBottom: '20px', color: '#111827' }}>Generated Content</h2>
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {[...Array(parseInt(formData.variants))].map((_, index) => (
                            <div key={index} style={{
                                ...styles.card,
                                padding: '24px',
                                border: '1px solid #e5e7eb'
                            }}>
                                <div style={{ marginBottom: '16px' }}>
                                    <h3 style={{ margin: '0 0 8px 0', color: '#111827' }}>Variant {index + 1}</h3>
                                    <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '12px 0' }}></div>
                                </div>
                                <div style={{ lineHeight: '1.6', color: '#374151' }}>
                                    {/* This is where the generated content would be displayed */}
                                    <p>Generated content will appear here. This is a preview of how the formatted content will look.</p>
                                    <p>Each variant will show different approaches based on your input parameters.</p>
                                </div>
                                <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                                    <button
                                        style={{
                                            ...styles.btn,
                                            ...styles.btnOutline,
                                            padding: '8px 16px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Copy to Clipboard
                                    </button>
                                    <button
                                        style={{
                                            ...styles.btn,
                                            ...styles.btnOutline,
                                            padding: '8px 16px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Save Draft
                                    </button>
                                    <button
                                        style={{
                                            ...styles.btn,
                                            ...styles.btnOutline,
                                            padding: '8px 16px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        style={{
                                            ...styles.btn,
                                            ...styles.btnOutline,
                                            padding: '8px 16px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Regenerate
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CopywritingAssistantForm;