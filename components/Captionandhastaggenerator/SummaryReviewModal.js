// components/Captionandhastaggenerator/SummaryReviewModal.js

import React from 'react';

// Re-using common styles and adding modal-specific styles
const styles = {
    // --- Modal Base Styles ---
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '50px',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '800px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        zIndex: 1001,
        maxHeight: '85vh',
        overflowY: 'auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    header: {
        padding: '20px 24px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#111827',
        margin: 0,
    },
    closeButton: {
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        color: '#6b7280',
        padding: '4px',
        lineHeight: 1,
    },
    // --- Summary Content Styles ---
    body: {
        padding: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '20px 30px',
    },
    sectionTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#3b82f6', // Primary color
        marginBottom: '10px',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '5px',
        gridColumn: '1 / -1', // Span full width
    },
    item: {
        marginBottom: '8px',
        fontSize: '14px',
        color: '#374151',
        display: 'flex',
        flexDirection: 'column',
    },
    itemLabel: {
        fontWeight: '600',
        color: '#1f2937',
        marginRight: '8px',
        marginBottom: '4px',
        display: 'inline-block',
    },
    valueBox: {
        backgroundColor: '#f3f4f6',
        padding: '8px',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
        whiteSpace: 'pre-wrap',
        maxHeight: '150px',
        overflowY: 'auto',
    },
    // --- Tag Styles ---
    tagContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        marginTop: '4px',
    },
    badge: {
        display: 'inline-flex',
        padding: '4px 8px',
        fontSize: '12px',
        fontWeight: '500',
        borderRadius: '4px',
    },
    badgePrimary: { backgroundColor: '#3b82f6', color: 'white' }, // Audience
    badgeSuccess: { backgroundColor: '#10b981', color: 'white' }, // Keywords
    badgeSecondary: { backgroundColor: '#fcd34d', color: '#1f2937' }, // Formatting/Exclude
    // --- Action Button Styles ---
    actionContainer: {
        padding: '20px 24px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
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
    btnGenerate: { 
        backgroundColor: '#10b981', 
        color: 'white' 
    },
    btnOutline: { 
        backgroundColor: 'white', 
        color: '#6b7280', 
        border: '1px solid #d1d5db' 
    },
};

