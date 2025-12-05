// components/Captionandhastaggenerator/Captionandhastaggeneratorform.js
import React, { useState, useEffect } from 'react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import VariantModalContent from './VariantModalContent';
// --- CHANGED IMPORT TO NEW MODAL COMPONENT ---
import SummaryReviewModal from './SummaryReviewModal'; 

// --- API Constants (Provided by User) ---
const BASE_URL = 'https://olive-gull-905765.hostingersite.com/public/api/v1';
const API = {
    GET_FIELD_OPTIONS: `${BASE_URL}/caption-hashtag/options?field_type=all`,
    GENERATE_CAPTION_HASHTAG: `${BASE_URL}/caption-hashtag/generate`, // Corrected typo in variable name
    GET_VARIANTS_LOG: (requestId) => `${BASE_URL}/caption-hashtag/${requestId}/variants`,
    REGENERATE_VARIANT: (variantId) => `${BASE_URL}/caption-hashtag/variants/${variantId}/regenerate`,
    AUTH_TOKEN: '3|WwYYaSEAfSr1guYBFdPQlPtGg0dKphy1sVMDLBmX647db358',
};

// Authorization header structure
const AUTH_HEADER = `Bearer ${API.AUTH_TOKEN}`;

const Captionandhastaggeneratorform = () => {
    // [STATE REMAINS THE SAME]
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

    // --- Shared Utility Function ---
    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    // --- Data mapping and retrieval ---
    const getOptions = (key) => apiOptions?.[key] || [];

    // Function to get the label and ID for predefined keys (Updated to be more robust for the summary)
    const getOptionDetails = (fieldKey, value, customValue = null, typeOverride = null) => {
        if (!apiOptions) return { type: 'predefined', id: null, value: value || 'N/A' };

        // Determine if the *mode* is explicitly custom based on the selector state
        let isCustomMode = false;
        if (fieldKey === 'caption_platform' && formData.platformType === 'custom') isCustomMode = true;
        if (fieldKey === 'caption_tone_of_voice' && formData.toneSelection === 'custom') isCustomMode = true;
        if (fieldKey === 'caption_cta_type' && formData.includeCtaType === 'custom') isCustomMode = true;

        const type = typeOverride || (isCustomMode ? 'custom' : 'predefined');
        
        if (type === 'custom') {
            const finalCustomValue = (fieldKey === 'caption_platform' ? formData.customPlatform : 
                                      (fieldKey === 'caption_tone_of_voice' ? formData.customTone : 
                                       formData.customCta));

            return {
                type: 'custom',
                id: null,
                value: finalCustomValue || 'Custom Input Required'
            };
        }

        const option = getOptions(fieldKey).find(opt => opt.key === value);
        return {
            type: 'predefined',
            id: option?.id || null,
            value: option?.label || value || 'N/A' 
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
            // [... existing fetch logic ...]
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
                    const defaultPlatform = result.data.caption_platform[0]?.key || '';
                    const defaultTone = result.data.caption_tone_of_voice[0]?.key || '';
                    const defaultLanguage = result.data.caption_language_locale.find(o => o.key === 'en_global')?.key || result.data.caption_language_locale[0]?.key || 'en_global';
                    const defaultPostLength = result.data.caption_post_length.find(o => o.key === 'medium')?.key || result.data.caption_post_length[0]?.key || 'medium';
                    const defaultCta = result.data.caption_cta_type.find(o => o.key === 'caption_cta_1')?.key || result.data.caption_cta_type[0]?.key || '';
                    const defaultCaptionStyle = result.data.caption_style[0]?.key || '';
                    const defaultHashtagStyle = result.data.caption_hashtag_style[0]?.key || '';

                    setFormData(prev => ({
                        ...prev,
                        platform: defaultPlatform,
                        toneOfVoice: defaultTone,
                        language: defaultLanguage,
                        postLength: defaultPostLength,
                        includeCtaType: defaultCta,
                        captionStyle: defaultCaptionStyle,
                        hashtagStyle: defaultHashtagStyle,
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


    // --- Handlers (Unchanged) ---
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

    // --- HANDLER: Show Summary Modal ---
    const handleSubmit = (e) => {
        e.preventDefault();
        
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
        setIsGenerating(true);
        showNotification('Generating captions and hashtags...', 'info');

        // 1. Construct the API Payload
        const platformPayload = getOptionDetails('caption_platform', formData.platform, formData.customPlatform, formData.platformType);
        const tonePayload = getOptionDetails('caption_tone_of_voice', formData.toneOfVoice, formData.customTone, formData.toneSelection);
        const ctaPayload = getOptionDetails('caption_cta_type', formData.includeCtaType, formData.customCta);
        const languagePayload = getOptionDetails('caption_language_locale', formData.language, null, 'predefined');
        const emotionalIntentPayload = getOptionDetails('caption_emotional_intent', formData.emotionalIntent, null, 'predefined');
        const postLengthPayload = getOptionDetails('caption_post_length', formData.postLength, null, 'predefined');
        const captionStylePayload = getOptionDetails('caption_style', formData.captionStyle, null, 'predefined');
        const hashtagStylePayload = getOptionDetails('caption_hashtag_style', formData.hashtagStyle, null, 'predefined');

        const formattedOptions = formData.formattingOptions.map(key => {
            const detail = formattingOptionsList.find(opt => opt.value === key);
            return detail ? detail.apiValue : key;
        });

        const payload = {
            platform: platformPayload,
            post_topic: formData.postTheme,
            primary_goal: formData.primaryGoal,
            tone_of_voice: tonePayload,
            target_audience: formData.targetAudience,
            number_of_variants: parseInt(formData.variants),
            required_keywords: formData.requiredKeywords,
            language_locale: languagePayload,
            emotional_intent: emotionalIntentPayload,
            post_length: postLengthPayload,
            caption_style: captionStylePayload,
            cta_type: ctaPayload,
            custom_cta_text: formData.includeCtaType === 'custom' ? formData.customCta : null,
            number_of_ctas: formData.includeCtaType !== ctaTypeOptions.find(o => o.label === 'No CTA')?.key ? parseInt(formData.numberOfCta) : 0,
            formatting_options: formattedOptions,
            hashtag_style: hashtagStylePayload,
            hashtag_limit: parseInt(formData.hashtagLimit),
            exclude_words: formData.excludeWords,
            creativity_level: parseInt(formData.creativityLevel),
            proofread_optimize: formData.proofread,
            compliance_notes: formData.complianceNotes
        };

        console.log('Submitting Payload:', payload);

        try {
            if (!API.GENERATE_CAPTION_HASHTAG) {
                throw new Error('API endpoint for generation is not defined.');
            }
            setIsGenerating(true);
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

            if (result.variants && Array.isArray(result.variants) && result.variants.length > 0) {
                setRequestId(result.request_id);

                const structuredVariants = result.variants.map((content, index) => ({
                    id: content.id || `temp-${Date.now()}-${index}`,
                    content: content.content || content,
                    show_variant: content.show_variant || true,
                }));

                setGeneratedVariantsData({ variants: structuredVariants, inputs: result.inputs, requestId: result.request_id });
                setShowVariantsModal(true);
                setShowSummary(false); // Hide summary before showing results
                showNotification('Captions and hashtags generated successfully!', 'success');
            } else {
                throw new Error('Generation successful, but no variants were returned. Response status: ' + (result.status_code || 'N/A'));
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
        // [ ... existing regenerate logic ... ]
        const variantIndex = generatedVariantsData.variants.findIndex(v => v.id === variantId);
        if (variantIndex === -1) return;

        showNotification(`Regenerating Variant ${variantIndex + 1}...`, 'info');

        try {
            const response = await fetch(API.REGENERATE_VARIANT(variantId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': AUTH_HEADER,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Regeneration failed with status: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Update the specific variant content in the state
            setGeneratedVariantsData(prev => {
                const newVariants = [...prev.variants];
                const updatedVariantIndex = newVariants.findIndex(v => v.id === result.variant_id);
                
                if (updatedVariantIndex !== -1) {
                    newVariants[updatedVariantIndex] = {
                        ...newVariants[updatedVariantIndex],
                        content: result.new_content,
                    };
                } else {
                    // Fallback: If regeneration API returned a new ID, add it (unlikely for regeneration)
                    newVariants.push({
                        id: result.variant_id,
                        content: result.new_content,
                        show_variant: true,
                    });
                }
                
                return { ...prev, variants: newVariants };
            });

            showNotification(`Variant ${variantIndex + 1} successfully regenerated!`, 'success');

        } catch (error) {
            console.error('Regeneration Error:', error);
            showNotification(`Regeneration Error: ${error.message}`, 'error');
        }
    };
    
    // --- FIXED handleViewLog Function ---
    const handleViewLog = async () => {
        if (!requestId) {
            console.error('No previous copywriting request_id found for log viewing.');
            alert('No previous generation found to view log.');
            return;
        }

        setIsFetchingLog(true);       // so VariantsModal can show loading state if needed
        setIsGenerating(true);         // reuse existing generating flag for buttons
        setModalTitle('Variants Log'); // set title for log view

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
                const errorMessage = errorData.message || response.statusText;
                console.error('Failed to fetch variants log:', errorData || response.statusText);
                alert('Failed to load log. Check console for details.');
                
                // Set error data in the expected object structure
                setGeneratedVariantsData({
                    requestId: requestId,
                    variants: [{ id: 'error', content: `Error loading log: ${errorMessage}`, isLog: true }],
                    inputs: {}
                });
                 console.log("inside if:",errorMessage);
            } else {
                const result = await response.json();
                
                if (result.variants && Array.isArray(result.variants) && result.variants.length > 0) {
                    // const structured = result.variants.map((v, index) => ({
                    //     id: v.id || `copy-log-${Date.now()}-${index}`,
                    //     // Display the entire object content as a formatted string for log view
                    //     content: JSON.stringify(v, null, 2), 
                    //     isLog: true,
                    // }));

                    // *** FIX APPLIED HERE: Ensure state is an object with a 'variants' key. ***
                     //console.log("inside else:",structured);
                    // setGeneratedVariantsData({
                    //     requestId: requestId,
                    //     variants: structured,
                    //     inputs: result.inputs || {},
                    // });

                            const structuredVariants = result.variants.map((content, index) => ({
                    id: content.id || `temp-${Date.now()}-${index}`,
                    content: content.content || content,
                    show_variant: content.show_variant || true,
                }));

                   setGeneratedVariantsData({
                     variants: structuredVariants,
                    inputs: result.inputs,
                    requestId: result.request_id });

                    
                    
                } else {
                    console.error('Variants log returned no variants:', result);
                    alert('No variants found in the log for this request.');
                    setGeneratedVariantsData({
                        requestId: requestId,
                        variants: [{ id: 'empty-log', content: 'Log was successfully fetched but contained no variant entries.', isLog: true }],
                        inputs: result.inputs || {},
                    });
                }
            }

            setShowVariantsModal(true);
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
            setIsFetchingLog(false);
            setIsGenerating(false);
            setShowSummary(false);
        }
    };
    // --- END FIXED handleViewLog Function ---
    
    const handleReset = () => {
        // [ ... existing reset logic ...]
        const defaultPlatform = platformOptions[0]?.key || '';
        const defaultTone = toneOptions[0]?.key || '';
        const defaultLanguage = languageOptions.find(o => o.key === 'en_global')?.key || languageOptions[0]?.key || 'en_global';
        const defaultPostLength = postLengthOptions.find(o => o.key === 'medium')?.key || postLengthOptions[0]?.key || 'medium';
        const defaultCta = ctaTypeOptions.find(o => o.key === 'caption_cta_1')?.key || ctaTypeOptions[0]?.key || '';
        const defaultCaptionStyle = captionStyleOptions[0]?.key || '';
        const defaultHashtagStyle = hashtagStyleOptions[0]?.key || '';

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
            variants: 3,
            showAdvanced: false,
            requiredKeywords: [],
            language: defaultLanguage,
            emotionalIntent: '',
            postLength: defaultPostLength,
            formattingOptions: [],
            includeCtaType: defaultCta,
            customCta: '',
            numberOfCta: 1,
            captionStyle: defaultCaptionStyle,
            hashtagStyle: defaultHashtagStyle,
            excludeWords: [],
            creativityLevel: 5,
            proofread: true,
            hashtagLimit: 15,
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
        container: { maxWidth: '1100px', margin: '0 auto', padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', backgroundColor: '#0a0e1a', minHeight: '100vh' },
        card: { backgroundColor: '#141b2d', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid #1e293b' },
        header: { padding: '24px 32px', borderBottom: '1px solid #1e293b', backgroundColor: '#0f1624' },
        title: { margin: 0, fontSize: '24px', fontWeight: '600', color: '#f8fafc' },
        subtitle: { margin: '6px 0 0', fontSize: '14px', color: '#94a3b8' },
        formGroup: { marginBottom: '20px' },
        label: { display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#e2e8f0' },
        input: { width: '100%', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5', color: '#e2e8f0', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', transition: 'all 0.15s ease-in-out', boxSizing: 'border-box' },
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
        radioGroup: { display: 'flex', gap: '16px', marginTop: '8px' },
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
        marginBottom: '20px',
        width: '100%'
    };
    const colHalfStyle = { 
        flex: '1 1 calc(50% - 10px)',
    };
    const colFullStyle = {
        width: '100%',
        marginBottom: '20px',
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

            <div style={styles.card}>
                {/* Header */}
                <div style={styles.header} id="caption-form-top">
                    <h1 style={styles.title}>Caption & Hashtag Generator ✍️</h1>
                    <p style={styles.subtitle}>Create engaging captions and hashtags for your social media posts</p>
                </div>

                <div style={{ padding: '24px' }}>
                    <form onSubmit={handleSubmit}>
                        {/* [ ... FORM CONTENT REMAINS THE SAME ... ] */}
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
                                                    style={styles.checkboxInput}
                                                />
                                                {option.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <hr style={{ width: '100%', border: 'none', borderTop: '1px solid #e5e7eb', margin: '5px 0' }} />

                            {/* Advanced Features Toggle (Full Width) */}
                            <div style={{ width: '100%', marginBottom: '20px' }}>
                                <button
                                    type="button"
                                    style={{
                                        ...styles.btn,
                                        ...styles.btnOutline,
                                        padding: '8px 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        backgroundColor:'transparent',
                                        gap: '8px'}}
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
                                        type="submit" // This triggers handleSubmit (shows summary modal)
                                        style={{ ...styles.btn, ...styles.btnPrimary }}
                                        disabled={isGenerating}
                                    >
                                        {'Review & Generate'}
                                    </button>
                                </div>
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
                        setShowSummary(true);
                    }}
                    onRequestRegenerate={handleRegenerateVariant}
                    showNotification={showNotification}
                    isFetchingLog={isFetchingLog} 
                    modalTitle={modalTitle} 
                />
            )}
        </div>
    );
};

export default Captionandhastaggeneratorform;