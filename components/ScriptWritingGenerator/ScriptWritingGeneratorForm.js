import React, { useEffect, useMemo, useState } from 'react';

// API Configuration
const BASE_URL = 'https://olive-gull-905765.hostingersite.com/public/api/v1';
const API = {
    GENERATE_SCRIPT: `${BASE_URL}/script/generate`,
    AUTH_TOKEN: '3|WwYYaSEAfSr1guYBFdPQlPtGg0dKphy1sVMDLBmX647db358',
};

const AUTH_HEADER = `Bearer ${API.AUTH_TOKEN}`;

// Default field options
const defaultFieldOptions = {
    platforms: [
        { id: 1, key: 'tiktok', label: 'TikTok' },
        { id: 2, key: 'reels', label: 'Reels' },
        { id: 3, key: 'shorts', label: 'Shorts' },
        { id: 4, key: 'youtube', label: 'YouTube' },
        { id: 5, key: 'podcast', label: 'Podcast' },
        { id: 6, key: 'video_ad', label: 'Video Ad' },
    ],
    goals: [
        { id: 1, key: 'awareness', label: 'Awareness' },
        { id: 2, key: 'educate', label: 'Educate' },
        { id: 3, key: 'entertain', label: 'Entertain' },
        { id: 4, key: 'lead_gen', label: 'Lead Generation' },
        { id: 5, key: 'sales', label: 'Sales / Conversions' },
        { id: 6, key: 'community', label: 'Community / Engagement' },
    ],
    tones: [
        { id: 1, key: 'professional', label: 'Professional' },
        { id: 2, key: 'friendly', label: 'Friendly' },
        { id: 3, key: 'energetic', label: 'Energetic' },
        { id: 4, key: 'humorous', label: 'Humorous' },
        { id: 5, key: 'dramatic', label: 'Dramatic' },
        { id: 6, key: 'inspiring', label: 'Inspiring' },
    ],
    scriptStyles: [
        { id: 1, key: 'conversational', label: 'Conversational' },
        { id: 2, key: 'storytelling', label: 'Storytelling' },
        { id: 3, key: 'tutorial', label: 'Tutorial / How-To' },
        { id: 4, key: 'listicle', label: 'Listicle' },
        { id: 5, key: 'ad', label: 'Direct Response / Ad' },
        { id: 6, key: 'interview', label: 'Interview' },
    ],
    hookStyles: [
        { id: 1, key: 'question', label: 'Question' },
        { id: 2, key: 'shock', label: 'Shocking statement / stat' },
        { id: 3, key: 'story', label: 'Quick story' },
        { id: 4, key: 'promise', label: 'Big promise' },
        { id: 5, key: 'contrarian', label: 'Contrarian take' },
    ],
    ctaTypes: [
        { id: 1, key: 'like_follow', label: 'Like / Follow' },
        { id: 2, key: 'subscribe', label: 'Subscribe' },
        { id: 3, key: 'comment', label: 'Comment' },
        { id: 4, key: 'visit', label: 'Visit Website' },
        { id: 5, key: 'download', label: 'Download' },
        { id: 6, key: 'buy', label: 'Buy Now' },
    ],
    narrationStyles: [
        { id: 1, key: 'first_person', label: 'First Person (I/We)' },
        { id: 2, key: 'second_person', label: 'Second Person (You)' },
        { id: 3, key: 'third_person', label: 'Third Person (They/He/She)' },
        { id: 4, key: 'voiceover', label: 'Voiceover' },
        { id: 5, key: 'dialogue', label: 'Dialogue' },
    ],
    outputFormats: [
        { id: 1, key: 'plain_text', label: 'Plain Text (.txt)' },
        { id: 2, key: 'html', label: 'HTML Export (.html)' },
    ],
    structureDepths: [
        { id: 1, key: 'basic', label: 'Basic' },
        { id: 2, key: 'standard', label: 'Standard' },
        { id: 3, key: 'detailed', label: 'Detailed' },
    ],
    visualTones: [
        { id: 1, key: 'bright', label: 'Bright & Energetic' },
        { id: 2, key: 'cinematic', label: 'Cinematic' },
        { id: 3, key: 'moody', label: 'Moody' },
        { id: 4, key: 'minimal', label: 'Minimal' },
        { id: 5, key: 'colorful', label: 'Colorful' },
    ],
    languages: [
        { id: 1, key: 'en', label: 'English' },
        { id: 2, key: 'hi', label: 'Hindi' },
        { id: 3, key: 'es', label: 'Spanish' },
        { id: 4, key: 'fr', label: 'French' },
        { id: 5, key: 'de', label: 'German' },
    ],
};

