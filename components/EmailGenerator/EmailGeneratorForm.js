import React, { useState } from 'react';
import ToggleButton from '../Form/ToggleButton';

// API Configuration
const BASE_URL = 'https://olive-gull-905765.hostingersite.com/public/api/v1';
const API = {
    GENERATE_EMAIL: `${BASE_URL}/email/generate`,
    AUTH_TOKEN: '3|WwYYaSEAfSr1guYBFdPQlPtGg0dKphy1sVMDLBmX647db358',
};

const AUTH_HEADER = `Bearer ${API.AUTH_TOKEN}`;

// Default field options
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

const EmailGeneratorForm = () => {
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
        lengthPreference: '',
        lengthPreferenceMode: 'predefined',
        lengthPreferenceCustom: '',
        ctaType: '',
        ctaTypeMode: 'predefined',
        customCta: '',
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
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [mounted, setMounted] = useState(false);

    React.useEffect(() => {
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

    const handleTagInput = (e, type) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            e.preventDefault();
            const newTag = e.target.value.trim();
            const fieldName = type === 'audience' ? 'targetAudience' : 
                            type === 'personalization' ? 'personalizationTags' : 'keyHighlights';
            
            if (!formData[fieldName].includes(newTag)) {
                setFormData(prev => ({
                    ...prev,
                    [fieldName]: [...prev[fieldName], newTag]
                }));
                
                if (type === 'audience') setAudienceInput('');
                else if (type === 'personalization') setPersonalizationInput('');
                else setHighlightInput('');
            }
        }
    };

    const removeTag = (tag, type) => {
        const fieldName = type === 'audience' ? 'targetAudience' : 
                        type === 'personalization' ? 'personalizationTags' : 'keyHighlights';
        
        setFormData(prev => ({
            ...prev,
            [fieldName]: prev[fieldName].filter(t => t !== tag)
        }));
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
                email_type: formData.emailType,
                target_audience: formData.targetAudience,
                brand_context: formData.brandContext,
                subject_line_focus: formData.subjectLineFocus,
                email_goal: formData.emailGoal,
                custom_goal: formData.customGoal || null,
                key_message: formData.keyMessage,
                tone_style: formData.toneStyle,
                length_preference: formData.lengthPreference,
                cta_type: formData.ctaType,
                custom_cta: formData.customCta || null,
                personalization_tags: formData.personalizationTags,
                key_highlights: formData.keyHighlights,
                social_proof: formData.socialProof,
                compliance_notes: formData.complianceNotes,
                send_frequency: formData.sendFrequency,
                custom_frequency: formData.customFrequency || null,
            };

            const response = await fetch(API.GENERATE_EMAIL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': AUTH_HEADER,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Failed to generate email');
            }

            const data = await response.json();
            showNotification('Email generated successfully!', 'success');
            
        } catch (error) {
            console.error('Error generating email:', error);
            showNotification('Failed to generate email. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
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
            lengthPreference: '',
            lengthPreferenceMode: 'predefined',
            lengthPreferenceCustom: '',
            ctaType: '',
            ctaTypeMode: 'predefined',
            customCta: '',
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
        showNotification('Form has been reset', 'info');
    };

    const toggleAdvanced = () => {
        setFormData(prev => ({
            ...prev,
            showAdvanced: !prev.showAdvanced
        }));
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
                <h1 style={styles.title}>Email / Newsletter Generator</h1>
                <p style={styles.subtitle}>Create engaging email content for your campaigns</p>
            </div>

            <div style={styles.card}>
                <div style={{ padding: '24px' }}>
                    <form onSubmit={handleSubmit}>
                        <div className="row g-4">
                            {/* Email Type & Brand Context */}
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
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        emailTypeMode: e.target.value,
                                                        emailType: prev.emailType || ''
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
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        emailTypeMode: e.target.value,
                                                        emailType: prev.emailTypeCustom || ''
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
                                            {defaultFieldOptions.emailTypes.map(option => (
                                                <option key={option.key} value={option.label}>
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
                                                setFormData(prev => ({
                                                    ...prev,
                                                    emailTypeCustom: val,
                                                    emailType: val
                                                }));
                                            }}
                                            placeholder="Enter custom email type"
                                            required
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Subject Line Focus & Email Goal */}
                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label htmlFor="subjectLineFocus" style={styles.label}>
                                        Email Subject Line Focus <span style={{ color: '#ef4444' }}>*</span>
                                        <span
                                            style={styles.infoIcon}
                                            title="Choose the approach for your email subject line"
                                        >
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
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        subjectLineFocusMode: e.target.value
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
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        subjectLineFocusMode: e.target.value,
                                                        subjectLineFocus: prev.subjectLineFocusCustom || ''
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
                                            {defaultFieldOptions.subjectLineFocus.map(option => (
                                                <option key={option.key} value={option.label}>
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
                                                setFormData(prev => ({
                                                    ...prev,
                                                    subjectLineFocusCustom: val,
                                                    subjectLineFocus: val
                                                }));
                                            }}
                                            placeholder="Enter custom subject line focus"
                                            required
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Target Audience */}
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
                                                    padding: '4px 10px'
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
                                        <span
                                            style={styles.infoIcon}
                                            title="Your company or brand name and brief context"
                                        >
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
                                        <span
                                            style={styles.infoIcon}
                                            title="What do you want to achieve with this email?"
                                        >
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
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        emailGoalMode: e.target.value
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
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        emailGoalMode: e.target.value,
                                                        emailGoal: 'Custom Goal'
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
                                            {defaultFieldOptions.emailGoals.map(option => (
                                                <option key={option.key} value={option.label}>
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
                            {/* Tone & Length */}
                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label htmlFor="toneStyle" style={styles.label}>
                                        Tone or Style <span style={{ color: '#ef4444' }}>*</span>
                                        <span
                                            style={styles.infoIcon}
                                            title="Select the tone or style for your email content"
                                        >
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
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        toneStyleMode: e.target.value
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
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        toneStyleMode: e.target.value,
                                                        toneStyle: prev.toneStyleCustom || ''
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
                                            {defaultFieldOptions.toneStyles.map(option => (
                                                <option key={option.key} value={option.label}>
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
                                                setFormData(prev => ({
                                                    ...prev,
                                                    toneStyleCustom: val,
                                                    toneStyle: val
                                                }));
                                            }}
                                            placeholder="Enter custom tone or style"
                                            required
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Key Message */}
                            <div className="col-12">
                                <div style={styles.formGroup}>
                                    <label htmlFor="keyMessage" style={styles.label}>
                                        Key Message / Offer <span style={{ color: '#ef4444' }}>*</span>
                                        <span
                                            style={styles.infoIcon}
                                            title="The main message or offer you want to communicate in your email"
                                        >
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
                                        <span
                                            style={styles.infoIcon}
                                            title="Choose the desired length for your email content"
                                        >
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
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        lengthPreferenceMode: e.target.value
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
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        lengthPreferenceMode: e.target.value,
                                                        lengthPreference: prev.lengthPreferenceCustom || ''
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
                                            <option value="">Select length preference</option>
                                            {defaultFieldOptions.lengthPreferences.map(option => (
                                                <option key={option.key} value={option.label}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {formData.lengthPreferenceMode === 'custom' && (
                                        <input
                                            type="text"
                                            style={styles.input}
                                            name="lengthPreferenceCustom"
                                            value={formData.lengthPreferenceCustom}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    lengthPreferenceCustom: val,
                                                    lengthPreference: val
                                                }));
                                            }}
                                            placeholder="Enter custom length preference"
                                            required
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Call to Action */}
                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label htmlFor="ctaType" style={styles.label}>
                                        Call to Action (CTA) <span style={{ color: '#ef4444' }}>*</span>
                                        <span
                                            style={styles.infoIcon}
                                            title="Select or specify the call-to-action for your email"
                                        >
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
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        ctaTypeMode: e.target.value
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
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        ctaTypeMode: e.target.value,
                                                        ctaType: 'Custom'
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
                                            {defaultFieldOptions.ctaTypes.map(option => (
                                                <option key={option.key} value={option.label}>
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

                            <hr style={{ width: '100%', border: 'none', borderTop: '1px solid #1e293b', margin: '5px 0' }} />

                            {/* Advanced Features Toggle */}
                            <div className="col-12" style={{ margin: '16px 0' }}>
                                <ToggleButton showAdvanced={formData.showAdvanced} onToggle={toggleAdvanced} />
                            </div>

                            {/* Advanced Options */}
                            {formData.showAdvanced && (
                                <>
                                    {/* Personalization Tags */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>
                                                Personalization Tags (Optional)
                                                <span
                                                    style={styles.infoIcon}
                                                    title="Add personalization tokens like {first_name}, {company}"
                                                >
                                                    i
                                                </span>
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

                                    {/* Key Highlights */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>
                                                Key Highlights / Bullet Points (Optional)
                                                <span
                                                    style={styles.infoIcon}
                                                    title="Add key points to highlight in your email"
                                                >
                                                    i
                                                </span>
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

                                    {/* Social Proof */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="socialProof" style={styles.label}>
                                                Social Proof / Testimonials (Optional)
                                                <span
                                                    style={styles.infoIcon}
                                                    title="Add testimonials or social proof to include in your email"
                                                >
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

                                    {/* Compliance Notes */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="complianceNotes" style={styles.label}>
                                                Compliance / Restrictions (Optional)
                                                <span
                                                    style={styles.infoIcon}
                                                    title="Any compliance requirements or restrictions to consider"
                                                >
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

                                    {/* Send Frequency */}
                                    <div className="col-12">
                                        <div style={styles.formGroup}>
                                            <label htmlFor="sendFrequency" style={styles.label}>
                                                Send Frequency / Cadence (Optional)
                                                <span
                                                    style={styles.infoIcon}
                                                    title="How often will this email be sent?"
                                                >
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
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                sendFrequencyMode: e.target.value
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
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                sendFrequencyMode: e.target.value,
                                                                sendFrequency: 'Custom'
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
                                                    {defaultFieldOptions.sendFrequencies.map(option => (
                                                        <option key={option.key} value={option.label}>
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
                                        ) : 'Generate Email'}
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

export default EmailGeneratorForm;