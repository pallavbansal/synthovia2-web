// components/Captionandhastaggenerator/Captionandhastaggeneratorform.js
import React, { useState, useEffect } from 'react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

// --- API Constants (Provided by User) ---
const BASE_URL = 'https://olive-gull-905765.hostingersite.com/public/api/v1';
const API = {
    GET_FIELD_OPTIONS: `${BASE_URL}/caption-hashtag/options?field_type=all`,
    GENERATE_CAPTION_HASHTAG: `${BASE_URL}/caption-hashtag/generate`, // Use this for submission
    GET_VARIANTS_LOG: (requestId) => `${BASE_URL}/caption-hashtag/${requestId}/variants`,
    REGENERATE_VARIANT: (variantId) => `${BASE_URL}/caption-hashtag/variants/${variantId}/regenerate`,
    AUTH_TOKEN: '3|WwYYaSEAfSr1guYBFdPQlPtGg0dKphy1sVMDLBmX647db358',
};

// Authorization header structure
const AUTH_HEADER = `Bearer ${API.AUTH_TOKEN}`;

// --- Variant Modal Component ---
const VariantModalContent = ({ variants, onClose, inputs, onRequestRegenerate, showNotification }) => {
    const [expandedIndex, setExpandedIndex] = useState(0); 
    const [regeneratingId, setRegeneratingId] = useState(null);

    const toggleExpand = (index) => {
        setExpandedIndex(index === expandedIndex ? null : index);
    };

    const handleCopy = (text, variantId) => {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showNotification(`Variant ${variantId} copied to clipboard!`, 'success');
        } catch (err) {
            showNotification('Failed to copy text.', 'error');
        }
    };

    const handleRegenerate = async (variantId) => {
        setRegeneratingId(variantId);
        try {
            await onRequestRegenerate(variantId);
        } finally {
            setRegeneratingId(null);
        }
    };

    const modalStyles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(30, 41, 59, 0.9)', 
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        },
        modal: {
            backgroundColor: 'white', 
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            width: '95%',
            maxWidth: '900px',
            maxHeight: '95vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
        },
        header: {
            padding: '20px 24px',
            borderBottom: '1px solid #e0e7ff', 
            backgroundColor: '#f1f5f9', 
            color: '#1e293b', 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        body: {
            padding: '24px',
            backgroundColor: 'white',
        },
        card: {
            marginBottom: '16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            overflow: 'hidden',
            transition: 'all 0.3s ease-in-out',
        },
        cardHeader: {
            padding: '16px 20px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            fontWeight: '600',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid transparent',
            gap: '10px',
        },
        cardContent: {
            padding: '20px',
            whiteSpace: 'pre-wrap',
            fontSize: '14px',
            color: '#1f2937', 
            backgroundColor: '#f9fafb', 
            borderTop: '1px solid #e5e7eb',
        },
        title: {
            fontSize: '1.25rem',
            margin: 0,
            color: '#1e293b',
        },
        actionButton: {
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: '500',
            borderRadius: '4px',
            border: '1px solid #d1d5db',
            cursor: 'pointer',
            marginLeft: '8px',
            transition: 'background-color 0.15s ease-in-out',
        }
    };

    if (!variants || variants.length === 0) return null;

    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.modal}>
                <div style={modalStyles.header}>
                    <h2 style={modalStyles.title}>Generated Ad Copy Variants ({variants.length})</h2>
                    <button 
                        onClick={onClose} 
                        style={{
                            background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', 
                            color: '#4b5563', padding: '4px', lineHeight: 1
                        }}
                    >
                        &times;
                    </button>
                </div>
                <div style={modalStyles.body}>
                    <p style={{marginBottom: '20px', color: '#475569', fontSize: '14px'}}>
                        Click on any variant card to expand and view the full ad copy.
                    </p>
                    {variants.filter(v => v.show_variant).map((variant, index) => {
                        const isExpanded = index === expandedIndex;
                        const isRegenerating = regeneratingId === variant.id;

                        return (
                            <div key={variant.id || index} style={{
                                ...modalStyles.card,
                                border: isExpanded ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                                boxShadow: isExpanded ? '0 4px 8px -2px rgba(59, 130, 246, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                                opacity: isRegenerating ? 0.6 : 1,
                            }}>
                                <div 
                                    style={{
                                        ...modalStyles.cardHeader,
                                        backgroundColor: isExpanded ? '#e0f2fe' : '#ffffff',
                                        borderBottom: isExpanded ? '1px solid #93c5fd' : '1px solid transparent',
                                        color: isExpanded ? '#0369a1' : '#1f2937',
                                    }}
                                    onClick={() => toggleExpand(index)}
                                >
                                    <span style={{flexGrow: 1}}>Variant {index + 1}: {inputs.platform?.value} ({inputs.post_length?.value})</span>
                                    
                                    <div onClick={(e) => e.stopPropagation()} style={{display: 'flex', alignItems: 'center'}}>
                                        {/* Copy Button */}
                                        <button 
                                            style={{
                                                ...modalStyles.actionButton,
                                                backgroundColor: '#10b981', color: 'white', border: 'none',
                                            }}
                                            onClick={() => handleCopy(variant.content, index + 1)}
                                        >
                                            Copy
                                        </button>

                                        {/* Regenerate Button */}
                                        <button 
                                            style={{
                                                ...modalStyles.actionButton,
                                                backgroundColor: isRegenerating ? '#9ca3af' : '#f97316', 
                                                color: 'white', 
                                                border: 'none',
                                                cursor: isRegenerating ? 'wait' : 'pointer'
                                            }}
                                            onClick={() => handleRegenerate(variant.id)}
                                            disabled={isRegenerating}
                                        >
                                            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                                        </button>
                                    </div>
                                    
                                    <span>{isExpanded ? '▲' : '▼'}</span>
                                </div>
                                {isExpanded && (
                                    <div style={modalStyles.cardContent}>
                                        <div style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
                                            <p style={{ fontWeight: 'bold', margin: '0 0 8px 0' }}>Variant Content:</p>
                                            {variant.content}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button 
                            onClick={onClose} 
                            style={{ 
                                padding: '10px 20px', 
                                fontSize: '14px', 
                                fontWeight: '500', 
                                borderRadius: '6px', 
                                border: '1px solid #d1d5db', 
                                cursor: 'pointer',
                                backgroundColor: '#f9fafb',
                                color: '#4b5563',
                                transition: 'background-color 0.15s ease-in-out'
                            }}
                        >
                            Close Modal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const Captionandhastaggeneratorform = () => {
    // --- 1. State for Form Data ---
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
        variants: 3,
        showAdvanced: false,
        requiredKeywords: [],
        language: 'en_global',
        emotionalIntent: '',
        postLength: 'medium',
        formattingOptions: [], // Multi-select checkbox array (e.g., ['emoji', 'linebreaks'])
        includeCtaType: '', // key from API options, can be 'custom'
        customCta: '',
        numberOfCta: 1,
        captionStyle: '',
        hashtagStyle: '',
        excludeWords: [],
        creativityLevel: 5,
        proofread: true,
        hashtagLimit: 15,
        complianceNotes: ''
    });

    // --- 2. State for API Options and Loading Status ---
    const [apiOptions, setApiOptions] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // State for submission feedback
    // --- State for Modal & Variants ---
    const [showVariantsModal, setShowVariantsModal] = useState(false);
    const [generatedVariantsData, setGeneratedVariantsData] = useState({ 
        requestId: null, 
        variants: [], 
        inputs: {} // To show context in the modal
    });

    // --- 3. State for UI Notifications ---
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    // --- Shared Utility Function ---
    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    // --- Data mapping and retrieval ---
    const getOptions = (key) => apiOptions?.[key] || [];

    // Function to get the label and ID for predefined keys
    const getOptionDetails = (fieldKey, value, customValue = null, typeOverride = null) => {
        const type = typeOverride || (value === 'custom' ? 'custom' : 'predefined');
        
        if (type === 'custom') {
             // For CTA type or custom platform/tone
            return {
                type: 'custom',
                id: null,
                value: customValue || value
            };
        }

        const option = getOptions(fieldKey).find(opt => opt.key === value);
        return {
            type: 'predefined',
            id: option?.id || null,
            value: option?.label || value
        };
    };

    // API-fetched options (used for rendering)
    const platformOptions = getOptions('caption_platform');
    const toneOptions = getOptions('caption_tone_of_voice');
    const languageOptions = getOptions('caption_language_locale');
    const emotionalIntentOptions = getOptions('caption_emotional_intent');
    const postLengthOptions = getOptions('caption_post_length');
    // Including 'custom' manually for the dropdown for consistent UX
    const ctaTypeOptions = [ ...getOptions('caption_cta_type'), { key: 'custom', label: 'Custom CTA' } ];
    const captionStyleOptions = getOptions('caption_style');
    const hashtagStyleOptions = getOptions('caption_hashtag_style');

    // Static Formatting Options (used for rendering and mapping values)
    const formattingOptionsList = [
        { value: 'emoji', label: 'Add Emojis', apiValue: 'minimal_emojis' },
        { value: 'hashtags', label: 'Include Hashtags', apiValue: 'include_hashtags' },
        { value: 'mentions', label: 'Add Mentions', apiValue: 'include_mentions' },
        { value: 'linebreaks', label: 'Use Line Breaks', apiValue: 'line_breaks' }
    ];

    // --- 4. Data Fetching Logic (unchanged) ---
    useEffect(() => {
        setMounted(true);
        const fetchOptions = async () => {
            try {
                const response = await fetch(API.GET_FIELD_OPTIONS, {
                    headers: { Authorization: AUTH_HEADER, 'Content-Type': 'application/json' },
                });
                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
                    throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorBody.message || response.statusText}`);
                }
                const result = await response.json();

                if (result.status_code === 1 && result.data) {
                    setApiOptions(result.data);
                    // Set initial form values based on API defaults
                    const defaultCta = result.data.caption_cta_type.find(o => o.key === 'caption_cta_1')?.key || result.data.caption_cta_type[0]?.key || '';
                    setFormData(prev => ({
                        ...prev,
                        platform: result.data.caption_platform[0]?.key || '',
                        toneOfVoice: result.data.caption_tone_of_voice[0]?.key || '',
                        language: result.data.caption_language_locale.find(o => o.key === 'en_global')?.key || result.data.caption_language_locale[0]?.key || 'en_global',
                        postLength: result.data.caption_post_length.find(o => o.key === 'medium')?.key || result.data.caption_post_length[0]?.key || 'medium',
                        includeCtaType: defaultCta,
                        captionStyle: result.data.caption_style[0]?.key || '',
                        hashtagStyle: result.data.caption_hashtag_style[0]?.key || '',
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


    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            if (name === 'formattingOptions') {
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

    const removeItem = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const handleRegenerateVariant = async (variantId) => {
        showNotification(`Regenerating variant ID: ${variantId}...`, 'info');
        try {
            const regenerateUrl = API.REGENERATE_VARIANT(variantId);

            const response = await fetch(regenerateUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': AUTH_HEADER,
                },
                body: JSON.stringify({ 
                    post_topic: generatedVariantsData.inputs.post_topic,
                    primary_goal: generatedVariantsData.inputs.primary_goal,
                }) 
            });

            const result = await response.json();

            if (!response.ok || result.status_code !== 1) {
                console.error("Regenerate API Response Failed:", response.status, result);
                throw new Error(result.message || `Regeneration failed with status: ${response.status}`);
            }

            // Fetch the updated variant list
            const updatedVariantsResponse = await fetch(API.GET_VARIANTS_LOG(generatedVariantsData.requestId), {
                headers: { Authorization: AUTH_HEADER, 'Content-Type': 'application/json' },
            });

            if (!updatedVariantsResponse.ok) {
                throw new Error("Failed to fetch updated variants log.");
            }

            const updatedResult = await updatedVariantsResponse.json();
            
            if (updatedResult.status_code === 1 && updatedResult.data) {
                setGeneratedVariantsData(prev => ({ 
                    ...prev, 
                    variants: updatedResult.data.variants 
                }));
                showNotification('Variant successfully regenerated!', 'success');
            } else {
                throw new Error(updatedResult.message || 'Failed to update variants list after regeneration.');
            }
        } catch (regenerateError) {
            console.error("Regeneration Error:", regenerateError);
            showNotification(`Regeneration Error: ${regenerateError.message || regenerateError.toString()}`, 'error');
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        showNotification('Generating captions and hashtags...', 'info');

        // 1. Construct the API Payload
        
        // --- Custom/Predefined Logic Mappers ---
        const platformPayload = getOptionDetails('caption_platform', formData.platform, formData.customPlatform, formData.platformType);
        const tonePayload = getOptionDetails('caption_tone_of_voice', formData.toneOfVoice, formData.customTone, formData.toneSelection);
        
        // CTA Type is Custom only if the dropdown value is explicitly 'custom', otherwise predefined
        const ctaPayload = getOptionDetails('caption_cta_type', formData.includeCtaType, formData.customCta);

        // All other dropdowns are assumed predefined for now, as they lack custom input fields
        const languagePayload = getOptionDetails('caption_language_locale', formData.language, null, 'predefined');
        const emotionalIntentPayload = getOptionDetails('caption_emotional_intent', formData.emotionalIntent, null, 'predefined');
        const postLengthPayload = getOptionDetails('caption_post_length', formData.postLength, null, 'predefined');
        const captionStylePayload = getOptionDetails('caption_style', formData.captionStyle, null, 'predefined');
        const hashtagStylePayload = getOptionDetails('caption_hashtag_style', formData.hashtagStyle, null, 'predefined');


        // Map formatting option keys to API required values
        const formattedOptions = formData.formattingOptions.map(key => {
            const detail = formattingOptionsList.find(opt => opt.value === key);
            return detail ? detail.apiValue : key;
        });

        const payload = {
            "platform": platformPayload,
            "post_topic": formData.postTheme,
            "primary_goal": formData.primaryGoal,
            "tone_of_voice": tonePayload,
            "target_audience": formData.targetAudience,
            "number_of_variants": parseInt(formData.variants),
            "required_keywords": formData.requiredKeywords,
            "language_locale": languagePayload,
            "emotional_intent": emotionalIntentPayload,
            "post_length": postLengthPayload,
            "caption_style": captionStylePayload,
            "cta_type": ctaPayload,
            "custom_cta_text": formData.includeCtaType === 'custom' ? formData.customCta : null,
            "number_of_ctas": formData.includeCtaType !== ctaTypeOptions.find(o => o.label === 'No CTA')?.key ? parseInt(formData.numberOfCta) : 0,
            "formatting_options": formattedOptions,
            "hashtag_style": hashtagStylePayload,
            "hashtag_limit": parseInt(formData.hashtagLimit),
            "exclude_words": formData.excludeWords,
            "creativity_level": parseInt(formData.creativityLevel),
            "proofread_optimize": formData.proofread,
            "compliance_notes": formData.complianceNotes
        };

        console.log("Submitting Payload:", payload);

        // 2. Send API Call
        try {
            // Check if the API URL is defined before attempting to fetch
            if (!API.GENERATE_CAPTION_HASHTAG) {
                throw new Error("API endpoint for generation is not defined.");
            }

            const response = await fetch(API.GENERATE_CAPTION_HASHTAG, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': AUTH_HEADER,
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok || result.status_code !== 1) {
                 // Log response status and message for debugging failed API calls
                 console.error("API Response Failed:", response.status, result);
                throw new Error(result.message || `API call failed with status: ${response.status}`);
            }

            showNotification('Content generated successfully!', 'success');
            console.log("API Response Success:", result);

            // --- Handle Variants Data and Modal ---
            if (result.data && result.data.variants) {
                setGeneratedVariantsData({
                    requestId: result.data.request_id,
                    variants: result.data.variants,
                    inputs: payload, // Store the original inputs for context in modal
                });
                setShowVariantsModal(true);
            } else {
                showNotification('Generation succeeded, but no variants were returned.', 'warning');
            }


        } catch (submitError) {
            console.error("Submission Error:", submitError);
            showNotification(`Error: ${submitError.message || submitError.toString()}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        const defaultCta = ctaTypeOptions.find(o => o.key === 'caption_cta_1')?.key || ctaTypeOptions[0]?.key || '';
        setFormData({
            platformType: 'predefined',
            platform: platformOptions[0]?.key || '',
            customPlatform: '',
            postTheme: '',
            primaryGoal: '',
            toneSelection: 'predefined',
            toneOfVoice: toneOptions[0]?.key || '',
            customTone: '',
            targetAudience: [],
            variants: 3,
            showAdvanced: false,
            requiredKeywords: [],
            language: languageOptions.find(o => o.key === 'en_global')?.key || languageOptions[0]?.key || 'en_global',
            emotionalIntent: '',
            postLength: 'medium',
            formattingOptions: [],
            includeCtaType: defaultCta,
            customCta: '',
            numberOfCta: 1,
            captionStyle: captionStyleOptions[0]?.key || '',
            hashtagStyle: hashtagStyleOptions[0]?.key || '',
            excludeWords: [],
            creativityLevel: 5,
            proofread: true,
            hashtagLimit: 15,
            complianceNotes: ''
        });
        // Also reset modal state
        setGeneratedVariantsData({ requestId: null, variants: [], inputs: {} });
        setShowVariantsModal(false);

        showNotification('Form has been reset', 'info');
    };

    const toggleAdvanced = () => {
        setFormData(prev => ({
            ...prev,
            showAdvanced: !prev.showAdvanced
        }));
    };

    // --- Styles (for consistent look and feel) ---
    const styles = {
        container: { maxWidth: '1100px', margin: '0 auto', padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
        card: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' },
        header: { padding: '24px 32px', borderBottom: '1px solid #e5e7eb' },
        title: { margin: 0, fontSize: '24px', fontWeight: '600', color: '#111827' },
        subtitle: { margin: '6px 0 0', fontSize: '14px', color: '#6b7280' },
        formGroup: { marginBottom: '20px' },
        label: { display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' },
        input: { width: '100%', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5', color: '#374151', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', transition: 'all 0.15s ease-in-out', boxSizing: 'border-box' },
        textarea: { width: '100%', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5', color: '#374151', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', transition: 'all 0.15s ease-in-out', boxSizing: 'border-box', resize: 'vertical', minHeight: '80px' },
        badge: { display: 'inline-flex', alignItems: 'center', padding: '6px 12px', fontSize: '13px', fontWeight: '500', borderRadius: '6px', gap: '6px' },
        badgePrimary: { backgroundColor: '#3b82f6', color: 'white' },
        badgeSecondary: { backgroundColor: '#6b7280', color: 'white' },
        badgeSuccess: { backgroundColor: '#10b981', color: 'white' },
        btn: { padding: '10px 20px', fontSize: '14px', fontWeight: '500', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.15s ease-in-out', display: 'inline-flex', alignItems: 'center', gap: '8px' },
        btnPrimary: { backgroundColor: '#3b82f6', color: 'white' },
        btnOutline: { backgroundColor: 'white', color: '#6b7280', border: '1px solid #d1d5db' },
        infoIcon: { display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', textAlign: 'center', lineHeight: '16px', fontSize: '11px', cursor: 'help', marginLeft: '6px' },
        removeBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '18px', height: '18px', borderRadius: '50%', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
        rangeInput: { width: '100%', height: '6px', borderRadius: '3px', background: '#e5e7eb', outline: 'none' },
        checkboxGroup: { display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px' },
        checkboxItem: { display: 'flex', alignItems: 'center', gap: '8px' }, 
        radioGroup: { display: 'flex', gap: '16px', marginTop: '8px' },
        radioItem: { display: 'flex', alignItems: 'center', gap: '8px' },
        toast: { position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', color: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999 }
    };

    // --- Layout Helpers (FIXED FOR STABILITY) ---
    const COLUMN_GAP = '20px';
    const twoColContainerStyle = { 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: COLUMN_GAP, // Use modern gap for stable spacing
        marginBottom: '20px',
        width: '100%',
        boxSizing: 'border-box',
    };
    const colHalfStyle = { 
        // Ensures two columns fit with one 20px gap
        flex: '1 1 calc(50% - 10px)', 
        minWidth: '200px', // Fallback to single column if screen is too narrow
    };
    const colFullStyle = {
        width: '100%',
        marginBottom: '20px',
    };


    // --- Conditional Rendering: Loading & Error States ---
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

            <div style={styles.card}>
                {/* Header */}
                <div style={styles.header}>
                    <h1 style={styles.title}>Caption & Hashtag Generator ✍️</h1>
                    <p style={styles.subtitle}>Create engaging captions and hashtags for your social media posts</p>
                </div>

                <div style={{ padding: '24px' }}>
                    <form onSubmit={handleSubmit}>
                        {/* Main Form Grid Container */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: COLUMN_GAP, width: '100%' }}>

                            {/* ROW 1: Platform Type Radio */}
                            <div style={colFullStyle}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Platform Type <span style={{ color: '#ef4444' }}>*</span>
                                        <span style={styles.infoIcon} data-tooltip-id="platformType-tooltip" data-tooltip-content="Select whether to use a predefined platform/post type or enter a custom one">i</span>
                                    </label>
                                    <Tooltip id="platformType-tooltip" />
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
                                </div>
                            </div>

                            {/* ROW 2: Platform Input + Tone Input (2 Columns) */}
                            <div style={twoColContainerStyle}>
                                {/* Platform Dropdown or Custom Platform Input (Left Half) */}
                                {formData.platformType === 'predefined' ? (
                                    <div style={colHalfStyle}>
                                        <div style={styles.formGroup}>
                                            <label htmlFor="platform" style={styles.label}>
                                                Platform & Post Type <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <select
                                                id="platform"
                                                name="platform"
                                                value={formData.platform}
                                                onChange={handleChange}
                                                style={styles.input}
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
                                    <div style={colHalfStyle}>
                                        <div style={styles.formGroup}>
                                            <label htmlFor="customPlatform" style={styles.label}>
                                                Custom Platform Description <span style={{ color: '#ef4444' }}>*</span>
                                                <span style={styles.infoIcon} data-tooltip-id="customPlatform-tooltip" data-tooltip-content="Enter a description of your custom platform and desired post type">i</span>
                                            </label>
                                            <Tooltip id="customPlatform-tooltip" />
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

                                {/* Tone Selection Radio/Dropdown (Right Half) */}
                                <div style={colHalfStyle}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>
                                            Tone Selection <span style={{ color: '#ef4444' }}>*</span>
                                            <span style={styles.infoIcon} data-tooltip-id="toneSelection-tooltip" data-tooltip-content="Select whether to use a predefined tone or enter a custom one">i</span>
                                        </label>
                                        <Tooltip id="toneSelection-tooltip" />
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
                                                style={{ ...styles.input, marginTop: '8px' }}
                                                required={formData.toneSelection === 'predefined'}
                                            >
                                                <option value="">Select Tone of Voice</option>
                                                {toneOptions.map((tone) => (
                                                    <option key={tone.key} value={tone.key}>{tone.label}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div style={{ marginTop: '8px' }}>
                                                <label htmlFor="customTone" style={styles.label}>
                                                    Custom Tone <span style={{ color: '#ef4444' }}>*</span>
                                                    <span style={styles.infoIcon} data-tooltip-id="customTone-tooltip" data-tooltip-content="Describe your custom tone (max 60 characters)">i</span>
                                                </label>
                                                <Tooltip id="customTone-tooltip" />
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

                            {/* ROW 3: Post Theme/Topic (Full Width Textarea) */}
                            <div style={colFullStyle}>
                                <div style={styles.formGroup}>
                                    <label htmlFor="postTheme" style={styles.label}>
                                        Post Theme / Topic <span style={{ color: '#ef4444' }}>*</span>
                                        <span style={styles.infoIcon} data-tooltip-id="postTheme-tooltip" data-tooltip-content="Describe the main theme or topic of your post (max 1200 characters)">i</span>
                                    </label>
                                    <Tooltip id="postTheme-tooltip" />
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

                            {/* ROW 4: Primary Goal (Full Width Input) */}
                            <div style={colFullStyle}>
                                <div style={styles.formGroup}>
                                    <label htmlFor="primaryGoal" style={styles.label}>
                                        Primary Goal <span style={{ color: '#ef4444' }}>*</span>
                                        <span style={styles.infoIcon} data-tooltip-id="primaryGoal-tooltip" data-tooltip-content="What is the main goal of this post? (e.g., drive traffic, increase engagement, announce launch)">i</span>
                                    </label>
                                    <Tooltip id="primaryGoal-tooltip" />
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

                            {/* ROW 5: Target Audience Tags (Full Width) */}
                            <div style={colFullStyle}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Target Audience <span style={{ color: '#ef4444' }}>*</span>
                                        <span style={styles.infoIcon} data-tooltip-id="targetAudience-tooltip" data-tooltip-content="Enter your target audience (press Enter to add multiple, max 10)">i</span>
                                    </label>
                                    <Tooltip id="targetAudience-tooltip" />
                                    <input
                                        type="text"
                                        style={styles.input}
                                        placeholder="Add an audience segment and press Enter (e.g., Young professionals, age 25-35)"
                                        onKeyPress={(e) => handleArrayChange(e, 'targetAudience')}
                                        disabled={formData.targetAudience.length >= 10}
                                    />
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                                        {formData.targetAudience.map((audience, index) => (
                                            <span key={index} style={{ ...styles.badge, ...styles.badgePrimary }}>
                                                {audience}
                                                <button type="button" style={styles.removeBtn} onClick={() => removeItem('targetAudience', index)}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ROW 6: Variants + Post Length (2 Columns) */}
                            <div style={twoColContainerStyle}>
                                {/* Number of Variants (Left Half) */}
                                <div style={colHalfStyle}>
                                    <div style={styles.formGroup}>
                                        <label htmlFor="variants" style={styles.label}>
                                            Number of Variants: {formData.variants}
                                            <span style={styles.infoIcon} data-tooltip-id="variants-tooltip" data-tooltip-content="Choose how many caption variations to generate">i</span>
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

                                {/* Post Length (Right Half) */}
                                <div style={colHalfStyle}>
                                    <div style={styles.formGroup}>
                                        <label htmlFor="postLength" style={styles.label}>Post Length</label>
                                        <select
                                            id="postLength"
                                            name="postLength"
                                            value={formData.postLength}
                                            onChange={handleChange}
                                            style={styles.input}
                                        >
                                            {postLengthOptions.map((option) => (
                                                <option key={option.key} value={option.key}>{option.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* ROW 7: Formatting Options (Full Width Checkboxes) */}
                            <div style={colFullStyle}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Formatting Options
                                        <span style={styles.infoIcon} data-tooltip-id="formattingOptions-tooltip" data-tooltip-content="Select formatting options for your caption">i</span>
                                    </label>
                                    <Tooltip id="formattingOptions-tooltip" />
                                    <div style={styles.checkboxGroup}>
                                        {formattingOptionsList.map((option) => (
                                            <label key={option.value} style={styles.checkboxItem}>
                                                <input
                                                    type="checkbox"
                                                    name="formattingOptions"
                                                    value={option.value}
                                                    checked={formData.formattingOptions.includes(option.value)}
                                                    onChange={handleChange}
                                                    // Explicitly ensure visibility and size
                                                    style={{ width: '16px', height: '16px', marginRight: '8px', minWidth: '16px' }} 
                                                />
                                                {option.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <hr style={{ width: '100%', border: 'none', borderTop: '1px solid #e5e7eb', margin: '10px 0' }} />

                            {/* Advanced Features Toggle (Full Width) */}
                            <div style={{ width: '100%', marginBottom: '20px' }}>
                                <button
                                    type="button"
                                    style={{ ...styles.btn, ...styles.btnOutline, padding: '0', border: 'none', background: 'none', color: '#3b82f6' }}
                                    onClick={toggleAdvanced}
                                >
                                    {formData.showAdvanced ? '▼ Hide Advanced Features' : '▶ Show Advanced Features'}
                                </button>
                            </div>

                            {/* Advanced Features Container (Conditional) */}
                            {formData.showAdvanced && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: COLUMN_GAP, width: '100%' }}>

                                    {/* ROW 8: CTA Type + Number of CTAs (2 Columns) */}
                                    <div style={twoColContainerStyle}>
                                        {/* CTA Type (Left Half) */}
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label htmlFor="includeCtaType" style={styles.label}>CTA Type</label>
                                                <select
                                                    id="includeCtaType"
                                                    name="includeCtaType"
                                                    value={formData.includeCtaType}
                                                    onChange={handleChange}
                                                    style={styles.input}
                                                >
                                                    <option value="">Select CTA Type</option>
                                                    {ctaTypeOptions.map((cta) => (
                                                        <option key={cta.key} value={cta.key}>{cta.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Number of CTAs (Right Half) */}
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label htmlFor="numberOfCta" style={styles.label}>
                                                    Number of CTAs
                                                    <span style={styles.infoIcon} data-tooltip-id="numberOfCta-tooltip" data-tooltip-content="Number of Call-to-Actions to include (max 3)">i</span>
                                                </label>
                                                <Tooltip id="numberOfCta-tooltip" />
                                                <input
                                                    type="number"
                                                    id="numberOfCta"
                                                    name="numberOfCta"
                                                    min="0"
                                                    max="3"
                                                    value={formData.numberOfCta}
                                                    onChange={handleChange}
                                                    style={styles.input}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Conditional Custom CTA Row (Full Width) */}
                                    {formData.includeCtaType === 'custom' && (
                                        <div style={colFullStyle}>
                                            <div style={styles.formGroup}>
                                                <label htmlFor="customCta" style={styles.label}>
                                                    Custom CTA Text <span style={{ color: '#ef4444' }}>*</span>
                                                    <span style={styles.infoIcon} data-tooltip-id="customCta-tooltip" data-tooltip-content="Enter your custom call-to-action (max 100 characters)">i</span>
                                                </label>
                                                <Tooltip id="customCta-tooltip" />
                                                <input
                                                    type="text"
                                                    id="customCta"
                                                    name="customCta"
                                                    value={formData.customCta}
                                                    onChange={handleChange}
                                                    style={styles.input}
                                                    maxLength={100}
                                                    placeholder="e.g., Tap to explore the full eco-collection now."
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* ROW 9: Caption Style + Hashtag Style (2 Columns) */}
                                    <div style={twoColContainerStyle}>
                                        {/* Caption Style (Left Half) */}
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label htmlFor="captionStyle" style={styles.label}>Caption Style</label>
                                                <select
                                                    id="captionStyle"
                                                    name="captionStyle"
                                                    value={formData.captionStyle}
                                                    onChange={handleChange}
                                                    style={styles.input}
                                                >
                                                    <option value="">Select Caption Style</option>
                                                    {captionStyleOptions.map((style) => (
                                                        <option key={style.key} value={style.key}>{style.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Platform Hashtag Style (Right Half) */}
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label htmlFor="hashtagStyle" style={styles.label}>Hashtag Style</label>
                                                <select
                                                    id="hashtagStyle"
                                                    name="hashtagStyle"
                                                    value={formData.hashtagStyle}
                                                    onChange={handleChange}
                                                    style={styles.input}
                                                >
                                                    <option value="">Select Hashtag Style</option>
                                                    {hashtagStyleOptions.map((style) => (
                                                        <option key={style.key} value={style.key}>{style.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ROW 10: Emotional Intent + Language/Locale (2 Columns) */}
                                    <div style={twoColContainerStyle}>
                                        {/* Emotional Intent (Left Half) */}
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label htmlFor="emotionalIntent" style={styles.label}>
                                                    Emotional Intent
                                                    <span style={styles.infoIcon} data-tooltip-id="emotionalIntent-tooltip" data-tooltip-content="Select the emotional tone for your caption">i</span>
                                                </label>
                                                <Tooltip id="emotionalIntent-tooltip" />
                                                <select
                                                    id="emotionalIntent"
                                                    name="emotionalIntent"
                                                    value={formData.emotionalIntent}
                                                    onChange={handleChange}
                                                    style={styles.input}
                                                >
                                                    <option value="">Select Emotional Intent</option>
                                                    {emotionalIntentOptions.map((emotion) => (
                                                        <option key={emotion.key} value={emotion.key}>{emotion.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Language/Locale (Right Half) */}
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label htmlFor="language" style={styles.label}>Language / Locale</label>
                                                <select
                                                    id="language"
                                                    name="language"
                                                    value={formData.language}
                                                    onChange={handleChange}
                                                    style={styles.input}
                                                >
                                                    {languageOptions.map((lang) => (
                                                        <option key={lang.key} value={lang.key}>{lang.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ROW 11: Required Keywords (Full Width Tags) */}
                                    <div style={colFullStyle}>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>
                                                Required Keywords/Hashtags
                                                <span style={styles.infoIcon} data-tooltip-id="requiredKeywords-tooltip" data-tooltip-content="Add keywords or hashtags that must be included (press Enter to add multiple, max 30)">i</span>
                                            </label>
                                            <Tooltip id="requiredKeywords-tooltip" />
                                            <input
                                                type="text"
                                                style={styles.input}
                                                placeholder="Add a keyword or hashtag and press Enter"
                                                onKeyPress={(e) => handleArrayChange(e, 'requiredKeywords')}
                                                disabled={formData.requiredKeywords.length >= 30}
                                            />
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                                                {formData.requiredKeywords.map((keyword, index) => (
                                                    <span key={index} style={{ ...styles.badge, ...styles.badgeSuccess }}>
                                                        {keyword}
                                                        <button type="button" style={styles.removeBtn} onClick={() => removeItem('requiredKeywords', index)}>×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ROW 12: Exclude Words (Full Width Tags) */}
                                    <div style={colFullStyle}>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>
                                                Exclude Words/Topics
                                                <span style={styles.infoIcon} data-tooltip-id="excludeWords-tooltip" data-tooltip-content="Add words or topics to avoid in the generated captions">i</span>
                                            </label>
                                            <Tooltip id="excludeWords-tooltip" />
                                            <input
                                                type="text"
                                                style={styles.input}
                                                placeholder="Add a word or topic to exclude and press Enter"
                                                onKeyPress={(e) => handleArrayChange(e, 'excludeWords')}
                                            />
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                                                {formData.excludeWords.map((word, index) => (
                                                    <span key={index} style={{ ...styles.badge, ...styles.badgeSecondary }}>
                                                        {word}
                                                        <button type="button" style={styles.removeBtn} onClick={() => removeItem('excludeWords', index)}>×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ROW 13: Creativity + Hashtag Limit (2 Columns) */}
                                    <div style={twoColContainerStyle}>
                                        {/* Creativity Level (Left Half) */}
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label htmlFor="creativityLevel" style={styles.label}>
                                                    Creativity Level: {formData.creativityLevel}/10
                                                    <span style={styles.infoIcon} data-tooltip-id="creativityLevel-tooltip" data-tooltip-content="Adjust how creative or conservative the generated captions should be">i</span>
                                                </label>
                                                <Tooltip id="creativityLevel-tooltip" />
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

                                        {/* Hashtag Limit (Right Half) */}
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label htmlFor="hashtagLimit" style={styles.label}>
                                                    Hashtag Limit
                                                    <span style={styles.infoIcon} data-tooltip-id="hashtagLimit-tooltip" data-tooltip-content="Maximum number of hashtags to include (max 30)">i</span>
                                                </label>
                                                <Tooltip id="hashtagLimit-tooltip" />
                                                <input
                                                    type="number"
                                                    id="hashtagLimit"
                                                    name="hashtagLimit"
                                                    min="0"
                                                    max="30"
                                                    value={formData.hashtagLimit}
                                                    onChange={handleChange}
                                                    style={styles.input}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* ROW 14: Proofread Toggle + Compliance Notes (Full Width) */}
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
                                                <Tooltip id="proofread-tooltip" />
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
                                            <Tooltip id="complianceNotes-tooltip" />
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
                                        type="submit"
                                        style={{ ...styles.btn, ...styles.btnPrimary }}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Generating...' : 'Generate Caption'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* --- Variant Modal Render --- */}
            {showVariantsModal && generatedVariantsData.variants.length > 0 && (
                <VariantModalContent 
                    variants={generatedVariantsData.variants} 
                    inputs={generatedVariantsData.inputs}
                    onClose={() => setShowVariantsModal(false)} 
                    onRequestRegenerate={handleRegenerateVariant}
                    showNotification={showNotification}
                />
            )}
        </div>
    );
};

export default Captionandhastaggeneratorform;