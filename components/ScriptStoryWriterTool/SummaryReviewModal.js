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
        backgroundColor: '#3b82f6',
        color: 'white',
    },
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

const SummaryReviewModal = ({ formData, onGenerate, onEdit, isGenerating, onViewLog }) => {
    const platformValue = formData.platformMode === 'custom' ? formData.platformCustom : formData.platform;
    const goalValue = formData.goalMode === 'custom' ? formData.goalCustom : formData.goal;
    const toneValue = formData.toneMode === 'custom' ? formData.toneCustom : formData.tone;
    const scriptStyleValue = formData.scriptStyleMode === 'custom' ? formData.scriptStyleCustom : formData.scriptStyle;
    const narrationValue =
        formData.narrationStyleMode === 'custom' ? formData.narrationStyleCustom : formData.narrationStyle;
    const visualToneValue = formData.visualToneMode === 'custom' ? formData.visualToneCustom : formData.visualTone;
    const structureDepthValue =
        formData.structureDepth === 'simple'
            ? 'Simple (25 – 35 %)'
            : formData.structureDepth === 'medium'
                ? 'Medium (50 – 70 %)'
                : formData.structureDepth === 'advanced'
                    ? 'Advanced (80 – 100 %)'
                    : formData.structureDepth;
    const ctaValue =
        !formData.includeCta
            ? 'Disabled'
            : formData.ctaTypeMode === 'custom'
                ? formData.ctaTypeCustom
                : formData.ctaType;

    return (
        <div style={styles.overlay} onClick={onEdit}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Review & Confirm Script Request</h2>
                    <button style={styles.closeButton} onClick={onEdit}>
                        ×
                    </button>
                </div>

                <div style={styles.body}>
                    <h3 style={styles.sectionTitle}>🎯 Core Details</h3>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Title / Topic:</span>
                        <div style={styles.valueBox}>{formData.scriptTitle || 'N/A'}</div>
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Platform:</span>
                        <div style={styles.valueBox}>{platformValue || 'N/A'}</div>
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Goal:</span>
                        <div style={styles.valueBox}>{goalValue || 'N/A'}</div>
                    </div>

                    <div style={{ ...styles.item, gridColumn: '1 / -1' }}>
                        <span style={styles.itemLabel}>Target Audience:</span>
                        <div style={styles.tagContainer}>
                            {(formData.targetAudience || []).length > 0 ? (
                                formData.targetAudience.map((chip, idx) => (
                                    <span key={idx} style={styles.badge}>
                                        {chip}
                                    </span>
                                ))
                            ) : (
                                <span style={{ color: '#6b7280' }}>None specified</span>
                            )}
                        </div>
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Tone:</span>
                        <div style={styles.valueBox}>{toneValue || 'N/A'}</div>
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Duration (seconds):</span>
                        <div style={styles.valueBox}>{String(formData.durationSeconds ?? 'N/A')}</div>
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Script Style:</span>
                        <div style={styles.valueBox}>{scriptStyleValue || 'N/A'}</div>
                    </div>

                    <h3 style={styles.sectionTitle}>⚙️ Advanced (if enabled)</h3>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Include Hook:</span>
                        <div style={styles.valueBox}>{formData.includeHook ? 'Yes' : 'No'}</div>
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Hook Style:</span>
                        <div style={styles.valueBox}>{formData.includeHook ? formData.hookStyle || 'N/A' : 'Disabled'}</div>
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>CTA:</span>
                        <div style={styles.valueBox}>{ctaValue || 'N/A'}</div>
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Narration POV:</span>
                        <div style={styles.valueBox}>{narrationValue || 'N/A'}</div>
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Output Format:</span>
                        <div style={styles.valueBox}>{formData.outputFormat || 'N/A'}</div>
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Structure Depth:</span>
                        <div style={styles.valueBox}>{structureDepthValue || 'N/A'}</div>
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Visual Tone:</span>
                        <div style={styles.valueBox}>{visualToneValue || 'N/A'}</div>
                    </div>

                    <div style={styles.item}>
                        <span style={styles.itemLabel}>Compliance Mode:</span>
                        <div style={styles.valueBox}>{formData.complianceMode || 'N/A'}</div>
                    </div>

                    <div style={{ ...styles.item, gridColumn: '1 / -1' }}>
                        <span style={styles.itemLabel}>Custom Instructions:</span>
                        <div style={styles.valueBox}>{formData.customInstructions || 'N/A'}</div>
                    </div>
                </div>

                <div style={styles.actionContainer}>
                    <button
                        type="button"
                        style={{ ...styles.btn, ...styles.btnOutline }}
                        onClick={onEdit}
                        disabled={isGenerating}
                    >
                        &lt; Edit
                    </button>
                    {typeof onViewLog === 'function' && (
                        <button
                            type="button"
                            style={{ ...styles.btn, ...styles.btnOutline }}
                            onClick={onViewLog}
                            disabled={isGenerating}
                        >
                            View History
                        </button>
                    )}
                    <button
                        type="button"
                        style={{ ...styles.btn, ...styles.btnPrimary }}
                        onClick={onGenerate}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <>
                                <span>Generating</span>
                                <div
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: 'white',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                        display: 'inline-block',
                                    }}
                                />
                            </>
                        ) : (
                            '🚀 Confirm & Generate Script'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SummaryReviewModal;