const ScriptWritingGeneratorForm = () => {
    const [formData, setFormData] = useState({
        scriptTitle: '',

        platform: '',
        platformMode: 'predefined',
        platformCustom: '',

        goal: '',
        goalMode: 'predefined',
        goalCustom: '',

        targetAudience: [],

        tone: '',
        toneMode: 'predefined',
        toneCustom: '',

        durationSeconds: 60,
        durationPresetSeconds: null,

        scriptStyle: '',
        scriptStyleMode: 'predefined',
        scriptStyleCustom: '',

        includeHook: true,
        hookStyle: '',
        hookStyleCustomPattern: '',

        includeCta: true,
        ctaType: '',
        ctaTypeMode: 'predefined',
        ctaTypeCustom: '',

        narrationStyle: '',
        narrationStyleMode: 'predefined',
        narrationStyleCustom: '',

        outputFormat: 'plain_text',

        structureDepth: 'standard',

        visualTone: '',
        visualToneMode: 'predefined',
        visualToneCustom: '',

        complianceMode: '',

        language: 'en',
        languageMode: 'predefined',
        languageCustom: '',

        customInstructions: '',
    });

    const [audienceInput, setAudienceInput] = useState('');
    const [customDurationInput, setCustomDurationInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const styles = {
        container: { 
            maxWidth: '1100px', 
            margin: '0 auto', 
            padding: '24px', 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 
            backgroundColor: '#0a0e1a', 
            minHeight: '100vh' 
        },
        card: { 
            backgroundColor: '#141b2d', 
            borderRadius: '12px', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)', 
            overflow: 'hidden', 
            border: '1px solid #1e293b' 
        },
        header: { 
            padding: '24px 32px', 
            borderBottom: '1px solid #1e293b', 
        },
        title: { 
            margin: 0, 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#f8fafc' 
        },
        subtitle: { 
            margin: '6px 0 0', 
            fontSize: '14px', 
            color: '#94a3b8' 
        },
        formGroup: { 
            marginBottom: '20px' 
        },
        label: { 
            display: 'block', 
            marginBottom: '6px', 
            fontSize: '16px', 
            fontWeight: '500', 
            color: '#e2e8f0' 
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
            boxSizing: 'border-box' 
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
            backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', 
            backgroundRepeat: 'no-repeat', 
            backgroundPosition: 'right 10px center', 
            backgroundSize: '20px', 
            paddingRight: '40px', 
            cursor: 'pointer' 
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
            minHeight: '80px' 
        },
        badge: { 
            display: 'inline-flex', 
            alignItems: 'center', 
            padding: '6px 12px', 
            fontSize: '13px', 
            fontWeight: '500', 
            borderRadius: '6px', 
            gap: '6px' 
        },
        badgePrimary: { 
            backgroundColor: '#3b82f6', 
            color: 'white' 
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
            gap: '8px' 
        },
        btnPrimary: {
            backgroundColor: '#3b82f6',
            color: 'white',
        },
        btnOutline: { 
            backgroundColor: 'transparent', 
            color: '#94a3b8', 
            border: '1px solid #334155' 
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
            marginLeft: '6px' 
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
            padding: 0 
        },
        toast: { 
            position: 'fixed', 
            top: '20px', 
            right: '20px', 
            padding: '16px 24px', 
            color: 'white', 
            borderRadius: '8px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
            zIndex: 9999 
        },
        toolTip: { 
            width: '40%' 
        },
        radioGroup: { 
            display: 'flex', 
            gap: '16px', 
            marginTop: '8px',
            marginBottom: '8px'
        },
        radioItem: { 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            color: '#e2e8f0',
            fontSize: '14px'
        },
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleTagInput = (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            e.preventDefault();
            const newTag = e.target.value.trim();
            if (!formData.targetAudience.includes(newTag)) {
                setFormData(prev => ({
                    ...prev,
                    targetAudience: [...prev.targetAudience, newTag]
                }));
            }
            setAudienceInput('');
        }
    };

    const removeTag = (tag) => {
        setFormData(prev => ({
            ...prev,
            targetAudience: prev.targetAudience.filter(t => t !== tag)
        }));
    };

    const formatDuration = (seconds) => {
        if (!seconds && seconds !== 0) return '';
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remaining = seconds % 60;
        if (remaining === 0) return `${minutes}m`;
        return `${minutes}m ${remaining}s`;
    };

    const estimateWords = (seconds) => {
        const wordsPerMinute = 150;
        return Math.max(1, Math.round((seconds / 60) * wordsPerMinute));
    };

    const durationPresets = useMemo(() => {
        const key = formData.platformMode === 'custom' ? 'custom' : formData.platform;
        if (key === 'youtube') return [120, 180, 300, 420, 600, 900];
        if (key === 'podcast') return [300, 600, 900, 1200, 1800];
        if (key === 'video_ad') return [15, 30, 45, 60, 90];
        if (key === 'tiktok' || key === 'reels' || key === 'shorts') return [15, 30, 45, 60, 90];
        return [15, 30, 45, 60, 90];
    }, [formData.platform, formData.platformMode]);

    const sliderSnap = (rawSeconds) => {
        const seconds = Math.max(15, Math.min(1800, rawSeconds));
        const step = seconds <= 90 ? 5 : seconds <= 300 ? 15 : 30;
        return Math.round(seconds / step) * step;
    };

    const handleDurationSliderChange = (e) => {
        const raw = Number(e.target.value);
        const snapped = sliderSnap(raw);
        setFormData(prev => ({
            ...prev,
            durationSeconds: snapped,
            durationPresetSeconds: null,
        }));
    };

    const handleDurationPresetClick = (seconds) => {
        setFormData(prev => ({
            ...prev,
            durationSeconds: seconds,
            durationPresetSeconds: seconds,
        }));
    };

    const parseDurationToSeconds = (input) => {
        const value = (input || '').trim().toLowerCase();
        if (!value) return null;

        const compact = value.replace(/\s+/g, '');
        const mmss = compact.match(/^(\d+):(\d{1,2})$/);
        if (mmss) {
            const m = Number(mmss[1]);
            const s = Number(mmss[2]);
            if (Number.isFinite(m) && Number.isFinite(s)) return (m * 60) + s;
        }

        const minutesMatch = compact.match(/^(\d+)m$/);
        if (minutesMatch) return Number(minutesMatch[1]) * 60;

        const secondsMatch = compact.match(/^(\d+)s$/);
        if (secondsMatch) return Number(secondsMatch[1]);

        const plain = compact.match(/^(\d+)$/);
        if (plain) return Number(plain[1]);

        const mixed = compact.match(/^(\d+)m(\d+)s$/);
        if (mixed) return (Number(mixed[1]) * 60) + Number(mixed[2]);

        return null;
    };

    const applyCustomDuration = () => {
        const seconds = parseDurationToSeconds(customDurationInput);
        if (seconds === null || !Number.isFinite(seconds)) {
            showNotification('Enter a valid duration like 45s or 2m 30s', 'error');
            return;
        }

        if (seconds < 10 || seconds > 180) {
            showNotification('Custom duration must be between 10s and 3m (180s)', 'error');
            return;
        }

        setFormData(prev => ({
            ...prev,
            durationSeconds: seconds,
            durationPresetSeconds: null,
        }));
        setCustomDurationInput('');
    };

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const payload = {
                script_title: formData.scriptTitle,
                platform: formData.platformMode === 'custom' ? formData.platformCustom : formData.platform,
                goal: formData.goalMode === 'custom' ? formData.goalCustom : formData.goal,
                target_audience: formData.targetAudience,
                tone: formData.toneMode === 'custom' ? formData.toneCustom : formData.tone,
                duration_seconds: formData.durationSeconds,
                script_style: formData.scriptStyleMode === 'custom' ? formData.scriptStyleCustom : formData.scriptStyle,
                include_hook: formData.includeHook,
                hook_style: formData.hookStyle,
                hook_custom_pattern: formData.hookStyleCustomPattern || null,
                include_cta: formData.includeCta,
                cta_type: formData.includeCta ? (formData.ctaTypeMode === 'custom' ? formData.ctaTypeCustom : formData.ctaType) : null,
                narration_style: formData.narrationStyleMode === 'custom' ? formData.narrationStyleCustom : formData.narrationStyle,
                output_format: formData.outputFormat,
                structure_depth: formData.structureDepth,
                visual_tone: formData.visualToneMode === 'custom' ? formData.visualToneCustom : formData.visualTone,
                compliance_mode: formData.complianceMode,
                language: formData.languageMode === 'custom' ? formData.languageCustom : formData.language,
                custom_instructions: formData.customInstructions,
            };

            const response = await fetch(API.GENERATE_SCRIPT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': AUTH_HEADER,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Failed to generate script');
            }

            const data = await response.json();
            showNotification('Script generated successfully!', 'success');
            
        } catch (error) {
            console.error('Error generating script:', error);
            showNotification('Failed to generate script. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            scriptTitle: '',
            platform: '',
            platformMode: 'predefined',
            platformCustom: '',
            goal: '',
            goalMode: 'predefined',
            goalCustom: '',
            targetAudience: [],
            tone: '',
            toneMode: 'predefined',
            toneCustom: '',
            durationSeconds: 60,
            durationPresetSeconds: null,
            scriptStyle: '',
            scriptStyleMode: 'predefined',
            scriptStyleCustom: '',
            includeHook: true,
            hookStyle: '',
            hookStyleCustomPattern: '',
            includeCta: true,
            ctaType: '',
            ctaTypeMode: 'predefined',
            ctaTypeCustom: '',
            narrationStyle: '',
            narrationStyleMode: 'predefined',
            narrationStyleCustom: '',
            outputFormat: 'plain_text',
            structureDepth: 'standard',
            visualTone: '',
            visualToneMode: 'predefined',
            visualToneCustom: '',
            complianceMode: '',
            language: 'en',
            languageMode: 'predefined',
            languageCustom: '',
            customInstructions: '',
        });
        setAudienceInput('');
        setCustomDurationInput('');
        showNotification('Form has been reset', 'info');
    };

    if (!mounted) return null;

    return (
        <div style={styles.container}>
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

            <div style={styles.header}>
                <h1 style={styles.title}>Script Writing Generator</h1>
                <p style={styles.subtitle}>Generate platform-ready scripts with structure, hooks and CTA</p>
            </div>

            <div style={styles.card}>
                <div style={{ padding: '24px' }}>
                    <form onSubmit={handleSubmit}>
                        <div className="row g-4">
                            <div className="col-12">
                                <div style={styles.formGroup}>
                                    <label htmlFor="scriptTitle" style={styles.label}>
                                        Script Title / Topic <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        style={styles.input}
                                        id="scriptTitle"
                                        name="scriptTitle"
                                        value={formData.scriptTitle}
                                        onChange={handleInputChange}
                                        placeholder="e.g., How to grow on YouTube Shorts"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label htmlFor="platform" style={styles.label}>
                                        Platform <span style={{ color: '#ef4444' }}>*</span>
                                    </label>

                                    <select
                                        style={styles.select}
                                        id="platform"
                                        name="platform"
                                        value={formData.platformMode === 'custom' ? 'custom' : formData.platform}
                                        onChange={(e) => {
                                            const value = e.target.value;

                                            if (value === 'custom') {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    platformMode: 'custom',
                                                    platform: '',
                                                    durationPresetSeconds: null,
                                                }));
                                                return;
                                            }

                                            setFormData(prev => ({
                                                ...prev,
                                                platformMode: 'predefined',
                                                platform: value,
                                                platformCustom: '',
                                                durationPresetSeconds: null,
                                            }));
                                        }}
                                        required
                                    >
                                        <option value="">Select platform</option>
                                        {defaultFieldOptions.platforms.map(option => (
                                            <option key={option.key} value={option.key}>
                                                {option.label}
                                            </option>
                                        ))}
                                        <option value="custom">Custom…</option>
                                    </select>

                                    {formData.platformMode === 'custom' && (
                                        <div style={{ marginTop: '10px' }}>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                name="platformCustom"
                                                value={formData.platformCustom}
                                                onChange={handleInputChange}
                                                placeholder="Enter custom platform"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label htmlFor="goal" style={styles.label}>
                                        Goal / Objective <span style={{ color: '#ef4444' }}>*</span>
                                    </label>

                                    <select
                                        style={styles.select}
                                        id="goal"
                                        name="goal"
                                        value={formData.goalMode === 'custom' ? 'custom' : formData.goal}
                                        onChange={(e) => {
                                            const value = e.target.value;

                                            if (value === 'custom') {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    goalMode: 'custom',
                                                    goal: '',
                                                }));
                                                return;
                                            }

                                            setFormData(prev => ({
                                                ...prev,
                                                goalMode: 'predefined',
                                                goal: value,
                                                goalCustom: '',
                                            }));
                                        }}
                                        required
                                    >
                                        <option value="">Select goal</option>
                                        {defaultFieldOptions.goals.map(option => (
                                            <option key={option.key} value={option.label}>
                                                {option.label}
                                            </option>
                                        ))}
                                        <option value="custom">Custom…</option>
                                    </select>

                                    {formData.goalMode === 'custom' && (
                                        <div style={{ marginTop: '10px' }}>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                name="goalCustom"
                                                value={formData.goalCustom}
                                                onChange={handleInputChange}
                                                placeholder="Enter custom goal"
                                                required
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
                                    </label>

                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '8px',
                                        marginBottom: '8px',
                                        minHeight: '40px',
                                        alignItems: 'center',
                                        padding: '4px',
                                        border: '1px solid #334155',
                                        borderRadius: '6px',
                                        backgroundColor: '#1e293b'
                                    }}>
                                        {formData.targetAudience.length === 0 && (
                                            <span style={{ color: '#9ca3af', fontSize: '14px', marginLeft: '8px' }}>
                                                Type and press Enter to add audience tags
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
                                                <button
                                                    type="button"
                                                    style={styles.removeBtn}
                                                    onClick={() => removeTag(chip)}
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
                                        onKeyDown={handleTagInput}
                                        placeholder="Type and press Enter to add audience tags"
                                        required={formData.targetAudience.length === 0}
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label htmlFor="tone" style={styles.label}>
                                        Tone / Emotion <span style={{ color: '#ef4444' }}>*</span>
                                    </label>

                                    <select
                                        style={styles.select}
                                        id="tone"
                                        name="tone"
                                        value={formData.toneMode === 'custom' ? 'custom' : formData.tone}
                                        onChange={(e) => {
                                            const value = e.target.value;

                                            if (value === 'custom') {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    toneMode: 'custom',
                                                    tone: '',
                                                }));
                                                return;
                                            }

                                            setFormData(prev => ({
                                                ...prev,
                                                toneMode: 'predefined',
                                                tone: value,
                                                toneCustom: '',
                                            }));
                                        }}
                                        required
                                    >
                                        <option value="">Select tone</option>
                                        {defaultFieldOptions.tones.map(option => (
                                            <option key={option.key} value={option.label}>
                                                {option.label}
                                            </option>
                                        ))}
                                        <option value="custom">Custom…</option>
                                    </select>

                                    {formData.toneMode === 'custom' && (
                                        <div style={{ marginTop: '10px' }}>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                name="toneCustom"
                                                value={formData.toneCustom}
                                                onChange={handleInputChange}
                                                placeholder="Enter custom tone"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Video Length / Duration <span style={{ color: '#ef4444' }}>*</span>
                                    </label>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                        {durationPresets.map((seconds) => {
                                            const active = formData.durationPresetSeconds === seconds;
                                            return (
                                                <button
                                                    key={seconds}
                                                    type="button"
                                                    style={{
                                                        ...styles.badge,
                                                        backgroundColor: active ? '#3b82f6' : '#1e293b',
                                                        color: active ? 'white' : '#e2e8f0',
                                                        border: '1px solid #334155',
                                                        cursor: 'pointer',
                                                    }}
                                                    onClick={() => handleDurationPresetClick(seconds)}
                                                >
                                                    {formatDuration(seconds)}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div style={{ marginBottom: '10px' }}>
                                        <input
                                            type="range"
                                            min={15}
                                            max={1800}
                                            step={1}
                                            value={formData.durationSeconds}
                                            onChange={handleDurationSliderChange}
                                            style={{ width: '100%' }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', color: '#94a3b8', fontSize: '13px' }}>
                                            <span>15s</span>
                                            <span>{formatDuration(formData.durationSeconds)} — Target ≈ {estimateWords(formData.durationSeconds)} words</span>
                                            <span>30m</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            type="text"
                                            style={styles.input}
                                            value={customDurationInput}
                                            onChange={(e) => setCustomDurationInput(e.target.value)}
                                            placeholder="Custom (10s–180s), e.g., 45s or 2m 30s"
                                        />
                                        <button
                                            type="button"
                                            style={{ ...styles.btn, ...styles.btnOutline, whiteSpace: 'nowrap' }}
                                            onClick={applyCustomDuration}
                                            disabled={!customDurationInput.trim()}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Script Style <span style={{ color: '#ef4444' }}>*</span>
                                    </label>

                                    <select
                                        style={styles.select}
                                        name="scriptStyle"
                                        value={formData.scriptStyleMode === 'custom' ? 'custom' : formData.scriptStyle}
                                        onChange={(e) => {
                                            const value = e.target.value;

                                            if (value === 'custom') {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    scriptStyleMode: 'custom',
                                                    scriptStyle: '',
                                                }));
                                                return;
                                            }

                                            setFormData(prev => ({
                                                ...prev,
                                                scriptStyleMode: 'predefined',
                                                scriptStyle: value,
                                                scriptStyleCustom: '',
                                            }));
                                        }}
                                        required
                                    >
                                        <option value="">Select style</option>
                                        {defaultFieldOptions.scriptStyles.map(option => (
                                            <option key={option.key} value={option.label}>
                                                {option.label}
                                            </option>
                                        ))}
                                        <option value="custom">Custom…</option>
                                    </select>

                                    {formData.scriptStyleMode === 'custom' && (
                                        <div style={{ marginTop: '10px' }}>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                name="scriptStyleCustom"
                                                value={formData.scriptStyleCustom}
                                                onChange={handleInputChange}
                                                placeholder="Enter custom script style"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Include Hook (Yes/No)</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.includeHook}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    includeHook: checked,
                                                    ...(checked ? {} : { hookStyle: '', hookStyleCustomPattern: '' }),
                                                }));
                                            }}
                                        />
                                        <span>{formData.includeHook ? 'Yes' : 'No'}</span>
                                    </div>
                                </div>
                            </div>

                            {formData.includeHook && (
                                <div className="col-12">
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Hook Style</label>
                                        <select
                                            style={styles.select}
                                            name="hookStyle"
                                            value={formData.hookStyle}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Select hook style</option>
                                            {defaultFieldOptions.hookStyles.map(option => (
                                                <option key={option.key} value={option.label}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div style={{ marginTop: '10px' }}>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                name="hookStyleCustomPattern"
                                                value={formData.hookStyleCustomPattern}
                                                onChange={handleInputChange}
                                                placeholder="Optional: Custom pattern (e.g., 'Stop scrolling if...')"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Include CTA (Yes/No)</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.includeCta}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    includeCta: checked,
                                                    ...(checked ? {} : { ctaType: '', ctaTypeMode: 'predefined', ctaTypeCustom: '' }),
                                                }));
                                            }}
                                        />
                                        <span>{formData.includeCta ? 'Yes' : 'No'}</span>
                                    </div>
                                </div>
                            </div>

                            {formData.includeCta && (
                                <div className="col-md-6">
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>CTA Type</label>
                                        <select
                                            style={styles.select}
                                            name="ctaType"
                                            value={formData.ctaTypeMode === 'custom' ? 'custom' : formData.ctaType}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === 'custom') {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        ctaTypeMode: 'custom',
                                                        ctaType: '',
                                                    }));
                                                    return;
                                                }
                                                setFormData(prev => ({
                                                    ...prev,
                                                    ctaTypeMode: 'predefined',
                                                    ctaType: value,
                                                    ctaTypeCustom: '',
                                                }));
                                            }}
                                        >
                                            <option value="">Select CTA</option>
                                            {defaultFieldOptions.ctaTypes.map(option => (
                                                <option key={option.key} value={option.label}>
                                                    {option.label}
                                                </option>
                                            ))}
                                            <option value="custom">Custom…</option>
                                        </select>

                                        {formData.ctaTypeMode === 'custom' && (
                                            <div style={{ marginTop: '10px' }}>
                                                <input
                                                    type="text"
                                                    style={styles.input}
                                                    name="ctaTypeCustom"
                                                    value={formData.ctaTypeCustom}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter custom CTA"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Narration Style (POV)</label>
                                    <select
                                        style={styles.select}
                                        name="narrationStyle"
                                        value={formData.narrationStyleMode === 'custom' ? 'custom' : formData.narrationStyle}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === 'custom') {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    narrationStyleMode: 'custom',
                                                    narrationStyle: '',
                                                }));
                                                return;
                                            }
                                            setFormData(prev => ({
                                                ...prev,
                                                narrationStyleMode: 'predefined',
                                                narrationStyle: value,
                                                narrationStyleCustom: '',
                                            }));
                                        }}
                                    >
                                        <option value="">Select POV</option>
                                        {defaultFieldOptions.narrationStyles.map(option => (
                                            <option key={option.key} value={option.label}>
                                                {option.label}
                                            </option>
                                        ))}
                                        <option value="custom">Custom…</option>
                                    </select>

                                    {formData.narrationStyleMode === 'custom' && (
                                        <div style={{ marginTop: '10px' }}>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                name="narrationStyleCustom"
                                                value={formData.narrationStyleCustom}
                                                onChange={handleInputChange}
                                                placeholder="Enter custom narration style"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Output Format (Export Type)</label>
                                    <select
                                        style={styles.select}
                                        name="outputFormat"
                                        value={formData.outputFormat}
                                        onChange={handleInputChange}
                                    >
                                        {defaultFieldOptions.outputFormats.map(option => (
                                            <option key={option.key} value={option.key}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="col-12">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Script Structure Depth (Level of Detail)</label>
                                    <div style={styles.radioGroup}>
                                        {defaultFieldOptions.structureDepths.map((opt) => (
                                            <label key={opt.key} style={styles.radioItem}>
                                                <input
                                                    type="radio"
                                                    name="structureDepth"
                                                    value={opt.key}
                                                    checked={formData.structureDepth === opt.key}
                                                    onChange={handleInputChange}
                                                />
                                                <span>{opt.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Visual Tone & Mood</label>

                                    <select
                                        style={styles.select}
                                        name="visualTone"
                                        value={formData.visualToneMode === 'custom' ? 'custom' : formData.visualTone}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === 'custom') {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    visualToneMode: 'custom',
                                                    visualTone: '',
                                                }));
                                                return;
                                            }
                                            setFormData(prev => ({
                                                ...prev,
                                                visualToneMode: 'predefined',
                                                visualTone: value,
                                                visualToneCustom: '',
                                            }));
                                        }}
                                    >
                                        <option value="">Select mood</option>
                                        {defaultFieldOptions.visualTones.map(option => (
                                            <option key={option.key} value={option.label}>
                                                {option.label}
                                            </option>
                                        ))}
                                        <option value="custom">Custom…</option>
                                    </select>

                                    {formData.visualToneMode === 'custom' && (
                                        <div style={{ marginTop: '10px' }}>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                name="visualToneCustom"
                                                value={formData.visualToneCustom}
                                                onChange={handleInputChange}
                                                placeholder="Enter custom mood"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Compliance Mode (Content & Claim Safety Controls)</label>
                                    <input
                                        type="text"
                                        style={styles.input}
                                        name="complianceMode"
                                        value={formData.complianceMode}
                                        onChange={handleInputChange}
                                        placeholder="e.g., No medical claims, No financial guarantees"
                                    />
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Language & Localization</label>

                                    <select
                                        style={styles.select}
                                        name="language"
                                        value={formData.languageMode === 'custom' ? 'custom' : formData.language}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === 'custom') {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    languageMode: 'custom',
                                                }));
                                                return;
                                            }
                                            setFormData(prev => ({
                                                ...prev,
                                                languageMode: 'predefined',
                                                language: value,
                                                languageCustom: '',
                                            }));
                                        }}
                                    >
                                        {defaultFieldOptions.languages.map(option => (
                                            <option key={option.key} value={option.key}>
                                                {option.label}
                                            </option>
                                        ))}
                                        <option value="custom">Custom…</option>
                                    </select>

                                    {formData.languageMode === 'custom' && (
                                        <div style={{ marginTop: '10px' }}>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                name="languageCustom"
                                                value={formData.languageCustom}
                                                onChange={handleInputChange}
                                                placeholder="Enter custom language / locale (e.g., English (US))"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-12">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Custom Instructions / AI Guidance</label>
                                    <textarea
                                        style={{ ...styles.textarea, minHeight: '120px' }}
                                        name="customInstructions"
                                        value={formData.customInstructions}
                                        onChange={handleInputChange}
                                        placeholder="Any specific guidance for the AI (format, pacing, forbidden phrases, etc.)"
                                    />
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="col-12 mt-4">
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        type="button"
                                        style={{ ...styles.btn, ...styles.btnOutline }}
                                        onClick={handleReset}
                                        disabled={isLoading}
                                    >
                                        Reset Form
                                    </button>
                                    <button
                                        type="submit"
                                        style={{ ...styles.btn, ...styles.btnPrimary }}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <span>Generating...</span>
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
                                        ) : 'Generate Script'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ScriptWritingGeneratorForm;