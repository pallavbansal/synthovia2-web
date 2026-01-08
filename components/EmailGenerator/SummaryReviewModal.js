import React from 'react';

const styles = {
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
        maxWidth: '900px',
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
    body: {
        padding: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px 30px',
    },
    sectionTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#3b82f6',
        marginBottom: '10px',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '5px',
        gridColumn: '1 / -1',
    },
    item: {
        marginBottom: '12px',
        fontSize: '14px',
        color: '#374151',
        display: 'flex',
        flexDirection: 'column',
    },
    itemLabel: {
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: '4px',
    },
    valueBox: {
        backgroundColor: '#f3f4f6',
        padding: '10px',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
        whiteSpace: 'pre-wrap',
        minHeight: '40px',
        display: 'flex',
        alignItems: 'center',
    },
    tagContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        marginTop: '4px',
    },
    badge: {
        display: 'inline-flex',
        padding: '4px 10px',
        fontSize: '12px',
        fontWeight: '500',
        borderRadius: '4px',
    },
    badgePrimary: { backgroundColor: '#3b82f6', color: 'white' },
    badgeSuccess: { backgroundColor: '#10b981', color: 'white' },
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
        gap: '8px',
    },
    btnPrimary: {
        backgroundColor: '#3b82f6',
        color: 'white',
    },
    btnOutline: {
        backgroundColor: 'white',
        color: '#6b7280',
        border: '1px solid #d1d5db',
    },
};

const SummaryReviewModal = ({ formData, fieldOptions, onGenerate, onEdit, isGenerating, onClose }) => {
    const renderText = (value) => {
        if (value === null || value === undefined) return '-';
        const str = String(value).trim();
        return str.length ? str : '-';
    };

    const renderFromOptions = (key, list) => {
        if (!key) return '-';
        if (String(key) === 'auto') return 'Auto-detect';
        const arr = Array.isArray(list) ? list : [];
        const found = arr.find((o) => String(o?.key) === String(key));
        return found?.label || key;
    };

    const renderTags = (arr) => {
        const tags = Array.isArray(arr) ? arr.filter(Boolean) : [];
        if (!tags.length) return <div style={styles.valueBox}>-</div>;

        return (
            <div style={styles.tagContainer}>
                {tags.map((t, i) => (
                    <span key={`${t}-${i}`} style={{ ...styles.badge, ...styles.badgePrimary }}>
                        {t}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modalContent}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Review Email Request</h2>
                    <button onClick={onClose} style={styles.closeButton} aria-label="Close">
                        &times;
                    </button>
                </div>

                <div style={styles.body}>
                    <h3 style={styles.sectionTitle}>Core Details</h3>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Email Type</span>
                        <div style={styles.valueBox}>
                            {renderText(
                                formData.emailTypeMode === 'custom'
                                    ? formData.emailType
                                    : renderFromOptions(formData.emailType, fieldOptions?.emailTypes)
                            )}
                        </div>
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Subject Line Focus</span>
                        <div style={styles.valueBox}>
                            {renderText(
                                formData.subjectLineFocusMode === 'custom'
                                    ? formData.subjectLineFocus
                                    : renderFromOptions(formData.subjectLineFocus, fieldOptions?.subjectLineFocus)
                            )}
                        </div>
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Email Goal</span>
                        <div style={styles.valueBox}>
                            {renderText(
                                formData.emailGoalMode === 'custom'
                                    ? formData.customGoal
                                    : renderFromOptions(formData.emailGoal, fieldOptions?.emailGoals)
                            )}
                        </div>
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Target Audience</span>
                        {renderTags(formData.targetAudience)}
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Brand Context</span>
                        <div style={styles.valueBox}>{renderText(formData.brandContext)}</div>
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Key Message</span>
                        <div style={styles.valueBox}>{renderText(formData.keyMessage)}</div>
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Tone</span>
                        <div style={styles.valueBox}>
                            {renderText(
                                formData.toneStyleMode === 'custom'
                                    ? formData.toneStyle
                                    : renderFromOptions(formData.toneStyle, fieldOptions?.toneStyles)
                            )}
                        </div>
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Length Preference</span>
                        <div style={styles.valueBox}>
                            {renderText(
                                formData.lengthPreferenceMode === 'custom'
                                    ? formData.lengthPreference
                                    : renderFromOptions(formData.lengthPreference, fieldOptions?.lengthPreferences)
                            )}
                        </div>
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>CTA</span>
                        <div style={styles.valueBox}>
                            {renderText(
                                formData.ctaTypeMode === 'custom'
                                    ? formData.customCta
                                    : renderFromOptions(formData.ctaType, fieldOptions?.ctaTypes)
                            )}
                        </div>
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Send Frequency</span>
                        <div style={styles.valueBox}>
                            {renderText(
                                formData.sendFrequencyMode === 'custom'
                                    ? formData.customFrequency
                                    : renderFromOptions(formData.sendFrequency, fieldOptions?.sendFrequencies)
                            )}
                        </div>
                    </div>

                    <h3 style={styles.sectionTitle}>Advanced (Optional)</h3>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Personalization Tags</span>
                        {renderTags(formData.personalizationTags)}
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Key Highlights</span>
                        {renderTags(formData.keyHighlights)}
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Social Proof</span>
                        <div style={styles.valueBox}>{renderText(formData.socialProof)}</div>
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Compliance Notes</span>
                        <div style={styles.valueBox}>{renderText(formData.complianceNotes)}</div>
                    </div>
                </div>

                <div style={styles.actionContainer}>
                    <button type="button" style={{ ...styles.btn, ...styles.btnOutline }} onClick={onEdit}>
                        Edit
                    </button>
                    <button
                        type="button"
                        style={{
                            ...styles.btn,
                            ...styles.btnPrimary,
                            opacity: isGenerating ? 0.7 : 1,
                            cursor: isGenerating ? 'not-allowed' : 'pointer',
                        }}
                        onClick={onGenerate}
                        disabled={isGenerating}
                    >
                        {isGenerating ? 'Generating...' : 'Generate'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SummaryReviewModal;
