import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import SummaryReviewModal from './SummaryReviewModal';
import VariantModalContent from './VariantModalContent';
import SurfingLoading from './SurfingLoading';
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

const CopywritingAssistantForm = () => {
    // State for all form fields
    const [formData, setFormData] = useState({
        useCaseMode: 'predefined',
        useCase: '',
        customUseCase: '',

        primaryGoal: '',
        targetAudience: [],

        toneMode: 'predefined',
        toneOfVoice: '',
        customTone: '',
        languageMode: 'predefined',
        language: 'English',
        customLanguage: '',
        lengthTargetMode: 'predefined',
        lengthTarget: 'short',
        customWordCount: 180,
        keyPoints: [],

        variants: 1,
        showAdvanced: false,
        keywords: '',
        ctaStyleMode: 'predefined',
        ctaStyle: '',
        customCtaStyle: '',
        referenceText: '',
        rewriteMode: false,
        readingLevelMode: 'predefined',
        readingLevel: 'standard',
        customReadingLevel: '',
        targetPlatformMode: 'predefined',
        targetPlatform: '',
        customTargetPlatform: '',
        brandVoiceMode: 'predefined',
        brandVoice: '',
        customBrandVoice: '',
        contentStyleMode: 'predefined',
        contentStyle: '',
        customContentStyle: '',
        emotionalIntentMode: 'predefined',
        emotionalIntent: '',
        customEmotionalIntent: '',
        writingFrameworkMode: 'predefined',
        writingFramework: '',
        customWritingFramework: '',
        grammarStrictnessMode: 'predefined',
        grammarStrictness: 'medium',
        customGrammarStrictness: '',
        formattingOptions: ['structured_layout'],
        includeWords: [],
        excludeWords: [],
        complianceNotes: '',
        outputStructure: 'plain_text',
        creativityLevel: 5,
        referenceUrl: '',
        proofreading: true,
        submitted: false,
    });

    const [customUseCaseError, setCustomUseCaseError] = useState('');

    const [apiOptions, setApiOptions] = useState(null);

    const [showSummary, setShowSummary] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showVariantsModal, setShowVariantsModal] = useState(false);

    // State structure to hold both variants array and metadata/inputs
    const [generatedVariantsData, setGeneratedVariantsData] = useState({
        requestId: null,
        variants: [],
        inputs: {},
    });

    const [requestId, setRequestId] = useState(null);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [modalTitle, setModalTitle] = useState("Generated Variants");
    const [isFetchingLog, setIsFetchingLog] = useState(false);
    const [isApiLoading, setIsApiLoading] = useState(false);
    const [isHistoryView, setIsHistoryView] = useState(false);

    // Target Audience (multi-tag) state
    const audienceSuggestions = {
        'Demographics': ['Women 25-34', 'Men 35-44', 'Parents of Toddlers'],
        'Interests': ['Fitness Enthusiasts', 'Tech Early Adopters', 'Travel Lovers'],
        'Professions': ['Marketing Managers', 'Small Business Owners', 'Software Engineers']
    };

    const [audienceInput, setAudienceInput] = useState('');
    const [showAudienceSuggestions, setShowAudienceSuggestions] = useState(false);

    const [keyPointsInput, setKeyPointsInput] = useState('');
    const [showKeyPointsSuggestions, setShowKeyPointsSuggestions] = useState(false);

    const streamControllersRef = useRef([]);
    const sessionRequestIdRef = useRef(null);
    const customUseCaseInputRef = useRef(null);

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

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    useEffect(() => {
        return () => {
            abortAllStreams();
        };
    }, [abortAllStreams]);

    // Helper to safely access API options by key
    const getOptions = (key) => apiOptions?.[key] || [];

    // Generic normalizer: accepts API objects or plain strings and returns { value, label }
    const normalizeOptions = (items) =>
        (items || []).map((item) => {
            if (typeof item === 'string') {
                return { value: item.toLowerCase().replace(/\s+/g, '_'), label: item };
            }
            const value = item.key || item.value || item.id || '';
            const label = item.label || item.name || item.key || String(value);
            return { value, label };
        });

    // Options for dropdowns (prefer API values, fallback to static presets)
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

    // Length Target
    const rawLengthTargets = getOptions('length_target').length
        ? getOptions('length_target').filter((opt) => {
            const key = opt?.key ?? opt?.value;
            const label = opt?.label ?? opt?.name;
            return key !== 'auto-detect' && label !== 'Auto Detect';
        })
        : [
            { key: 'short', label: 'Short (50-150 words)' },
            { key: 'medium', label: 'Medium (150-400 words)' },
            { key: 'long', label: 'Long (400-800 words)' },
            { key: 'custom', label: 'Custom' },
        ];

    const lengthTargetOptions = normalizeOptions([...rawLengthTargets]);

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

    // Brand Voice - Using placeholders since API Options are not explicitly listed
    const brandVoiceOptions = normalizeOptions(
        getOptions('brand_voice').length
            ? getOptions('brand_voice')
            : [...Array(5)].map((_, i) => ({ key: `brand_${i + 1}`, label: `Brand Voice ${i + 1}` }))
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
                { key: 'plain_text', label: 'Plain Text' },
                { key: 'html', label: 'HTML' },
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
            // { key: 'structured_layout', label: 'Structured Layout' },
        ];

    // Handler functions
    const buildOptionObject = (fieldKey, value, typeMode = 'predefined') => {
        if (!value) return null;

        const list = getOptions(fieldKey);
        const match = list.find((opt) => opt.key === value || opt.value === value || opt.label === value);

        // Handle explicit custom or unrecognized value that isn't length custom
        const isCustom = typeMode === 'custom' || (!match && fieldKey !== 'length_target');
        const isLengthCustom = fieldKey === 'length_target' && value === 'custom';

        if (isCustom || isLengthCustom) {
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

        if (name === 'customUseCase') {
            setCustomUseCaseError('');
        }
        if (name === 'useCaseMode' && value !== 'custom') {
            setCustomUseCaseError('');
        }

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleArrayChange = (e, field) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            e.preventDefault();
            const newItem = e.target.value.trim();
            setFormData((prev) => ({
                ...prev,
                [field]: [...prev[field], newItem],
            }));
            e.target.value = '';
        }
    };

    const addAudienceChip = (value) => {
        const trimmed = value.trim();
        if (!trimmed) return;

        setFormData((prev) => {
            if (prev.targetAudience.includes(trimmed)) return prev;
            return {
                ...prev,
                targetAudience: [...prev.targetAudience, trimmed],
            };
        });

        setAudienceInput('');
        setShowAudienceSuggestions(false);
    };

    const removeAudienceChip = (chip) => {
        setFormData((prev) => ({
            ...prev,
            targetAudience: prev.targetAudience.filter((item) => item !== chip),
        }));
    };

    const handleAudienceInput = (e) => {
        const value = e.target.value;
        setAudienceInput(value);
        setShowAudienceSuggestions(value.trim().length > 0);
    };

    const addKeyPointsChip = (value) => {
        const trimmed = value.trim();
        if (!trimmed) return;

        setFormData((prev) => {
            if (prev.keyPoints.includes(trimmed)) return prev;
            return {
                ...prev,
                keyPoints: [...prev.keyPoints, trimmed],
            };
        });

        setKeyPointsInput('');
        setShowKeyPointsSuggestions(false);
    };

    const removeKeyPointsChip = (chip) => {
        setFormData((prev) => ({
            ...prev,
            keyPoints: prev.keyPoints.filter((item) => item !== chip),
        }));
    };

    const handleKeyPointsInput = (e) => {
        const value = e.target.value;
        setKeyPointsInput(value);
        setShowKeyPointsSuggestions(value.trim().length > 0);
    };

    const removeItem = (field, index) => {
        setFormData((prev) => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index),
        }));
    };

    const toggleAdvanced = () => {
        setFormData((prev) => ({
            ...prev,
            showAdvanced: !prev.showAdvanced,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        setCustomUseCaseError('');

        // Basic validation for required fields
        if (
            !formData.primaryGoal ||
            !formData.targetAudience ||
            formData.targetAudience.length === 0 ||
            !formData.keyPoints ||
            (Array.isArray(formData.keyPoints) && formData.keyPoints.length === 0)
        ) {
            alert('Please fill in all required fields (marked with *)');
            return;
        }

        // Mode-specific validation
        if (formData.useCaseMode === 'predefined' && !formData.useCase) {
            alert('Please select a Use Case.');
            return;
        }
        if (formData.useCaseMode === 'custom' && !formData.customUseCase) {
            alert('Please enter a Custom Use Case.');
            return;
        }

        // Block references to other tools in custom use case
        if (formData.useCaseMode === 'custom') {
            const raw = String(formData.customUseCase || '').trim();
            const forbidden = [
                /\bad\s*generator\b/i,
                /\bad\s*copy\b/i,
                /\bad\s*copy\s*generator\b/i,
                /\bemails?\b/i,
                /\bnewsletters?\b/i,
                /\bseo\b/i,
                /\bmeta\s*tags?\b/i,
                /\bcaption\s*(?:&|and)?\s*hashtags?\b/i,
                /\bhashtags?\b/i,
                /\bscripts?\b/i,
                /\bstory\s*writers?\b/i,
                /\b\/ad-copy-generator\b/i,
                /\b\/email-generator\b/i,
                /\b\/seo-keyword-meta-tag-generator\b/i,
                /\b\/caption-and-hastag-generator\b/i,
                /\b\/script-story-writer-tool\b/i,
            ];

            const hasForbidden = raw && forbidden.some((re) => re.test(raw));
            if (hasForbidden) {
                setCustomUseCaseError('Please don\'t reference other tools in this field.');

                const el = customUseCaseInputRef.current;
                if (el && typeof el.scrollIntoView === 'function') {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                if (el && typeof el.focus === 'function') {
                    el.focus();
                }
                return;
            }
        }

        if (formData.toneMode === 'predefined' && !formData.toneOfVoice) {
            alert('Please select a Tone of Voice.');
            return;
        }
        if (formData.toneMode === 'custom' && !formData.customTone) {
            alert('Please enter a Custom Tone.');
            return;
        }

        if (formData.languageMode === 'custom' && !formData.customLanguage) {
            alert('Please enter a Custom Language.');
            return;
        }

        // Advanced Mode-specific validation for required custom fields
        if (formData.showAdvanced) {
            if (formData.brandVoiceMode === 'custom' && !formData.customBrandVoice) {
                alert('Please enter a Custom Brand Voice Reference.');
                return;
            }
            if (formData.contentStyleMode === 'custom' && !formData.customContentStyle) {
                alert('Please enter a Custom Content Style Preference.');
                return;
            }
            if (formData.emotionalIntentMode === 'custom' && !formData.customEmotionalIntent) {
                alert('Please enter a Custom Emotional Intent.');
                return;
            }
            if (formData.writingFrameworkMode === 'custom' && !formData.customWritingFramework) {
                alert('Please enter a Custom Writing Framework.');
                return;
            }
            if (
                formData.proofreading &&
                formData.grammarStrictnessMode === 'custom' &&
                !formData.customGrammarStrictness
            ) {
                alert('Please enter a Custom Grammar Strictness.');
                return;
            }
        }

        setShowSummary(true);
    };

    const handleEdit = () => {
        setShowSummary(false);
    };

    const handleGenerate = async () => {
        if (isGenerating) return;

        if (formData.useCaseMode === 'custom') {
            const raw = String(formData.customUseCase || '').trim();
            const forbidden = [
                /\bad\s*generator\b/i,
                /\bad\s*copy\b/i,
                /\bad\s*copy\s*generator\b/i,
                /\bemails?\b/i,
                /\bnewsletters?\b/i,
                /\bseo\b/i,
                /\bmeta\s*tags?\b/i,
                /\bcaption\s*(?:&|and)?\s*hashtags?\b/i,
                /\bhashtags?\b/i,
                /\bscripts?\b/i,
                /\bstory\s*writers?\b/i,
                /\b\/ad-copy-generator\b/i,
                /\b\/email-generator\b/i,
                /\b\/seo-keyword-meta-tag-generator\b/i,
                /\b\/caption-and-hastag-generator\b/i,
                /\b\/script-story-writer-tool\b/i,
            ];

            const hasForbidden = raw && forbidden.some((re) => re.test(raw));
            if (hasForbidden) {
                setCustomUseCaseError('Please don\'t reference other tools in this field.');

                setShowSummary(false);

                const el = customUseCaseInputRef.current;
                if (el && typeof el.scrollIntoView === 'function') {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                if (el && typeof el.focus === 'function') {
                    el.focus();
                }
                return;
            }
        }

        sessionRequestIdRef.current = createSessionRequestId();

        const useCaseType = formData.useCaseMode === 'custom' ? 'custom' : 'predefined';
        const useCaseValue = formData.useCaseMode === 'custom' ? formData.customUseCase : formData.useCase;
        const useCaseObj = buildOptionObject('use_case', useCaseValue, useCaseType) || { id: null, value: useCaseValue, type: useCaseType };

        const toneType = formData.toneMode === 'custom' ? 'custom' : 'predefined';
        const toneValue = formData.toneMode === 'custom' ? formData.customTone : formData.toneOfVoice;
        const toneObj = buildOptionObject('tone_of_voice', toneValue, toneType) || { id: null, value: toneValue, type: toneType };

        const languageType = formData.languageMode === 'custom' ? 'custom' : 'predefined';
        const languageValue = formData.languageMode === 'custom' ? formData.customLanguage : formData.language;
        const languageObj = buildOptionObject('language', languageValue, languageType) || { id: null, value: languageValue, type: languageType };

        let lengthTargetObj;
        if (formData.lengthTargetMode === 'custom') {
            lengthTargetObj = { id: null, value: String(formData.customWordCount ?? ''), type: 'custom' };
        } else {
            lengthTargetObj =
                buildOptionObject('length_target', formData.lengthTarget) || {
                    id: null,
                    value: formData.lengthTarget,
                    type: 'predefined',
                };
        }

        if (lengthTargetObj && lengthTargetObj.value != null) {
            lengthTargetObj = { ...lengthTargetObj, value: String(lengthTargetObj.value) };
        }

        let ctaStyleObj = null;
        if (formData.ctaStyleMode === 'custom' && formData.customCtaStyle) {
            ctaStyleObj = { id: null, value: formData.customCtaStyle, type: 'custom' };
        } else if (formData.ctaStyleMode === 'predefined' && formData.ctaStyle) {
            ctaStyleObj = buildOptionObject('cta_style', formData.ctaStyle) || { id: null, value: formData.ctaStyle, type: 'predefined' };
        }

        let readingLevelObj = null;
        if (formData.readingLevelMode === 'custom' && formData.customReadingLevel) {
            readingLevelObj = { id: null, value: formData.customReadingLevel, type: 'custom' };
        } else if (formData.readingLevelMode === 'predefined' && formData.readingLevel) {
            readingLevelObj = buildOptionObject('reading_level', formData.readingLevel) || { id: null, value: formData.readingLevel, type: 'predefined' };
        }

        let targetPlatformObj = null;
        if (formData.targetPlatformMode === 'custom' && formData.customTargetPlatform) {
            targetPlatformObj = { id: null, value: formData.customTargetPlatform, type: 'custom' };
        } else if (formData.targetPlatformMode === 'predefined' && formData.targetPlatform) {
            targetPlatformObj = buildOptionObject('target_platform', formData.targetPlatform) || { id: null, value: formData.targetPlatform, type: 'predefined' };
        }

        let brandVoiceObj = null;
        if (formData.brandVoiceMode === 'custom' && formData.customBrandVoice) {
            brandVoiceObj = { id: null, value: formData.customBrandVoice, type: 'custom' };
        } else if (formData.brandVoiceMode === 'predefined' && formData.brandVoice) {
            brandVoiceObj = buildOptionObject('brand_voice', formData.brandVoice) || { id: null, value: formData.brandVoice, type: 'predefined' };
        }

        let contentStyleObj = null;
        if (formData.contentStyleMode === 'custom' && formData.customContentStyle) {
            contentStyleObj = { id: null, value: formData.customContentStyle, type: 'custom' };
        } else if (formData.contentStyleMode === 'predefined' && formData.contentStyle) {
            contentStyleObj = buildOptionObject('content_style_preference', formData.contentStyle) || { id: null, value: formData.contentStyle, type: 'predefined' };
        }

        let emotionalIntentObj = null;
        if (formData.emotionalIntentMode === 'custom' && formData.customEmotionalIntent) {
            emotionalIntentObj = { id: null, value: formData.customEmotionalIntent, type: 'custom' };
        } else if (formData.emotionalIntentMode === 'predefined' && formData.emotionalIntent) {
            emotionalIntentObj = buildOptionObject('emotional_intent', formData.emotionalIntent) || { id: null, value: formData.emotionalIntent, type: 'predefined' };
        }

        let writingFrameworkObj = null;
        if (formData.writingFrameworkMode === 'custom' && formData.customWritingFramework) {
            writingFrameworkObj = { id: null, value: formData.customWritingFramework, type: 'custom' };
        } else if (formData.writingFrameworkMode === 'predefined' && formData.writingFramework) {
            writingFrameworkObj = buildOptionObject('writing_framework', formData.writingFramework) || { id: null, value: formData.writingFramework, type: 'predefined' };
        }

        let grammarStrictnessObj = null;
        if (formData.proofreading) {
            if (formData.grammarStrictnessMode === 'custom' && formData.customGrammarStrictness) {
                grammarStrictnessObj = { id: null, value: formData.customGrammarStrictness, type: 'custom' };
            } else if (formData.grammarStrictnessMode === 'predefined' && formData.grammarStrictness) {
                grammarStrictnessObj = buildOptionObject('grammar_strictness', formData.grammarStrictness) || { id: null, value: formData.grammarStrictness, type: 'predefined' };
            }
        }

        const outputStructureObj = formData.outputStructure
            ? buildOptionObject('output_structure_type', formData.outputStructure) || { id: null, value: formData.outputStructure, type: 'predefined' }
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
            key_points: Array.isArray(formData.keyPoints)
                ? formData.keyPoints
                : String(formData.keyPoints)
                    .split('\n')
                    .map((v) => v.trim())
                    .filter(Boolean),
            number_of_variants: parseInt(formData.variants, 10) || 1,
            show_advanced_features: !!formData.showAdvanced,
            keywords: keywordsArray,
            cta_style: ctaStyleObj,
            rewrite_mode: !!formData.rewriteMode,
            reference_text: formData.referenceText || null,
            reading_level: readingLevelObj,
            target_platform: targetPlatformObj,
            brand_voice_reference: brandVoiceObj,
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
            session_request_id: sessionRequestIdRef.current,
        };

        abortAllStreams();
        setIsGenerating(true);
        setModalTitle("Generated Variants");
        setIsHistoryView(false);
        setIsApiLoading(true);

        try {
            showNotification('Generating copywriting, please wait...', 'info');

            const variantCount = Math.max(1, parseInt(payload?.number_of_variants || 1, 10));
            const clientRequestKey = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

            setRequestId(null);
            setIsApiLoading(false);
            setGeneratedVariantsData({
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
                streamControllersRef.current = [...streamControllersRef.current, controller];

                const payloadForStream = {
                    ...payload,
                    number_of_variants: 1,
                };

                const response = await fetch(API.GENERATE_COPYWRITING_STREAM, {
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
        } catch (err) {
            console.error('Error generating copywriting variants:', err);
            showNotification(`Error: ${err.message || 'Failed to generate'}`, 'error');
        } finally {
            setIsApiLoading(false);
            setIsGenerating(false);
        }
    };

    const handleRegenerateVariant = async (variantId) => {
        if (!variantId) return;

        const variantIndex = (generatedVariantsData.variants || []).findIndex((v) => v.id === variantId);
        if (variantIndex === -1) return;

        showNotification(`Regenerating Variant ${variantIndex + 1}...`, 'info');

        const controller = new AbortController();
        streamControllersRef.current = [...streamControllersRef.current, controller];

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
            const response = await fetch(API.REGENERATE_COPYWRITING_VARIANT(variantId), {
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
                            content: result?.new_content || result?.content || '',
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
                    return;
                }

                if (typeof msg.new_content === 'string' || typeof msg.content === 'string') {
                    setGeneratedVariantsData((prev) => {
                        const next = [...(prev.variants || [])];
                        if (next[variantIndex]) {
                            next[variantIndex] = {
                                ...next[variantIndex],
                                content: msg.new_content || msg.content || '',
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
                for (;;) {
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
                for (;;) {
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

    // --- New handleViewLog Function ---
    const handleViewLog = async () => {
        if (!requestId) {
            console.error('No previous copywriting request_id found for log viewing.');
            alert('No previous generation found to view log.');
            return;
        }

        setIsFetchingLog(true);    // so VariantsModal can show loading state if needed
        setIsGenerating(true);    // reuse existing generating flag for buttons
        setModalTitle('Variants Log'); // set title for log view
        setIsHistoryView(true);
        setIsApiLoading(true);

        try {
            const response = await fetch(API.COPYWRITING_GET_VARIANTS_LOG(requestId), {
                headers: {
                    Authorization: getAuthHeader(),
                },
            });

            if (!response.ok) {
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch (e) {
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
            setIsFetchingLog(false);
            setIsGenerating(false);
            setIsApiLoading(false);
            setShowSummary(false);
        }
    };

    // Fetch dropdown & predefined options from API on mount
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const response = await fetch(API.GET_COPYWRITING_OPTIONS, {
                    headers: {
                        Authorization: getAuthHeader(),
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
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
        container: { maxWidth: '1100px', margin: '0 auto', padding: '10px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', backgroundColor: '#0a0e1a', minHeight: '100vh' },
        card: { backgroundColor: '#141b2d', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid #1e293b' },
        header: { padding: '24px 32px' },
        title: { margin: 0, fontSize: '24px', fontWeight: '600', color: '#f8fafc' },
        subtitle: { margin: '6px 0 0', fontSize: '15px', color: '#94a3b8' },
        // formGroup: { marginBottom: '8px' },
        label: { display: 'block', marginBottom: '6px', fontSize: '16px', fontWeight: '500', color: '#e2e8f0' },
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
        select: { width: '100%', height: '42px', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5', color: '#e2e8f0', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', transition: 'all 0.15s ease-in-out', boxSizing: 'border-box', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '20px', paddingRight: '40px', cursor: 'pointer' },
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
        toolTip: { width: '40%' },
        toast: { position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', color: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999 },
    };

    // --- Layout Helpers (Unchanged) ---
    const COLUMN_GAP = '20px';
    const twoColContainerStyle = {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: COLUMN_GAP,
        // marginBottom: '20px',
        width: '100%'
    };
    const colHalfStyle = {
        flex: '1 1 calc(50% - 10px)',
    };
    const colFullStyle = {
        width: '100%',
        // marginBottom: '20px',
    };

    // Helper function for radio buttons in the advanced section
    const renderModeToggle = (modeName, labelText, tooltipContent, required = false) => (
        <div className="col-12">
            <div style={styles.formGroup}>
                <label style={styles.label}>
                    {labelText} {required && <span style={{ color: '#ef4444' }}>*</span>}
                    {!required && " (optional)"}
                    <span style={styles.infoIcon} data-tooltip-id={`${modeName}-tooltip`} data-tooltip-content={tooltipContent}>i</span>
                </label>
                <Tooltip style={styles.toolTip} id={`${modeName}-tooltip`} />
                <div style={{ display: 'flex', gap: '20px', marginBottom: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="radio"
                            name={modeName}
                            value="predefined"
                            checked={formData[modeName] === 'predefined'}
                            onChange={handleChange}
                            style={{ marginRight: '8px' }}
                        />
                        Predefined
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="radio"
                            name={modeName}
                            value="custom"
                            checked={formData[modeName] === 'custom'}
                            onChange={handleChange}
                            style={{ marginRight: '8px' }}
                        />
                        Custom
                    </label>
                </div>
            </div>
        </div>
    );

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Copywriting Assistant Tool</h1>
                <p style={styles.subtitle}>Generate high-quality copy for your needs</p>
            </div>
            <div style={styles.card}>
                <div style={{ padding: '24px' }}>
                    <form onSubmit={handleSubmit}>
                        <div className="row g-4">
                            {/* Main (non-advanced) fields */}
                            {!formData.showAdvanced && (
                                <>
                                    {/* Use Case */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>
                                                Use Case <span style={{ color: '#ef4444' }}>*</span>
                                                <span style={styles.infoIcon} data-tooltip-id="useCase-tooltip" data-tooltip-content="Select a predefined use case or define your own custom use case">i</span>
                                            </label>
                                            <Tooltip style={styles.toolTip} id="useCase-tooltip" />
                                            <div style={{ display: 'flex', gap: '20px', marginBottom: '8px' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                    <input
                                                        type="radio"
                                                        name="useCaseMode"
                                                        value="predefined"
                                                        checked={formData.useCaseMode === 'predefined'}
                                                        onChange={handleChange}
                                                        style={{ marginRight: '8px' }}
                                                    />
                                                    Predefined
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                    <input
                                                        type="radio"
                                                        name="useCaseMode"
                                                        value="custom"
                                                        checked={formData.useCaseMode === 'custom'}
                                                        onChange={handleChange}
                                                        style={{ marginRight: '8px' }}
                                                    />
                                                    Custom
                                                </label>
                                            </div>

                                            {/* Predefined Use Case (shown when predefined is selected) */}
                                            {formData.useCaseMode === 'predefined' && (
                                                <div className="col-md-6">
                                                    <div style={styles.formGroup}>
                                                        <select
                                                            id="useCase"
                                                            name="useCase"
                                                            value={formData.useCase}
                                                            onChange={handleChange}
                                                            style={styles.select}
                                                            required={formData.useCaseMode === 'predefined'}
                                                        >
                                                            <option value="">Select a use case</option>
                                                            {useCaseOptions.map((option, index) => (
                                                                <option key={index} value={option.value}>{option.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Custom Use Case (shown when custom is selected) */}
                                            {formData.useCaseMode === 'custom' && (
                                                <div className="col-md-6">
                                                    <div style={styles.formGroup}>
                                                        <input
                                                            type="text"
                                                            id="customUseCase"
                                                            name="customUseCase"
                                                            value={formData.customUseCase}
                                                            onChange={handleChange}
                                                            ref={customUseCaseInputRef}
                                                            style={{
                                                                ...styles.input,
                                                                border: customUseCaseError ? '1px solid #ef4444' : styles.input.border,
                                                            }}
                                                            placeholder="Describe your specific use case"
                                                            maxLength={150}
                                                            required={formData.useCaseMode === 'custom'}
                                                            aria-invalid={customUseCaseError ? 'true' : 'false'}
                                                            aria-describedby={customUseCaseError ? 'customUseCase-error' : undefined}
                                                        />
                                                        {customUseCaseError ? (
                                                            <div
                                                                id="customUseCase-error"
                                                                style={{ marginTop: '6px', color: '#ef4444', fontSize: '13px' }}
                                                            >
                                                                {customUseCaseError}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Primary Goal */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="primaryGoal" style={styles.label}>
                                                Primary Goal <span style={{ color: '#ef4444' }}>*</span>
                                                <span style={styles.infoIcon} data-tooltip-id="primaryGoal-tooltip" data-tooltip-content="Describe the main objective of your content (max 150 words)">i</span>
                                            </label>
                                            <Tooltip style={styles.toolTip} id="primaryGoal-tooltip" />
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

                                            {/* Audience Chips and Input (multi-select custom input) */}
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

                                    {/* Tone Selection + Language (two columns) */}
                                    <div style={twoColContainerStyle}>
                                        {/* Tone (Left Half) */}
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>
                                                    Tone Selection <span style={{ color: '#ef4444' }}>*</span>
                                                    <span style={styles.infoIcon} data-tooltip-id="toneMode-tooltip" data-tooltip-content="Choose between predefined tones or define a custom tone">i</span>
                                                </label>
                                                <Tooltip style={styles.toolTip} id="toneMode-tooltip" />
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

                                                {formData.toneMode === 'predefined' && (
                                                    <div style={{ marginTop: '8px' }}>
                                                        <Tooltip style={styles.toolTip} id="tone-tooltip" />
                                                        <select
                                                            id="toneOfVoice"
                                                            name="toneOfVoice"
                                                            value={formData.toneOfVoice}
                                                            onChange={handleChange}
                                                            style={styles.select}
                                                            required={formData.toneMode === 'predefined'}
                                                        >
                                                            <option value="">Select a tone</option>
                                                            {toneOptions.map((tone, index) => (
                                                                <option key={index} value={tone.value}>{tone.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {formData.toneMode === 'custom' && (
                                                    <div style={{ marginTop: '8px' }}>
                                                        <input
                                                            type="text"
                                                            id="customTone"
                                                            name="customTone"
                                                            value={formData.customTone}
                                                            onChange={handleChange}
                                                            style={styles.input}
                                                            placeholder="Describe your desired tone in a few words (max 12 words)"
                                                            maxLength={100}
                                                            required={formData.toneMode === 'custom'}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Language (Right Half) */}
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>
                                                    Language <span style={{ color: '#ef4444' }}>*</span>
                                                    <span style={styles.infoIcon} data-tooltip-id="language-tooltip" data-tooltip-content="Select the language for your content or define a custom language">i</span>
                                                </label>
                                                <Tooltip style={styles.toolTip} id="language-tooltip" />
                                                <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                        <input
                                                            type="radio"
                                                            name="languageMode"
                                                            value="predefined"
                                                            checked={formData.languageMode === 'predefined'}
                                                            onChange={handleChange}
                                                            style={{ marginRight: '8px' }}
                                                        />
                                                        Predefined
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                        <input
                                                            type="radio"
                                                            name="languageMode"
                                                            value="custom"
                                                            checked={formData.languageMode === 'custom'}
                                                            onChange={handleChange}
                                                            style={{ marginRight: '8px' }}
                                                        />
                                                        Custom
                                                    </label>
                                                </div>

                                                {formData.languageMode === 'predefined' && (
                                                    <div style={{ marginTop: '8px' }}>
                                                        <select
                                                            id="language"
                                                            name="language"
                                                            value={formData.language}
                                                            onChange={handleChange}
                                                            style={styles.select}
                                                            required={formData.languageMode === 'predefined'}
                                                        >
                                                            {languageOptions.map((lang, index) => (
                                                                <option key={index} value={lang.value}>{lang.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {formData.languageMode === 'custom' && (
                                                    <div style={{ marginTop: '8px' }}>
                                                        <input
                                                            type="text"
                                                            id="customLanguage"
                                                            name="customLanguage"
                                                            value={formData.customLanguage}
                                                            onChange={handleChange}
                                                            style={styles.input}
                                                            placeholder="e.g., English (Canada), Hinglish"
                                                            maxLength={100}
                                                            required={formData.languageMode === 'custom'}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Key Points */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="keyPoints" style={styles.label}>
                                                Key Benefits <span style={{ color: '#ef4444' }}>*</span>
                                                <span
                                                    style={styles.infoIcon}
                                                    data-tooltip-id="keyPoints-tooltip"
                                                    data-tooltip-content="List the main points to include in your content as short bullets."
                                                >
                                                    i
                                                </span>
                                            </label>
                                            <Tooltip style={styles.toolTip} id="keyPoints-tooltip" />

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
                                                backgroundColor: formData.keyPoints.length > 0 ? '#f9fafb' : 'white'
                                            }}>
                                                {formData.keyPoints.length === 0 && (
                                                    <span style={{ color: '#9ca3af', fontSize: '14px', marginLeft: '8px' }}>
                                                        Add key points (e.g., 'Highlight main benefit', 'Mention free trial')
                                                    </span>
                                                )}
                                                {formData.keyPoints.map((chip, index) => (
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
                                                            onClick={() => removeKeyPointsChip(chip)}
                                                        />
                                                    </span>
                                                ))}
                                            </div>

                                            <input
                                                type="text"
                                                value={keyPointsInput}
                                                onChange={handleKeyPointsInput}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && keyPointsInput.trim()) {
                                                        e.preventDefault();
                                                        addKeyPointsChip(keyPointsInput.trim());
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                                if (keyPointsInput.trim()) {
                                                                    addKeyPointsChip(keyPointsInput.trim());
                                                                }
                                                            }}
                                                style={{
                                                    ...styles.input,
                                                    marginBottom: 0,
                                                }}
                                                placeholder="Type a key point and press Enter to add"
                                                required={formData.keyPoints.length === 0}
                                                inputMode='text'
                                            />
                                        </div>
                                    </div>

                                    {/* Length Target */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>
                                                Length Target <span style={{ color: '#ef4444' }}>*</span>
                                                <span style={styles.infoIcon} data-tooltip-id="length-tooltip" data-tooltip-content="Select or specify your desired word count">i</span>
                                            </label>
                                            <Tooltip style={styles.toolTip} id="length-tooltip" />

                                            {/* Mode toggle: Predefined vs Custom */}
                                            <div style={{ display: 'flex', gap: '20px', marginTop: '4px', marginBottom: '8px' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                    <input
                                                        type="radio"
                                                        name="lengthTargetMode"
                                                        value="predefined"
                                                        checked={formData.lengthTargetMode === 'predefined'}
                                                        onChange={handleChange}
                                                        style={{ marginRight: '8px' }}
                                                    />
                                                    Predefined
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                    <input
                                                        type="radio"
                                                        name="lengthTargetMode"
                                                        value="custom"
                                                        checked={formData.lengthTargetMode === 'custom'}
                                                        onChange={handleChange}
                                                        style={{ marginRight: '8px' }}
                                                    />
                                                    Custom
                                                </label>
                                            </div>

                                            {formData.lengthTargetMode === 'predefined' && (
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <select
                                                        id="lengthTarget"
                                                        name="lengthTarget"
                                                        value={formData.lengthTarget}
                                                        onChange={handleChange}
                                                        style={{ ...styles.select, flex: 1 }}
                                                    >
                                                        {lengthTargetOptions.map((opt, index) => (
                                                            <option key={index} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {formData.lengthTargetMode === 'custom' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <input
                                                        type="number"
                                                        name="customWordCount"
                                                        value={formData.customWordCount}
                                                        onChange={handleChange}
                                                        min="50"
                                                        max="1200"
                                                        style={{ ...styles.input, maxWidth: '160px' }}
                                                        placeholder="Target words (50-1200)"
                                                    />
                                                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                                        Custom length target should be between 50 and 1200 words. The generator will aim for this length.
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Number of Variants */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="variants" style={styles.label}>
                                                Number of Variants: {formData.variants}
                                                <span style={styles.infoIcon} data-tooltip-id="variants-tooltip" data-tooltip-content="How many different versions of the content would you like to generate?">i</span>
                                            </label>
                                            <Tooltip style={styles.toolTip} id="variants-tooltip" />
                                            <input
                                                type="range"
                                                id="variants"
                                                name="variants"
                                                min="1"
                                                max="2"
                                                value={formData.variants}
                                                onChange={handleChange}
                                                style={{ width: '100%' }}
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                                <span>1</span>
                                                <span>2</span>
                                                {/* <span>3</span>
                                                <span>4</span>
                                                <span>5</span> */}
                                            </div>
                                        </div>
                                    </div>

                                    <hr style={{ width: '100%', border: 'none', borderTop: '1px solid #1e293b', margin: '5px 0' }} />
                                </>
                            )}
                            {/* Advanced Features Toggle */}
                            <div className="col-12" style={{ margin: '16px 0' }}>
                                <ToggleButton showAdvanced={formData.showAdvanced} onToggle={toggleAdvanced} />
                            </div>

                            {/* Advanced Features */}
                            {formData.showAdvanced && (
                                <>
                                    {/* Keywords */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="keywords" style={styles.label}>
                                                Keywords (optional)
                                                <span style={styles.infoIcon} data-tooltip-id="keywords-tooltip" data-tooltip-content="Add keywords to include in your content (max 250 characters)">i</span>
                                            </label>
                                            <Tooltip style={styles.toolTip} id="keywords-tooltip" />
                                            <input
                                                type="text"
                                                id="keywords"
                                                name="keywords"
                                                value={formData.keywords}
                                                onChange={handleChange}
                                                style={{ ...styles.input, marginBottom: '20px' }}
                                                placeholder="e.g., digital marketing, seo, content strategy"
                                                maxLength={250}
                                            />
                                        </div>
                                        {/* CTA Style Mode Toggle */}
                                    {renderModeToggle('ctaStyleMode', 'CTA Style', 'Choose between predefined CTA styles or define your own')}

                                    {/* CTA Style (Predefined/Custom Input) */}
                                    {formData.ctaStyleMode === 'predefined' && (
                                        <div className="col-12">
                                            <div style={styles.formGroup}>
                                                <select
                                                    id="ctaStyle"
                                                    name="ctaStyle"
                                                    value={formData.ctaStyle || ''}
                                                    onChange={handleChange}
                                                    style={styles.select}
                                                >
                                                    <option value="">Select CTA Style</option>
                                                    {ctaStyleOptions.map((style, index) => (
                                                        <option key={index} value={style.value}>{style.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {formData.ctaStyleMode === 'custom' && (
                                        <div className="col-md-6">
                                            <div style={styles.formGroup}>
                                                <input
                                                    type="text"
                                                    id="customCtaStyle"
                                                    name="customCtaStyle"
                                                    value={formData.customCtaStyle}
                                                    onChange={handleChange}
                                                    style={styles.input}
                                                    placeholder="Describe your CTA style"
                                                    maxLength={120}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    </div>

                                    {/* Reference Text */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="referenceText" style={styles.label}>
                                                Reference Text (optional)
                                                <span style={styles.infoIcon} data-tooltip-id="reference-tooltip" data-tooltip-content="Add any reference text or examples (max 5000 characters)">i</span>
                                            </label>
                                            <Tooltip style={styles.toolTip} id="reference-tooltip" />
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
                                    <div style={twoColContainerStyle}>
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        name="rewriteMode"
                                                        checked={formData.rewriteMode}
                                                        onChange={handleChange}
                                                        style={{ width: '16px', height: '16px' }}
                                                    />
                                                    <span>Rewrite Mode (optional)</span>
                                                    <span style={{ ...styles.infoIcon, marginLeft: '8px' }} data-tooltip-id="rewrite-tooltip" data-tooltip-content="Enable to rewrite the reference text in a different style">i</span>
                                                </label>
                                                <Tooltip style={styles.toolTip} id="rewrite-tooltip" />
                                            </div>
                                        </div>
                                        <div style={colHalfStyle}></div>
                                    </div>

                                    {/* Reading Level + Target Platform (two-column row) */}
                                    <div style={twoColContainerStyle}>
                                        {/* Reading Level (Left Half) */}
                                        <div style={colHalfStyle}>
                                            {renderModeToggle('readingLevelMode', 'Reading Level', 'Select the reading level for your content or describe a custom level')}

                                            {formData.readingLevelMode === 'predefined' && (
                                                <div style={styles.formGroup}>
                                                    <select
                                                        id="readingLevel"
                                                        name="readingLevel"
                                                        value={formData.readingLevel}
                                                        onChange={handleChange}
                                                        style={styles.select}
                                                    >
                                                        {readingLevelOptions.map((opt, index) => (
                                                            <option key={index} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {formData.readingLevelMode === 'custom' && (
                                                <div style={styles.formGroup}>
                                                    <input
                                                        type="text"
                                                        id="customReadingLevel"
                                                        name="customReadingLevel"
                                                        value={formData.customReadingLevel}
                                                        onChange={handleChange}
                                                        style={styles.input}
                                                        placeholder="Describe the reading level"
                                                        maxLength={120}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Target Platform (Right Half) */}
                                        <div style={colHalfStyle}>
                                            {renderModeToggle('targetPlatformMode', 'Target Platform (optional)', 'Select the platform where this content will be published or specify your own')}

                                            {formData.targetPlatformMode === 'predefined' && (
                                                <div style={styles.formGroup}>
                                                    <select
                                                        id="targetPlatform"
                                                        name="targetPlatform"
                                                        value={formData.targetPlatform || ''}
                                                        onChange={handleChange}
                                                        style={styles.select}
                                                    >
                                                        <option value="">Any Platform</option>
                                                        {targetPlatformOptions.map((opt, index) => (
                                                            <option key={index} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {formData.targetPlatformMode === 'custom' && (
                                                <div style={styles.formGroup}>
                                                    <input
                                                        type="text"
                                                        id="customTargetPlatform"
                                                        name="customTargetPlatform"
                                                        value={formData.customTargetPlatform}
                                                        onChange={handleChange}
                                                        style={styles.input}
                                                        placeholder="Describe the platform"
                                                        maxLength={120}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Formatting Options */}
                                    <div className="col-md-6">
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>
                                                Formatting Options (optional)
                                                <span style={styles.infoIcon} data-tooltip-id="formatting-tooltip" data-tooltip-content="Select the formatting options you want to include">i</span>
                                            </label>
                                            <Tooltip style={styles.toolTip} id="formatting-tooltip" />
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
                                                                style={styles.checkboxInput}
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
                                                Include Words (optional)
                                                <span style={styles.infoIcon} data-tooltip-id="include-tooltip" data-tooltip-content="Words that must be included in the content (press Enter to add)">i</span>
                                            </label>
                                            <Tooltip style={styles.toolTip} id="include-tooltip" />
                                            <input
                                                type="text"
                                                style={styles.input}
                                                placeholder="Add a word and press Enter"
                                                onKeyPress={(e) => handleArrayChange(e, 'includeWords')}
                                                onBlur={(e) => {
                                                                const value = e.target.value.trim();
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        includeWords: [...prev.includeWords, value]
                                                                    }));
                                                                    e.target.value = '';
                                                            }}
                                                inputMode='text'
                                            />
                                            <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '8px' }}>
                                                {formData.includeWords.map((word, index) => (
                                                    <span key={index} style={{ ...styles.badge, ...styles.badgeSecondary, marginRight: '8px', marginBottom: '8px' }}>
                                                        {word}
                                                        <RemoveTagButton
                                                            style={styles.removeBtn}
                                                            onClick={() => removeItem('includeWords', index)}
                                                        />
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* --- EMOTIONAL INTENT + WRITING FRAMEWORK (two-column row) --- */}
                                    <div style={twoColContainerStyle}>
                                        {/* Emotional Intent (Left Half) */}
                                        <div style={colHalfStyle}>
                                            {renderModeToggle(
                                                'emotionalIntentMode',
                                                'Emotional Intent (optional)',
                                                'Select the emotional tone for your content or describe a custom one'
                                            )}

                                            {formData.emotionalIntentMode === 'predefined' && (
                                                <div style={styles.formGroup}>
                                                    <select
                                                        id="emotionalIntent"
                                                        name="emotionalIntent"
                                                        value={formData.emotionalIntent}
                                                        onChange={handleChange}
                                                        style={styles.select}
                                                    >
                                                        <option value="">None (Neutral)</option>
                                                        {emotionalIntentOptions.map((opt, index) => (
                                                            <option key={index} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {formData.emotionalIntentMode === 'custom' && (
                                                <div style={styles.formGroup}>
                                                    <input
                                                        type="text"
                                                        id="customEmotionalIntent"
                                                        name="customEmotionalIntent"
                                                        value={formData.customEmotionalIntent}
                                                        onChange={handleChange}
                                                        style={styles.input}
                                                        placeholder="e.g., Inspire hope and joy"
                                                        maxLength={120}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Writing Framework (Right Half) */}
                                        <div style={colHalfStyle}>
                                            {renderModeToggle(
                                                'writingFrameworkMode',
                                                'Writing Framework (optional)',
                                                'Select a writing framework or specify a custom one for content structure'
                                            )}

                                            {formData.writingFrameworkMode === 'predefined' && (
                                                <div style={styles.formGroup}>
                                                    <select
                                                        id="writingFramework"
                                                        name="writingFramework"
                                                        value={formData.writingFramework}
                                                        onChange={handleChange}
                                                        style={styles.select}
                                                    >
                                                        <option value="">None (Standard Structure)</option>
                                                        {writingFrameworkOptions.map((opt, index) => (
                                                            <option key={index} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {formData.writingFrameworkMode === 'custom' && (
                                                <div style={styles.formGroup}>
                                                    <input
                                                        type="text"
                                                        id="customWritingFramework"
                                                        name="customWritingFramework"
                                                        value={formData.customWritingFramework}
                                                        onChange={handleChange}
                                                        style={styles.input}
                                                        placeholder="e.g., Problem-Agitate-Solve with a storytelling intro"
                                                        maxLength={120}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Compliance Notes */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="complianceNotes" style={styles.label}>
                                                Compliance Notes (optional)
                                                <span style={styles.infoIcon} data-tooltip-id="compliance-tooltip" data-tooltip-content="Any legal or compliance requirements (max 200 words)">i</span>
                                            </label>
                                            <Tooltip style={styles.toolTip} id="compliance-tooltip" />
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

                                    {/* Output Structure */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="outputStructure" style={styles.label}>
                                                Output Structure
                                                <span style={styles.infoIcon} data-tooltip-id="output-structure-tooltip" data-tooltip-content="Select the desired output structure">i</span>
                                            </label>
                                            <Tooltip style={styles.toolTip} id="output-structure-tooltip" />
                                            <select
                                                id="outputStructure"
                                                name="outputStructure"
                                                value={formData.outputStructure}
                                                onChange={handleChange}
                                                style={styles.select}
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
                                                Creativity Level (optional): {formData.creativityLevel}/10
                                                <span style={styles.infoIcon} data-tooltip-id="creativity-tooltip" data-tooltip-content="Adjust how creative or conservative the output should be">i</span>
                                            </label>
                                            <Tooltip style={styles.toolTip} id="creativity-tooltip" />
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
                                                Reference URL (optional)
                                                <span style={styles.infoIcon} data-tooltip-id="url-tooltip" data-tooltip-content="Add a URL for reference or to extract content from">i</span>
                                            </label>
                                            <Tooltip style={styles.toolTip} id="url-tooltip" />
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
                                    <div style={twoColContainerStyle}>
                                        <div style={colHalfStyle}>
                                            <div style={styles.formGroup}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        name="proofreading"
                                                        checked={formData.proofreading}
                                                        onChange={handleChange}
                                                        style={{ width: '16px', height: '16px' }}
                                                    />
                                                    <span>Enable Proofreading & Optimization (optional)</span>
                                                    <span style={{ ...styles.infoIcon, marginLeft: '8px' }} data-tooltip-id="proofreading-tooltip" data-tooltip-content="Automatically check for grammar, readability, and SEO optimization">i</span>
                                                </label>
                                                <Tooltip style={styles.toolTip} id="proofreading-tooltip" />
                                            </div>
                                        </div>
                                        <div style={colHalfStyle}></div>
                                    </div>

                                    {/* Grammar Strictness (shown when proofreading is enabled) */}
                                    <div style={twoColContainerStyle}>
                                        {/* Emotional Intent (Left Half) */}
                                        <div style={colHalfStyle}>  

                                            {formData.proofreading && (
                                                <>
                                                {/* --- GRAMMAR STRICTNESS MODE TOGGLE - NEW --- */}
                                                {renderModeToggle('grammarStrictnessMode', 'Grammar Strictness', 'Select how strictly grammar and style rules should be applied, or describe custom rules')}

                                                {/* Grammar Strictness (Predefined/Custom Input) */}
                                                {formData.grammarStrictnessMode === 'predefined' && (
                                                    
                                                        <div style={styles.formGroup}>
                                                            {/* <label htmlFor="grammarStrictness" style={styles.label}>
                                                                Select Grammar Strictness
                                                            </label> */}
                                                            <select
                                                                id="grammarStrictness"
                                                                name="grammarStrictness"
                                                                value={formData.grammarStrictness}
                                                                onChange={handleChange}
                                                                style={styles.select}
                                                            >
                                                                {grammarStrictnessOptions.map((opt, index) => (
                                                                    <option key={index} value={opt.value}>{opt.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                )}

                                                {formData.grammarStrictnessMode === 'custom' && (
                                                        <div style={styles.formGroup}>
                                                            {/* <label htmlFor="customGrammarStrictness" style={styles.label}>
                                                                Custom Grammar Strictness
                                                            </label> */}
                                                            <input
                                                                type="text"
                                                                id="customGrammarStrictness"
                                                                name="customGrammarStrictness"
                                                                value={formData.customGrammarStrictness}
                                                                onChange={handleChange}
                                                                style={styles.input}
                                                                placeholder="e.g., Use Oxford comma, avoid passive voice"
                                                                maxLength={120}
                                                            />
                                                        </div>                                            
                                                )}
                                                </>
                                            )}
                                        </div>

                                        {/* Writing Framework (Right Half) */}
                                        <div style={colHalfStyle}></div>
                                    </div>

                                </>
                            )}

                            {/* Submit Button */}
                            <div className="col-12" style={{ marginTop: '20px' }}>
                                <button
                                    type="submit"
                                    // className='personal-info-button'
                                    style={{
                                        ...styles.btn,
                                        ...styles.btnPrimary,
                                        padding: '12px 24px',
                                        fontSize: '16px',
                                        fontWeight: '600'
                                    }}
                                >
                                    Review & Generate
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
                    onViewLog={handleViewLog}
                />
            )}

            {showVariantsModal && (
                <VariantModalContent
                    variants={generatedVariantsData.variants}
                    inputs={generatedVariantsData.inputs}
                    onClose={() => {
                        abortAllStreams();
                        setShowVariantsModal(false);
                        setIsHistoryView(false);
                        setShowSummary(true); // Always return to summary
                    }}
                    onRequestRegenerate={handleRegenerateVariant}
                    showNotification={showNotification}
                    isLoading={isApiLoading}
                    isHistoryView={isHistoryView}
                />
            )}

            {isApiLoading && (
                <SurfingLoading mode={isHistoryView ? "history" : "generate"} />
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