const SummaryReviewModal = ({ formData, apiOptions, onGenerate, onEdit, onViewLog, formattingOptionsList, getOptionDetails, isGenerating }) => {
    
    // Map predefined keys to labels for display (using the utility function passed from parent)
    const platformDetails = getOptionDetails('caption_platform', formData.platform, formData.customPlatform, formData.platformType);
    const toneDetails = getOptionDetails('caption_tone_of_voice', formData.toneOfVoice, formData.customTone, formData.toneSelection);
    const languageDetails = getOptionDetails('caption_language_locale', formData.language);
    const postLengthDetails = getOptionDetails('caption_post_length', formData.postLength);
    const ctaDetails = getOptionDetails('caption_cta_type', formData.includeCtaType);
    const captionStyleDetails = getOptionDetails('caption_style', formData.captionStyle);
    const hashtagStyleDetails = getOptionDetails('caption_hashtag_style', formData.hashtagStyle);
    const emotionalIntentDetails = getOptionDetails('caption_emotional_intent', formData.emotionalIntent);

    const getFormattingLabels = () => {
        return formData.formattingOptions.map(key => {
            const detail = formattingOptionsList.find(opt => opt.value === key);
            return detail ? detail.label : key;
        });
    };

    const getValueDisplay = (details, customValue) => {
        if (details.type === 'custom') {
            return `Custom: ${customValue}`;
        }
        return details.value;
    };

    return (
        <div style={styles.overlay} onClick={onEdit}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Review & Confirm Generation Parameters</h2>
                    <button style={styles.closeButton} onClick={onEdit}>
                        ×
                    </button>
                </div>

                <div style={styles.body}>
                    <h3 style={styles.sectionTitle}>🎯 Core Request Details</h3>
                    
                    {/* Column 1: Core Fields */}
                    <div style={{...styles.item, gridColumn: 'span 1'}}>
                        <span style={styles.itemLabel}>Platform & Post Type:</span>
                        <div style={styles.valueBox}>{getValueDisplay(platformDetails, formData.customPlatform)}</div>
                    </div>
                    <div style={{...styles.item, gridColumn: 'span 1'}}>
                        <span style={styles.itemLabel}>Tone of Voice:</span>
                        <div style={styles.valueBox}>{getValueDisplay(toneDetails, formData.customTone)}</div>
                    </div>

                    <div style={{...styles.item, gridColumn: 'span 1'}}>
                        <span style={styles.itemLabel}>Primary Goal:</span>
                        <div style={styles.valueBox}>{formData.primaryGoal || 'N/A'}</div>
                    </div>
                    <div style={{...styles.item, gridColumn: 'span 1'}}>
                        <span style={styles.itemLabel}>Target Audience:</span>
                        <div style={styles.tagContainer}>
                            {formData.targetAudience.map((a, i) => <span key={i} style={{ ...styles.badge, ...styles.badgePrimary }}>{a}</span>)}
                            {formData.targetAudience.length === 0 && <span>None specified.</span>}
                        </div>
                    </div>

                    <div style={{...styles.item, gridColumn: '1 / -1'}}>
                        <span style={styles.itemLabel}>Post Theme/Topic:</span> 
                        <div style={styles.valueBox}>
                            {formData.postTheme || 'No topic provided.'}
                        </div>
                    </div>

                    <h3 style={styles.sectionTitle}>⚙️ Advanced Customization</h3>
                    
                    {/* Column 2: Advanced Style/Settings */}
                    <div style={{...styles.item, gridColumn: 'span 1'}}>
                        <span style={styles.itemLabel}>Language / Locale:</span>
                        <div style={styles.valueBox}>{languageDetails.value || 'N/A'}</div>
                    </div>
                    <div style={{...styles.item, gridColumn: 'span 1'}}>
                        <span style={styles.itemLabel}>Emotional Intent:</span>
                        <div style={styles.valueBox}>{emotionalIntentDetails.value || 'N/A'}</div>
                    </div>
                    <div style={{...styles.item, gridColumn: 'span 1'}}>
                        <span style={styles.itemLabel}>Caption Style:</span>
                        <div style={styles.valueBox}>{captionStyleDetails.value || 'N/A'}</div>
                    </div>
                    <div style={{...styles.item, gridColumn: 'span 1'}}>
                        <span style={styles.itemLabel}>Hashtag Style:</span>
                        <div style={styles.valueBox}>{hashtagStyleDetails.value || 'N/A'}</div>
                    </div>
                    <div style={{...styles.item, gridColumn: 'span 1'}}>
                        <span style={styles.itemLabel}>CTA Type:</span>
                        <div style={styles.valueBox}>{ctaDetails.value === 'Custom CTA' ? `Custom: ${formData.customCta}` : ctaDetails.value || 'N/A'}</div>
                    </div>
                    <div style={{...styles.item, gridColumn: 'span 1'}}>
                        <span style={styles.itemLabel}>Post Length / Variants / Creativity:</span>
                        <div style={styles.valueBox}>
                            Length: {postLengthDetails.value} | Variants: {formData.variants} | Creativity: {formData.creativityLevel}/10
                        </div>
                    </div>

                    {/* Full Width Tags/Options */}
                    <div style={{...styles.item, gridColumn: '1 / -1'}}>
                        <span style={styles.itemLabel}>Formatting Options:</span>
                        <div style={styles.tagContainer}>
                            <span style={{...styles.badge, backgroundColor: formData.proofread ? '#10b981' : '#f87171', color: 'white'}}>
                                Proofread: {formData.proofread ? 'Yes' : 'No'}
                            </span>
                            {getFormattingLabels().map((l, i) => <span key={i} style={{ ...styles.badge, ...styles.badgeSecondary }}>{l}</span>)}
                        </div>
                    </div>

                    {(formData.requiredKeywords.length > 0 || formData.excludeWords.length > 0) && (
                        <div style={{...styles.item, gridColumn: '1 / -1'}}>
                            <span style={styles.itemLabel}>Keyword Constraints:</span>
                            <div style={styles.tagContainer}>
                                {formData.requiredKeywords.map((k, i) => <span key={`req-${i}`} style={{ ...styles.badge, ...styles.badgeSuccess }}>Required: {k}</span>)}
                                {formData.excludeWords.map((w, i) => <span key={`exc-${i}`} style={{ ...styles.badge, backgroundColor: '#f87171', color: 'white' }}>Exclude: {w}</span>)}
                            </div>
                        </div>
                    )}

                    {formData.complianceNotes && (
                        <div style={{...styles.item, gridColumn: '1 / -1'}}>
                            <span style={styles.itemLabel}>Compliance Notes:</span>
                            <div style={styles.valueBox}>{formData.complianceNotes}</div>
                        </div>
                    )}

                </div>

                {/* Actions */}
                <div style={styles.actionContainer}>
                    <button
                        type="button"
                        style={{ ...styles.btn, ...styles.btnOutline }}
                        onClick={onEdit}
                    >
                        &lt; Edit Request
                    </button>
                    <button
                        type="button"
                        style={{ ...styles.btn, ...styles.btnOutline }}
                        onClick={onViewLog}
                        disabled={isGenerating}
                    >
                        View Log
                    </button>
                    <button
                        type="button"
                        style={{ ...styles.btn, ...styles.btnGenerate }}
                        onClick={onGenerate}
                        disabled={isGenerating}
                    >
                        {isGenerating ? 'Generating...' : '🚀 Confirm & Generate Captions'}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default SummaryReviewModal;