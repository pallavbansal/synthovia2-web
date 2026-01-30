// components/Captionandhastaggenerator/Captionandhastaggeneratorform.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import VariantModalContent from './VariantModalContent';
// --- CHANGED IMPORT TO NEW MODAL COMPONENT ---
import SummaryReviewModal from './SummaryReviewModal';

import ToggleButton from '../Form/ToggleButton';
import RemoveTagButton from '../Form/RemoveTagButton';

import { getAuthHeader } from "@/utils/auth";
import API from "@/utils/api";

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

const Captionandhastaggeneratorform = () => {
    // [STATE UPDATED TO SUPPORT CUSTOM/PREDEFINED TOGGLES FOR 5 FIELDS]
    const [formData, setFormData] = useState({
        platformType: 'predefined',
        platform: '', // key from API options
        customPlatform: '',
        postTheme: '',
        primaryGoal: '',
        toneSelection: 'predefined',
        toneOfVoice: '', // key from API options
        customTone: '',
        targetAudience: [],
        variants: 1,
        showAdvanced: false,
        requiredKeywords: [],
        mentionHandles: [],
        // Language / locale selection - NEW LOGIC TOGGLES ADDED
        languageSelection: 'predefined', // <--- NEW STATE
        language: 'en_global', // key from API options
        customLanguage: '', // <--- NEW STATE
        // Emotional intent selection - NEW LOGIC TOGGLES ADDED
        emotionalIntentSelection: 'predefined', // <--- NEW STATE
        emotionalIntent: '', // key from API options
        customEmotionalIntent: '', // <--- NEW STATE
        // Post length selection & value
        postLengthSelection: 'predefined',
        postLength: '', // default to Auto-Detect (Platform Optimized)
        customPostLength: '',
        formattingOptions: [], // Multi-select checkbox array (e.g., ['emoji', 'linebreaks'])
        // CTA selection - NEW LOGIC TOGGLES ADDED
        ctaSelection: 'predefined', // <--- NEW STATE
        includeCtaType: '', // key from API options, can be 'custom'
        customCta: '', // <--- NEW STATE (Already present, now used with toggle)
        numberOfCtaSelection: 'predefined',
        numberOfCta: 1,
        // Caption & hashtag style selection - NEW LOGIC TOGGLES ADDED
        captionStyleSelection: 'predefined', // <--- NEW STATE
        captionStyle: '', // key from API options
        customCaptionStyle: '', // <--- NEW STATE
        hashtagStyleSelection: 'predefined', // <--- NEW STATE
        hashtagStyle: '', // key from API options
        customHashtagStyle: '', // <--- NEW STATE
        excludeWords: [],
        creativityLevel: 5,
        proofread: true,
        hashtagLimit: '', // Changed to empty string to be set by API default key
        complianceNotes: ''
    });

    const [apiOptions, setApiOptions] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSummary, setShowSummary] = useState(false); // <--- Controls the modal visibility
    const [isGenerating, setIsGenerating] = useState(false);
    const [showVariantsModal, setShowVariantsModal] = useState(false);
    const [requestId, setRequestId] = useState(null);
    const [modalTitle, setModalTitle] = useState("Generated Variants");
    const [isFetchingLog, setIsFetchingLog] = useState(false);
    const [generatedVariantsData, setGeneratedVariantsData] = useState({
        requestId: null,
        variants: [],
        inputs: {}
    });
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [audienceInput, setAudienceInput] = useState('');
    const [showAudienceSuggestions, setShowAudienceSuggestions] = useState(false);
    const [isHistoryView, setIsHistoryView] = useState(false);

    const streamControllersRef = useRef([]);
    const sessionRequestIdRef = useRef(null);

    const abortAllStreams = useCallback(() => {
        const controllers = streamControllersRef.current;
        streamControllersRef.current = [];
        controllers.forEach((c) => {
            try {
                c.abort();
            } catch (e) {
            }
        });
    }, []);

    // --- Shared Utility Function ---
    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    // --- Data mapping and retrieval ---
    const getOptions = (key) => apiOptions?.[key] || [];

    // Function to get the label, key/value, and ID for predefined fields 
    const getOptionDetails = (fieldKey, value, customValue = null, typeOverride = null) => {
        if (!apiOptions) return { type: 'predefined', id: null, value: value || 'N/A' };

        // Determine if the *mode* is explicitly custom based on the selector state
        let isCustomMode = false;
        if (fieldKey === 'caption_platform' && formData.platformType === 'custom') isCustomMode = true;
        if (fieldKey === 'caption_tone_of_voice' && formData.toneSelection === 'custom') isCustomMode = true;
        if (fieldKey === 'caption_cta_type' && formData.ctaSelection === 'custom') isCustomMode = true;
        if (fieldKey === 'caption_language_locale' && formData.languageSelection === 'custom') isCustomMode = true;
        if (fieldKey === 'caption_emotional_intent' && formData.emotionalIntentSelection === 'custom') isCustomMode = true;
        if (fieldKey === 'caption_style' && formData.captionStyleSelection === 'custom') isCustomMode = true;
        if (fieldKey === 'caption_hashtag_style' && formData.hashtagStyleSelection === 'custom') isCustomMode = true;
        if (fieldKey === 'caption_post_length' && formData.postLengthSelection === 'custom') isCustomMode = true;

        const type = typeOverride || (isCustomMode ? 'custom' : 'predefined');

        if (type === 'custom') {
            let finalCustomValue = '';
            if (fieldKey === 'caption_platform') {
                finalCustomValue = formData.customPlatform;
            } else if (fieldKey === 'caption_tone_of_voice') {
                finalCustomValue = formData.customTone;
            } else if (fieldKey === 'caption_cta_type') {
                finalCustomValue = formData.customCta;
            } else if (fieldKey === 'caption_language_locale') {
                finalCustomValue = formData.customLanguage;
            } else if (fieldKey === 'caption_emotional_intent') {
                finalCustomValue = formData.customEmotionalIntent;
            } else if (fieldKey === 'caption_post_length') {
                finalCustomValue = formData.customPostLength;
            } else if (fieldKey === 'caption_style') {
                finalCustomValue = formData.customCaptionStyle;
            } else if (fieldKey === 'caption_hashtag_style') {
                finalCustomValue = formData.customHashtagStyle;
            }

            return {
                type: 'custom',
                id: null,
                value: finalCustomValue || 'Custom Input Required',
                isAuto: false
            };
        }

        const option = getOptions(fieldKey).find(opt => opt.key === value);
        // NOTE: For the API payload, we use id/type; for display (SummaryReviewModal) we prefer the label.
        return {
            type: 'predefined',
            id: option?.id || null,
            // Use label for user-facing display, fall back to key/value if label is missing
            value: option?.label || option?.key || value || 'N/A',
            isAuto: false
        };
    };

    // API-fetched options (used for rendering)
    const platformOptions = getOptions('caption_platform');
    const toneOptions = getOptions('caption_tone_of_voice');
    const languageOptions = getOptions('caption_language_locale');
    const emotionalIntentOptions = getOptions('caption_emotional_intent');
    const postLengthOptions = getOptions('caption_post_length');
    // Including 'custom' manually for the dropdown for consistent UX
    const ctaTypeOptions = [...getOptions('caption_cta_type'), { key: 'custom', label: 'Custom CTA' }];
    const captionStyleOptions = getOptions('caption_style');
    const hashtagStyleOptions = getOptions('caption_hashtag_style');
    const hashtagLimitOptions = getOptions('caption_hashtag_limit');

    // Static Formatting Options (used for rendering and mapping values)
    const formattingOptionsList = [
        { value: 'emoji', label: 'Add Emojis', apiValue: 'minimal_emojis' },
        { value: 'hashtags', label: 'Include Hashtags', apiValue: 'include_hashtags' },
        { value: 'mentions', label: 'Add Mentions', apiValue: 'include_mentions' },
        { value: 'linebreaks', label: 'Use Line Breaks', apiValue: 'line_breaks' }
    ];

    // Hardcoded audience suggestions (mirroring Ad Copy Generator)
    const audienceSuggestions = {
        'Demographics': ['Women 25-34', 'Men 35-44', 'Parents of Toddlers'],
        'Interests': ['Fitness Enthusiasts', 'Tech Early Adopters', 'Travel Lovers'],
        'Professions': ['Marketing Managers', 'Small Business Owners', 'Software Engineers']
    };

    // --- 4. Data Fetching Logic (UPDATED for hashtagLimit default and postLength default) ---
    useEffect(() => {
        setMounted(true);
        const fetchOptions = async () => {
            try {
                const response = await fetch(API.CAPTION_HASHTAG_GET_FIELD_OPTIONS, {
                    headers: { Authorization: getAuthHeader(), 'Content-Type': 'application/json' },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch options');
                }
                const result = await response.json();

                if (result.status_code === 1 && result.data) {
                    setApiOptions(result.data);
                    // Set initial form values based on API defaults
                    const defaultPlatform = result.data.caption_platform[0]?.key || '';
                    const defaultTone = result.data.caption_tone_of_voice[0]?.key || '';
                    const defaultLanguage = result.data.caption_language_locale.find(o => o.key === 'en_global')?.key || result.data.caption_language_locale[0]?.key || 'en_global';
                    const defaultEmotionalIntent = result.data.caption_emotional_intent[0]?.key || '';
                    const defaultCta = result.data.caption_cta_type.find(o => o.key === 'caption_cta_1')?.key || result.data.caption_cta_type[0]?.key || '';
                    const defaultCaptionStyle = result.data.caption_style[0]?.key || '';
                    const defaultHashtagStyle = result.data.caption_hashtag_style[0]?.key || '';
                    const defaultPostLength = result.data.caption_post_length[0]?.key || '';
                    // Set default for Hashtag Limit from API
                    const defaultHashtagLimit = result.data.caption_hashtag_limit?.find(o => o.key === '15')?.key || result.data.caption_hashtag_limit?.[0]?.key || '15';

                    setFormData(prev => ({
                        ...prev,
                        platform: defaultPlatform,
                        toneOfVoice: defaultTone,
                        language: defaultLanguage,
                        emotionalIntent: defaultEmotionalIntent,
                        postLength: defaultPostLength,
                        includeCtaType: defaultCta,
                        captionStyle: defaultCaptionStyle,
                        hashtagStyle: defaultHashtagStyle,
                        hashtagLimit: defaultHashtagLimit,
                    }));
                } else {
                    setError('Failed to load options: API returned an unsuccessful status or no data.');
                }
            } catch (err) {
                console.error("Error fetching API options:", err);
                setError(`Network error or configuration issue: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOptions();
    }, []);

    // --- Handlers (Unchanged for generic behavior) ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            if (name === 'formattingOptions') {
                if (!checked && value === 'mentions') {
                    return {
                        ...prev,
                        mentionHandles: [],
                        [name]: prev[name].filter(v => v !== value)
                    };
                }
                return {
                    ...prev,
                    [name]: checked
                        ? [...prev[name], value]
                        : prev[name].filter(v => v !== value)
                };
            }
            return { ...prev, [name]: type === 'checkbox' ? checked : value };
        });
    };

    const handleAudienceInput = (e) => {
        const value = e.target.value;
        setAudienceInput(value);
        setShowAudienceSuggestions(value.length > 0);
    };

    const handleArrayChange = (e, field) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            e.preventDefault();
            const newItem = e.target.value.trim();
            const maxItems = field === 'requiredKeywords' ? 30 : 10;
            if (formData[field].length < maxItems) {
                setFormData(prev => ({ ...prev, [field]: [...prev[field], newItem] }));
                e.target.value = '';
            }
        }
    };

    const addAudienceChip = (chip) => {
        if (!chip.trim()) return;
        const value = chip.trim();
        if (!formData.targetAudience.includes(value) && formData.targetAudience.length < 10) {
            setFormData(prev => ({
                ...prev,
                targetAudience: [...prev.targetAudience, value]
            }));
        }
        setAudienceInput('');
        setShowAudienceSuggestions(false);
    };

    const removeItem = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    // --- HANDLER: Show Summary Modal ---
    const handleSubmit = (e) => {
        e.preventDefault();

        if (formData.formattingOptions.includes('mentions') && (!formData.mentionHandles || formData.mentionHandles.length === 0)) {
            showNotification('Please add at least one mention when "Add Mentions" is selected', 'error');
            return;
        }

        if (formData.postLengthSelection === 'custom') {
            const customLen = parseInt(formData.customPostLength, 10);
            if (!Number.isFinite(customLen)) {
                showNotification('Please enter a valid Custom Post Length', 'error');
                return;
            }
        }

        // Basic Validation check for required fields
        if (!formData.postTheme || !formData.primaryGoal || formData.targetAudience.length === 0 ||
            (formData.platformType === 'predefined' && !formData.platform) ||
            (formData.platformType === 'custom' && !formData.customPlatform) ||
            (formData.toneSelection === 'predefined' && !formData.toneOfVoice) ||
            (formData.toneSelection === 'custom' && !formData.customTone)
        ) {
            showNotification('Please fill in all required fields (*)', 'error');
            return;
        }

        setShowSummary(true);
    };

    // --- HANDLER: Hide Summary Modal ---
    const handleEdit = () => {
        setShowSummary(false);
        // Optional: Scroll back to the top of the form 
        const el = document.getElementById('caption-form-top');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    const handleGenerate = async () => {
        try {
            abortAllStreams();
            sessionRequestIdRef.current = createSessionRequestId();
            setIsGenerating(true);
            setIsHistoryView(false);
            showNotification('Generating captions and hashtags...', 'info');

            const customPostLengthInt = formData.postLengthSelection === 'custom' ? parseInt(formData.customPostLength, 10) : null;
            if (formData.postLengthSelection === 'custom' && !Number.isFinite(customPostLengthInt)) {
                showNotification('Please enter a valid Custom Post Length', 'error');
                setIsGenerating(false);
                return;
            }

            // 1. Construct the API Payload
            const platformPayload = getOptionDetails('caption_platform', formData.platform, formData.customPlatform, formData.platformType);
            const tonePayload = getOptionDetails('caption_tone_of_voice', formData.toneOfVoice, formData.customTone, formData.toneSelection);
            const ctaPayload = getOptionDetails('caption_cta_type', formData.includeCtaType, formData.customCta, formData.ctaSelection);
            const languagePayload = getOptionDetails('caption_language_locale', formData.language, formData.customLanguage, formData.languageSelection);
            const emotionalIntentPayload = getOptionDetails('caption_emotional_intent', formData.emotionalIntent, formData.customEmotionalIntent, formData.emotionalIntentSelection);
            const postLengthPayload = getOptionDetails('caption_post_length', formData.postLength, formData.customPostLength, formData.postLengthSelection);
            const captionStylePayload = getOptionDetails('caption_style', formData.captionStyle, formData.customCaptionStyle, formData.captionStyleSelection);
            const hashtagStylePayload = getOptionDetails('caption_hashtag_style', formData.hashtagStyle, formData.customHashtagStyle, formData.hashtagStyleSelection);
            const hashtagLimitDetails = getOptionDetails('caption_hashtag_limit', formData.hashtagLimit, null, 'predefined');

            const formattedOptions = formData.formattingOptions.map(key => {
                const detail = formattingOptionsList.find(opt => opt.value === key);
                return detail ? detail.apiValue : key;
            });

            // 2. Build the final payload
            const payload = {
                platform: platformPayload,
                post_topic: formData.postTheme,
                primary_goal: formData.primaryGoal,
                tone_of_voice: tonePayload,
                target_audience: formData.targetAudience,
                number_of_variants: parseInt(formData.variants, 10),
                required_keywords: formData.requiredKeywords,
                language_locale: languagePayload,
                emotional_intent: emotionalIntentPayload,
                post_length: formData.postLengthSelection === 'custom'
                    ? { type: 'custom', id: null, value: String(customPostLengthInt) }
                    : { type: 'predefined', id: postLengthPayload.id, value: postLengthPayload.value },
                caption_style: captionStylePayload,
                cta_type: ctaPayload,
                custom_cta_text: ctaPayload.type === 'custom' ? formData.customCta : null,
                number_of_ctas: formData.includeCtaType !== ctaTypeOptions.find(o => o.label === 'No CTA')?.key ? parseInt(formData.numberOfCta, 10) : 0,
                formatting_options: formattedOptions,
                mentions: formData.formattingOptions.includes('mentions') ? (formData.mentionHandles || []) : [],
                hashtag_style: hashtagStylePayload,
                hashtag_limit: { type: 'predefined', id: hashtagLimitDetails.id },
                exclude_words: formData.excludeWords,
                creativity_level: parseInt(formData.creativityLevel, 10),
                proofread_optimize: formData.proofread,
                compliance_notes: formData.complianceNotes,
                session_request_id: sessionRequestIdRef.current,
            };

            const variantCount = Math.max(1, parseInt(payload?.number_of_variants || 1, 10));
            const clientRequestKey = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

            setRequestId(null);
            setGeneratedVariantsData({
                requestId: null,
                variants: Array.from({ length: variantCount }).map((_, index) => ({
                    client_id: `${clientRequestKey}-${index}`,
                    id: null,
                    content: '',
                    show_variant: true,
                    is_streaming: true,
                })),
                inputs: payload,
                requestId: null,
            });
            setShowVariantsModal(true);
            setShowSummary(false);

            const streamSingleVariant = async (variantIndex) => {
                const controller = new AbortController();
                streamControllersRef.current = [...(streamControllersRef.current || []), controller];

                try {
                    const payloadForStream = { ...payload, number_of_variants: 1 };

                    const response = await fetch(API.CAPTION_HASHTAG_GENERATE_STREAM, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': getAuthHeader(),
                        },
                        body: JSON.stringify(payloadForStream),
                        signal: controller.signal,
                    });

                    if (!response.ok) {
                        let errorData = {};
                        try {
                            errorData = await response.json();
                        } catch (e) {
                        }
                        throw new Error(errorData.message || `API call failed with status: ${response.status}`);
                    }

                    if (!response.body) {
                        throw new Error('Streaming is not supported in this browser/environment');
                    }

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder('utf-8');
                    let buffer = '';

                    const processLine = (rawLine) => {
                        if (!rawLine) return;
                        let line = rawLine.trim();
                        if (!line) return;
                        if (line.startsWith('data:')) {
                            line = line.slice('data:'.length).trim();
                        }
                        if (!line) return;

                        let msg;
                        try {
                            msg = JSON.parse(line);
                        } catch (e) {
                            buffer = `${line}\n${buffer}`;
                            return;
                        }

                        if (!msg || typeof msg !== 'object') return;

                        if (msg.type === 'meta') {
                            if (msg.request_id) {
                                setRequestId((prev) => prev || msg.request_id);
                                setGeneratedVariantsData((prev) => ({ ...prev, requestId: prev.requestId || msg.request_id }));
                            }
                            if (msg.variant_id) {
                                setGeneratedVariantsData((prev) => {
                                    const next = [...(prev.variants || [])];
                                    if (next[variantIndex]) {
                                        next[variantIndex] = { ...next[variantIndex], id: msg.variant_id };
                                    }
                                    return { ...prev, variants: next };
                                });
                            }
                            return;
                        }

                        if (msg.type === 'delta') {
                            const deltaText = msg.content || '';
                            if (!deltaText) return;
                            setGeneratedVariantsData((prev) => {
                                const next = [...(prev.variants || [])];
                                if (next[variantIndex]) {
                                    next[variantIndex] = {
                                        ...next[variantIndex],
                                        content: `${next[variantIndex].content || ''}${deltaText}`,
                                    };
                                }
                                return { ...prev, variants: next };
                            });
                            return;
                        }

                        if (msg.type === 'done') {
                            if (msg.request_id) {
                                setRequestId((prev) => prev || msg.request_id);
                                setGeneratedVariantsData((prev) => ({ ...prev, requestId: prev.requestId || msg.request_id }));
                            }
                            setGeneratedVariantsData((prev) => {
                                const next = [...(prev.variants || [])];
                                if (next[variantIndex]) {
                                    next[variantIndex] = {
                                        ...next[variantIndex],
                                        id: next[variantIndex].id || msg.variant_id || null,
                                        content: msg.content || next[variantIndex].content || '',
                                        is_streaming: false,
                                    };
                                }
                                return { ...prev, variants: next };
                            });
                        }
                    };

                    try {
                        for (;;) {
                            const { value, done } = await reader.read();
                            if (done) break;

                            buffer += decoder.decode(value, { stream: true });
                            const parts = buffer.split(/\r?\n/);
                            buffer = parts.pop() || '';
                            parts.forEach(processLine);
                        }

                        const final = buffer.trim();
                        if (final) {
                            processLine(final);
                        }
                    } finally {
                        try {
                            reader.releaseLock();
                        } catch (e) {
                        }
                    }
                } finally {
                    streamControllersRef.current = (streamControllersRef.current || []).filter((c) => c !== controller);
                }
            };

            const results = await Promise.allSettled(
                Array.from({ length: variantCount }).map((_, index) => streamSingleVariant(index))
            );

            const hasError = results.some(r => r.status === 'rejected');
            if (hasError) {
                setGeneratedVariantsData((prev) => {
                    const next = (prev.variants || []).map((v, i) => {
                        const r = results[i];
                        if (r && r.status === 'rejected') {
                            return {
                                ...v,
                                is_streaming: false,
                                content: (v.content || '') || (r.reason?.message ? `Error: ${r.reason.message}` : 'Error: Failed to generate'),
                            };
                        }
                        return v;
                    });
                    return { ...prev, variants: next };
                });
            } else {
                showNotification('Captions and hashtags generated successfully!', 'success');
            }

        } catch (submitError) {
            console.error('Submission Error:', submitError);
            showNotification(`Error: ${submitError.message || submitError.toString()}`, 'error');
        } finally {
            setIsGenerating(false);
            setIsSubmitting(false);
        }
    };

    const handleRegenerateVariant = async (variantId) => {
        const variantIndex = generatedVariantsData.variants.findIndex(v => v.id === variantId);
        if (variantIndex === -1) return;

        showNotification(`Regenerating Variant ${variantIndex + 1}...`, 'info');

        const controller = new AbortController();
        streamControllersRef.current = [...(streamControllersRef.current || []), controller];

        setGeneratedVariantsData((prev) => {
            const next = [...(prev.variants || [])];
            if (next[variantIndex]) {
                next[variantIndex] = {
                    ...next[variantIndex],
                    content: '',
                    is_streaming: true,
                };
            }
            return { ...prev, variants: next };
        });

        try {
            const response = await fetch(API.CAPTION_HASHTAG_REGENERATE_VARIANT(variantId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': getAuthHeader(),
                },
                signal: controller.signal,
            });

            if (!response.ok) {
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch (e) {
                }
                throw new Error(errorData.message || `Regeneration failed with status: ${response.status}`);
            }

            if (!response.body) {
                const result = await response.json();

                setGeneratedVariantsData((prev) => {
                    const next = [...(prev.variants || [])];
                    if (next[variantIndex]) {
                        next[variantIndex] = {
                            ...next[variantIndex],
                            content: result?.new_content || '',
                            is_streaming: false,
                        };
                    }
                    return { ...prev, variants: next };
                });
                showNotification(`Variant ${variantIndex + 1} successfully regenerated!`, 'success');
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let sawAnyDelta = false;
            let sawDone = false;

            const processLine = (rawLine) => {
                if (!rawLine) return;
                let line = rawLine.trim();
                if (!line) return;
                if (line.startsWith('data:')) {
                    line = line.slice('data:'.length).trim();
                }
                if (!line) return;

                let msg;
                try {
                    msg = JSON.parse(line);
                } catch (e) {
                    buffer = `${line}\n${buffer}`;
                    return;
                }

                if (!msg || typeof msg !== 'object') return;

                if (msg.type === 'meta') {
                    if (msg.request_id) {
                        setRequestId((prev) => prev || msg.request_id);
                        setGeneratedVariantsData((prev) => ({ ...prev, requestId: prev.requestId || msg.request_id }));
                    }
                    if (msg.variant_id) {
                        setGeneratedVariantsData((prev) => {
                            const next = [...(prev.variants || [])];
                            if (next[variantIndex]) {
                                next[variantIndex] = { ...next[variantIndex], id: msg.variant_id };
                            }
                            return { ...prev, variants: next };
                        });
                    }
                    return;
                }

                if (msg.type === 'delta') {
                    const deltaText = msg.content || '';
                    if (!deltaText) return;
                    sawAnyDelta = true;
                    setGeneratedVariantsData((prev) => {
                        const next = [...(prev.variants || [])];
                        if (next[variantIndex]) {
                            next[variantIndex] = {
                                ...next[variantIndex],
                                content: `${next[variantIndex].content || ''}${deltaText}`,
                                is_streaming: true,
                            };
                        }
                        return { ...prev, variants: next };
                    });
                    return;
                }

                if (msg.type === 'done') {
                    sawDone = true;
                    if (msg.request_id) {
                        setRequestId((prev) => prev || msg.request_id);
                        setGeneratedVariantsData((prev) => ({ ...prev, requestId: prev.requestId || msg.request_id }));
                    }
                    setGeneratedVariantsData((prev) => {
                        const next = [...(prev.variants || [])];
                        if (next[variantIndex]) {
                            next[variantIndex] = {
                                ...next[variantIndex],
                                id: next[variantIndex].id || msg.variant_id || null,
                                content: msg.content || next[variantIndex].content || '',
                                is_streaming: false,
                            };
                        }
                        return { ...prev, variants: next };
                    });
                }
            };

            try {
                for (;;) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const parts = buffer.split(/\r?\n/);
                    buffer = parts.pop() || '';
                    parts.forEach(processLine);
                }

                const final = buffer.trim();
                if (final) {
                    processLine(final);
                }
            } finally {
                try {
                    reader.releaseLock();
                } catch (e) {
                }
            }

            setGeneratedVariantsData((prev) => {
                const next = [...(prev.variants || [])];
                if (next[variantIndex]) {
                    next[variantIndex] = {
                        ...next[variantIndex],
                        is_streaming: false,
                    };
                }
                return { ...prev, variants: next };
            });

            if (sawDone || sawAnyDelta) {
                showNotification(`Variant ${variantIndex + 1} successfully regenerated!`, 'success');
            }

        } catch (error) {
            console.error('Regeneration Error:', error);
            if (error?.name !== 'AbortError') {
                showNotification(`Regeneration Error: ${error.message}`, 'error');
            }
            setGeneratedVariantsData((prev) => {
                const next = [...(prev.variants || [])];
                if (next[variantIndex]) {
                    next[variantIndex] = {
                        ...next[variantIndex],
                        is_streaming: false,
                    };
                }
                return { ...prev, variants: next };
            });
        } finally {
            streamControllersRef.current = (streamControllersRef.current || []).filter((c) => c !== controller);
        }
    };

    // --- FIXED handleViewLog Function ---
    const handleViewLog = async () => {
        if (!requestId) {
            console.error('No previous copywriting request_id found for log viewing.');
            alert('No previous generation found to view log.');
            return;
        }

        setIsGenerating(true);         // reuse existing generating flag for buttons
        setModalTitle('Variants Log'); // set title for log view
        setIsHistoryView(true);

        try {
            const response = await fetch(API.CAPTION_HASHTAG_GET_VARIANTS_LOG(requestId), {
                headers: {
                    Authorization: getAuthHeader(),
                },
            });

            if (!response.ok) {
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch (e) {
                    // ignore parse error
                }
                const errorMessage = errorData.message || response.statusText;
                console.error('Failed to fetch variants log:', errorData || response.statusText);
                alert('Failed to load log. Check console for details.');

                // Set error data in the expected object structure
                setGeneratedVariantsData({
                    requestId: requestId,
                    variants: [{ id: 'error', content: `Error loading log: ${errorMessage}`, isLog: true }],
                    inputs: {}
                });
            } else {
                const result = await response.json();

                if (result.variants && Array.isArray(result.variants) && result.variants.length > 0) {
                    const structuredVariants = result.variants.map((content, index) => ({
                        id: content.id || `temp-${Date.now()}-${index}`,
                        content: content.content || content,
                        show_variant: content.show_variant || true,
                    }));

                    setGeneratedVariantsData({
                        variants: structuredVariants,
                        inputs: result.inputs,
                        requestId: result.request_id
                    });
                    setShowVariantsModal(true);
                } else {
                    console.error('Variants log returned no variants:', result);
                    alert('No variants found in the log for this request.');
                    setGeneratedVariantsData({
                        requestId: requestId,
                        variants: [{ id: 'empty-log', content: 'Log was successfully fetched but contained no variant entries.', isLog: true }],
                        inputs: result.inputs || {},
                    });
                    setShowVariantsModal(true);
                }
            }
        } catch (err) {
            console.error('Error while fetching variants log:', err);
            alert('Error while loading log. Check console for details.');
            setGeneratedVariantsData({
                requestId: requestId,
                variants: [{ id: 'fatal-error', content: `Fatal Error: ${err.message}`, isLog: true }],
                inputs: {}
            });
            setShowVariantsModal(true);
        } finally {
            setIsGenerating(false);
            setIsHistoryView(false);
        }
    };
    // --- END FIXED handleViewLog Function ---

    const handleReset = () => {
        abortAllStreams();
        const defaultPlatform = platformOptions[0]?.key || '';
        const defaultTone = toneOptions[0]?.key || '';
        const defaultLanguage = languageOptions.find(o => o.key === 'en_global')?.key || languageOptions[0]?.key || 'en_global';
        const defaultEmotionalIntent = emotionalIntentOptions[0]?.key || ''; // Default Emotional Intent
        const defaultCta = ctaTypeOptions.find(o => o.key === 'caption_cta_1')?.key || ctaTypeOptions[0]?.key || '';
        const defaultCaptionStyle = captionStyleOptions[0]?.key || '';
        const defaultHashtagStyle = hashtagStyleOptions[0]?.key || '';
        const defaultPostLength = postLengthOptions[0]?.key || '';
        // Reset Hashtag Limit to its new default
        const defaultHashtagLimit = hashtagLimitOptions?.find(o => o.key === '15')?.key || hashtagLimitOptions?.[0]?.key || '15';


        setFormData({
            platformType: 'predefined',
            platform: defaultPlatform,
            customPlatform: '',
            postTheme: '',
            primaryGoal: '',
            toneSelection: 'predefined',
            toneOfVoice: defaultTone,
            customTone: '',
            targetAudience: [],
            variants: 1,
            showAdvanced: false,
            requiredKeywords: [],
            mentionHandles: [],
            // Reset new fields to defaults
            languageSelection: 'predefined',
            language: defaultLanguage,
            customLanguage: '',
            emotionalIntentSelection: 'predefined',
            emotionalIntent: defaultEmotionalIntent,
            customEmotionalIntent: '',
            postLength: defaultPostLength,
            formattingOptions: [],
            ctaSelection: 'predefined', // Reset CTA toggle
            includeCtaType: defaultCta,
            customCta: '',
            numberOfCtaSelection: 'predefined',
            numberOfCta: 1,
            captionStyleSelection: 'predefined', // Reset Caption Style toggle
            captionStyle: defaultCaptionStyle,
            customCaptionStyle: '',
            hashtagStyleSelection: 'predefined', // Reset Hashtag Style toggle
            hashtagStyle: defaultHashtagStyle,
            customHashtagStyle: '',
            // End of new field resets
            excludeWords: [],
            creativityLevel: 5,
            proofread: true,
            hashtagLimit: defaultHashtagLimit, // <--- RESET DEFAULT
            complianceNotes: ''
        });
        setShowSummary(false); // Hide summary on reset
        showNotification('Form has been reset', 'info');
    };

    const toggleAdvanced = () => {
        setFormData(prev => ({
            ...prev,
            showAdvanced: !prev.showAdvanced
        }));
    };

    // [ ... styles remain the same ...]
    const styles = {
        container: { maxWidth: '1100px', margin: '0 auto', padding: '10px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', backgroundColor: '#0a0e1a', minHeight: '100vh' },
        card: { backgroundColor: '#141b2d', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid #1e293b' },
        header: { padding: '24px 32px' },
        title: { margin: 0, fontSize: '24px', fontWeight: '600', color: '#f8fafc' },
        subtitle: { margin: '6px 0 0', fontSize: '15px', color: '#94a3b8' },
        // formGroup: { marginBottom: '8px' },
        label: { display: 'block', marginBottom: '6px', fontSize: '16px', fontWeight: '500', color: '#e2e8f0' },
        input: { width: '100%', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5', color: '#e2e8f0', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', transition: 'all 0.15s ease-in-out', boxSizing: 'border-box' },
        select: { width: '100%', height: '42px', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5', color: '#e2e8f0', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', transition: 'all 0.15s ease-in-out', boxSizing: 'border-box', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'\x3e\x3c/polyline\x3e\x3c/svg\x3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '20px', paddingRight: '40px', cursor: 'pointer' },
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
        checkboxItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '6px',
            transition: 'background-color 0.2s',
            '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
            }
        },
        toolTip: { width: '40%' },
        checkboxInput: {
            width: '18px',
            height: '18px',
            margin: 0,
            cursor: 'pointer',
            accentColor: '#3b82f6',
            backgroundColor: '#0f1624',
            border: '2px solid #64748b',
            borderRadius: '4px',
            outline: 'none',
            transition: 'all 0.2s ease',
        },
        radioGroup: { display: 'flex', gap: '16px', marginTop: '14px', marginBottom: '10px' },
        radioItem: { display: 'flex', alignItems: 'center', gap: '8px' },
        toast: { position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', color: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999 },
    };

    // --- Layout Helpers (Unchanged) ---
    const COLUMN_GAP = '20px';
    const twoColContainerStyle = {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: COLUMN_GAP,
        marginBottom: '8px',
        width: '100%'
    };
    const colHalfStyle = {
        flex: '1 1 calc(50% - 10px)',
    };
    const colFullStyle = {
        width: '100%',
        marginBottom: '8px',
    };


    // --- Conditional Rendering: Loading & Error States (Unchanged) ---
    if (!mounted || isLoading) return <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px', color: '#3b82f6' }}>
            ⏳ **Loading form options from API...** Please wait.
        </div>
    </div>;

    if (error || platformOptions.length === 0) return <div style={{ ...styles.container, color: '#ef4444' }}>
        <div style={{ textAlign: 'center', padding: '50px', border: '1px solid #ef4444', borderRadius: '8px' }}>
            🛑 **Error Loading Form Data:** {error || 'API data fields are empty. Check API endpoint and authorization.'}
        </div>
    </div>;

    // --- Main Render ---
    return (
        <div style={styles.container}>
            {/* Notification Toast */}
            {notification.show && (
                <div style={{
                    ...styles.toast,
                    backgroundColor: notification.type === 'success' ? '#10b981' : notification.type === 'error' ? '#ef4444' : '#3b82f6'
                }}>
                    {notification.message}
                </div>
            )}
            {/* Header */}
                <div style={styles.header} id="caption-form-top">
                    <h1 style={styles.title}>Caption & Hashtag Generator</h1>
                    <p style={styles.subtitle}>Create engaging captions and hashtags for your social media posts</p>
                </div>

            <div style={styles.card}>

                <div style={{ padding: '24px' }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: COLUMN_GAP, width: '100%' }}>
                            {/* Main (non-advanced) fields */}
                            {!formData.showAdvanced && (
                                <>
                                    {/* ROW 1: Post Theme/Topic (Full Width Textarea) */}
                                    <div style={colFullStyle}>
                                        <div style={styles.formGroup}>
                                            <label htmlFor="postTheme" style={styles.label}>
                                                Post Theme / Topic <span style={{ color: '#ef4444' }}>*</span>
                                                <span style={styles.infoIcon} data-tooltip-id="postTheme-tooltip" data-tooltip-content="Describe the main theme or topic of your post (max 1200 characters)">i</span>
                                            </label>
                                            <Tooltip style={styles.toolTip} id="postTheme-tooltip" />
                                            <textarea
                                                id="postTheme"
                                                name="postTheme"
                                                value={formData.postTheme}
                                                onChange={handleChange}
                                                style={{ ...styles.textarea, minHeight: '100px' }}
                                                maxLength={1200}
                                                placeholder="What is your post about?"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* ROW 2: Primary Goal (Full Width Input) */}
                                    <div style={colFullStyle}>
                                        <div style={styles.formGroup}>
                                            <label htmlFor="primaryGoal" style={styles.label}>
                                                Primary Goal <span style={{ color: '#ef4444' }}>*</span>
                                                <span style={styles.infoIcon} data-tooltip-id="primaryGoal-tooltip" data-tooltip-content="What is the main goal of this post? (e.g., drive traffic, increase engagement, announce launch)">i</span>
                                            </label>
                                            <Tooltip style={styles.toolTip} id="primaryGoal-tooltip" />
                                            <input
                                                type="text"
                                                id="primaryGoal"
                                                name="primaryGoal"
                                                value={formData.primaryGoal}
                                                onChange={handleChange}
                                                style={styles.input}
                                                maxLength={300}
                                                placeholder="e.g., Increase engagement, drive traffic to website, etc."
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* ROW 3: Target Audience Tags (Full Width) */}
                                    <div style={colFullStyle}>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>
                                                Target Audience <span style={{ color: '#ef4444' }}>*</span>
                                                <span
                                                    style={styles.infoIcon}
                                                    data-tooltip-id="targetAudience-tooltip"
                                                    data-tooltip-html="Describe who you want to reach with this ad. Include audience characteristics like age, profession, interests, and behavior. This helps generate messaging that speaks directly to the right people and increases conversions."
                                                >
                                                    i
                                                </span>
                                            </label>

                                            <Tooltip style={styles.toolTip} id="targetAudience-tooltip" />

                                            {/* Chips container */}
                                            <div style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '8px',
                                                marginBottom: '8px',
                                                minHeight: '40px',
                                                alignItems: 'center',
                                                padding: '4px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '6px',
                                                backgroundColor: formData.targetAudience.length > 0 ? '#f9fafb' : 'white'
                                            }}>
                                                {formData.targetAudience.length === 0 && (
                                                    <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                                                        Add audience segments (e.g., 'Women 25-34', 'Fitness Enthusiasts')
                                                    </span>
                                                )}

                                                {formData.targetAudience.map((chip, index) => (
                                                    <span
                                                        key={index}
                                                        style={{
                                                            ...styles.badge,
                                                            ...styles.badgePrimary,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '4px 10px'
                                                        }}
                                                    >
                                                        {chip}
                                                        <RemoveTagButton
                                                            style={styles.removeBtn}
                                                            onClick={() => removeItem('targetAudience', index)}
                                                        />
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Input + Suggestions */}
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="text"
                                                    value={audienceInput}
                                                    onChange={handleAudienceInput}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && audienceInput.trim()) {
                                                            e.preventDefault();
                                                            addAudienceChip(audienceInput.trim());
                                                        }
                                                    }}
                                                    onBlur={(e) => {
                                                                if (audienceInput.trim()) {
                                                                    addAudienceChip(audienceInput.trim());
                                                                }
                                                            }}
                                                    style={{
                                                        ...styles.input,
                                                        marginBottom: 0,
                                                        borderBottomLeftRadius: showAudienceSuggestions ? '0' : '6px',
                                                        borderBottomRightRadius: showAudienceSuggestions ? '0' : '6px'
                                                    }}
                                                    placeholder="Type and press Enter to add audience segments"
                                                    required={formData.targetAudience.length === 0}
                                                    inputMode='text'
                                                />

                                                {showAudienceSuggestions && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        left: 0,
                                                        right: 0,
                                                        backgroundColor: 'white',
                                                        border: '1px solid #d1d5db',
                                                        borderTop: 'none',
                                                        borderBottomLeftRadius: '6px',
                                                        borderBottomRightRadius: '6px',
                                                        zIndex: 1000,
                                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                                        maxHeight: '200px',
                                                        overflowY: 'auto'
                                                    }}>
                                                        {Object.entries(audienceSuggestions).map(([category, suggestions]) => {
                                                            const filtered = suggestions.filter(s =>
                                                                s.toLowerCase().includes(audienceInput.toLowerCase()) &&
                                                                !formData.targetAudience.includes(s)
                                                            );
                                                            if (filtered.length === 0) return null;

                                                            return (
                                                                <div key={category}>
                                                                    <div style={{
                                                                        padding: '8px 12px',
                                                                        fontSize: '12px',
                                                                        fontWeight: 600,
                                                                        color: '#4b5563',
                                                                        backgroundColor: '#f3f4f6',
                                                                        textTransform: 'uppercase',
                                                                        letterSpacing: '0.05em'
                                                                    }}>
                                                                        {category}
                                                                    </div>

                                                                    {filtered.map((suggestion, idx) => (
                                                                        <div
                                                                            key={idx}
                                                                            onClick={() => {
                                                                                addAudienceChip(suggestion);
                                                                                setAudienceInput('');
                                                                            }}
                                                                            style={{
                                                                                padding: '8px 16px',
                                                                                cursor: 'pointer'
                                                                            }}
                                                                        >
                                                                            {suggestion}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        })}

                                                        {/* Custom audience option */}
                                                        {audienceInput && !Object.values(audienceSuggestions)
                                                            .flat()
                                                            .some(s => s.toLowerCase() === audienceInput.toLowerCase()) && (
                                                                <div
                                                                    onClick={() => {
                                                                        addAudienceChip(audienceInput);
                                                                        setAudienceInput('');
                                                                    }}
                                                                    style={{
                                                                        padding: '8px 16px',
                                                                        cursor: 'pointer',
                                                                        backgroundColor: '#f8fafc',
                                                                        borderTop: '1px solid #e5e7eb',
                                                                        color: '#3b82f6',
                                                                        fontWeight: 500
                                                                    }}
                                                                >
                                                                    Add "{audienceInput}" as custom audience
                                                                </div>
                                                            )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>


                                    {/* ROW 4: Platform Input + Tone Input (2 Columns - Existing Logic) */}
                                    <div style={twoColContainerStyle}>
                                        {/* Platform Dropdown or Custom Platform Input (Left Half) */}
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>
                                                    Platform & Post Type <span style={{ color: '#ef4444' }}>*</span>
                                                    <span style={styles.infoIcon} data-tooltip-id="platformType-tooltip" data-tooltip-content="Select whether to use a predefined platform/post type or enter a custom one">i</span>
                                                </label>
                                                <Tooltip style={styles.toolTip} id="platformType-tooltip" />
                                                <div style={styles.radioGroup}>
                                                    <label style={styles.radioItem}>
                                                        <input
                                                            type="radio"
                                                            name="platformType"
                                                            value="predefined"
                                                            checked={formData.platformType === 'predefined'}
                                                            onChange={handleChange}
                                                            style={{ marginRight: '8px' }}
                                                            required
                                                        />
                                                        Predefined
                                                    </label>
                                                    <label style={styles.radioItem}>
                                                        <input
                                                            type="radio"
                                                            name="platformType"
                                                            value="custom"
                                                            checked={formData.platformType === 'custom'}
                                                            onChange={handleChange}
                                                            style={{ marginRight: '8px' }}
                                                            required
                                                        />
                                                        Custom
                                                    </label>
                                                </div>
                                                {formData.platformType === 'predefined' ? (
                                                    <div>
                                                        <div style={styles.formGroup}>
                                                            <select
                                                                id="platform"
                                                                name="platform"
                                                                value={formData.platform}
                                                                onChange={handleChange}
                                                                style={styles.select}
                                                                required={formData.platformType === 'predefined'}
                                                            >
                                                                <option value="">Select Platform & Post Type</option>
                                                                {platformOptions.map((platform) => (
                                                                    <option key={platform.key} value={platform.key}>{platform.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div style={styles.formGroup}>
                                                            {/* <label htmlFor="customPlatform" style={styles.label}>
                                                                Custom Platform Description <span style={{ color: '#ef4444' }}>*</span>
                                                                <span style={styles.infoIcon} data-tooltip-id="customPlatform-tooltip" data-tooltip-content="Enter a description of your custom platform and desired post type">i</span>
                                                            </label> */}
                                                            <Tooltip style={styles.toolTip} id="customPlatform-tooltip" />
                                                            <input
                                                                type="text"
                                                                id="customPlatform"
                                                                name="customPlatform"
                                                                value={formData.customPlatform}
                                                                onChange={handleChange}
                                                                style={styles.input}
                                                                maxLength={50}
                                                                placeholder="e.g., Email newsletter snippet, Product flyer text"
                                                                required={formData.platformType === 'custom'}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>


                                        {/* Tone Selection Radio/Dropdown (Right Half - Existing Logic) */}
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>
                                                    Tone Selection <span style={{ color: '#ef4444' }}>*</span>
                                                    <span style={styles.infoIcon} data-tooltip-id="toneSelection-tooltip" data-tooltip-content="Select whether to use a predefined tone or enter a custom one">i</span>
                                                </label>
                                                <Tooltip style={styles.toolTip} id="toneSelection-tooltip" />
                                                <div style={styles.radioGroup}>
                                                    <label style={styles.radioItem}>
                                                        <input
                                                            type="radio"
                                                            name="toneSelection"
                                                            value="predefined"
                                                            checked={formData.toneSelection === 'predefined'}
                                                            onChange={handleChange}
                                                            style={{ marginRight: '8px' }}
                                                            required
                                                        />
                                                        Predefined
                                                    </label>
                                                    <label style={styles.radioItem}>
                                                        <input
                                                            type="radio"
                                                            name="toneSelection"
                                                            value="custom"
                                                            checked={formData.toneSelection === 'custom'}
                                                            onChange={handleChange}
                                                            style={{ marginRight: '8px' }}
                                                            required
                                                        />
                                                        Custom
                                                    </label>
                                                </div>

                                                {formData.toneSelection === 'predefined' ? (
                                                    <select
                                                        id="toneOfVoice"
                                                        name="toneOfVoice"
                                                        value={formData.toneOfVoice}
                                                        onChange={handleChange}
                                                        style={{ ...styles.select }}
                                                        required={formData.toneSelection === 'predefined'}
                                                    >
                                                        <option value="">Select Tone of Voice</option>
                                                        {toneOptions.map((tone) => (
                                                            <option key={tone.key} value={tone.key}>{tone.label}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <div>
                                                        {/* <label htmlFor="customTone" style={styles.label}>
                                                            Custom Tone <span style={{ color: '#ef4444' }}>*</span>
                                                            <span style={styles.infoIcon} data-tooltip-id="customTone-tooltip" data-tooltip-content="Describe your custom tone (max 60 characters)">i</span>
                                                        </label> */}
                                                        <Tooltip style={styles.toolTip} id="customTone-tooltip" />
                                                        <input
                                                            type="text"
                                                            id="customTone"
                                                            name="customTone"
                                                            value={formData.customTone}
                                                            onChange={handleChange}
                                                            style={styles.input}
                                                            maxLength={60}
                                                            placeholder="e.g., Playful and witty"
                                                            required={formData.toneSelection === 'custom'}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ROW 5: Variants + Post Length (2 Columns) */}
                                    <div style={twoColContainerStyle}>
                                        {/* Number of Variants (Left Half) */}
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label htmlFor="variants" style={styles.label}>
                                                    Number of Variants: {formData.variants}
                                                    <span style={styles.infoIcon} data-tooltip-id="variants-tooltip" data-tooltip-content="Choose how many caption variations to generate">i</span>
                                                </label>
                                                <Tooltip style={styles.toolTip} id="variants-tooltip" />
                                                <input
                                                    type="range"
                                                    id="variants"
                                                    name="variants"
                                                    min="1"
                                                    max="5"
                                                    value={formData.variants}
                                                    onChange={handleChange}
                                                    style={styles.rangeInput}
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

                                        {/* Post Length (Right Half) - with Predefined/Custom toggle */}
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label htmlFor="postLength" style={styles.label}>Post Length</label>

                                                {/* Mode toggle: Predefined vs Custom */}
                                                <div style={styles.radioGroup}>
                                                    <label style={styles.radioItem}>
                                                        <input
                                                            type="radio"
                                                            name="postLengthSelection"
                                                            value="predefined"
                                                            checked={formData.postLengthSelection === 'predefined'}
                                                            onChange={handleChange}
                                                        />
                                                        Predefined
                                                    </label>
                                                    <label style={styles.radioItem}>
                                                        <input
                                                            type="radio"
                                                            name="postLengthSelection"
                                                            value="custom"
                                                            checked={formData.postLengthSelection === 'custom'}
                                                            onChange={handleChange}
                                                        />
                                                        Custom
                                                    </label>
                                                </div>

                                                {formData.postLengthSelection === 'predefined' && (
                                                    <select
                                                        id="postLength"
                                                        name="postLength"
                                                        value={formData.postLength}
                                                        onChange={handleChange}
                                                        style={styles.select}
                                                    >
                                                        {postLengthOptions.map((option) => (
                                                            <option key={option.key} value={option.key}>{option.label}</option>
                                                        ))}
                                                    </select>
                                                )}

                                                {formData.postLengthSelection === 'custom' && (
                                                    <div>
                                                        <input
                                                            type="number"
                                                            id="customPostLength"
                                                            name="customPostLength"
                                                            value={formData.customPostLength}
                                                            onChange={(e) => {
                                                                let val = e.target.value;
                                                                // allow empty, otherwise clamp to 1-2000
                                                                if (val === '') {
                                                                    setFormData(prev => ({ ...prev, customPostLength: '' }));
                                                                    return;
                                                                }
                                                                const num = parseInt(val, 10);
                                                                if (isNaN(num)) return;
                                                                const clamped = Math.max(1, Math.min(500, num));
                                                                setFormData(prev => ({ ...prev, customPostLength: clamped.toString() }));
                                                            }}
                                                            min={1}
                                                            max={500}
                                                            step={1}
                                                            style={styles.input}
                                                            placeholder="Enter desired post length (1-500 characters)"
                                                        />
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                                                                <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                                                                    Custom post  length must be an integer between 1 and 500 characters.
                                                                </span>
                                                            </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ROW 6: Formatting Options (Full Width Checkboxes) */}
                                    <div style={colFullStyle}>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>
                                                Formatting Options
                                                <span style={styles.infoIcon} data-tooltip-id="formattingOptions-tooltip" data-tooltip-content="Select formatting options for your caption">i</span>
                                            </label>
                                            <Tooltip style={styles.toolTip} id="formattingOptions-tooltip" />
                                            <div style={styles.checkboxGroup}>
                                                {formattingOptionsList.map((option) => (
                                                    <label key={option.value} style={styles.checkboxItem}>
                                                        <input
                                                            type="checkbox"
                                                            name="formattingOptions"
                                                            value={option.value}
                                                            checked={formData.formattingOptions.includes(option.value)}
                                                            onChange={handleChange}
                                                            style={styles.checkboxInput}
                                                        />
                                                        {option.label}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {formData.formattingOptions.includes('mentions') && (
                                        <div style={colFullStyle}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>
                                                    Mentions <span style={{ color: '#ef4444' }}>*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    style={styles.input}
                                                    placeholder="Add a mention (e.g., @yourbrand) and press Enter"
                                                    onKeyPress={(e) => handleArrayChange(e, 'mentionHandles')}
                                                    onBlur={(e) => {
                                                        const value = e.target.value.trim();
                                                        if (value && formData.mentionHandles.length < 10) {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                mentionHandles: [...prev.mentionHandles, value]
                                                            }));
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                    disabled={formData.mentionHandles.length >= 10}
                                                    inputMode='text'
                                                />
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                                                    {formData.mentionHandles.map((mention, index) => (
                                                        <span key={index} style={{ ...styles.badge, ...styles.badgeSecondary }}>
                                                            {mention}
                                                            <RemoveTagButton
                                                                style={styles.removeBtn}
                                                                onClick={() => removeItem('mentionHandles', index)}
                                                            />
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <hr style={{ width: '100%', border: 'none', borderTop: '1px solid #334155', margin: '5px 0' }} />
                                </>
                            )}
                            {/* Advanced Features Toggle (Full Width) */}
                            <div className="col-12" style={{ margin: '16px 0' }}>
                                <ToggleButton showAdvanced={formData.showAdvanced} onToggle={toggleAdvanced} />
                            </div>
                            {formData.showAdvanced && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: COLUMN_GAP, width: '100%' }}>

                                    {/* ROW 7 (OLD ROW 8): CTA Type (Full Width) */}
                                    <div style={colFullStyle}>
                                        {/* CTA Type - UPDATED WITH TOGGLE */}
                                        <div>

                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>CTA Type</label>
                                                <div style={styles.radioGroup}>
                                                    <label style={styles.radioItem}>
                                                        <input type="radio" name="ctaSelection" value="predefined" checked={formData.ctaSelection === 'predefined'} onChange={handleChange} style={{ marginRight: '8px' }} />
                                                        Predefined
                                                    </label>
                                                    <label style={styles.radioItem}>
                                                        <input type="radio" name="ctaSelection" value="custom" checked={formData.ctaSelection === 'custom'} onChange={handleChange} style={{ marginRight: '8px' }} />
                                                        Custom
                                                    </label>
                                                </div>
                                                {formData.ctaSelection === 'predefined' ? (
                                                    <select
                                                        id="includeCtaType"
                                                        name="includeCtaType"
                                                        value={formData.includeCtaType}
                                                        onChange={handleChange}
                                                        style={styles.select}
                                                    >
                                                        <option value="">Select CTA Type</option>
                                                        {ctaTypeOptions.filter(cta => cta.key !== 'custom').map((cta) => (
                                                            <option key={cta.key} value={cta.key}>{cta.label}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        id="customCta"
                                                        name="customCta"
                                                        value={formData.customCta}
                                                        onChange={handleChange}
                                                        style={styles.input}
                                                        maxLength={100}
                                                        placeholder="e.g., Tap to explore the full eco-collection now."
                                                        required={formData.ctaSelection === 'custom'}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ROW 8: Number of CTAs (Full Width) */}
                                    <div style={colFullStyle}>
                                        <div style={styles.formGroup}>
                                            <label htmlFor="numberOfCta" style={styles.label}>
                                                Number of CTAs
                                                <span style={styles.infoIcon} data-tooltip-id="numberOfCta-tooltip" data-tooltip-content="Number of Call-to-Actions to include (max 3)">i</span>
                                            </label>
                                            <Tooltip style={styles.toolTip} id="numberOfCta-tooltip" />
                                            <input
                                                type="number"
                                                id="numberOfCta"
                                                name="numberOfCta"
                                                min="0"
                                                max="3"
                                                value={formData.numberOfCta}
                                                onChange={handleChange}
                                                style={styles.input}
                                                disabled={formData.ctaSelection === 'predefined' && formData.includeCtaType === ctaTypeOptions.find(o => o.label === 'No CTA')?.key}
                                            />
                                        </div>
                                    </div>

                                    {/* ROW 8 (OLD ROW 9): Caption Style + Hashtag Style (2 Columns) - UPDATED WITH TOGGLES */}
                                    <div style={twoColContainerStyle}>
                                        {/* Caption Style (Left Half) */}
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>Caption Style</label>
                                                <div style={styles.radioGroup}>
                                                    <label style={styles.radioItem}>
                                                        <input type="radio" name="captionStyleSelection" value="predefined" checked={formData.captionStyleSelection === 'predefined'} onChange={handleChange} style={{ marginRight: '8px' }} />
                                                        Predefined
                                                    </label>
                                                    <label style={styles.radioItem}>
                                                        <input type="radio" name="captionStyleSelection" value="custom" checked={formData.captionStyleSelection === 'custom'} onChange={handleChange} style={{ marginRight: '8px' }} />
                                                        Custom
                                                    </label>
                                                </div>
                                                {formData.captionStyleSelection === 'predefined' ? (
                                                    <select
                                                        id="captionStyle"
                                                        name="captionStyle"
                                                        value={formData.captionStyle}
                                                        onChange={handleChange}
                                                        style={styles.select}
                                                    >
                                                        <option value="">Select Caption Style</option>
                                                        {captionStyleOptions.map((style) => (
                                                            <option key={style.key} value={style.key}>{style.label}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        id="customCaptionStyle"
                                                        name="customCaptionStyle"
                                                        value={formData.customCaptionStyle}
                                                        onChange={handleChange}
                                                        style={styles.input}
                                                        maxLength={60}
                                                        placeholder="e.g., A/B Split Test, Case Study format"
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {/* Platform Hashtag Style (Right Half) */}
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>Hashtag Style</label>
                                                <div style={styles.radioGroup}>
                                                    <label style={styles.radioItem}>
                                                        <input type="radio" name="hashtagStyleSelection" value="predefined" checked={formData.hashtagStyleSelection === 'predefined'} onChange={handleChange} style={{ marginRight: '8px' }} />
                                                        Predefined
                                                    </label>
                                                    <label style={styles.radioItem}>
                                                        <input type="radio" name="hashtagStyleSelection" value="custom" checked={formData.hashtagStyleSelection === 'custom'} onChange={handleChange} style={{ marginRight: '8px' }} />
                                                        Custom
                                                    </label>
                                                </div>
                                                {formData.hashtagStyleSelection === 'predefined' ? (
                                                    <select
                                                        id="hashtagStyle"
                                                        name="hashtagStyle"
                                                        value={formData.hashtagStyle}
                                                        onChange={handleChange}
                                                        style={styles.select}
                                                    >
                                                        <option value="">Select Hashtag Style</option>
                                                        {hashtagStyleOptions.map((style) => (
                                                            <option key={style.key} value={style.key}>{style.label}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        id="customHashtagStyle"
                                                        name="customHashtagStyle"
                                                        value={formData.customHashtagStyle}
                                                        onChange={handleChange}
                                                        style={styles.input}
                                                        maxLength={60}
                                                        placeholder="e.g., Industry-specific, Long-tail, Minimal"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ROW 9 (OLD ROW 10): Emotional Intent + Language/Locale (2 Columns) - UPDATED WITH TOGGLES */}
                                    <div style={twoColContainerStyle}>
                                        {/* Emotional Intent (Left Half) */}
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>
                                                    Emotional Intent
                                                    <span style={styles.infoIcon} data-tooltip-id="emotionalIntent-tooltip" data-tooltip-content="Select the emotional tone for your caption">i</span>
                                                </label>
                                                <Tooltip style={styles.toolTip} id="emotionalIntent-tooltip" />
                                                <div style={styles.radioGroup}>
                                                    <label style={styles.radioItem}>
                                                        <input type="radio" name="emotionalIntentSelection" value="predefined" checked={formData.emotionalIntentSelection === 'predefined'} onChange={handleChange} style={{ marginRight: '8px' }} />
                                                        Predefined
                                                    </label>
                                                    <label style={styles.radioItem}>
                                                        <input type="radio" name="emotionalIntentSelection" value="custom" checked={formData.emotionalIntentSelection === 'custom'} onChange={handleChange} style={{ marginRight: '8px' }} />
                                                        Custom
                                                    </label>
                                                </div>
                                                {formData.emotionalIntentSelection === 'predefined' ? (
                                                    <select
                                                        id="emotionalIntent"
                                                        name="emotionalIntent"
                                                        value={formData.emotionalIntent}
                                                        onChange={handleChange}
                                                        style={styles.select}
                                                    >
                                                        <option value="">Select Emotional Intent</option>
                                                        {emotionalIntentOptions.map((emotion) => (
                                                            <option key={emotion.key} value={emotion.key}>{emotion.label}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        id="customEmotionalIntent"
                                                        name="customEmotionalIntent"
                                                        value={formData.customEmotionalIntent}
                                                        onChange={handleChange}
                                                        style={styles.input}
                                                        maxLength={60}
                                                        placeholder="e.g., Nostalgia, Awe, Urgency"
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {/* Language/Locale (Right Half) */}
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>Language / Locale</label>
                                                <div style={styles.radioGroup}>
                                                    <label style={styles.radioItem}>
                                                        <input type="radio" name="languageSelection" value="predefined" checked={formData.languageSelection === 'predefined'} onChange={handleChange} style={{ marginRight: '8px' }} />
                                                        Predefined
                                                    </label>
                                                    <label style={styles.radioItem}>
                                                        <input type="radio" name="languageSelection" value="custom" checked={formData.languageSelection === 'custom'} onChange={handleChange} style={{ marginRight: '8px' }} />
                                                        Custom
                                                    </label>
                                                </div>
                                                {formData.languageSelection === 'predefined' ? (
                                                    <select
                                                        id="language"
                                                        name="language"
                                                        value={formData.language}
                                                        onChange={handleChange}
                                                        style={styles.select}
                                                    >
                                                        <option value="">Select Language/Locale</option>
                                                        {languageOptions.map((lang) => (
                                                            <option key={lang.key} value={lang.key}>{lang.label}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        id="customLanguage"
                                                        name="customLanguage"
                                                        value={formData.customLanguage}
                                                        onChange={handleChange}
                                                        style={styles.input}
                                                        maxLength={30}
                                                        placeholder="e.g., Canadian French, Brazilian Portuguese"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ROW 10 (OLD ROW 11): Required Keywords (Full Width Tags) */}
                                    <div style={colFullStyle}>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>
                                                Required Keywords/Hashtags
                                                <span style={styles.infoIcon} data-tooltip-id="requiredKeywords-tooltip" data-tooltip-content="Add keywords or hashtags that must be included (press Enter to add multiple, max 30)">i</span>
                                            </label>
                                            <Tooltip style={styles.toolTip} id="requiredKeywords-tooltip" />
                                            <input
                                                type="text"
                                                style={styles.input}
                                                placeholder="Add a keyword or hashtag and press Enter"
                                                onKeyPress={(e) => handleArrayChange(e, 'requiredKeywords')}
                                                onBlur={(e) => {
                                                                const value = e.target.value.trim();
                                                                if (value && formData.requiredKeywords.length <30) {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        requiredKeywords: [...prev.requiredKeywords, value]
                                                                    }));
                                                                    e.target.value = '';
                                                                }
                                                            }}
                                                disabled={formData.requiredKeywords.length >= 30}
                                                inputMode='text'
                                            />
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                                                {formData.requiredKeywords.map((keyword, index) => (
                                                    <span key={index} style={{ ...styles.badge, ...styles.badgeSuccess }}>
                                                        {keyword}
                                                        <RemoveTagButton
                                                            style={styles.removeBtn}
                                                            onClick={() => removeItem('requiredKeywords', index)}
                                                        />
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ROW 11 (OLD ROW 12): Exclude Words (Full Width Tags) */}
                                    <div style={colFullStyle}>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>
                                                Exclude Words/Topics
                                                <span style={styles.infoIcon} data-tooltip-id="excludeWords-tooltip" data-tooltip-content="Add words or topics to avoid in the generated captions">i</span>
                                            </label>
                                            <Tooltip style={styles.toolTip} id="excludeWords-tooltip" />
                                            <input
                                                type="text"
                                                style={styles.input}
                                                placeholder="Add a word or topic to exclude and press Enter"
                                                onKeyPress={(e) => handleArrayChange(e, 'excludeWords')}
                                                onBlur={(e) => {
                                                                const value = e.target.value.trim();
                                                                if (value && formData.excludeWords.length < 30) {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        excludeWords: [...prev.excludeWords, value]
                                                                    }));
                                                                    e.target.value = '';
                                                                }
                                                            }}
                                                disabled={formData.excludeWords.length >= 30}
                                                inputMode='text'
                                            />
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                                                {formData.excludeWords.map((word, index) => (
                                                    <span key={index} style={{ ...styles.badge, ...styles.badgeSecondary }}>
                                                        {word}
                                                        <RemoveTagButton
                                                            style={styles.removeBtn}
                                                            onClick={() => removeItem('excludeWords', index)}
                                                        />
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ROW 12 (OLD ROW 13): Creativity + Hashtag Limit (2 Columns) */}
                                    <div style={twoColContainerStyle}>
                                        {/* Creativity Level (Left Half) */}
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label htmlFor="creativityLevel" style={styles.label}>
                                                    Creativity Level: {formData.creativityLevel}/10
                                                    <span style={styles.infoIcon} data-tooltip-id="creativityLevel-tooltip" data-tooltip-content="Adjust how creative or conservative the generated captions should be">i</span>
                                                </label>
                                                <Tooltip style={styles.toolTip} id="creativityLevel-tooltip" />
                                                <input
                                                    type="range"
                                                    id="creativityLevel"
                                                    name="creativityLevel"
                                                    min="1"
                                                    max="10"
                                                    value={formData.creativityLevel}
                                                    onChange={handleChange}
                                                    style={styles.rangeInput}
                                                />
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                                    <span>More Conservative</span>
                                                    <span>More Creative</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hashtag Limit (Right Half) - UPDATED TO DROPDOWN */}
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label htmlFor="hashtagLimit" style={styles.label}>
                                                    Hashtag Limit (Max Number)
                                                    <span style={styles.infoIcon} data-tooltip-id="hashtagLimit-tooltip" data-tooltip-content="Maximum number of hashtags to include (select limit)">i</span>
                                                </label>
                                                <Tooltip style={styles.toolTip} id="hashtagLimit-tooltip" />
                                                {/* Replaced input type="number" with select */}
                                                <select
                                                    id="hashtagLimit"
                                                    name="hashtagLimit"
                                                    value={formData.hashtagLimit}
                                                    onChange={handleChange}
                                                    style={styles.select}
                                                >
                                                    <option value="">Select Limit</option>
                                                    {hashtagLimitOptions.map((option) => (
                                                        <option key={option.key} value={option.key}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ROW 13 (OLD ROW 14): Proofread Toggle + Compliance Notes (Full Width) */}
                                    <div style={twoColContainerStyle}>
                                        {/* Proofread & Optimize (Left Half - Toggle) */}
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        id="proofread"
                                                        name="proofread"
                                                        checked={formData.proofread}
                                                        onChange={handleChange}
                                                        style={{ width: '16px', height: '16px' }}
                                                    />
                                                    <span>Proofread & Optimize</span>
                                                    <span style={styles.infoIcon} data-tooltip-id="proofread-tooltip" data-tooltip-content="Automatically proofread and optimize the generated captions">i</span>
                                                </label>
                                                <Tooltip style={styles.toolTip} id="proofread-tooltip" />
                                            </div>
                                        </div>

                                        {/* Spacer to align Compliance Notes below */}
                                        <div style={colHalfStyle}></div>
                                    </div>

                                    {/* Compliance Notes (Full Width) */}
                                    <div style={colFullStyle}>
                                        <div style={styles.formGroup}>
                                            <label htmlFor="complianceNotes" style={styles.label}>
                                                Compliance Notes
                                                <span style={styles.infoIcon} data-tooltip-id="complianceNotes-tooltip" data-tooltip-content="Add any compliance requirements or legal disclaimers (max 1500 characters)">i</span>
                                            </label>
                                            <Tooltip style={styles.toolTip} id="complianceNotes-tooltip" />
                                            <textarea
                                                id="complianceNotes"
                                                name="complianceNotes"
                                                value={formData.complianceNotes}
                                                onChange={handleChange}
                                                style={{ ...styles.textarea, minHeight: '80px' }}
                                                maxLength={1500}
                                                placeholder="Any compliance requirements or legal disclaimers"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button (Full Width Footer) */}
                            <div style={{ width: '100%', marginTop: '24px' }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        type="button"
                                        style={{ ...styles.btn, ...styles.btnOutline }}
                                        onClick={handleReset}
                                    >
                                        Reset Form
                                    </button>
                                    <button
                                        type="submit" // This triggers handleSubmit (shows summary modal)
                                        // className="personal-info-button"
                                        style={{ ...styles.btn, ...styles.btnPrimary }}
                                        disabled={isGenerating}
                                    >
                                        {'Review & Generate'}
                                    </button>
                                </div>
                                {/* {requestId && (
                                    <button
                                        type="button"
                                        style={{ ...styles.btn, ...styles.btnOutline, marginTop: '10px' }}
                                        onClick={handleViewLog}
                                        disabled={isGenerating}
                                    >
                                        View Last Generation Log
                                    </button>
                                )} */}
                            </div>
                        </div>
                    </form>

                </div>
            </div>

            {/* --- CONDITIONAL SUMMARY MODAL VIEW --- */}
            {showSummary && (
                <SummaryReviewModal
                    formData={formData}
                    apiOptions={apiOptions}
                    onGenerate={handleGenerate}
                    onEdit={handleEdit} // Close handler
                    formattingOptionsList={formattingOptionsList}
                    getOptionDetails={getOptionDetails}
                    isGenerating={isGenerating}
                    onViewLog={handleViewLog}
                />
            )}

            {/* Variant Display Modal */}
            {showVariantsModal && generatedVariantsData.variants.length > 0 && (
                <VariantModalContent
                    variants={generatedVariantsData.variants}
                    inputs={generatedVariantsData.inputs}
                    onClose={() => {
                        setShowVariantsModal(false);
                        setRequestId(generatedVariantsData.requestId); // Keep last successful request ID
                    }}
                    onRequestRegenerate={handleRegenerateVariant}
                    showNotification={showNotification}
                    isLoading={
                        isGenerating &&
                        (generatedVariantsData.variants || []).some(
                            (v) => v && v.is_streaming && !(v.content || '').trim()
                        )
                    }
                    isHistoryView={isHistoryView}
                    modalTitle={modalTitle}
                />
            )}
        </div>
    );
};

export default Captionandhastaggeneratorform;
