import React, { useCallback, useEffect, useRef, useState } from 'react';
import ToggleButton from '../Form/ToggleButton';
import SummaryReviewModal from './SummaryReviewModal';
import VariantModalContent from './VariantModalContent';
import { getAuthHeader } from '@/utils/auth';

import API from "@/utils/api";
import { useCredits } from "@/components/CreditsContext";

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

const defaultFieldOptions = {
    emailTypes: [
        { id: 1, key: 'newsletter', label: 'Newsletter' },
        { id: 2, key: 'promotional', label: 'Promotional' },
        { id: 3, key: 'transactional', label: 'Transactional' },
        { id: 4, key: 'welcome', label: 'Welcome Series' },
        { id: 5, key: 'cart', label: 'Abandoned Cart' },
        { id: 6, key: 'update', label: 'Product Update' },
        { id: 7, key: 'event', label: 'Event Invitation' },
        { id: 8, key: 'announcement', label: 'Announcement' },
    ],
    subjectLineFocus: [
        { id: 1, key: 'benefit', label: 'Benefit-Oriented' },
        { id: 2, key: 'curiosity', label: 'Curiosity-Driven' },
        { id: 3, key: 'urgency', label: 'Urgency-Based' },
        { id: 4, key: 'question', label: 'Question-Based' },
        { id: 5, key: 'personalized', label: 'Personalized' },
    ],
    emailGoals: [
        { id: 1, key: 'sales', label: 'Drive Sales' },
        { id: 2, key: 'engagement', label: 'Increase Engagement' },
        { id: 3, key: 'educate', label: 'Educate Subscribers' },
        { id: 4, key: 'relationships', label: 'Build Relationships' },
        { id: 5, key: 'event', label: 'Promote Event' },
        { id: 6, key: 'custom', label: 'Custom Goal' },
    ],
    toneStyles: [
        { id: 1, key: 'professional', label: 'Professional' },
        { id: 2, key: 'friendly', label: 'Friendly' },
        { id: 3, key: 'casual', label: 'Casual' },
        { id: 4, key: 'enthusiastic', label: 'Enthusiastic' },
        { id: 5, key: 'urgent', label: 'Urgent' },
    ],
    lengthPreferences: [
        { id: 1, key: 'short', label: 'Short & Concise' },
        { id: 2, key: 'medium', label: 'Medium' },
        { id: 3, key: 'detailed', label: 'Detailed' },
    ],
    ctaTypes: [
        { id: 1, key: 'shop', label: 'Shop Now' },
        { id: 2, key: 'learn', label: 'Learn More' },
        { id: 3, key: 'signup', label: 'Sign Up' },
        { id: 4, key: 'download', label: 'Download' },
        { id: 5, key: 'custom', label: 'Custom' },
    ],
    sendFrequencies: [
        { id: 1, key: 'onetime', label: 'One-time' },
        { id: 2, key: 'daily', label: 'Daily' },
        { id: 3, key: 'weekly', label: 'Weekly' },
        { id: 4, key: 'biweekly', label: 'Bi-weekly' },
        { id: 5, key: 'monthly', label: 'Monthly' },
        { id: 6, key: 'custom', label: 'Custom' },
    ],
};

