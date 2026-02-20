import React, { useState, useEffect, useCallback, useRef } from 'react';
// Assuming SummaryReviewModal is a separate file that you are importing
import SummaryReviewModal from './SummaryReviewModal';
import { Tooltip } from 'react-tooltip'; // Retained
import VariantModalContent from './VariantModalContent';
import SurfingLoading from './SurfingLoading';
import ToggleButton from '../Form/ToggleButton';
import RemoveTagButton from '../Form/RemoveTagButton';


import { getAuthHeader } from "@/utils/auth";
import API from "@/utils/api";
import { useCredits } from "@/components/CreditsContext";

const createSessionRequestId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        // Per RFC 4122 section 4.4
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    // Last resort fallback (non-crypto)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

const defaultFieldOptions = {
    platform: [],
    placement: [],
    campaign_objective: [],
    tone_style: [],
    headline_focus: [],
    primary_text_length: [],
    cta_type: [],
    emotional_angle: [],
    asset_reuse_strategy: [],
    brand_voice_personality: [],
};

// --- Helper Functions (Retained) ---
const mapSelectionToApiObject = (fieldName, selectedLabel, options, isAutoSelect = false) => {
    if (isAutoSelect && selectedLabel.includes('Auto-')) {
        return { type: "auto-detect", id: null, value: selectedLabel };
    }
    if (fieldName === 'campaign_objective' && selectedLabel === 'Custom Objective') {
        return { type: "custom", id: null, value: selectedLabel };
    }

    let optionList = Array.isArray(options) ? options : options?.[fieldName];
    if (fieldName === 'primary_text_length') {
        optionList = Array.isArray(options) ? options : options?.primary_text_length;
    }

    const selectedOption = optionList?.find(opt =>
        selectedLabel === opt.label.replace('\t', '→')
    );

    if (selectedOption) {
        return {
            type: "predefined",
            id: selectedOption.id,
            value: selectedLabel
        };
    }
    return { type: "custom", id: null, value: selectedLabel };
};

const getLabelFromKey = (selectedKey, fieldName, options) => {
    let optionList = Array.isArray(options) ? options : options?.[fieldName];
    if (fieldName === 'adTextLength') {
        optionList = Array.isArray(options) ? options : options?.primary_text_length;
    }

    if (!optionList) return selectedKey;

    const selectedOption = optionList.find(opt => opt.key === selectedKey);

    if (selectedOption) {
        return selectedOption.label.replace('\t', '→');
    }
    return selectedKey;
};

