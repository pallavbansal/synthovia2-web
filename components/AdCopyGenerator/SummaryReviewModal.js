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
    badgeSecondary: { backgroundColor: '#fcd34d', color: '#1f2937' },
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
    btnPrimary: { 
        backgroundColor: '#3b82f6', 
        color: 'white',
        '&:hover': {
            backgroundColor: '#2563eb',
        }
    },
    btnOutline: { 
        backgroundColor: 'white', 
        color: '#6b7280', 
        border: '1px solid #d1d5db',
        '&:hover': {
            backgroundColor: '#f9fafb',
        }
    },
};

const SummaryReviewModal = ({ formData, onGenerate, onEdit, isGenerating, onViewLog }) => {
    const getValueDisplay = (value) => {
        if (Array.isArray(value)) {
            return value.length > 0 ? value.join(', ') : 'None';
        }
        return value || 'Not specified';
    };

    return (
        <div style={styles.overlay} onClick={onEdit}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Review Your Ad Copy Selections</h2>
                    <button style={styles.closeButton} onClick={onEdit}>
                        ×
                    </button>
                </div>

                <div style={styles.body}>
                    <h3 style={styles.sectionTitle}>🎯 Campaign Details</h3>
                    
                    <div style={{...styles.item, gridColumn: 'span 1'}}>
                        <span style={styles.itemLabel}>Platform:</span>
                        <div style={styles.valueBox}>{formData.platform}</div>
                    </div>
                    
                    <div style={{...styles.item, gridColumn: 'span 1'}}>
                        <span style={styles.itemLabel}>Placement:</span>
                        <div style={styles.valueBox}>{formData.placement}</div>
                    </div>
                    
                    <div style={{...styles.item, gridColumn: 'span 1'}}>
                        <span style={styles.itemLabel}>Campaign Objective:</span>
                        <div style={styles.valueBox}>
                            {formData.campaignObjective}
                            {formData.customObjective && ` (${formData.customObjective})`}
                        </div>
                    </div>
                    
                    <div style={{...styles.item, gridColumn: 'span 1'}}>
                        <span style={styles.itemLabel}>Target Audience:</span>
                        <div style={styles.tagContainer}>
                            {formData.targetAudience && formData.targetAudience.length > 0 ? (
                                formData.targetAudience.map((item, index) => (
                                    <span key={index} style={{ ...styles.badge, ...styles.badgePrimary }}>
                                        {item}
                                    </span>
                                ))
                            ) : (
                                <span style={{ color: '#6b7280' }}>None specified</span>
                            )}
                        </div>
                    </div>

                    <h3 style={styles.sectionTitle}>📝 Ad Content</h3>
                    
                    <div style={{...styles.item, gridColumn: '1 / -1'}}>
                        <span style={styles.itemLabel}>Product/Services:</span>
                        <div style={styles.valueBox}>
                            {formData.productServices || 'Not specified'}
                        </div>
                    </div>
                    
                    <div style={{...styles.item, gridColumn: '1 / -1'}}>
                        <span style={styles.itemLabel}>Key Benefits/Features:</span>
                        <div style={styles.tagContainer}>
                            {formData.keyBenefits && formData.keyBenefits.length > 0 ? (
                                formData.keyBenefits.map((benefit, index) => (
                                    <span key={index} style={{ ...styles.badge, ...styles.badgeSuccess }}>
                                        {benefit}
                                    </span>
                                ))
                            ) : (
                                <span style={{ color: '#6b7280' }}>None specified</span>
                            )}
                        </div>
                    </div>

                    <h3 style={styles.sectionTitle}>⚙️ Advanced Settings</h3>
                    
                    <div style={{...styles.item, gridColumn: 'span 1'}}>
                        <span style={styles.itemLabel}>Tone:</span>
                        <div style={styles.valueBox}>
                            {formData.tone}
                        </div>
                    </div>
                    
                    <div style={{...styles.item, gridColumn: 'span 1'}}>
                        <span style={styles.itemLabel}>Headline Focus:</span>
                        <div style={styles.valueBox}>
                            {formData.headlineFocus}
                        </div>
                    </div>
                    
                    <div style={{...styles.item, gridColumn: 'span 1'}}>
                        <span style={styles.itemLabel}>Text Length:</span>
                        <div style={styles.valueBox}>
                            {formData.adTextLength}
                        </div>
                    </div>
                    
                    <div style={{...styles.item, gridColumn: 'span 1'}}>
                        <span style={styles.itemLabel}>CTA Type:</span>
                        <div style={styles.valueBox}>
                            {formData.ctaType}
                        </div>
                    </div>
                    
                    <div style={{...styles.item, gridColumn: 'span 1'}}>
                        <span style={styles.itemLabel}>Emotional Angle:</span>
                        <div style={styles.valueBox}>
                            {formData.emotionalAngle}
                        </div>
                    </div>
                    
                    <div style={{...styles.item, gridColumn: 'span 1'}}>
                        <span style={styles.itemLabel}>Number of Variants:</span>
                        <div style={styles.valueBox}>
                            {formData.variants}
                        </div>
                    </div>

                    {formData.usp && (
                        <div style={{...styles.item, gridColumn: '1 / -1'}}>
                            <span style={styles.itemLabel}>Unique Selling Proposition (USP):</span>
                            <div style={styles.valueBox}>
                                {formData.usp}
                            </div>
                        </div>
                    )}
                    
                    {formData.complianceNote && (
                        <div style={{...styles.item, gridColumn: '1 / -1'}}>
                            <span style={styles.itemLabel}>Compliance Note:</span>
                            <div style={styles.valueBox}>
                                {formData.complianceNote}
                            </div>
                        </div>
                    )}
                </div>

                <div style={styles.actionContainer}>
                    <button
                        type="button"
                        style={{ ...styles.btn, ...styles.btnOutline }}
                        onClick={onEdit}
                        disabled={isGenerating}
                    >
                        &lt; Edit Selections
                    </button>
                    <button
                        type="button"
                        style={{ ...styles.btn, ...styles.btnOutline }}
                        onClick={onViewLog}
                        disabled={isGenerating}
                    >
                        View History
                    </button>
                    <button
                        type="button"
                        style={{ ...styles.btn, ...styles.btnPrimary }}
                        onClick={onGenerate}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
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
                                }} />
                            </>
                        ) : '🚀 Generate Ad Copy'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SummaryReviewModal;