const EmailNewsletterGenerator = () => {
    const { setTrialRemaining, fetchCredits, setShowGateModal, setGateFromPayload } = useCredits() || {};
    const streamControllersRef = useRef([]);
    const sessionRequestIdRef = useRef(null);
    const [fieldOptions, setFieldOptions] = useState(defaultFieldOptions);
    const [formData, setFormData] = useState({
        emailType: '',
        emailTypeMode: 'predefined',
        emailTypeCustom: '',
        targetAudience: [],
        brandContext: '',
        subjectLineFocus: '',
        subjectLineFocusMode: 'predefined',
        subjectLineFocusCustom: '',
        emailGoal: '',
        emailGoalMode: 'predefined',
        customGoal: '',
        keyMessage: '',
        toneStyle: '',
        toneStyleMode: 'predefined',
        toneStyleCustom: '',
        lengthPreference: 'short',
        lengthPreferenceMode: 'predefined',
        lengthPreferenceCustom: '',
        ctaType: '',
        ctaTypeMode: 'predefined',
        customCta: '',
        variantsCount: 1,
        personalizationTags: [],
        keyHighlights: [],
        socialProof: '',
        complianceNotes: '',
        sendFrequency: '',
        sendFrequencyMode: 'predefined',
        customFrequency: '',
        showAdvanced: false,
    });

    const [audienceInput, setAudienceInput] = useState('');
    const [personalizationInput, setPersonalizationInput] = useState('');
    const [highlightInput, setHighlightInput] = useState('');

    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [mounted, setMounted] = useState(false);

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

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        return () => {
            streamControllersRef.current.forEach((c) => {
                try {
                    c?.abort?.();
                } catch {
                }
            });
            streamControllersRef.current = [];
        };
    }, []);

    useEffect(() => {
        let isActive = true;

        const normalize = (arr) => {
            const list = Array.isArray(arr) ? arr : [];
            return list
                .slice()
                .sort((a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0))
                .map((opt) => ({
                    id: opt?.id ?? opt?.key,
                    key: opt?.key,
                    label: opt?.label,
                }))
                .filter((opt) => opt.key && opt.label);
        };

        const fetchOptions = async () => {
            try {
                const res = await fetch(API.EMAIL_NEWSLETTER_OPTIONS, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': getAuthHeader(),
                    },
                });

                if (!res.ok) {
                    throw new Error(`Options API failed with status: ${res.status}`);
                }

                const json = await res.json();
                const data = json?.data || {};

                const next = {
                    emailTypes: normalize(data.email_type),
                    subjectLineFocus: normalize(data.email_subject_focus),
                    emailGoals: normalize(data.goal_or_purpose),
                    toneStyles: normalize(data.tone_style),
                    lengthPreferences: normalize(data.text_length).filter((opt) => {
                        const key = String(opt?.key || '').toLowerCase();
                        const label = String(opt?.label || '').toLowerCase();
                        return key !== 'auto' && label !== 'auto' && label !== 'auto-detect';
                    }),
                    ctaTypes: normalize(data.call_to_action),
                    sendFrequencies: normalize(data.send_frequency_cadence),
                };

                const hasAny = Object.values(next).some((v) => Array.isArray(v) && v.length > 0);
                if (isActive && hasAny) {
                    setFieldOptions((prev) => ({
                        ...prev,
                        ...next,
                    }));

                    setFormData((prev) => {
                        if (prev.lengthPreferenceMode === 'custom') return prev;
                        const defaultLength = next.lengthPreferences?.[0]?.key || '';
                        const hasCurrent = (next.lengthPreferences || []).some((o) => String(o?.key) === String(prev.lengthPreference));
                        if (hasCurrent) return prev;
                        return { ...prev, lengthPreference: defaultLength };
                    });
                }
            } catch (e) {
                if (isActive) {
                    showNotification('Failed to load dropdown options. Using defaults.', 'error');
                }
            }
        };

        fetchOptions();

        return () => {
            isActive = false;
        };
    }, []);

    const styles = {
        container: {
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '10px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            backgroundColor: '#0a0e1a',
            minHeight: '100vh',
        },
        card: {
            backgroundColor: '#141b2d',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            border: '1px solid #1e293b',
        },
        header: {
            padding: '24px 32px',
        },
        title: {
            margin: 0,
            fontSize: '24px',
            fontWeight: '600',
            color: '#f8fafc',
        },
        subtitle: {
            margin: '6px 0 0',
            fontSize: '15px',
            color: '#94a3b8',
        },
        formGroup: {
            // marginBottom: '20px',
        },
        label: {
            display: 'block',
            marginBottom: '6px',
            fontSize: '16px',
            fontWeight: '500',
            color: '#e2e8f0',
        },
        input: {
            width: '100%',
            padding: '10px 14px',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#e2e8f0',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '6px',
            transition: 'all 0.15s ease-in-out',
            boxSizing: 'border-box',
        },
        select: {
            width: '100%',
            height: '42px',
            padding: '10px 14px',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#e2e8f0',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '6px',
            transition: 'all 0.15s ease-in-out',
            boxSizing: 'border-box',
            appearance: 'none',
            backgroundImage:
                'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
            backgroundSize: '20px',
            paddingRight: '40px',
            cursor: 'pointer',
        },
        rangeInput: {
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            background: '#334155',
            outline: 'none',
        },
        textarea: {
            width: '100%',
            padding: '10px 14px',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#e2e8f0',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '6px',
            transition: 'all 0.15s ease-in-out',
            boxSizing: 'border-box',
            resize: 'vertical',
            minHeight: '80px',
        },
        badge: {
            display: 'inline-flex',
            alignItems: 'center',
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: '500',
            borderRadius: '6px',
            gap: '6px',
        },
        badgePrimary: {
            backgroundColor: '#3b82f6',
            color: 'white',
        },
        btn: {
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease-in-out',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
        },
        btnPrimary: {
            backgroundColor: '#3b82f6',
            color: 'white',
        },
        btnOutline: {
            backgroundColor: 'transparent',
            color: '#94a3b8',
            border: '1px solid #334155',
        },
        infoIcon: {
            display: 'inline-block',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            color: 'white',
            textAlign: 'center',
            lineHeight: '16px',
            fontSize: '11px',
            cursor: 'help',
            marginLeft: '6px',
        },
        removeBtn: {
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
        },
        toast: {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 24px',
            color: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 9999,
        },
        radioGroup: {
            display: 'flex',
            gap: '16px',
            marginTop: '8px',
            marginBottom: '8px',
        },
        radioItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#e2e8f0',
            fontSize: '14px',
        },
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleTagInput = (e, type) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            e.preventDefault();
            const newTag = e.target.value.trim();
            const fieldName =
                type === 'audience'
                    ? 'targetAudience'
                    : type === 'personalization'
                        ? 'personalizationTags'
                        : 'keyHighlights';

            if (!formData[fieldName].includes(newTag)) {
                setFormData((prev) => ({
                    ...prev,
                    [fieldName]: [...prev[fieldName], newTag],
                }));

                if (type === 'audience') setAudienceInput('');
                else if (type === 'personalization') setPersonalizationInput('');
                else setHighlightInput('');
            }
        }
    };

    const removeTag = (tag, type) => {
        const fieldName =
            type === 'audience'
                ? 'targetAudience'
                : type === 'personalization'
                    ? 'personalizationTags'
                    : 'keyHighlights';

        setFormData((prev) => ({
            ...prev,
            [fieldName]: prev[fieldName].filter((t) => t !== tag),
        }));
    };

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const validateForm = () => {
        const missing = [];

        if (!String(formData.emailType || '').trim()) missing.push('Email Type');
        if (!Array.isArray(formData.targetAudience) || formData.targetAudience.length < 1) missing.push('Target Audience');
        if (!String(formData.brandContext || '').trim()) missing.push('Brand Context');
        if (!String(formData.subjectLineFocus || '').trim()) missing.push('Subject Line Focus');

        if (!String(formData.emailGoal || '').trim()) missing.push('Email Goal');
        if (formData.emailGoalMode === 'custom' && !String(formData.customGoal || '').trim()) missing.push('Custom Goal');

        const keyMessageTrimmed = String(formData.keyMessage || '').trim();
        if (!keyMessageTrimmed) missing.push('Key Message');
        if (keyMessageTrimmed && keyMessageTrimmed.length < 20) missing.push('Key Message (min 20 characters)');
        if (!String(formData.toneStyle || '').trim()) missing.push('Tone');
        if (formData.lengthPreferenceMode === 'custom') {
            if (!String(formData.lengthPreferenceCustom || '').trim()) missing.push('Text Length');
        } else {
            const lp = String(formData.lengthPreference || '').trim();
            if (!lp) missing.push('Text Length');
        }

        if (!String(formData.ctaType || '').trim()) missing.push('CTA');
        if (formData.ctaTypeMode === 'custom' && !String(formData.customCta || '').trim()) missing.push('Custom CTA');

        if (!Number.isFinite(Number(formData.variantsCount)) || Number(formData.variantsCount) < 1) missing.push('Number of Variants');

        return missing;
    };

    const buildPayload = () => {
        const buildSelectObject = ({ mode, key, customValue, list }) => {
            if (mode === 'custom') {
                const v = String(customValue || '').trim();
                return { type: 'custom', id: null, value: v || null };
            }

            const k = String(key || '').trim();
            if (!k) return null;
            const opt = (Array.isArray(list) ? list : []).find((o) => String(o?.key) === String(k));
            return {
                type: 'predefined',
                id: opt?.id ?? null,
                value: opt?.label ?? k,
            };
        };

        const textLengthObj = (() => {
            if (formData.lengthPreferenceMode === 'custom') {
                const value = String(formData.lengthPreferenceCustom || formData.lengthPreference || '').trim();
                return { type: 'custom', id: null, value: value || null };
            }

            const selectedKey = String(formData.lengthPreference || '').trim();
            const resolvedKey = selectedKey || fieldOptions.lengthPreferences?.[0]?.key || '';

            const opt = (fieldOptions.lengthPreferences || []).find((o) => String(o?.key) === String(resolvedKey));
            return {
                type: 'predefined',
                id: opt?.id ?? null,
                value: opt?.label ?? resolvedKey,
            };
        })();

        const proofSocial = String(formData.socialProof || '')
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean);

        return {
            email_type: buildSelectObject({
                mode: formData.emailTypeMode,
                key: formData.emailTypeMode === 'predefined' ? formData.emailType : null,
                customValue: formData.emailTypeCustom,
                list: fieldOptions.emailTypes,
            }),
            target_audience: formData.targetAudience,
            sender_brand_context: String(formData.brandContext || '').trim(),
            email_subject_focus: buildSelectObject({
                mode: formData.subjectLineFocusMode,
                key: formData.subjectLineFocusMode === 'predefined' ? formData.subjectLineFocus : null,
                customValue: formData.subjectLineFocusCustom,
                list: fieldOptions.subjectLineFocus,
            }),
            goal_or_purpose:
                formData.emailGoalMode === 'custom'
                    ? { type: 'custom', id: null, value: String(formData.customGoal || '').trim() || null }
                    : buildSelectObject({
                        mode: 'predefined',
                        key: formData.emailGoal,
                        customValue: null,
                        list: fieldOptions.emailGoals,
                    }),
            key_message_offer: String(formData.keyMessage || '').trim(),
            tone_style: buildSelectObject({
                mode: formData.toneStyleMode,
                key: formData.toneStyleMode === 'predefined' ? formData.toneStyle : null,
                customValue: formData.toneStyleCustom,
                list: fieldOptions.toneStyles,
            }),
            text_length: textLengthObj,
            call_to_action:
                formData.ctaTypeMode === 'custom'
                    ? { type: 'custom', id: null, value: String(formData.customCta || '').trim() || null }
                    : buildSelectObject({
                        mode: 'predefined',
                        key: formData.ctaType,
                        customValue: null,
                        list: fieldOptions.ctaTypes,
                    }),
            personalization_tags: formData.personalizationTags,
            key_highlights: formData.keyHighlights,
            proof_social_validation: proofSocial,
            compliance_restrictions: String(formData.complianceNotes || '').trim() || null,
            send_frequency_cadence:
                formData.sendFrequencyMode === 'custom'
                    ? { type: 'custom', id: null, value: String(formData.customFrequency || '').trim() || null }
                    : String(formData.sendFrequency || '').trim()
                        ? buildSelectObject({
                            mode: 'predefined',
                            key: formData.sendFrequency,
                            customValue: null,
                            list: fieldOptions.sendFrequencies,
                        })
                        : null,
            number_of_variants: Number(formData.variantsCount) || 1,
        };
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const missing = validateForm();
        if (missing.length > 0) {
            showNotification(`Please fill all required fields: ${missing.join(', ')}`, 'error');
            return;
        }

        setShowSummary(true);
    };

    const appendVariantDelta = (variantIndex, delta) => {
        setGeneratedVariantsData((prev) => {
            const nextVariants = Array.isArray(prev?.variants) ? [...prev.variants] : [];
            const existing = nextVariants[variantIndex];
            if (!existing) return prev;
            nextVariants[variantIndex] = {
                ...existing,
                content: `${existing?.content || ''}${delta || ''}`,
            };
            return { ...prev, variants: nextVariants };
        });
    };

    const markVariantDone = (variantIndex, errorMessage) => {
        setGeneratedVariantsData((prev) => {
            const nextVariants = Array.isArray(prev?.variants) ? [...prev.variants] : [];
            const existing = nextVariants[variantIndex];
            if (!existing) return prev;
            nextVariants[variantIndex] = {
                ...existing,
                isStreaming: false,
                is_streaming: false,
                error: errorMessage || null,
            };
            return { ...prev, variants: nextVariants };
        });
    };

    const runStreamForVariant = async ({ payload, variantIndex, controller }) => {
        const res = await fetch(API.EMAIL_NEWSLETTER_GENERATE_STREAM, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Authorization': getAuthHeader(),
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        if (!res.ok) {
            let errorData = {};
            try {
                errorData = await res.json();
            } catch {
            }
            if (errorData && isGateError(errorData)) {
                try { showGateFromPayload(errorData); } catch {}
                try { controller?.abort?.(); } catch {}
                try {
                    setIsGenerating(false);
                    setIsApiLoading(false);
                    setShowVariantsModal(false);
                } catch {}
                return;
            }
            throw new Error(errorData?.message || `API call failed with status: ${res.status}`);
        }

        const contentType = res.headers.get('content-type') || '';
        const looksLikeJson = contentType.includes('application/json') && !contentType.includes('text/event-stream');

        if (looksLikeJson || !res.body) {
            const json = await res.json().catch(() => null);
            if (json && isGateError(json)) {
                try { showGateFromPayload(json); } catch {}
                try { controller?.abort?.(); } catch {}
                try {
                    setIsGenerating(false);
                    setIsApiLoading(false);
                    setShowVariantsModal(false);
                } catch {}
                return;
            }
            const content =
                json?.content ||
                json?.email ||
                json?.email_content ||
                json?.data?.content ||
                json?.data?.email ||
                json?.data?.email_content ||
                (typeof json === 'string' ? json : '');
            // Update trial credits if present in non-stream JSON
            try {
                const t = json?.trial_credits_remaining ?? json?.trial_remaining ?? json?.data?.trial_remaining;
                if (t != null && !Number.isNaN(Number(t))) {
                    setTrialRemaining?.(Number(t));
                }
            } catch {}
            if (content) appendVariantDelta(variantIndex, content);
            return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let sawDone = false;

        const setVariantMeta = (meta) => {
            if (!meta) return;
            if (!meta.variant_id && !meta.request_id) return;
            setGeneratedVariantsData((prev) => {
                const next = [...(prev.variants || [])];
                if (next[variantIndex]) {
                    next[variantIndex] = {
                        ...next[variantIndex],
                        id: next[variantIndex].id || meta.variant_id || next[variantIndex].id,
                        request_id: next[variantIndex].request_id || meta.request_id || next[variantIndex].request_id,
                    };
                }
                return { ...prev, variants: next };
            });
        };

        const setVariantFinal = (finalMsg) => {
            setGeneratedVariantsData((prev) => {
                const next = [...(prev.variants || [])];
                if (next[variantIndex]) {
                    next[variantIndex] = {
                        ...next[variantIndex],
                        id: next[variantIndex].id || finalMsg?.variant_id || null,
                        request_id: next[variantIndex].request_id || finalMsg?.request_id || null,
                        content: typeof finalMsg?.content === 'string' ? finalMsg.content : next[variantIndex].content || '',
                        isStreaming: false,
                        is_streaming: false,
                    };
                }
                return { ...prev, variants: next };
            });
        };

        const processJsonMessage = (msg) => {
            if (!msg || typeof msg !== 'object') return;

            if (msg.type === 'meta') {
                setVariantMeta(msg);
                try {
                    if (msg.trial_credits_remaining != null) {
                        const t = Number(msg.trial_credits_remaining);
                        if (!Number.isNaN(t)) setTrialRemaining?.(t);
                    }
                } catch {}
                return;
            }

            if (msg.type === 'delta') {
                const deltaText = msg.content || msg.delta || '';
                if (!deltaText) return;
                appendVariantDelta(variantIndex, deltaText);
                return;
            }

            if (msg.type === 'done') {
                setVariantMeta(msg);
                if (typeof msg.content === 'string' && msg.content.trim()) {
                    // Backend sends full final content on done; set (do not append) to avoid duplication.
                    setVariantFinal(msg);
                }
                sawDone = true;
                return;
            }

            if (msg.type === 'error') {
                if (isGateError(msg)) {
                    try {
                        if (msg.trial_credits_remaining != null) {
                            const t = Number(msg.trial_credits_remaining);
                            if (!Number.isNaN(t)) setTrialRemaining?.(t);
                        }
                    } catch {}
                    try { fetchCredits?.(); } catch {}
                    try { showGateFromPayload(msg); } catch {}
                    try { controller?.abort?.(); } catch {}
                    try {
                        setIsGenerating(false);
                        setIsApiLoading(false);
                        setShowVariantsModal(false);
                    } catch {}
                    return;
                }
                throw new Error(msg.message || 'Stream error');
            }

            if (typeof msg.content === 'string' && msg.content) {
                appendVariantDelta(variantIndex, msg.content);
            }
        };

        const explodeConcatenatedJson = (maybeLine) => {
            // Handles backend sending: {..}{..}{..} without newlines.
            // This is a heuristic but works for the provided example.
            if (!maybeLine.includes('}{')) return [maybeLine];
            return maybeLine.replace(/}\s*{/g, '}\n{').split(/\r?\n/).filter(Boolean);
        };

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

            const pieces = explodeConcatenatedJson(line);
            for (const piece of pieces) {
                let msg;
                try {
                    msg = JSON.parse(piece);
                } catch {
                    buffer = `${piece}\n${buffer}`;
                    continue;
                }
                processJsonMessage(msg);
            }
        };

        const flushBuffer = () => {
            if (!buffer) return;

            // First, normalize concatenated objects into newline-separated chunks.
            const normalized = buffer.includes('}{') ? buffer.replace(/}\s*{/g, '}\n{') : buffer;

            // Prefer newline boundaries when present.
            const parts = normalized.split(/\r?\n/);

            // If there's only one part, we might still have complete JSON objects without newlines.
            if (parts.length === 1) {
                const single = parts[0].trim();
                if (!single) {
                    buffer = '';
                    return;
                }

                const pieces = explodeConcatenatedJson(single);
                if (pieces.length <= 1) {
                    // Leave it in buffer until we get more data (or final flush).
                    buffer = single;
                    return;
                }

                // Process all but the last piece; keep the last in buffer (may be incomplete).
                const tail = pieces.pop() || '';
                pieces.forEach(processLine);
                buffer = tail;
                return;
            }

            // For multiline: process all complete lines, keep last as possible partial.
            const tail = parts.pop() || '';
            parts.forEach(processLine);
            buffer = tail;
        };

        try {
            for (;;) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                flushBuffer();

                if (sawDone) return;
            }

            const final = buffer.trim();
            if (final) {
                buffer = final;
                flushBuffer();
                const leftover = buffer.trim();
                if (leftover) {
                    // last attempt: if it's a complete JSON object, process it
                    try {
                        const msg = JSON.parse(leftover);
                        processJsonMessage(msg);
                        buffer = '';
                    } catch {
                    }
                }
            }

            if (sawDone) return;
        } finally {
            try {
                reader.releaseLock();
            } catch {
            }
        }
    };

    const handleGenerate = async () => {
        const missing = validateForm();
        if (missing.length > 0) {
            showNotification(`Please fill all required fields: ${missing.join(', ')}`, 'error');
            return;
        }

        sessionRequestIdRef.current = createSessionRequestId();

        setShowSummary(false);
        setShowVariantsModal(true);
        try { fetchCredits?.(); } catch {}
        setIsApiLoading(true);
        setIsGenerating(true);

        streamControllersRef.current.forEach((c) => {
            try {
                c?.abort?.();
            } catch {
            }
        });
        streamControllersRef.current = [];

        try {
            const payload = {
                ...buildPayload(),
                session_request_id: sessionRequestIdRef.current,
            };
            const count = Math.max(1, Math.min(5, Number(payload?.number_of_variants) || 1));

            const placeholders = Array.from({ length: count }).map((_, i) => ({
                id: `email-stream-${Date.now()}-${i}`,
                content: '',
                show_variant: true,
                isStreaming: true,
                is_streaming: true,
            }));

            setGeneratedVariantsData({ variants: placeholders, inputs: payload });
            setIsApiLoading(false);

            const streamPromises = Array.from({ length: count }).map((_, variantIndex) => {
                const controller = new AbortController();
                streamControllersRef.current[variantIndex] = controller;

                return runStreamForVariant({ payload, variantIndex, controller })
                    .then(() => {
                        markVariantDone(variantIndex, null);
                        return { ok: true };
                    })
                    .catch((err) => {
                        markVariantDone(variantIndex, err?.message || 'Failed');
                        return { ok: false, error: err };
                    });
            });

            const results = await Promise.all(streamPromises);
            const okCount = results.filter((r) => r?.ok).length;

            if (okCount === 0) {
                throw new Error('All variant streams failed');
            }

            showNotification('Email generated successfully!', 'success');
        } catch (error) {
            console.error('Error generating email:', error);
            showNotification(`Error: ${error.message || 'Failed to generate email'}`, 'error');
            setShowVariantsModal(false);
        } finally {
            setIsApiLoading(false);
            setIsGenerating(false);
            setShowSummary(false);
            try { fetchCredits?.(); } catch {}
        }
    };

    const handleRequestRegenerate = async (variantId) => {
        const payload = generatedVariantsData?.inputs ? { ...generatedVariantsData.inputs } : buildPayload();
        if (!payload.session_request_id) {
            payload.session_request_id = sessionRequestIdRef.current || createSessionRequestId();
        }
        sessionRequestIdRef.current = payload.session_request_id;
        const variants = Array.isArray(generatedVariantsData?.variants) ? generatedVariantsData.variants : [];

        const variantIndex = variants.findIndex((v) => v?.id === variantId);
        if (variantIndex < 0) {
            showNotification('Unable to regenerate: variant not found.', 'error');
            return;
        }

        const controller = new AbortController();
        try {
            const existing = streamControllersRef.current?.[variantIndex];
            try {
                existing?.abort?.();
            } catch {
            }
            streamControllersRef.current[variantIndex] = controller;

            setGeneratedVariantsData((prev) => {
                const next = [...(prev?.variants || [])];
                if (next[variantIndex]) {
                    next[variantIndex] = {
                        ...next[variantIndex],
                        content: '',
                        error: null,
                        isStreaming: true,
                        is_streaming: true,
                        id: null,
                        request_id: null,
                    };
                }
                return { ...prev, variants: next };
            });

            await runStreamForVariant({
                payload: { ...payload, number_of_variants: 1 },
                variantIndex,
                controller,
            });

            markVariantDone(variantIndex, null);
            showNotification('Variant regenerated successfully!', 'success');
        } catch (err) {
            markVariantDone(variantIndex, err?.message || 'Failed');
            showNotification(`Error: ${err?.message || 'Failed to regenerate variant'}`, 'error');
            throw err;
        }
    };

    const handleReset = () => {
        const defaultLengthPreference = fieldOptions.lengthPreferences?.[0]?.key || '';
        setFormData({
            emailType: '',
            emailTypeMode: 'predefined',
            emailTypeCustom: '',
            targetAudience: [],
            brandContext: '',
            subjectLineFocus: '',
            subjectLineFocusMode: 'predefined',
            subjectLineFocusCustom: '',
            emailGoal: '',
            emailGoalMode: 'predefined',
            customGoal: '',
            keyMessage: '',
            toneStyle: '',
            toneStyleMode: 'predefined',
            toneStyleCustom: '',
            lengthPreference: defaultLengthPreference,
            lengthPreferenceMode: 'predefined',
            lengthPreferenceCustom: '',
            ctaType: '',
            ctaTypeMode: 'predefined',
            customCta: '',
            variantsCount: 1,
            personalizationTags: [],
            keyHighlights: [],
            socialProof: '',
            complianceNotes: '',
            sendFrequency: '',
            sendFrequencyMode: 'predefined',
            customFrequency: '',
            showAdvanced: false,
        });
        setAudienceInput('');
        setPersonalizationInput('');
        setHighlightInput('');
        setShowSummary(false);
        setShowVariantsModal(false);
        setGeneratedVariantsData({ variants: [], inputs: {} });
        showNotification('Form has been reset', 'info');
    };

    const toggleAdvanced = () => {
        setFormData((prev) => ({
            ...prev,
            showAdvanced: !prev.showAdvanced,
        }));
    };

    const handleCloseVariantsModal = () => {
        streamControllersRef.current.forEach((c) => {
            try {
                c?.abort?.();
            } catch {
            }
        });
        streamControllersRef.current = [];
        setShowVariantsModal(false);
        setIsApiLoading(false);
        setIsGenerating(false);
    };

    if (!mounted) return null;

    return (
        <div style={styles.container}>
            {notification.show && (
                <div
                    style={{
                        ...styles.toast,
                        backgroundColor: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
                        borderColor: notification.type === 'error' ? '#fecaca' : '#bbf7d0',
                        color: notification.type === 'error' ? '#b91c1c' : '#166534',
                    }}
                >
                    {notification.message}
                    <button
                        onClick={() => setNotification({ ...notification, show: false })}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'inherit',
                            marginLeft: '10px',
                            cursor: 'pointer',
                            fontSize: '18px',
                        }}
                    >
                        &times;
                    </button>
                </div>
            )}

            <div style={styles.header}>
                <h1 style={styles.title}>Email / Newsletter Generator</h1>
                <p style={styles.subtitle}>Create engaging email content for your campaigns</p>
            </div>

            <div style={styles.card}>
                <div style={{ padding: '24px' }}>
                    <form onSubmit={handleSubmit}>
                        <div className="row g-4">

                            {!formData.showAdvanced && (
                                <>
                                    <div className="col-md-6">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="emailType" style={styles.label}>
                                                Email Type / Use Case <span style={{ color: '#ef4444' }}>*</span>
                                                <span
                                                    style={styles.infoIcon}
                                                    title="Select the type of email you want to generate (e.g., Newsletter, Promotional, Welcome Series)"
                                                >
                                                    i
                                                </span>
                                            </label>

                                            <div style={styles.radioGroup}>
                                                <label style={styles.radioItem}>
                                                    <input
                                                        type="radio"
                                                        name="emailTypeMode"
                                                        value="predefined"
                                                        checked={formData.emailTypeMode === 'predefined'}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                emailTypeMode: e.target.value,
                                                                emailType: prev.emailType || '',
                                                            }));
                                                        }}
                                                    />
                                                    <span>Predefined</span>
                                                </label>
                                                <label style={styles.radioItem}>
                                                    <input
                                                        type="radio"
                                                        name="emailTypeMode"
                                                        value="custom"
                                                        checked={formData.emailTypeMode === 'custom'}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                emailTypeMode: e.target.value,
                                                                emailType: prev.emailTypeCustom || '',
                                                            }));
                                                        }}
                                                    />
                                                    <span>Custom</span>
                                                </label>
                                            </div>

                                            {formData.emailTypeMode === 'predefined' && (
                                                <select
                                                    style={styles.select}
                                                    id="emailType"
                                                    name="emailType"
                                                    value={formData.emailType}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="">Select email type</option>
                                                    {fieldOptions.emailTypes.map((option) => (
                                                        <option key={option.key} value={option.key}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            {formData.emailTypeMode === 'custom' && (
                                                <input
                                                    type="text"
                                                    style={styles.input}
                                                    name="emailTypeCustom"
                                                    value={formData.emailTypeCustom}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            emailTypeCustom: val,
                                                            emailType: val,
                                                        }));
                                                    }}
                                                    placeholder="Enter custom email type"
                                                    required
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="subjectLineFocus" style={styles.label}>
                                                Email Subject Line Focus <span style={{ color: '#ef4444' }}>*</span>
                                                <span style={styles.infoIcon} title="Choose the approach for your email subject line">
                                                    i
                                                </span>
                                            </label>

                                            <div style={styles.radioGroup}>
                                                <label style={styles.radioItem}>
                                                    <input
                                                        type="radio"
                                                        name="subjectLineFocusMode"
                                                        value="predefined"
                                                        checked={formData.subjectLineFocusMode === 'predefined'}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                subjectLineFocusMode: e.target.value,
                                                            }));
                                                        }}
                                                    />
                                                    <span>Predefined</span>
                                                </label>
                                                <label style={styles.radioItem}>
                                                    <input
                                                        type="radio"
                                                        name="subjectLineFocusMode"
                                                        value="custom"
                                                        checked={formData.subjectLineFocusMode === 'custom'}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                subjectLineFocusMode: e.target.value,
                                                                subjectLineFocus: prev.subjectLineFocusCustom || '',
                                                            }));
                                                        }}
                                                    />
                                                    <span>Custom</span>
                                                </label>
                                            </div>

                                            {formData.subjectLineFocusMode === 'predefined' && (
                                                <select
                                                    style={styles.select}
                                                    id="subjectLineFocus"
                                                    name="subjectLineFocus"
                                                    value={formData.subjectLineFocus}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="">Select subject line focus</option>
                                                    {fieldOptions.subjectLineFocus.map((option) => (
                                                        <option key={option.key} value={option.key}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            {formData.subjectLineFocusMode === 'custom' && (
                                                <input
                                                    type="text"
                                                    style={styles.input}
                                                    name="subjectLineFocusCustom"
                                                    value={formData.subjectLineFocusCustom}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            subjectLineFocusCustom: val,
                                                            subjectLineFocus: val,
                                                        }));
                                                    }}
                                                    placeholder="Enter custom subject line focus"
                                                    required
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>
                                                Target Audience / Recipient Type <span style={{ color: '#ef4444' }}>*</span>
                                                <span
                                                    style={styles.infoIcon}
                                                    title="Define who will receive this email (e.g., Marketing Managers, E-commerce Shoppers)"
                                                >
                                                    i
                                                </span>
                                            </label>

                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: '8px',
                                                    marginBottom: '8px',
                                                    minHeight: '40px',
                                                    alignItems: 'center',
                                                    padding: '4px',
                                                    border: '1px solid #334155',
                                                    borderRadius: '6px',
                                                    backgroundColor: '#FFFFFF',
                                                }}
                                            >
                                                {formData.targetAudience.length === 0 && (
                                                    <span style={{ color: '#9ca3af', fontSize: '14px', marginLeft: '8px' }}>
                                                        Type and press Enter to add audience segments
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
                                                            padding: '4px 10px',
                                                        }}
                                                    >
                                                        {chip}
                                                        <button
                                                            type="button"
                                                            style={styles.removeBtn}
                                                            onClick={() => removeTag(chip, 'audience')}
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>

                                            <input
                                                type="text"
                                                style={styles.input}
                                                id="audienceInput"
                                                value={audienceInput}
                                                onChange={(e) => setAudienceInput(e.target.value)}
                                                onKeyDown={(e) => handleTagInput(e, 'audience')}
                                                placeholder="Type and press Enter to add audience segments"
                                                required={formData.targetAudience.length === 0}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-12">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="brandContext" style={styles.label}>
                                                Sender / Brand Context <span style={{ color: '#ef4444' }}>*</span>
                                                <span style={styles.infoIcon} title="Your company or brand name and brief context">
                                                    i
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                id="brandContext"
                                                name="brandContext"
                                                value={formData.brandContext}
                                                onChange={handleInputChange}
                                                placeholder="Your company/brand name and context"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="emailGoal" style={styles.label}>
                                                Goal or Purpose of Email <span style={{ color: '#ef4444' }}>*</span>
                                                <span style={styles.infoIcon} title="What do you want to achieve with this email?">
                                                    i
                                                </span>
                                            </label>

                                            <div style={styles.radioGroup}>
                                                <label style={styles.radioItem}>
                                                    <input
                                                        type="radio"
                                                        name="emailGoalMode"
                                                        value="predefined"
                                                        checked={formData.emailGoalMode === 'predefined'}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                emailGoalMode: e.target.value,
                                                            }));
                                                        }}
                                                    />
                                                    <span>Predefined</span>
                                                </label>
                                                <label style={styles.radioItem}>
                                                    <input
                                                        type="radio"
                                                        name="emailGoalMode"
                                                        value="custom"
                                                        checked={formData.emailGoalMode === 'custom'}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                emailGoalMode: e.target.value,
                                                                emailGoal: 'Custom Goal',
                                                            }));
                                                        }}
                                                    />
                                                    <span>Custom</span>
                                                </label>
                                            </div>

                                            {formData.emailGoalMode === 'predefined' && (
                                                <select
                                                    style={styles.select}
                                                    id="emailGoal"
                                                    name="emailGoal"
                                                    value={formData.emailGoal}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="">Select email goal</option>
                                                    {fieldOptions.emailGoals.map((option) => (
                                                        <option key={option.key} value={option.key}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            {formData.emailGoalMode === 'custom' && (
                                                <input
                                                    type="text"
                                                    style={styles.input}
                                                    name="customGoal"
                                                    value={formData.customGoal}
                                                    onChange={handleInputChange}
                                                    placeholder="Specify custom goal"
                                                    required
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="toneStyle" style={styles.label}>
                                                Tone or Style <span style={{ color: '#ef4444' }}>*</span>
                                                <span style={styles.infoIcon} title="Select the tone or style for your email content">
                                                    i
                                                </span>
                                            </label>

                                            <div style={styles.radioGroup}>
                                                <label style={styles.radioItem}>
                                                    <input
                                                        type="radio"
                                                        name="toneStyleMode"
                                                        value="predefined"
                                                        checked={formData.toneStyleMode === 'predefined'}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                toneStyleMode: e.target.value,
                                                            }));
                                                        }}
                                                    />
                                                    <span>Predefined</span>
                                                </label>
                                                <label style={styles.radioItem}>
                                                    <input
                                                        type="radio"
                                                        name="toneStyleMode"
                                                        value="custom"
                                                        checked={formData.toneStyleMode === 'custom'}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                toneStyleMode: e.target.value,
                                                                toneStyle: prev.toneStyleCustom || '',
                                                            }));
                                                        }}
                                                    />
                                                    <span>Custom</span>
                                                </label>
                                            </div>

                                            {formData.toneStyleMode === 'predefined' && (
                                                <select
                                                    style={styles.select}
                                                    id="toneStyle"
                                                    name="toneStyle"
                                                    value={formData.toneStyle}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="">Select tone or style</option>
                                                    {fieldOptions.toneStyles.map((option) => (
                                                        <option key={option.key} value={option.key}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            {formData.toneStyleMode === 'custom' && (
                                                <input
                                                    type="text"
                                                    style={styles.input}
                                                    name="toneStyleCustom"
                                                    value={formData.toneStyleCustom}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            toneStyleCustom: val,
                                                            toneStyle: val,
                                                        }));
                                                    }}
                                                    placeholder="Enter custom tone or style"
                                                    required
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="keyMessage" style={styles.label}>
                                                Key Message / Offer <span style={{ color: '#ef4444' }}>*</span>
                                                <span style={styles.infoIcon} title="The main message or offer you want to communicate in your email">
                                                    i
                                                </span>
                                            </label>
                                            <textarea
                                                style={{ ...styles.textarea, minHeight: '100px' }}
                                                id="keyMessage"
                                                name="keyMessage"
                                                value={formData.keyMessage}
                                                onChange={handleInputChange}
                                                placeholder="Describe the main message or offer of your email"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="lengthPreference" style={styles.label}>
                                                Length Preference <span style={{ color: '#ef4444' }}>*</span>
                                                <span style={styles.infoIcon} title="Choose the desired length for your email content">
                                                    i
                                                </span>
                                            </label>

                                            <div style={styles.radioGroup}>
                                                <label style={styles.radioItem}>
                                                    <input
                                                        type="radio"
                                                        name="lengthPreferenceMode"
                                                        value="predefined"
                                                        checked={formData.lengthPreferenceMode === 'predefined'}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                lengthPreferenceMode: e.target.value,
                                                            }));
                                                        }}
                                                    />
                                                    <span>Predefined</span>
                                                </label>
                                                <label style={styles.radioItem}>
                                                    <input
                                                        type="radio"
                                                        name="lengthPreferenceMode"
                                                        value="custom"
                                                        checked={formData.lengthPreferenceMode === 'custom'}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                lengthPreferenceMode: e.target.value,
                                                                lengthPreference: prev.lengthPreferenceCustom || '',
                                                            }));
                                                        }}
                                                    />
                                                    <span>Custom</span>
                                                </label>
                                            </div>

                                            {formData.lengthPreferenceMode === 'predefined' && (
                                                <select
                                                    style={styles.select}
                                                    id="lengthPreference"
                                                    name="lengthPreference"
                                                    value={formData.lengthPreference}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    {fieldOptions.lengthPreferences.map((option) => (
                                                        <option key={option.key} value={option.key}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            {formData.lengthPreferenceMode === 'custom' && (
                                                <input
                                                    type="number"
                                                    inputMode="numeric"
                                                    min={1}
                                                    max={1000}
                                                    step={1}
                                                    style={styles.input}
                                                    name="lengthPreferenceCustom"
                                                    value={formData.lengthPreferenceCustom}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === '') {
                                                        setFormData((prev) => ({ ...prev, lengthPreferenceCustom: '' }));
                                                        return;
                                                    }
                                                    const parsed = parseInt(val, 10);
                                                    const clamped = Number.isFinite(parsed)
                                                        ? Math.min(1000, Math.max(1, parsed))
                                                        : '';
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            lengthPreferenceCustom:clamped === '' ? '' : String(clamped),
                                                            lengthPreference: val,
                                                        }));
                                                    }}
                                                    placeholder="Enter custom length preference max upto 1000"
                                                    required
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="ctaType" style={styles.label}>
                                                Call to Action (CTA) <span style={{ color: '#ef4444' }}>*</span>
                                                <span style={styles.infoIcon} title="Select or specify the call-to-action for your email">
                                                    i
                                                </span>
                                            </label>

                                            <div style={styles.radioGroup}>
                                                <label style={styles.radioItem}>
                                                    <input
                                                        type="radio"
                                                        name="ctaTypeMode"
                                                        value="predefined"
                                                        checked={formData.ctaTypeMode === 'predefined'}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                ctaTypeMode: e.target.value,
                                                            }));
                                                        }}
                                                    />
                                                    <span>Predefined</span>
                                                </label>
                                                <label style={styles.radioItem}>
                                                    <input
                                                        type="radio"
                                                        name="ctaTypeMode"
                                                        value="custom"
                                                        checked={formData.ctaTypeMode === 'custom'}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                ctaTypeMode: e.target.value,
                                                                ctaType: 'Custom',
                                                            }));
                                                        }}
                                                    />
                                                    <span>Custom</span>
                                                </label>
                                            </div>

                                            {formData.ctaTypeMode === 'predefined' && (
                                                <select
                                                    style={styles.select}
                                                    id="ctaType"
                                                    name="ctaType"
                                                    value={formData.ctaType}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="">Select CTA type</option>
                                                    {fieldOptions.ctaTypes.map((option) => (
                                                        <option key={option.key} value={option.key}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            {formData.ctaTypeMode === 'custom' && (
                                                <input
                                                    type="text"
                                                    style={styles.input}
                                                    name="customCta"
                                                    value={formData.customCta}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter custom CTA text"
                                                    required
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="variantsCount" style={styles.label}>
                                                Number of Variants: {formData.variantsCount}
                                                <span style={styles.infoIcon} title="How many different email variations would you like to generate?">
                                                    i
                                                </span>
                                            </label>
                                            <input
                                                type="range"
                                                id="variantsCount"
                                                name="variantsCount"
                                                min="1"
                                                max="5"
                                                value={formData.variantsCount}
                                                onChange={(e) => {
                                                    const raw = Number(e.target.value);
                                                    const clamped = Math.max(1, Math.min(5, Number.isFinite(raw) ? raw : 1));
                                                    setFormData((prev) => ({ ...prev, variantsCount: clamped }));
                                                }}
                                                style={styles.rangeInput}
                                                disabled={isGenerating || isApiLoading}
                                            />
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    fontSize: '12px',
                                                    color: '#94a3b8',
                                                    marginTop: '4px',
                                                }}
                                            >
                                                <span>1</span>
                                                <span>2</span>
                                                <span>3</span>
                                                <span>4</span>
                                                <span>5</span>
                                            </div>
                                        </div>
                                    </div>

                                </>)}

                            <hr style={{ width: '100%', border: 'none', borderTop: '1px solid #1e293b', margin: '5px 0' }} />

                            <div className="col-12" style={{ margin: '16px 0' }}>
                                <ToggleButton showAdvanced={formData.showAdvanced} onToggle={toggleAdvanced} />
                            </div>

                            {formData.showAdvanced && (
                                <>
                                    <div className="col-md-6">
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>
                                                Personalization Tags (Optional)
                                                <span style={styles.infoIcon} title="Add personalization tokens like {first_name}, {company}">
                                                    i
                                                </span>
                                            </label>

                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: '8px',
                                                    marginBottom: '8px',
                                                    minHeight: '40px',
                                                    alignItems: 'center',
                                                    padding: '4px',
                                                    border: '1px solid #334155',
                                                    borderRadius: '6px',
                                                    backgroundColor: '#ffffff',
                                                }}
                                            >
                                                {formData.personalizationTags.length === 0 && (
                                                    <span style={{ color: '#9ca3af', fontSize: '14px', marginLeft: '8px' }}>
                                                        Type and press Enter to add personalization tags
                                                    </span>
                                                )}
                                                {formData.personalizationTags.map((tag, index) => (
                                                    <span
                                                        key={index}
                                                        style={{
                                                            ...styles.badge,
                                                            ...styles.badgePrimary,
                                                        }}
                                                    >
                                                        {tag}
                                                        <button
                                                            type="button"
                                                            style={styles.removeBtn}
                                                            onClick={() => removeTag(tag, 'personalization')}
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>

                                            <input
                                                type="text"
                                                style={styles.input}
                                                value={personalizationInput}
                                                onChange={(e) => setPersonalizationInput(e.target.value)}
                                                onKeyDown={(e) => handleTagInput(e, 'personalization')}
                                                placeholder="Add personalization tags (e.g., {first_name}, {company})"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>
                                                Key Highlights / Bullet Points (Optional)
                                                <span style={styles.infoIcon} title="Add key points to highlight in your email">
                                                    i
                                                </span>
                                            </label>

                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: '8px',
                                                    marginBottom: '8px',
                                                    minHeight: '40px',
                                                    alignItems: 'center',
                                                    padding: '4px',
                                                    border: '1px solid #334155',
                                                    borderRadius: '6px',
                                                    backgroundColor: '#ffffff',
                                                }}
                                            >
                                                {formData.keyHighlights.length === 0 && (
                                                    <span style={{ color: '#9ca3af', fontSize: '14px', marginLeft: '8px' }}>
                                                        Type and press Enter to add key highlights
                                                    </span>
                                                )}
                                                {formData.keyHighlights.map((highlight, index) => (
                                                    <span
                                                        key={index}
                                                        style={{
                                                            ...styles.badge,
                                                            ...styles.badgePrimary,
                                                        }}
                                                    >
                                                        {highlight}
                                                        <button
                                                            type="button"
                                                            style={styles.removeBtn}
                                                            onClick={() => removeTag(highlight, 'highlight')}
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>

                                            <input
                                                type="text"
                                                style={styles.input}
                                                value={highlightInput}
                                                onChange={(e) => setHighlightInput(e.target.value)}
                                                onKeyDown={(e) => handleTagInput(e, 'highlight')}
                                                placeholder="Add key points to highlight"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="socialProof" style={styles.label}>
                                                Social Proof / Testimonials (Optional)
                                                <span style={styles.infoIcon} title="Add testimonials or social proof to include in your email">
                                                    i
                                                </span>
                                            </label>
                                            <textarea
                                                style={styles.textarea}
                                                id="socialProof"
                                                name="socialProof"
                                                value={formData.socialProof}
                                                onChange={handleInputChange}
                                                placeholder="Add social proof or testimonials to include"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="complianceNotes" style={styles.label}>
                                                Compliance / Restrictions (Optional)
                                                <span style={styles.infoIcon} title="Any compliance requirements or restrictions to consider">
                                                    i
                                                </span>
                                            </label>
                                            <textarea
                                                style={styles.textarea}
                                                id="complianceNotes"
                                                name="complianceNotes"
                                                value={formData.complianceNotes}
                                                onChange={handleInputChange}
                                                placeholder="Any compliance requirements or restrictions to consider"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="sendFrequency" style={styles.label}>
                                                Send Frequency / Cadence (Optional)
                                                <span style={styles.infoIcon} title="How often will this email be sent?">
                                                    i
                                                </span>
                                            </label>

                                            <div style={styles.radioGroup}>
                                                <label style={styles.radioItem}>
                                                    <input
                                                        type="radio"
                                                        name="sendFrequencyMode"
                                                        value="predefined"
                                                        checked={formData.sendFrequencyMode === 'predefined'}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                sendFrequencyMode: e.target.value,
                                                            }));
                                                        }}
                                                    />
                                                    <span>Predefined</span>
                                                </label>
                                                <label style={styles.radioItem}>
                                                    <input
                                                        type="radio"
                                                        name="sendFrequencyMode"
                                                        value="custom"
                                                        checked={formData.sendFrequencyMode === 'custom'}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                sendFrequencyMode: e.target.value,
                                                                sendFrequency: 'Custom',
                                                            }));
                                                        }}
                                                    />
                                                    <span>Custom</span>
                                                </label>
                                            </div>

                                            {formData.sendFrequencyMode === 'predefined' && (
                                                <select
                                                    style={styles.select}
                                                    id="sendFrequency"
                                                    name="sendFrequency"
                                                    value={formData.sendFrequency}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="">Select send frequency</option>
                                                    {fieldOptions.sendFrequencies.map((option) => (
                                                        <option key={option.key} value={option.key}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            {formData.sendFrequencyMode === 'custom' && (
                                                <input
                                                    type="text"
                                                    style={styles.input}
                                                    name="customFrequency"
                                                    value={formData.customFrequency}
                                                    onChange={handleInputChange}
                                                    placeholder="Specify custom frequency"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

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
                                        Review & Generate
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {showSummary && (
                <SummaryReviewModal
                    formData={formData}
                    fieldOptions={fieldOptions}
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
                    showNotification={showNotification}
                    isLoading={isApiLoading}
                    isHistoryView={false}
                />
            )}

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default EmailNewsletterGenerator;