const AdCopyGeneratorForm = () => {
    const { fetchCredits, setTrialRemaining, setShowGateModal } = useCredits() || {};
    // Hardcoded audience suggestions (moved inside the component function)
    const audienceSuggestions = {
        'Demographics': ['Women 25-34', 'Men 35-44', 'Parents of Toddlers'],
        'Interests': ['Fitness Enthusiasts', 'Tech Early Adopters', 'Travel Lovers'],
        'Professions': ['Marketing Managers', 'Small Business Owners', 'Software Engineers']
    };

    const [formData, setFormData] = useState({
        // ... (Initial formData state remains the same)
        platform: 'Meta (Facebook & Instagram)',
        platformMode: 'predefined',
        platformCustom: '',

        placement: 'Facebook Feed',
        campaignObjective: 'Brand Awareness',
        customObjective: '',
        targetAudience: [],
        productServices: '',
        keyBenefits: [],
        variants: 1,
        tone: 'Auto-Detect (Based on Platform)',
        headlineFocus: 'Auto-Select (Recommended)',
        adTextLength: '',
        ctaType: 'Learn More',
        emotionalAngle: 'Pain → Solution',
        complianceNote: '',
        brandVoice: '',
        assetReuseStrategy: 'Auto-Detect (Recommended)',

        offerPricing: '',
        audiencePain: [],
        campaignDuration: { start: '', end: '' },
        geoLanguageTarget: '',
        proofCredibility: [],
        showAdvanced: false,
        usp: '',
        featureHighlight: '',
        problemScenario: '',
        brandVoicePersonalityMode: 'predefined',
        brandVoicePersonalityOption: '',
        brandVoicePersonalityCustom: ''
    });

    const [audienceInput, setAudienceInput] = useState('');
    const [showAudienceSuggestions, setShowAudienceSuggestions] = useState(false);
    const [placementMode, setPlacementMode] = useState('predefined');
    const [placementCustom, setPlacementCustom] = useState('');
    const [campaignObjectiveMode, setCampaignObjectiveMode] = useState('predefined');
    const [toneMode, setToneMode] = useState('predefined');
    const [toneCustom, setToneCustom] = useState('');
    const [headlineFocusMode, setHeadlineFocusMode] = useState('predefined');
    const [headlineFocusCustom, setHeadlineFocusCustom] = useState('');
    const [adTextLengthMode, setAdTextLengthMode] = useState('predefined');
    const [adTextLengthCustom, setAdTextLengthCustom] = useState('');
    const [ctaTypeMode, setCtaTypeMode] = useState('predefined');
    const [ctaTypeCustom, setCtaTypeCustom] = useState('');
    const [emotionalAngleMode, setEmotionalAngleMode] = useState('predefined');
    const [emotionalAngleCustom, setEmotionalAngleCustom] = useState('');
    const [assetReuseMode, setAssetReuseMode] = useState('predefined');
    const [assetReuseCustom, setAssetReuseCustom] = useState('');

    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [mounted, setMounted] = useState(false);
    const [availablePlacements, setAvailablePlacements] = useState([]);
    const [fieldOptions, setFieldOptions] = useState(defaultFieldOptions);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [optionsError, setOptionsError] = useState('');
    const [showSummary, setShowSummary] = useState(false);

    // UPDATED STATE MANAGEMENT FOR GENERATION FLOW
    const [isGenerating, setIsGenerating] = useState(false); // Controls button text on form
    const [isApiLoading, setIsApiLoading] = useState(false); // NEW: Controls the modal loading state (step 1 & 2)
    const [isHistoryView, setIsHistoryView] = useState(false);
    const [isStreamingGeneration, setIsStreamingGeneration] = useState(false);

    const streamControllersRef = useRef([]);
    const sessionRequestIdRef = useRef(null);

    const [requestId, setRequestId] = useState(null);
    const [showVariantsModal, setShowVariantsModal] = useState(false);
    const [generatedVariantsData, setGeneratedVariantsData] = useState({
        variants: [],
        inputs: {},
    });

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

    useEffect(() => {
        return () => {
            abortAllStreams();
        };
    }, [abortAllStreams]);

    const showNotification = useCallback((message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    }, []);

    // REFACTORED: updatePlacements now accepts and uses the options list directly
    const updatePlacements = useCallback((platformLabel, allPlacements) => {
        if (!allPlacements) return;

        const filteredPlacements = allPlacements.filter(opt =>
            opt.parent_label === platformLabel
        );

        setAvailablePlacements(filteredPlacements);

        // Set the new default placement to the first available option
        const newPlacement = filteredPlacements.length > 0 ? filteredPlacements[0].label : '';
        setFormData(prev => ({
            ...prev,
            placement: newPlacement || ''
        }));
    }, []); // Empty dependency array, relies on caller to pass data

    // Initial Data Load (Retained)
    useEffect(() => {
        setMounted(true);

        const fetchFieldOptions = async () => {
            const maxRetries = 3;
            let attempt = 0;
            setLoadingOptions(true);
            setOptionsError('');

            while (attempt < maxRetries) {
                try {
                    if (attempt > 0) {
                        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }

                    const response = await fetch(API.GET_FIELD_OPTIONS, {
                        headers: { Authorization: getAuthHeader() },
                    });

                    if (response.status === 429 && attempt < maxRetries - 1) {
                        attempt++;
                        continue;
                    }

                    if (!response.ok) {
                        throw new Error(`Failed to fetch field options (Status: ${response.status})`);
                    }

                    const apiData = await response.json();

                    if (apiData && apiData.data && typeof apiData.data === 'object') {
                        const loadedOptions = {
                            ...defaultFieldOptions,
                            ...apiData.data
                        };
                        setFieldOptions(loadedOptions);

                        const defaultPlatform = loadedOptions.platform.find(opt => opt.label === formData.platform)?.label || formData.platform;

                        // Pass loaded placement data directly
                        updatePlacements(defaultPlatform, loadedOptions.placement);

                        // Update other defaults
                        setFormData(prev => ({
                            ...prev,
                            platform: defaultPlatform,
                            // placement is handled by updatePlacements
                            campaignObjective: loadedOptions.campaign_objective.find(opt => opt.label === prev.campaignObjective)?.label || prev.campaignObjective,
                            tone: loadedOptions.tone_style.find(opt => opt.label === prev.tone || prev.tone.includes('Auto'))?.label || prev.tone,
                            headlineFocus: loadedOptions.headline_focus.find(opt => opt.label === prev.headlineFocus || prev.headlineFocus.includes('Auto'))?.label || prev.headlineFocus,
                            adTextLength: loadedOptions.primary_text_length.find(opt => opt.label === prev.adTextLength)?.label || loadedOptions.primary_text_length?.[0]?.label || prev.adTextLength,
                            ctaType: loadedOptions.cta_type.find(opt => opt.label === prev.ctaType)?.label || prev.ctaType,
                            emotionalAngle: loadedOptions.emotional_angle.find(opt => opt.label.replace('\t', '→') === prev.emotionalAngle)?.label.replace('\t', '→') || prev.emotionalAngle,
                            assetReuseStrategy: loadedOptions.asset_reuse_strategy.find(opt => opt.label === prev.assetReuseStrategy || prev.assetReuseStrategy.includes('Auto'))?.label || prev.assetReuseStrategy,
                        }));

                        setLoadingOptions(false);
                        return;
                    } else {
                        throw new Error('Invalid data structure from API');
                    }
                } catch (error) {
                    attempt++;
                    if (attempt >= maxRetries) {
                        setOptionsError('Unable to load field options. Default options are being used.');
                        setLoadingOptions(false);
                        return;
                    }
                }
            }
        };

        fetchFieldOptions();

    }, []); // Initial load only

    // FIXED: Runtime Platform Change Effect
    useEffect(() => {
        // This effect runs whenever formData.platform or fieldOptions.placement (master list) changes.
        // It explicitly passes the current, updated options list to updatePlacements.
        updatePlacements(formData.platform, fieldOptions.placement);
    }, [formData.platform, fieldOptions.placement, updatePlacements]);

    const handlePlatformChange = (e) => {
        const selectedKey = e.target.value;
        const platformLabel = getLabelFromKey(selectedKey, 'platform', fieldOptions);

        // This simply updates the platform label in state.
        // The useEffect hook above handles calling updatePlacements to filter based on this new label.
        setFormData(prev => ({ ...prev, platform: platformLabel }));
    };

    const handleAudienceInput = (e) => {
        const value = e.target.value;
        setAudienceInput(value);
        setShowAudienceSuggestions(value.length > 0);
    };

    const addAudienceChip = (chip) => {
        if (!formData.targetAudience.includes(chip)) {
            setFormData(prev => ({ ...prev, targetAudience: [...prev.targetAudience, chip] }));
        }
        setAudienceInput('');
        setShowAudienceSuggestions(false);
    };

    const removeAudienceChip = (chipToRemove) => {
        setFormData(prev => ({ ...prev, targetAudience: prev.targetAudience.filter(chip => chip !== chipToRemove) }));
    };

    const handleChange = (e) => {
        const { name, value: selectedKey, type, checked } = e.target;

        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
            return;
        }

        // Special handling for Ad Platform custom text
        if (name === 'platformCustom') {
            setFormData(prev => ({
                ...prev,
                platformCustom: selectedKey,
                platform: selectedKey,
            }));
            return;
        }

        // Special handling for Brand Voice Personality mode and option
        if (name === 'brandVoicePersonalityMode') {
            setFormData(prev => ({
                ...prev,
                brandVoicePersonalityMode: selectedKey,
                // Reset custom / option when switching modes
                brandVoicePersonalityCustom: selectedKey === 'custom' ? prev.brandVoicePersonalityCustom : '',
            }));
            return;
        }

        if (name === 'brandVoicePersonalityOption') {
            // Map key -> label from API options list so UI shows label consistently
            const option = (fieldOptions.brand_voice_personality || []).find(opt => opt.key === selectedKey);
            const label = option ? option.label : selectedKey;
            setFormData(prev => ({ ...prev, brandVoicePersonalityOption: label }));
            return;
        }

        let labelToStore = selectedKey;
        if (selectedKey) {
            // Map form field name to the correct options key used in fieldOptions
            let fieldOptionsKey = name;
            if (name === 'adTextLength') fieldOptionsKey = 'primary_text_length';
            if (name === 'tone') fieldOptionsKey = 'tone_style';
            if (name === 'headlineFocus') fieldOptionsKey = 'headline_focus';
            if (name === 'ctaType') fieldOptionsKey = 'cta_type';
            if (name === 'emotionalAngle') fieldOptionsKey = 'emotional_angle';
            if (name === 'assetReuseStrategy') fieldOptionsKey = 'asset_reuse_strategy';

            if (e.target.tagName === 'SELECT') {
                labelToStore = getLabelFromKey(selectedKey, fieldOptionsKey, fieldOptions);
            }

            if (name === 'campaignObjective' && labelToStore !== 'Custom Objective') {
                setFormData(prev => ({ ...prev, [name]: labelToStore, customObjective: '' }));
                return;
            }
        }

        setFormData(prev => ({ ...prev, [name]: labelToStore }));
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            campaignDuration: {
                ...prev.campaignDuration,
                [name]: value
            }
        }));
    };

    const handleArrayChange = (e, field) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            e.preventDefault();
            const newItem = e.target.value.trim();
            if (formData[field].length < 10) {
                setFormData(prev => ({
                    ...prev,
                    [field]: [...prev[field], newItem]
                }));
                e.target.value = '';
            }
        }
    };

    const removeItem = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const validateForm = () => {
        const missing = [];

        if (!formData.platform) missing.push('Ad Platform');
        const requirePlacement = Array.isArray(availablePlacements) && availablePlacements.length > 0;
        if (requirePlacement && !formData.placement) missing.push('Ad Placement');
        if (!formData.campaignObjective) missing.push('Campaign Objective');
        // Only require Custom Objective when user has explicitly chosen custom mode
        if (formData.campaignObjectiveMode === 'custom' && !formData.customObjective.trim()) {
            missing.push('Custom Objective');
        }

        if (!formData.targetAudience || formData.targetAudience.length === 0) {
            missing.push('Target Audience');
        }

        if (!formData.productServices.trim()) missing.push('Product/Services');

        if (!formData.tone) missing.push('Tone');
        if (!formData.headlineFocus) missing.push('Headline Focus');
        // Ad Text Length is optional; default Auto-Length can be sent without validation
        if (!formData.ctaType) missing.push('Call to Action (CTA)');
        if (!formData.variants) missing.push('Number of Variants');
        if (!formData.emotionalAngle) missing.push('Emotional Angle');

        if (!formData.keyBenefits || formData.keyBenefits.length === 0) {
            missing.push('Key Benefits');
        }

        // All advanced fields are optional and therefore not validated here.

        return missing;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const missingFields = validateForm();

        if (missingFields.length > 0) {
            const message = `Please fill all required fields: ${missingFields.join(', ')}`;
            showNotification(message, 'error');
            return;
        }

        setShowSummary(true);
    };

    // UPDATED FUNCTION: Handles the actual generation logic
    const handleGenerate = async () => {
        const missingFields = validateForm();
        if (missingFields.length > 0) {
            // This is for the button click from the summary modal
            const message = `Please fill all required fields: ${missingFields.join(', ')}`;
            showNotification(message, 'error');
            return;
        }

        setShowSummary(false); // Close summary modal
        setShowVariantsModal(true); // Open the variants modal
        try { fetchCredits?.(); } catch { }
        setIsHistoryView(false);
        setIsApiLoading(true); // START API LOADING - SHOWS SURFING ANIMATION IN MODAL

        sessionRequestIdRef.current = createSessionRequestId();

        // 2. While backend API request is in progress: modal shows surfing animation
        try {
            const payload = {
                ...formatPayload(),
                session_request_id: sessionRequestIdRef.current,
            };

            const response = await fetch(API.GENERATE_AD_COPY, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': getAuthHeader(),
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch (e) {
                    throw new Error(`API call failed with status: ${response.status} (${response.statusText}).`);
                }
                throw new Error(errorData.message || `API call failed with status: ${response.status}`);
            }

            const result = await response.json();

            if (result.variants?.length > 0) {
                // API SUCCESS: Stop the surfing loading
                setIsApiLoading(false); // STOP API LOADING - HIDES SURFING, SHOWS VARIANT LIST

                setRequestId((prev) => prev || result.request_id);

                const structuredVariants = result.variants.map((content, index) => ({
                    id: content.id || `temp-${Date.now()}-${index}`,
                    content: content.content || content,
                    show_variant: true
                }));

                // Update the variant data. This will trigger the typing effect for the first variant 
                // inside the now-visible VariantModalContent.
                setGeneratedVariantsData({
                    variants: structuredVariants,
                    inputs: result.inputs || payload
                });

                // Note: The UI for variants 2+ will naturally display after variant 1's typing completes,
                // as the structure is a map of variants, and only the first one has the typing logic.
            } else {
                throw new Error("No variants were returned from the server");
            }

        } catch (error) {
            console.error('Generation Error:', error);
            showNotification(`Error: ${error.message || 'Failed to generate ad copy'}`, 'error');
            setShowVariantsModal(false); // Close modal on error
        } finally {
            setIsApiLoading(false); // Ensure loading is off even on error
            setIsGenerating(false); // Ensure button state is reset
            try { fetchCredits?.(); } catch { }
        }
    };

    // The handleGenerateFromSummary logic is merged into handleGenerate in this implementation,
    // but the summary step is kept for flow: Form -> Summary (Review) -> Generate (API Call)
    const handleGenerateFromSummary = async () => {

        try {
            abortAllStreams();
            setIsGenerating(true); // START GENERATING - SHOWS LOADING SCREEN
            setIsHistoryView(false);
            // Reuse the formatPayload function to get the current form data
            sessionRequestIdRef.current = createSessionRequestId();
            const payload = {
                ...formatPayload(),
                session_request_id: sessionRequestIdRef.current,
            };
            console.log("payload:payload", payload);

            // ... (validation remains the same) ...

            showNotification('Generating ad copy, please wait...', 'info');

            const variantCount = Math.max(1, parseInt(payload?.number_of_variants || 1, 10));
            const clientRequestKey = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

            setRequestId(null);
            setIsApiLoading(false);
            setIsStreamingGeneration(true);
            setGeneratedVariantsData({
                variants: Array.from({ length: variantCount }).map((_, index) => ({
                    client_id: `${clientRequestKey}-${index}`,
                    id: null,
                    content: '',
                    show_variant: true,
                    is_streaming: true,
                })),
                inputs: payload,
            });
            setShowVariantsModal(true);
            try { fetchCredits?.(); } catch { }
            setShowSummary(false);

            const streamSingleVariant = async (variantIndex) => {
                const controller = new AbortController();
                streamControllersRef.current = [...streamControllersRef.current, controller];

                const payloadForStream = {
                    ...payload,
                    number_of_variants: 1,
                };

                const response = await fetch(API.GENERATE_AD_COPY_CLAUDE_STREAM, {
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

                        // Check for Free Trial Exhausted / Subscription Required
                        if (errorData.code === 'subscription_required' || errorData.status_code === 2) {
                            // 1. Show the subscription popup
                            setShowGateModal?.(true);

                            // 2. Clean up UI states
                            setIsGenerating(false);
                            setIsApiLoading(false);
                            setShowVariantsModal(false);

                            // 3. Exit the function so no generic error toast appears
                            return;
                        }
                    } catch (e) {
                        // Fallback if JSON parsing fails
                    }

                    // Throw error for any other status (500, 404, etc.)
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

                    if (line.startsWith(',')) line = line.slice(1).trim();
                    if (line.endsWith(',')) line = line.slice(0, -1).trim();
                    if (!line) return;

                    let msg;
                    try {
                        msg = JSON.parse(line);
                    } catch (e) {
                        buffer = `${line}\n${buffer}`;
                        return;
                    }
                    console.log("susbcription is here 2")
                    if (!msg || typeof msg !== 'object') return;

                    if (msg.type === 'meta') {
                        if (msg.request_id) { setRequestId((prev) => prev || msg.request_id); }
                        if (msg.variant_id) {
                            setGeneratedVariantsData((prev) => {
                                const next = [...(prev.variants || [])];
                                if (next[variantIndex]) next[variantIndex] = { ...next[variantIndex], id: msg.variant_id };
                                return { ...prev, variants: next };
                            });
                        }
                        if (msg.trial_credits_remaining != null) {
                            const t = Number(msg.trial_credits_remaining);
                            if (!Number.isNaN(t)) setTrialRemaining?.(t);
                            try { fetchCredits?.(); } catch { }
                        }
                        return;
                    }

                    if (
                        msg.type === 'error' &&
                        (msg.code === 'subscription_required' || msg.error_code === 'subscription_required' || msg.status_code === 2)
                    ) {
                        console.log("susbcription is here 1");
                        if (msg.trial_credits_remaining != null) {
                            const t = Number(msg.trial_credits_remaining);
                            if (!Number.isNaN(t)) setTrialRemaining?.(t);
                        }
                        try { fetchCredits?.(); } catch { }
                        setShowGateModal?.(true);
                        try { controller?.abort?.(); } catch { }
                        try { setIsGenerating(false); setShowVariantsModal(false); } catch { }
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
                    for (; ;) {
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
            }

        } catch (error) {
            console.error('Generation Error:', error);
            showNotification(`Error: ${error.message || 'Failed to generate ad copy'}`, 'error');
        } finally {
            setIsGenerating(false); // STOP GENERATING - TRIGGERS TYPING EFFECT
            setIsApiLoading(false);
            setIsStreamingGeneration(false);
            try { fetchCredits?.(); } catch { }
        }
    };

    const handleEditFromSummary = () => {
        setShowSummary(false);
        // Scroll to top of form
        const formTop = document.getElementById('ad-copy-form-top');
        if (formTop) {
            formTop.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleViewHistory = async () => {
        if (!requestId) {
            showNotification("No previous generation history found.", 'error');
            return;
        }

        setIsGenerating(true);
        setShowVariantsModal(true); // Open modal
        setIsApiLoading(true); // Show surfing loader
        setIsHistoryView(true);

        try {
            const response = await fetch(API.GET_VARIANTS_LOG(requestId), {
                headers: { 'Authorization': getAuthHeader() },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch log: ${response.status}`);
            }

            const result = await response.json();

            if (result.variants && Array.isArray(result.variants) && result.variants.length > 0) {
                const structuredVariants = result.variants.map(variant => ({
                    id: variant.id,
                    content: variant.content,
                    show_variant: variant.show_variant || true,
                }));

                // Note: No typing effect for history
                setGeneratedVariantsData({ variants: structuredVariants, inputs: result.inputs });
                showNotification('Log loaded successfully!', 'success');
            } else {
                showNotification('No variants found in the log.', 'error');
            }

        } catch (error) {
            console.error('Log View Error:', error);
            showNotification(`Error loading log: ${error.message || 'Failed to fetch variants log.'}`, 'error');
            setShowVariantsModal(false); // Close modal on error
        } finally {
            setIsApiLoading(false); // Hide surfing loader
            setIsGenerating(false); // Reset button state
        }
    };

    const formatPayload = () => {
        // ... (formatPayload function remains the same)
        const parseGeoLanguage = (input) => {
            if (!input) return { locale: null, language: null };
            const parts = input.split(',').map(p => p.trim());
            const geo = parts[0]?.trim();
            const lang = parts.length > 1 ? parts[1]?.trim() : null;
            return { locale: geo || null, language: lang || null };
        };

        const payload = {
            platform: mapSelectionToApiObject('platform', formData.platform, fieldOptions.platform, true),
            ...(formData.placement
                ? { placement: mapSelectionToApiObject('placement', formData.placement, fieldOptions.placement, true) }
                : {}),
            campaign_objective: formData.campaignObjective === 'Custom Objective' ?
                { type: 'custom', id: null, value: formData.customObjective || 'Custom Objective' } :
                mapSelectionToApiObject('campaign_objective', formData.campaignObjective, fieldOptions.campaign_objective, false),
            target_audience: formData.targetAudience,
            key_benefits: formData.keyBenefits,
            audience_pain_points: formData.audiencePain,
            proof_elements: formData.proofCredibility,
            product_description: formData.productServices,
            number_of_variants: parseInt(formData.variants, 10),
            compliance_notes: formData.complianceNote,
            brand_voice: formData.brandVoice,
            offer_pricing_details: formData.offerPricing,
            tone_style: mapSelectionToApiObject('tone_style', formData.tone, fieldOptions.tone_style, true),
            headline_focus: headlineFocusMode === 'custom'
                ? { type: 'custom', id: null, value: (headlineFocusCustom || formData.headlineFocus || '') }
                : mapSelectionToApiObject('headline_focus', formData.headlineFocus, fieldOptions.headline_focus, true),
            primary_text_length: mapSelectionToApiObject('primary_text_length', formData.adTextLength, fieldOptions, true),
            cta_type: mapSelectionToApiObject('cta_type', formData.ctaType, fieldOptions.cta_type, false),
            emotional_angle: mapSelectionToApiObject('emotional_angle', formData.emotionalAngle, fieldOptions.emotional_angle, false),
            asset_reuse_strategy: mapSelectionToApiObject('asset_reuse_strategy', formData.assetReuseStrategy, fieldOptions.asset_reuse_strategy, true),
            campaign_duration: formData.campaignDuration,
            geographic_language_target: parseGeoLanguage(formData.geoLanguageTarget),
            usp: formData.usp,
            feature_highlight: formData.featureHighlight,
            problem_scenario: formData.problemScenario,
            brand_voice_personality: (() => {
                const mode = formData.brandVoicePersonalityMode;
                const customValue = formData.brandVoicePersonalityCustom;

                if (mode === 'custom') {
                    return {
                        type: 'custom',
                        id: null,
                        value: customValue || ''
                    };
                }

                // Predefined option: find matching option by label from API options
                const options = fieldOptions.brand_voice_personality || [];
                const selected = options.find(opt => opt.label === formData.brandVoicePersonalityOption);

                if (selected) {
                    return {
                        type: 'predefined',
                        id: selected.id ?? null,
                        value: selected.label,
                    };
                }

                return {
                    type: 'predefined',
                    id: null,
                    value: formData.brandVoicePersonalityOption || ''
                };
            })(),
        };

        return payload;
    };

    // Regenerate function is retained and works with the new state
    const handleRegenerateVariant = async (variantId) => {
        const variantIndex = generatedVariantsData.variants.findIndex(v => v.id === variantId);
        if (variantIndex === -1) return;

        showNotification(`Regenerating Variant ${variantIndex + 1}...`, 'info');

        const controller = new AbortController();
        streamControllersRef.current = [...(streamControllersRef.current || []), controller];
        try { fetchCredits?.(); } catch { }

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
            const response = await fetch(API.REGENERATE_VARIANT(variantId), {
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

            const contentType = response.headers.get('content-type') || '';
            const looksLikeJson = contentType.includes('application/json') && !contentType.includes('text/event-stream');

            if (looksLikeJson || !response.body) {
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

            const processMessage = (msg) => {
                if (!msg || typeof msg !== 'object') return;

                if (msg.type === 'meta') {
                    if (msg.request_id) {
                        setRequestId((prev) => prev || msg.request_id);
                    }
                    if (msg.variant_id) {
                        setGeneratedVariantsData((prev) => {
                            const next = [...(prev.variants || [])];
                            if (next[variantIndex]) {
                                next[variantIndex] = { ...next[variantIndex], id: msg.variant_id };
                            }
                            return { ...prev, variants: next };
                        });
                        try { fetchCredits?.(); } catch { }
                    }
                    if (msg.trial_credits_remaining != null) {
                        const t = Number(msg.trial_credits_remaining);
                        if (!Number.isNaN(t)) setTrialRemaining?.(t);
                        try { fetchCredits?.(); } catch { }
                    }
                    return;
                }

                if (
                    msg.type === 'error' &&
                    (msg.code === 'subscription_required' || msg.error_code === 'subscription_required' || msg.status_code === 2)
                ) {
                    console.log("susbcription is here 1");
                    if (msg.trial_credits_remaining != null) {
                        const t = Number(msg.trial_credits_remaining);
                        if (!Number.isNaN(t)) setTrialRemaining?.(t);
                    }
                    try { fetchCredits?.(); } catch { }
                    setShowGateModal?.(true);
                    try { controller?.abort?.(); } catch { }
                    try { setIsGenerating(false); setShowVariantsModal(false); } catch { }
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
                            };
                        }
                        return { ...prev, variants: next };
                    });
                    try { fetchCredits?.(); } catch { }
                    return;
                }

                if (msg.type === 'done') {
                    sawDone = true;
                    if (msg.request_id) {
                        setRequestId((prev) => prev || msg.request_id);
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

            const stripSsePrefixes = (text) => text.replace(/^data:\s*/gm, '');

            const extractNextJsonObject = () => {
                let i = 0;
                while (i < buffer.length && /[\s,]/.test(buffer[i])) i++;
                if (i > 0) buffer = buffer.slice(i);
                if (!buffer) return null;

                if (buffer[0] !== '{') {
                    const nextObj = buffer.indexOf('{');
                    if (nextObj === -1) {
                        buffer = '';
                        return null;
                    }
                    buffer = buffer.slice(nextObj);
                }

                let depth = 0;
                let inString = false;
                let escape = false;
                for (let idx = 0; idx < buffer.length; idx++) {
                    const ch = buffer[idx];

                    if (inString) {
                        if (escape) {
                            escape = false;
                        } else if (ch === '\\') {
                            escape = true;
                        } else if (ch === '"') {
                            inString = false;
                        }
                        continue;
                    }

                    if (ch === '"') {
                        inString = true;
                        continue;
                    }

                    if (ch === '{') {
                        depth += 1;
                        continue;
                    }

                    if (ch === '}') {
                        depth -= 1;
                        if (depth === 0) {
                            const jsonText = buffer.slice(0, idx + 1);
                            buffer = buffer.slice(idx + 1);
                            return jsonText;
                        }
                    }
                }

                return null;
            };

            const drainBuffer = () => {
                for (; ;) {
                    const jsonText = extractNextJsonObject();
                    if (!jsonText) break;
                    try {
                        const msg = JSON.parse(jsonText);
                        processMessage(msg);
                    } catch (e) {
                        buffer = `${jsonText}${buffer}`;
                        break;
                    }
                }
            };

            try {
                for (; ;) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    buffer = stripSsePrefixes(buffer + decoder.decode(value, { stream: true }));
                    drainBuffer();
                }
                drainBuffer();
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

    const toggleAdvanced = () => {
        setFormData(prev => ({
            ...prev,
            showAdvanced: !prev.showAdvanced
        }));
    };

    // Reset handler (Retained)
    const handleReset = () => {
        const defaultAdTextLength = fieldOptions.primary_text_length?.[0]?.label || '';
        setFormData({
            platform: 'Meta (Facebook & Instagram)',
            platformMode: 'predefined',
            platformCustom: '',

            placement: 'Facebook Feed',
            campaignObjective: 'Brand Awareness',
            customObjective: '',
            targetAudience: [],
            productServices: '',
            keyBenefits: [],
            variants: 1,
            tone: 'Auto-Detect (Based on Platform)',
            headlineFocus: 'Auto-Select (Recommended)',
            adTextLengthMode: 'predefined',
            adTextLength: defaultAdTextLength,
            adTextLengthCustom: '',
            ctaType: 'Learn More',
            emotionalAngle: 'Pain → Solution',
            complianceNote: '',
            brandVoice: '',
            assetReuseStrategy: 'Auto-Detect (Recommended)',
            offerPricing: '',

            audiencePain: [],
            campaignDuration: { start: '', end: '' },
            geoLanguageTarget: '',
            proofCredibility: [],
            showAdvanced: false,
            usp: '',
            featureHighlight: '',
            problemScenario: '',
            brandVoicePersonalityMode: 'predefined',
            brandVoicePersonalityOption: '',
            brandVoicePersonalityCustom: ''
        });
        setPlacementMode('predefined');
        setPlacementCustom('');
        setCampaignObjectiveMode('predefined');
        setCampaignObjectiveMode('predefined');
        setToneMode('predefined');
        setToneCustom('');
        setHeadlineFocusMode('predefined');
        setHeadlineFocusCustom('');
        setAdTextLengthMode('predefined');
        setAdTextLengthCustom('');
        setCtaTypeMode('predefined');
        setCtaTypeCustom('');
        setEmotionalAngleMode('predefined');
        setEmotionalAngleCustom('');

        setAudienceInput('');
        setShowAudienceSuggestions(false);
        setShowSummary(false);
        setGeneratedVariantsData({ variants: [], inputs: {} });
        setShowVariantsModal(false);
        setRequestId(null); // Clear request ID
        setIsApiLoading(false); // Reset loading state
        setIsGenerating(false); // Reset button state
        setIsHistoryView(false);
        showNotification('Form has been reset', 'info');
    };

    // Styles (Defined for the main component's structure)
    const styles = {
        // ... (Styles object is large, keeping it concise here but retaining the original content)
        container: { maxWidth: '1100px', margin: '0 auto', padding: '10px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', backgroundColor: '#0a0e1a', minHeight: '100vh' },
        card: { backgroundColor: '#141b2d', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid #1e293b' },
        header: { padding: '24px 32px' },
        title: { margin: 0, fontSize: '24px', fontWeight: '600', color: '#f8fafc' },
        subtitle: { margin: '6px 0 0', fontSize: '15px', color: '#94a3b8' },
        // formGroup: { marginBottom: '20px' },
        label: { display: 'block', marginBottom: '6px', fontSize: '16px', fontWeight: '500', color: '#e2e8f0' },
        input: { width: '100%', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5', color: '#e2e8f0', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', transition: 'all 0.15s ease-in-out', boxSizing: 'border-box' },
        select: { width: '100%', height: '42px', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5', color: '#e2e8f0', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', transition: 'all 0.15s ease-in-out', boxSizing: 'border-box', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '20px', paddingRight: '40px', cursor: 'pointer' },
        textarea: { width: '100%', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5', color: '#e2e8f0', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', transition: 'all 0.15s ease-in-out', boxSizing: 'border-box', resize: 'vertical', minHeight: '80px' },
        badge: { display: 'inline-flex', alignItems: 'center', padding: '6px 12px', fontSize: '13px', fontWeight: '500', borderRadius: '6px', gap: '6px' },
        badgePrimary: { backgroundColor: '#3b82f6', color: 'white' },
        badgeSecondary: { backgroundColor: '#475569', color: 'white' },
        badgeSuccess: { backgroundColor: '#10b981', color: 'white' },
        btn: { padding: '10px 20px', fontSize: '14px', fontWeight: '500', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.15s ease-in-out', display: 'inline-flex', alignItems: 'center', gap: '8px' },
        btnPrimary: {
            backgroundColor: '#3b82f6',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            '&:hover': {
                backgroundColor: '#2563eb',
            },
            '&:disabled': {
                backgroundColor: '#93c5fd',
                cursor: 'not-allowed',
            },
        },
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
        toast: { position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', color: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', zIndex: 9999 },
        toolTip: { width: '40%' },
        summaryContainer: {
            backgroundColor: '#0f1624',
            borderRadius: '8px',
            padding: '24px',
            border: '1px solid #1e293b',
            marginTop: '16px'
        },
        summaryTitle: {
            marginTop: 0,
            marginBottom: '20px',
            color: '#f8fafc',
            fontSize: '1.25rem',
            fontWeight: 600
        },
        summaryGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            marginBottom: '16px'
        },
        summarySection: {
            backgroundColor: '#141b2d',
            padding: '16px',
            borderRadius: '6px',
            border: '1px solid #1e293b'
        },
        summarySectionTitle: {
            marginTop: 0,
            marginBottom: '12px',
            color: '#e2e8f0',
            fontSize: '1rem',
            fontWeight: 600,
            paddingBottom: '8px',
            borderBottom: '1px solid #1e293b'
        },
        summaryChip: {
            display: 'inline-block',
            backgroundColor: '#1e3a8a',
            color: '#93c5fd',
            padding: '4px 10px',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            fontWeight: 500
        },
        complianceNote: {
            backgroundColor: '#1e293b',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            color: '#94a3b8',
            marginTop: '8px',
            whiteSpace: 'pre-wrap'
        }
    };


    if (!mounted) return null;

    return (
        <div style={styles.container}>
            {/* -------------------- Notification Toast -------------------- */}
            {notification.show && (
                <div style={{
                    ...styles.toast,
                    backgroundColor: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
                    borderColor: notification.type === 'error' ? '#fecaca' : '#bbf7d0',
                    color: notification.type === 'error' ? '#b91c1c' : '#166534',
                }}>
                    {notification.message}
                    <button onClick={() => setNotification({ ...notification, show: false })} style={{
                        background: 'none', border: 'none', color: 'inherit', marginLeft: '10px', cursor: 'pointer', fontSize: '18px'
                    }}>&times;</button>
                </div>
            )}

            {/* -------------------- Main Form / Summary View -------------------- */}
            {!showSummary ? (
                <>
                    <div style={styles.header} id="ad-copy-form-top">
                        <h1 style={styles.title}>Ad Copy Generator</h1>
                        <p style={styles.subtitle}>Create compelling ad copy for your campaigns</p>
                    </div>
                    <div style={styles.card}>

                        <div style={{ padding: '24px' }}>
                            <form onSubmit={handleSubmit}>
                                <div className="row g-4">
                                    {/* Main (non-advanced) fields */}
                                    {!formData.showAdvanced && (
                                        <>
                                            {/* Platform & Placement - Two-Step Selector */}

                                            <div className="col-md-6">
                                                <div style={styles.formGroup}>
                                                    <label htmlFor="platform" style={styles.label}>
                                                        Ad Platform <span style={{ color: '#ef4444' }}>*</span>
                                                        <span
                                                            style={styles.infoIcon}
                                                            data-tooltip-id="platform-tooltip"
                                                            data-tooltip-content="Choose whether you want to use predefined platforms like Instagram, Facebook, Google, or enter your own custom platform. This helps the tool understand where your ad will be posted so the content format matches platform style."
                                                        >
                                                            i
                                                        </span>
                                                    </label>
                                                    <Tooltip style={styles.toolTip} id="platform-tooltip" />
                                                    {/* Platform mode: Predefined vs Custom */}
                                                    <div style={styles.radioGroup}>
                                                        <label style={styles.radioItem}>
                                                            <input
                                                                type="radio"
                                                                name="platformMode"
                                                                value="predefined"
                                                                checked={formData.platformMode === 'predefined'}
                                                                onChange={(e) => {
                                                                    const mode = e.target.value;
                                                                    setFormData(prev => {
                                                                        const next = { ...prev, platformMode: mode };
                                                                        if (mode === 'predefined') {
                                                                            const predefinedLabels = (fieldOptions.platform || []).map(opt => opt.label);
                                                                            if (!predefinedLabels.includes(prev.platform)) {
                                                                                const defaultLabel = (fieldOptions.platform && fieldOptions.platform[0]?.label) || prev.platform;
                                                                                next.platform = defaultLabel;
                                                                            }
                                                                        }
                                                                        if (mode === 'custom') {
                                                                            next.platform = prev.platformCustom || '';
                                                                        }
                                                                        return next;
                                                                    });
                                                                }}
                                                            />
                                                            <span>Predefined</span>
                                                        </label>
                                                        <label style={styles.radioItem}>
                                                            <input
                                                                type="radio"
                                                                name="platformMode"
                                                                value="custom"
                                                                checked={formData.platformMode === 'custom'}
                                                                onChange={(e) => {
                                                                    const mode = e.target.value;
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        platformMode: mode,
                                                                        platform: prev.platformCustom || '',
                                                                    }));
                                                                }}
                                                            />
                                                            <span>Custom</span>
                                                        </label>
                                                    </div>

                                                    {formData.platformMode === 'predefined' && (
                                                        <select
                                                            id="platform"
                                                            name="platform"
                                                            // Use key for value attribute, label for display
                                                            value={fieldOptions.platform.find(opt => opt.label === formData.platform)?.key || formData.platform}
                                                            onChange={handlePlatformChange}
                                                            style={{ ...styles.select, marginTop: '8px' }}
                                                            required
                                                        >
                                                            {loadingOptions && <option value="">Loading Platforms...</option>}
                                                            {fieldOptions.platform && fieldOptions.platform.map((option) => (
                                                                <option
                                                                    key={option.key || option.id}
                                                                    value={option.key}
                                                                >
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    {formData.platformMode === 'custom' && (
                                                        <input
                                                            type="text"
                                                            id="platformCustom"
                                                            name="platformCustom"
                                                            value={formData.platformCustom}
                                                            onChange={handleChange}
                                                            style={{ ...styles.input, marginTop: '8px' }}
                                                            placeholder="Enter custom ad platform"
                                                            required
                                                        />
                                                    )}
                                                    {optionsError && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{optionsError}</p>}
                                                </div>
                                            </div>

                                            <div className="col-md-6">
                                                <div style={styles.formGroup}>
                                                    <label htmlFor="placement" style={styles.label}>
                                                        Ad Placement <span style={{ color: '#ef4444' }}>*</span>
                                                        <span
                                                            style={styles.infoIcon}
                                                            data-tooltip-id="placement-tooltip"
                                                            data-tooltip-content="Select where the ad will appear (example: feed, story, search results, sidebar). Placement affects length, tone, and visual structure of the generated ad, so choosing correctly helps improve conversion and readability."
                                                        >
                                                            i
                                                        </span>
                                                    </label>
                                                    <Tooltip style={styles.toolTip} id="placement-tooltip" />
                                                    <div style={styles.radioGroup}>
                                                        <label style={styles.radioItem}>
                                                            <input
                                                                type="radio"
                                                                name="placementMode"
                                                                value="predefined"
                                                                checked={placementMode === 'predefined'}
                                                                onChange={() => {
                                                                    setPlacementMode('predefined');
                                                                    setFormData(prev => {
                                                                        const labels = availablePlacements.map(p => p.label);
                                                                        let nextPlacement = prev.placement;
                                                                        if (!labels.includes(nextPlacement) && availablePlacements[0]) {
                                                                            nextPlacement = availablePlacements[0].label;
                                                                        }
                                                                        return { ...prev, placement: nextPlacement };
                                                                    });
                                                                }}
                                                            />
                                                            <span>Predefined</span>
                                                        </label>
                                                        <label style={styles.radioItem}>
                                                            <input
                                                                type="radio"
                                                                name="placementMode"
                                                                value="custom"
                                                                checked={placementMode === 'custom'}
                                                                onChange={() => {
                                                                    setPlacementMode('custom');
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        placement: placementCustom || '',
                                                                    }));
                                                                }}
                                                            />
                                                            <span>Custom</span>
                                                        </label>
                                                    </div>

                                                    {placementMode === 'predefined' && (
                                                        <select
                                                            id="placement"
                                                            name="placement"
                                                            // Use key for value attribute, label for display
                                                            value={fieldOptions.placement.find(opt => opt.label === formData.placement)?.key || formData.placement}
                                                            onChange={handleChange}
                                                            style={{ ...styles.select, marginTop: '8px' }}
                                                            required
                                                            disabled={!formData.platform || availablePlacements.length === 0}
                                                        >
                                                            <option value="">Select Placement</option>
                                                            {availablePlacements.map((option) => (
                                                                <option
                                                                    key={option.key || option.id}
                                                                    value={option.key}
                                                                >
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    {placementMode === 'custom' && (
                                                        <input
                                                            type="text"
                                                            id="placementCustom"
                                                            value={placementCustom}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setPlacementCustom(val);
                                                                setFormData(prev => ({ ...prev, placement: val }));
                                                            }}
                                                            style={{ ...styles.input, marginTop: '8px' }}
                                                            placeholder="Enter custom ad placement"
                                                            required
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Campaign Objective */}
                                            <div className="col-12">
                                                <div style={styles.formGroup}>
                                                    <label htmlFor="campaignObjective" style={styles.label}>
                                                        Campaign Objective <span style={{ color: '#ef4444' }}>*</span>
                                                        <span
                                                            style={styles.infoIcon}
                                                            data-tooltip-id="campaignObjective-tooltip"
                                                            data-tooltip-html="Select the main goal of your campaign, such as leads, sales, awareness, traffic, or engagement. The tool uses your objective to shape message style, content strength, and call-to-action direction to drive results effectively."
                                                        >
                                                            i
                                                        </span>
                                                    </label>
                                                    <Tooltip style={styles.toolTip} id="campaignObjective-tooltip" />
                                                    <div style={styles.radioGroup}>
                                                        <label style={styles.radioItem}>
                                                            <input
                                                                type="radio"
                                                                name="campaignObjectiveMode"
                                                                value="predefined"
                                                                checked={campaignObjectiveMode === 'predefined'}
                                                                onChange={() => {
                                                                    setCampaignObjectiveMode('predefined');
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        campaignObjective: fieldOptions.campaign_objective.find(opt => opt.label === prev.campaignObjective)?.label || prev.campaignObjective,
                                                                    }));
                                                                }}
                                                            />
                                                            <span>Predefined</span>
                                                        </label>
                                                        <label style={styles.radioItem}>
                                                            <input
                                                                type="radio"
                                                                name="campaignObjectiveMode"
                                                                value="custom"
                                                                checked={campaignObjectiveMode === 'custom'}
                                                                onChange={() => {
                                                                    setCampaignObjectiveMode('custom');
                                                                    setFormData(prev => ({ ...prev, campaignObjective: 'Custom Objective' }));
                                                                }}
                                                            />
                                                            <span>Custom</span>
                                                        </label>
                                                    </div>

                                                    {campaignObjectiveMode === 'predefined' && (
                                                        <select
                                                            id="campaignObjective"
                                                            name="campaignObjective"
                                                            // Use key for value attribute, label for display
                                                            value={fieldOptions.campaign_objective.find(opt => opt.label === formData.campaignObjective)?.key || formData.campaignObjective}
                                                            onChange={handleChange}
                                                            style={{ ...styles.select, marginTop: '8px' }}
                                                            required
                                                        >
                                                            {fieldOptions.campaign_objective && fieldOptions.campaign_objective.map((option) => (
                                                                <option
                                                                    key={option.key || option.id}
                                                                    value={option.key}
                                                                >
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    {campaignObjectiveMode === 'custom' && (
                                                        <div style={{ marginTop: '12px' }}>
                                                            <input
                                                                type="text"
                                                                name="customObjective"
                                                                value={formData.customObjective}
                                                                onChange={handleChange}
                                                                style={styles.input}
                                                                placeholder="Describe your custom objective"
                                                                required={formData.campaignObjective === 'Custom Objective'}
                                                            />

                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Target Audience */}
                                            <div className="col-12">
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

                                                    {/* Audience Chips and Input (No change here as it's a multi-select custom input) */}
                                                    {/* ... (Audience Input/Chips render logic remains the same) ... */}
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
                                                            <span style={{ color: '#9ca3af', fontSize: '14px', marginLeft: '8px' }}>
                                                                Type and press Enter to add audience segments (e.g., 'Women 25-34', 'Fitness Enthusiasts')
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
                                                                    onClick={() => removeAudienceChip(chip)}
                                                                />
                                                            </span>
                                                        ))}
                                                    </div>

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
                                                                borderBottomRightRadius: showAudienceSuggestions ? '0' : '6px',
                                                                WebkitAppearance: 'none' // Removes inner shadow on iOS
                                                            }}
                                                            placeholder={formData.targetAudience.length === 0
                                                                ? "Type and press Enter to Add audience segments (e.g., 'Women 25-34')"
                                                                : "Type and press Enter to Add another segment"}
                                                            required={formData.targetAudience.length === 0}
                                                            inputMode="text"
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
                                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
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
                                                                                    style={{ padding: '8px 16px', cursor: 'pointer' }}
                                                                                >
                                                                                    {suggestion}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    );
                                                                })}

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
                                                                            Add **"{audienceInput}"** as custom audience
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Product/Services */}
                                            <div className="col-12">
                                                <div style={styles.formGroup}>
                                                    <label htmlFor="productServices" style={styles.label}>
                                                        Product/Services <span style={{ color: '#ef4444' }}>*</span>
                                                        <span
                                                            style={styles.infoIcon}
                                                            data-tooltip-id="productServices-tooltip"
                                                            data-tooltip-html="Write important information about your product or service, including features, purpose, and key details. Clear information allows the system to create accurate ad content that explains your offering effectively to potential customers."
                                                        >
                                                            i
                                                        </span>
                                                    </label>
                                                    <Tooltip style={styles.toolTip} id="productServices-tooltip" />
                                                    <textarea
                                                        id="productServices"
                                                        name="productServices"
                                                        value={formData.productServices}
                                                        onChange={handleChange}
                                                        style={{ ...styles.textarea, minHeight: '100px' }}
                                                        placeholder="Describe your product or service in detail. What makes it unique? What problems does it solve?"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {/* Tone */}
                                            <div className="col-md-6">
                                                <div style={styles.formGroup}>
                                                    <label htmlFor="tone" style={styles.label}>
                                                        Tone <span style={{ color: '#ef4444' }}>*</span>
                                                        <span
                                                            style={styles.infoIcon}
                                                            data-tooltip-id="tone-tooltip"
                                                            data-tooltip-html="Select the personality or feel of the ad copy (such as professional, friendly, urgent, funny, bold). Tone guides how the message connects emotionally with your target audience."
                                                        >
                                                            i
                                                        </span>
                                                    </label>
                                                    <Tooltip style={styles.toolTip} id="tone-tooltip" />
                                                    <div style={styles.radioGroup}>
                                                        <label style={styles.radioItem}>
                                                            <input
                                                                type="radio"
                                                                name="toneMode"
                                                                value="predefined"
                                                                checked={toneMode === 'predefined'}
                                                                onChange={() => {
                                                                    setToneMode('predefined');
                                                                    setFormData(prev => ({ ...prev, tone: 'Auto-Detect (Based on Platform)' }));
                                                                }}
                                                            />
                                                            <span>Predefined</span>
                                                        </label>
                                                        <label style={styles.radioItem}>
                                                            <input
                                                                type="radio"
                                                                name="toneMode"
                                                                value="custom"
                                                                checked={toneMode === 'custom'}
                                                                onChange={() => {
                                                                    setToneMode('custom');
                                                                    setFormData(prev => ({ ...prev, tone: toneCustom || '' }));
                                                                }}
                                                            />
                                                            <span>Custom</span>
                                                        </label>
                                                    </div>

                                                    {toneMode === 'predefined' && (
                                                        <select
                                                            id="tone"
                                                            name="tone"
                                                            // Use key for value attribute, label for display
                                                            value={fieldOptions.tone_style.find(opt => opt.label === formData.tone)?.key || formData.tone}
                                                            onChange={handleChange}
                                                            style={{ ...styles.select, marginTop: '8px' }}
                                                        >
                                                            <option value="Auto-Detect (Based on Platform)">Auto-Detect (Based on Platform)</option>
                                                            {fieldOptions.tone_style && fieldOptions.tone_style.map((option) => (
                                                                <option
                                                                    key={option.key || option.id}
                                                                    value={option.key}
                                                                >
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    {toneMode === 'custom' && (
                                                        <input
                                                            type="text"
                                                            id="toneCustom"
                                                            value={toneCustom}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setToneCustom(val);
                                                                setFormData(prev => ({ ...prev, tone: val }));
                                                            }}
                                                            style={{ ...styles.input, marginTop: '8px' }}
                                                            placeholder="Enter custom tone"
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Headline Focus */}
                                            <div className="col-md-6">
                                                <div style={styles.formGroup}>
                                                    <label htmlFor="headlineFocus" style={styles.label}>
                                                        Headline Focus
                                                        <span
                                                            style={styles.infoIcon}
                                                            data-tooltip-id="headlineFocus-tooltip"
                                                            data-tooltip-html="Choose what you want the headline to highlight, such as problem-solution, transformation, discount, or urgency. A good hook catches immediate attention and improves click-through rates."
                                                        >
                                                            i
                                                        </span>
                                                    </label>
                                                    <Tooltip style={styles.toolTip} id="headlineFocus-tooltip" />
                                                    <div style={styles.radioGroup}>
                                                        <label style={styles.radioItem}>
                                                            <input
                                                                type="radio"
                                                                name="headlineFocusMode"
                                                                value="predefined"
                                                                checked={headlineFocusMode === 'predefined'}
                                                                onChange={() => {
                                                                    setHeadlineFocusMode('predefined');
                                                                    setFormData(prev => ({ ...prev, headlineFocus: 'Auto-Select (Recommended)' }));
                                                                }}
                                                            />
                                                            <span>Predefined</span>
                                                        </label>
                                                        <label style={styles.radioItem}>
                                                            <input
                                                                type="radio"
                                                                name="headlineFocusMode"
                                                                value="custom"
                                                                checked={headlineFocusMode === 'custom'}
                                                                onChange={() => {
                                                                    setHeadlineFocusMode('custom');
                                                                    setFormData(prev => ({ ...prev, headlineFocus: headlineFocusCustom || '' }));
                                                                }}
                                                            />
                                                            <span>Custom</span>
                                                        </label>
                                                    </div>

                                                    {headlineFocusMode === 'predefined' && (
                                                        <select
                                                            id="headlineFocus"
                                                            name="headlineFocus"
                                                            // Use key for value attribute, label for display
                                                            value={fieldOptions.headline_focus.find(opt => opt.label === formData.headlineFocus)?.key || formData.headlineFocus}
                                                            onChange={handleChange}
                                                            style={{ ...styles.select, marginTop: '8px' }}
                                                        >
                                                            <option value="Auto-Select (Recommended)">Auto-Select (Recommended)</option>
                                                            {fieldOptions.headline_focus && fieldOptions.headline_focus.map((option) => (
                                                                <option
                                                                    key={option.key || option.id}
                                                                    value={option.key}
                                                                >
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    {headlineFocusMode === 'custom' && (
                                                        <input
                                                            type="text"
                                                            id="headlineFocusCustom"
                                                            value={headlineFocusCustom}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setHeadlineFocusCustom(val);
                                                                setFormData(prev => ({ ...prev, headlineFocus: val }));
                                                            }}
                                                            style={{ ...styles.input, marginTop: '8px' }}
                                                            placeholder="Enter custom headline focus"
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Ad Text Length (6-column on desktop, full-width on mobile) */}
                                            <div className="col-12 col-md-6">
                                                <div style={styles.formGroup}>
                                                    <label htmlFor="adTextLength" style={styles.label}>
                                                        Ad Text Length
                                                        <span
                                                            style={styles.infoIcon}
                                                            data-tooltip-id="adTextLength-tooltip"
                                                            data-tooltip-content="Select the desired length for your ad copy, or define a custom description."
                                                        >
                                                            i
                                                        </span>
                                                    </label>
                                                    <Tooltip style={styles.toolTip} id="adTextLength-tooltip" />

                                                    {/* Mode toggle: Predefined vs Custom */}
                                                    <div style={styles.radioGroup}>
                                                        <label style={styles.radioItem}>
                                                            <input
                                                                type="radio"
                                                                name="adTextLengthMode"
                                                                value="predefined"
                                                                checked={adTextLengthMode === 'predefined'}
                                                                onChange={() => {
                                                                    setAdTextLengthMode('predefined');
                                                                    const defaultAdTextLength = fieldOptions.primary_text_length?.[0]?.label || '';
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        adTextLength: defaultAdTextLength,
                                                                    }));
                                                                }}
                                                            />
                                                            <span>Predefined</span>
                                                        </label>
                                                        <label style={styles.radioItem}>
                                                            <input
                                                                type="radio"
                                                                name="adTextLengthMode"
                                                                value="custom"
                                                                checked={adTextLengthMode === 'custom'}
                                                                onChange={() => {
                                                                    setAdTextLengthMode('custom');
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        adTextLength: adTextLengthCustom || prev.adTextLength,
                                                                    }));
                                                                }}
                                                            />
                                                            <span>Custom</span>
                                                        </label>
                                                    </div>

                                                    {/* Predefined length select */}
                                                    {adTextLengthMode === 'predefined' && (
                                                        <select
                                                            id="adTextLength"
                                                            name="adTextLength"
                                                            // Use key for value attribute, label for display
                                                            value={fieldOptions.primary_text_length.find(opt => opt.label === formData.adTextLength)?.key || formData.adTextLength}
                                                            onChange={handleChange}
                                                            style={{ ...styles.select, marginTop: '8px' }}
                                                        >
                                                            {fieldOptions.primary_text_length && fieldOptions.primary_text_length.map((option) => (
                                                                <option
                                                                    key={option.key || option.id}
                                                                    value={option.key}
                                                                >
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    {/* Custom length description (numeric, max 2000) */}
                                                    {adTextLengthMode === 'custom' && (
                                                        <>
                                                            <input
                                                                type="number"
                                                                id="adTextLengthCustom"
                                                                name="adTextLengthCustom"
                                                                value={adTextLengthCustom}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    // Allow empty value while typing, otherwise clamp to 0-2000 range
                                                                    if (val === '') {
                                                                        setAdTextLengthCustom(val);
                                                                        setFormData(prev => ({ ...prev, adTextLength: val }));
                                                                        return;
                                                                    }

                                                                    const numeric = Math.min(500, Math.max(0, parseInt(val, 10) || 0));
                                                                    const next = String(numeric);
                                                                    setAdTextLengthCustom(next);
                                                                    setFormData(prev => ({ ...prev, adTextLength: next }));
                                                                }}
                                                                style={{ ...styles.input, marginTop: '8px' }}
                                                                placeholder="Enter desired length (1 - 500 characters)"
                                                                min={0}
                                                                max={500}
                                                                step={1}
                                                            />
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                                                                <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                                                                    Custom ad text length must be an integer between 1 and 500 characters.
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* CTA Type (6-column on desktop, full-width on mobile) */}
                                            <div className="col-12 col-md-6">
                                                <div style={styles.formGroup}>
                                                    <label htmlFor="ctaType" style={styles.label}>
                                                        Call to Action (CTA)
                                                        <span
                                                            style={styles.infoIcon}
                                                            data-tooltip-id="ctaType-tooltip"
                                                            data-tooltip-html="Choose what action you want users to take (example: Buy Now, Learn More, Sign Up). A strong CTA increases conversions by telling the audience exactly what to do next."
                                                        >
                                                            i
                                                        </span>
                                                    </label>
                                                    <Tooltip style={styles.toolTip} id="ctaType-tooltip" />
                                                    <div style={styles.radioGroup}>
                                                        <label style={styles.radioItem}>
                                                            <input
                                                                type="radio"
                                                                name="ctaTypeMode"
                                                                value="predefined"
                                                                checked={ctaTypeMode === 'predefined'}
                                                                onChange={() => {
                                                                    setCtaTypeMode('predefined');
                                                                    setFormData(prev => ({ ...prev, ctaType: 'Learn More' }));
                                                                }}
                                                            />
                                                            <span>Predefined</span>
                                                        </label>
                                                        <label style={styles.radioItem}>
                                                            <input
                                                                type="radio"
                                                                name="ctaTypeMode"
                                                                value="custom"
                                                                checked={ctaTypeMode === 'custom'}
                                                                onChange={() => {
                                                                    setCtaTypeMode('custom');
                                                                    setFormData(prev => ({ ...prev, ctaType: ctaTypeCustom || '' }));
                                                                }}
                                                            />
                                                            <span>Custom</span>
                                                        </label>
                                                    </div>

                                                    {ctaTypeMode === 'predefined' && (
                                                        <select
                                                            id="ctaType"
                                                            name="ctaType"
                                                            // Use key for value attribute, label for display
                                                            value={fieldOptions.cta_type.find(opt => opt.label === formData.ctaType)?.key || formData.ctaType}
                                                            onChange={handleChange}
                                                            style={{ ...styles.select, marginTop: '8px' }}
                                                        >
                                                            <option value="">Select CTA Type</option>
                                                            {fieldOptions.cta_type && fieldOptions.cta_type.map((option) => (
                                                                <option
                                                                    key={option.key || option.id}
                                                                    value={option.key}
                                                                >
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    {ctaTypeMode === 'custom' && (
                                                        <input
                                                            type="text"
                                                            id="ctaTypeCustom"
                                                            value={ctaTypeCustom}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setCtaTypeCustom(val);
                                                                setFormData(prev => ({ ...prev, ctaType: val }));
                                                            }}
                                                            style={{ ...styles.input, marginTop: '8px' }}
                                                            placeholder="Enter custom CTA"
                                                            required
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Key Benefits */}
                                            <div className="col-12">
                                                <div style={styles.formGroup}>
                                                    <label style={styles.label}>
                                                        Key Benefits
                                                        <span style={styles.infoIcon} data-tooltip-id="keyBenefits-tooltip" data-tooltip-content="List the main benefits of your product/service (press Enter to add)">i</span>
                                                    </label>
                                                    <Tooltip style={styles.toolTip} id="keyBenefits-tooltip" />
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
                                                        backgroundColor: formData.keyBenefits.length > 0 ? '#f9fafb' : 'white'
                                                    }}>
                                                        {formData.keyBenefits.length === 0 && (
                                                            <span style={{ color: '#9ca3af', fontSize: '14px', marginLeft: '8px' }}>
                                                                Type and press Enter to add key benefits
                                                            </span>
                                                        )}
                                                        {formData.keyBenefits.map((benefit, index) => (
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
                                                                {benefit}

                                                                <RemoveTagButton
                                                                    style={styles.removeBtn}
                                                                    onClick={() => removeItem('keyBenefits', index)}
                                                                />
                                                            </span>
                                                        ))}
                                                    </div>

                                                    {/* Input to add new key benefits, same interaction as before */}
                                                    <input
                                                        type="text"
                                                        style={styles.input}
                                                        placeholder="Type and press Enter to add key benefits"
                                                        onKeyPress={(e) => handleArrayChange(e, 'keyBenefits')}
                                                        onBlur={(e) => {
                                                            const value = e.target.value.trim();
                                                            if (value && formData.keyBenefits.length < 10) {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    keyBenefits: [...prev.keyBenefits, value]
                                                                }));
                                                                e.target.value = '';
                                                            }
                                                        }}
                                                        disabled={formData.keyBenefits.length >= 10}
                                                        inputMode='text'
                                                    />
                                                </div>
                                            </div>

                                            {/* Number of Variants */}
                                            <div className="col-12">
                                                <div style={styles.formGroup}>
                                                    <label htmlFor="variants" style={styles.label}>
                                                        Number of Variants: {formData.variants}
                                                        <span style={styles.infoIcon} data-tooltip-id="variants-tooltip" data-tooltip-content="How many different ad variations would you like to generate?">i</span>
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

                                            {/* Emotional Angle */}
                                            <div className="col-md-6">
                                                <div style={styles.formGroup}>
                                                    <label htmlFor="emotionalAngle" style={styles.label}>
                                                        Emotional Angle
                                                    </label>
                                                    <div style={styles.radioGroup}>
                                                        <label style={styles.radioItem}>
                                                            <input
                                                                type="radio"
                                                                name="emotionalAngleMode"
                                                                value="predefined"
                                                                checked={emotionalAngleMode === 'predefined'}
                                                                onChange={() => {
                                                                    setEmotionalAngleMode('predefined');
                                                                    setFormData(prev => ({ ...prev, emotionalAngle: 'Pain → Solution' }));
                                                                }}
                                                            />
                                                            <span>Predefined</span>
                                                        </label>
                                                        <label style={styles.radioItem}>
                                                            <input
                                                                type="radio"
                                                                name="emotionalAngleMode"
                                                                value="custom"
                                                                checked={emotionalAngleMode === 'custom'}
                                                                onChange={() => {
                                                                    setEmotionalAngleMode('custom');
                                                                    setFormData(prev => ({ ...prev, emotionalAngle: emotionalAngleCustom || '' }));
                                                                }}
                                                            />
                                                            <span>Custom</span>
                                                        </label>
                                                    </div>

                                                    {emotionalAngleMode === 'predefined' && (
                                                        <select
                                                            id="emotionalAngle"
                                                            name="emotionalAngle"
                                                            // Use key for value attribute, label for display
                                                            value={fieldOptions.emotional_angle.find(opt => opt.label.replace('\t', '→') === formData.emotionalAngle)?.key || formData.emotionalAngle}
                                                            onChange={handleChange}
                                                            style={{ ...styles.select, marginTop: '8px' }}
                                                        >
                                                            <option value="">Select Emotional Angle</option>
                                                            {fieldOptions.emotional_angle && fieldOptions.emotional_angle.map((option) => (
                                                                <option
                                                                    key={option.key || option.id}
                                                                    value={option.key}
                                                                >
                                                                    {option.label.replace('\t', '→')}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    {emotionalAngleMode === 'custom' && (
                                                        <input
                                                            type="text"
                                                            id="emotionalAngleCustom"
                                                            value={emotionalAngleCustom}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setEmotionalAngleCustom(val);
                                                                setFormData(prev => ({ ...prev, emotionalAngle: val }));
                                                            }}
                                                            style={{ ...styles.input, marginTop: '8px' }}
                                                            placeholder="Enter custom emotional angle"
                                                            required
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            <hr style={{ width: '100%', border: 'none', borderTop: '1px solid #e5e7eb', margin: '5px 0' }} />
                                        </>

                                    )}
                                    {/* Advanced Features Toggle */}
                                    <div className="col-12" style={{ margin: '16px 0' }}>
                                        <ToggleButton showAdvanced={formData.showAdvanced} onToggle={toggleAdvanced} />
                                    </div>

                                    {/* Advanced Features */}
                                    {formData.showAdvanced && (
                                        <>
                                            {/* Brand Voice */}
                                            <div className="col-12">
                                                <div style={styles.formGroup}>
                                                    <label htmlFor="brandVoice" style={styles.label}>
                                                        Brand Voice (Optional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="brandVoice"
                                                        name="brandVoice"
                                                        value={formData.brandVoice}
                                                        onChange={handleChange}
                                                        style={styles.input}
                                                        placeholder="Describe your brand's tone and personality"
                                                    />
                                                </div>
                                            </div>

                                            {/* USP (Unique Selling Proposition) */}
                                            <div className="col-12">
                                                <div style={styles.formGroup}>
                                                    <label htmlFor="usp" style={styles.label}>
                                                        USP [Unique Selling Proposition](Optional)
                                                    </label>
                                                    <textarea
                                                        id="usp"
                                                        name="usp"
                                                        value={formData.usp}
                                                        onChange={handleChange}
                                                        style={{ ...styles.textarea, minHeight: '80px' }}
                                                        placeholder="Strongest differentiator vs competitors. E.g., 'First AI tool with multi-variant regeneration in one click.'"
                                                    />
                                                </div>
                                            </div>

                                            {/* Feature Highlight */}
                                            <div className="col-12">
                                                <div style={styles.formGroup}>
                                                    <label htmlFor="featureHighlight" style={styles.label}>
                                                        Feature Highlight (Optional)
                                                    </label>
                                                    <textarea
                                                        id="featureHighlight"
                                                        name="featureHighlight"
                                                        value={formData.featureHighlight}
                                                        onChange={handleChange}
                                                        style={{ ...styles.textarea, minHeight: '80px' }}
                                                        placeholder="Most important product feature showcased. E.g., 'Automated campaign generation in 30 seconds.'"
                                                    />
                                                </div>
                                            </div>

                                            {/* Problem Scenario */}
                                            <div className="col-12">
                                                <div style={styles.formGroup}>
                                                    <label htmlFor="problemScenario" style={styles.label}>
                                                        Problem Scenario (Optional)
                                                    </label>
                                                    <textarea
                                                        id="problemScenario"
                                                        name="problemScenario"
                                                        value={formData.problemScenario}
                                                        onChange={handleChange}
                                                        style={{ ...styles.textarea, minHeight: '80px' }}
                                                        placeholder="When/where customer needs your solution. E.g., 'When agencies need to scale content fast without hiring more writers during seasonal sales events.'"
                                                    />
                                                </div>
                                            </div>

                                            {/* Offer & Pricing */}
                                            <div className="col-md-6">
                                                <div style={styles.formGroup}>
                                                    <label htmlFor="offerPricing" style={styles.label}>
                                                        Offer & Pricing (Optional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="offerPricing"
                                                        name="offerPricing"
                                                        value={formData.offerPricing}
                                                        onChange={handleChange}
                                                        style={styles.input}
                                                        placeholder="e.g., 20% off, Free trial, Limited time offer"
                                                    />
                                                </div>
                                            </div>

                                            {/* Asset Reuse Strategy */}
                                            <div className="col-md-6">
                                                <div style={styles.formGroup}>
                                                    <label htmlFor="assetReuseStrategy" style={styles.label}>
                                                        Asset Reuse Strategy (Optional)
                                                    </label>

                                                    {/* Mode toggle */}
                                                    <div style={styles.radioGroup}>
                                                        <label style={styles.radioItem}>
                                                            <input
                                                                type="radio"
                                                                name="assetReuseMode"
                                                                value="predefined"
                                                                checked={assetReuseMode === 'predefined'}
                                                                onChange={() => {
                                                                    setAssetReuseMode('predefined');
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        assetReuseStrategy: prev.assetReuseStrategy || 'Auto-Detect (Recommended)',
                                                                    }));
                                                                }}
                                                            />
                                                            <span>Predefined</span>
                                                        </label>
                                                        <label style={styles.radioItem}>
                                                            <input
                                                                type="radio"
                                                                name="assetReuseMode"
                                                                value="custom"
                                                                checked={assetReuseMode === 'custom'}
                                                                onChange={() => {
                                                                    setAssetReuseMode('custom');
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        assetReuseStrategy: assetReuseCustom || prev.assetReuseStrategy,
                                                                    }));
                                                                }}
                                                            />
                                                            <span>Custom</span>
                                                        </label>
                                                    </div>

                                                    {/* Predefined select */}
                                                    {assetReuseMode === 'predefined' && (
                                                        <select
                                                            id="assetReuseStrategy"
                                                            name="assetReuseStrategy"
                                                            // Use key for value attribute, label for display
                                                            value={fieldOptions.asset_reuse_strategy.find(opt => opt.label === formData.assetReuseStrategy)?.key || formData.assetReuseStrategy}
                                                            onChange={handleChange}
                                                            style={{ ...styles.select, marginTop: '8px' }}
                                                        >
                                                            <option value="">Select Strategy</option>
                                                            <option value="Auto-Detect (Recommended)">Auto-Detect (Recommended)</option>
                                                            {fieldOptions.asset_reuse_strategy && fieldOptions.asset_reuse_strategy.map((option) => (
                                                                <option
                                                                    key={option.key || option.id}
                                                                    value={option.key}
                                                                >
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    {/* Custom input */}
                                                    {assetReuseMode === 'custom' && (
                                                        <div style={{ marginTop: '8px' }}>
                                                            <input
                                                                type="text"
                                                                id="assetReuseCustom"
                                                                name="assetReuseCustom"
                                                                value={assetReuseCustom}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setAssetReuseCustom(val);
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        assetReuseStrategy: val,
                                                                    }));
                                                                }}
                                                                style={styles.input}
                                                                placeholder="Describe how existing assets should be reused"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Audience Pain Points */}
                                            <div className="col-12">
                                                <div style={styles.formGroup}>
                                                    <label style={styles.label}>
                                                        Audience Pain Points (Optional)
                                                        <span style={styles.infoIcon} data-tooltip-id="audiencePain-tooltip" data-tooltip-content="What problems or pain points does your product/service solve? (press Enter to add)">i</span>
                                                    </label>
                                                    <Tooltip style={styles.toolTip} id="audiencePain-tooltip" />
                                                    <input
                                                        type="text"
                                                        style={styles.input}
                                                        placeholder="Add a pain point and press Enter"
                                                        onKeyPress={(e) => handleArrayChange(e, 'audiencePain')}
                                                    />
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                                                        {formData.audiencePain.length === 0 && (
                                                            <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                                                                Type and press Enter to add audience pain points
                                                            </span>
                                                        )}
                                                        {formData.audiencePain.map((pain, index) => (
                                                            <span key={index} style={{ ...styles.badge, ...styles.badgeSecondary }}>
                                                                {pain}

                                                                <RemoveTagButton
                                                                    style={styles.removeBtn}
                                                                    onClick={() => removeItem('audiencePain', index)}
                                                                />
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>



                                            {/* Proof & Credibility */}
                                            <div className="col-12">
                                                <div style={styles.formGroup}>
                                                    <label style={styles.label}>
                                                        Proof & Credibility Elements (Optional)
                                                        <span style={styles.infoIcon} data-tooltip-id="proofCredibility-tooltip" data-tooltip-content="Add trust signals (press Enter to add)">i</span>
                                                    </label>
                                                    <Tooltip style={styles.toolTip} id="proofCredibility-tooltip" />
                                                    <input
                                                        type="text"
                                                        style={styles.input}
                                                        placeholder="e.g., '10,000+ happy customers', 'Rated 4.9/5 stars'"
                                                        onKeyPress={(e) => handleArrayChange(e, 'proofCredibility')}
                                                    />
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                                                        {formData.proofCredibility.length === 0 && (
                                                            <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                                                                Type and press Enter to add proof & credibility elements
                                                            </span>
                                                        )}
                                                        {formData.proofCredibility.map((item, index) => (
                                                            <span key={index} style={{ ...styles.badge, ...styles.badgeSuccess }}>
                                                                {item}

                                                                <RemoveTagButton
                                                                    style={styles.removeBtn}
                                                                    onClick={() => removeItem('proofCredibility', index)}
                                                                />
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Compliance Note */}
                                            <div className="col-12">
                                                <div style={styles.formGroup}>
                                                    <label htmlFor="complianceNote" style={styles.label}>
                                                        Compliance Note (Optional)
                                                    </label>
                                                    <textarea
                                                        id="complianceNote"
                                                        name="complianceNote"
                                                        value={formData.complianceNote}
                                                        onChange={handleChange}
                                                        style={{ ...styles.textarea, minHeight: '80px' }}
                                                        placeholder="Any legal disclaimers or compliance requirements for your ads"
                                                    />
                                                </div>
                                            </div>

                                            {/* Brand Voice Personality */}
                                            <div className="col-md-6">
                                                <div style={styles.formGroup}>
                                                    <label htmlFor="brandVoicePersonality" style={styles.label}>
                                                        Brand Voice Personality (Optional)
                                                    </label>
                                                    <div style={{ ...styles.radioGroup, marginBottom: '8px' }}>
                                                        <label style={styles.radioItem}>
                                                            <input
                                                                type="radio"
                                                                name="brandVoicePersonalityMode"
                                                                value="predefined"
                                                                checked={formData.brandVoicePersonalityMode === 'predefined'}
                                                                onChange={handleChange}
                                                            />
                                                            <span>Predefined</span>
                                                        </label>
                                                        <label style={styles.radioItem}>
                                                            <input
                                                                type="radio"
                                                                name="brandVoicePersonalityMode"
                                                                value="custom"
                                                                checked={formData.brandVoicePersonalityMode === 'custom'}
                                                                onChange={handleChange}
                                                            />
                                                            <span>Custom</span>
                                                        </label>
                                                    </div>

                                                    {formData.brandVoicePersonalityMode === 'predefined' && (
                                                        <select
                                                            name="brandVoicePersonalityOption"
                                                            // Use key from API as value, map to label in handleChange
                                                            value={(fieldOptions.brand_voice_personality || []).find(opt => opt.label === formData.brandVoicePersonalityOption)?.key || ''}
                                                            onChange={handleChange}
                                                            style={styles.select}
                                                        >
                                                            <option value="">Select Brand Voice Personality</option>
                                                            {(fieldOptions.brand_voice_personality || []).map((option) => (
                                                                <option
                                                                    key={option.key || option.id}
                                                                    value={option.key}
                                                                >
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    {formData.brandVoicePersonalityMode === 'custom' && (
                                                        <input
                                                            type="text"
                                                            name="brandVoicePersonalityCustom"
                                                            value={formData.brandVoicePersonalityCustom}
                                                            onChange={handleChange}
                                                            style={styles.input}
                                                            placeholder="Describe your brand voice personality (e.g., Calm, Educational, Bold)"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Submit Button */}
                                    <div className="col-12 mt-4">
                                        <div style={{ display: 'flex', gap: '12px' }}>
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
                                                // className='personal-info-button'
                                                style={{ ...styles.btn, ...styles.btnPrimary }}
                                                disabled={isGenerating || isApiLoading}
                                            >
                                                {isGenerating || isApiLoading ? (
                                                    <>
                                                        <span>Loading Summary...</span>
                                                        <div style={{
                                                            width: '16px',
                                                            height: '16px',
                                                            border: '2px solid rgba(255,255,255,0.3)',
                                                            borderTopColor: 'white',
                                                            borderRadius: '50%',
                                                            animation: 'spin 1s linear infinite',
                                                            display: 'inline-block',
                                                            marginLeft: '8px'
                                                        }} />
                                                    </>
                                                ) : 'Review &Generate'}</button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            ) : (
                // --- Summary Review Modal/View ---
                <div style={styles.card}>
                    <div style={styles.header}>
                        <h1 style={styles.title}>Review Your Selections</h1>
                        <p style={styles.subtitle}>Please review your ad copy details before generating</p>
                    </div>
                    <div style={{ padding: '24px' }}>
                        {/* The SummaryReviewModal component is used for the summary display - assuming it exists */}
                        <SummaryReviewModal
                            formData={formData}
                            onGenerate={handleGenerateFromSummary} // Calls updated logic
                            onEdit={handleEditFromSummary}
                            onViewLog={handleViewHistory}
                            isGenerating={isGenerating || isApiLoading}
                        />

                        {/* Rendering basic summary content inline for completeness */}
                        <div style={styles.summaryGrid}>
                            <div style={styles.summarySection}>
                                <h5 style={styles.summarySectionTitle}>Product & Objective</h5>
                                <p><strong>Platform:</strong> {formData.platform} / {formData.placement}</p>
                                <p><strong>Objective:</strong> {formData.campaignObjective === 'Custom Objective' ? (formData.customObjective || 'Custom Objective') : formData.campaignObjective}</p>
                                <p><strong>Product:</strong> {formData.productServices.substring(0, 50)}...</p>
                                <p><strong>Variants:</strong> {formData.variants}</p>
                            </div>
                            <div style={styles.summarySection}>
                                <h5 style={styles.summarySectionTitle}>Targeting</h5>
                                <p><strong>Target Audience:</strong></p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                    {formData.targetAudience.length > 0 ? (
                                        formData.targetAudience.map((audience, index) => (
                                            <span key={index} style={styles.summaryChip}>{audience}</span>
                                        ))
                                    ) : (
                                        <span style={{ color: '#6b7280' }}>No audience segments added</span>
                                    )}
                                </div>
                                {formData.geoLanguageTarget && (
                                    <p><strong>Geo/Language:</strong> {formData.geoLanguageTarget}</p>
                                )}
                            </div>

                            <div style={styles.summarySection}>
                                <h5 style={styles.summarySectionTitle}>Content Style</h5>
                                <p><strong>Tone:</strong> {formData.tone}</p>
                                <p><strong>Headline Focus:</strong> {formData.headlineFocus}</p>
                                <p><strong>Ad Text Length:</strong> {formData.adTextLength}</p>
                                <p><strong>CTA:</strong> {formData.ctaType}</p>
                                <p><strong>Emotional Angle:</strong> {formData.emotionalAngle}</p>
                            </div>
                            {formData.showAdvanced && (
                                <div style={styles.summarySection}>
                                    <h5 style={styles.summarySectionTitle}>Advanced Settings</h5>
                                    {formData.brandVoice && <p><strong>Brand Voice:</strong> {formData.brandVoice}</p>}
                                    {(formData.brandVoicePersonalityMode === 'predefined' && formData.brandVoicePersonalityOption) && (
                                        <p><strong>Brand Voice Personality:</strong> {formData.brandVoicePersonalityOption}</p>
                                    )}
                                    {(formData.brandVoicePersonalityMode === 'custom' && formData.brandVoicePersonalityCustom) && (
                                        <p><strong>Brand Voice Personality (Custom):</strong> {formData.brandVoicePersonalityCustom}</p>
                                    )}
                                    {formData.offerPricing && <p><strong>Offer & Pricing:</strong> {formData.offerPricing}</p>}
                                    {formData.assetReuseStrategy && <p><strong>Asset Reuse:</strong> {formData.assetReuseStrategy}</p>}
                                    {formData.complianceNote && (
                                        <div>
                                            <p><strong>Compliance Note:</strong></p>
                                            <p style={styles.complianceNote}>{formData.complianceNote}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                            {requestId && (
                                <button
                                    type="button"
                                    onClick={handleViewHistory}
                                    style={{ ...styles.btn, ...styles.btnSuccess, backgroundColor: '#fcd34d', color: '#111827' }}
                                    disabled={isGenerating || isApiLoading}
                                >
                                    {isGenerating || isApiLoading ? 'Loading history...' : 'View history'}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleEditFromSummary}
                                style={{ ...styles.btn, ...styles.btnOutline }}
                                disabled={isGenerating || isApiLoading}
                            >
                                Back to Edit
                            </button>
                            <button
                                type="button"
                                onClick={handleGenerateFromSummary} // This is the button that starts the API call
                                style={{ ...styles.btn, ...styles.btnPrimary }}
                                disabled={isGenerating || isApiLoading}
                            >
                                {isGenerating || isApiLoading ? (
                                    <>
                                        <span>Generating</span>
                                        <div style={{
                                            width: '16px',
                                            height: '16px',
                                            border: '2px solid rgba(255,255,255,0.3)',
                                            borderTopColor: 'white',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite',
                                            display: 'inline-block',
                                            marginLeft: '8px'
                                        }} />
                                    </>
                                ) : 'Generate Ad Copy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* -------------------- Variant Display Modal -------------------- */}
            {showVariantsModal && (
                <VariantModalContent
                    variants={generatedVariantsData.variants}
                    inputs={generatedVariantsData.inputs}
                    onClose={() => {
                        abortAllStreams();
                        setShowVariantsModal(false);
                        setIsHistoryView(false); // *** NEW: Reset flag on close ***
                        setIsStreamingGeneration(false);
                        setShowSummary(true);
                    }}
                    onRequestRegenerate={handleRegenerateVariant}
                    showNotification={showNotification}
                    isLoading={isApiLoading}
                    isHistoryView={isHistoryView} // *** NEW PROP PASSED DOWN ***
                    isStreaming={isStreamingGeneration && !isHistoryView}
                />
            )}

            {isApiLoading && (
                <SurfingLoading mode={isHistoryView ? "history" : "generate"} />
            )}
        </div>
    );
};

export default AdCopyGeneratorForm;