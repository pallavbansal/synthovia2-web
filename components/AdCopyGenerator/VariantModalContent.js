import React, { useState, useEffect } from 'react';
// Assuming SurfingLoading is imported correctly and accessible
import SurfingLoading from './SurfingLoading'; 


const VariantModalContent = ({ 
    variants, 
    onClose, 
    inputs, 
    onRequestRegenerate, 
    showNotification,
    isLoading, 
    isHistoryView = false,
    isStreaming = false,
}) => {
    
    const [expandedIndex, setExpandedIndex] = useState(0); 
    const [regeneratingId, setRegeneratingId] = useState(null);

    useEffect(() => {
        if (variants.length > 0) {
            setExpandedIndex(0);
        }
    }, [variants.length]);


    const toggleExpand = (index) => {
        // This function is implicitly blocked via pointerEvents: none on the UI element.
        setExpandedIndex(index === expandedIndex ? null : index);
    };

    // --- Action Handlers ---

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
    
    const handleDownload = (variant, index) => {
        if (!variant || !variant.content) {
            if (showNotification) {
                showNotification('No content available to download for this variant.', 'error');
            }
            return;
        }

        try {
            const blob = new Blob([variant.content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            const platform = inputs?.platform?.value || 'Platform';
            const textLength = inputs?.adTextLength?.value || 'TextLength'; 

            link.href = url;
            link.download = `adcopy_variant_${index + 1}_${platform}_${textLength}.txt`.replace(/\s+/g, '_');

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            if (showNotification) {
                showNotification('Failed to download variant as a file.', 'error');
            }
            return;
        }
    };
    
    const handleRegenerate = async (variantId) => {
        setRegeneratingId(variantId);

        // Ensure the current variant is expanded to show the typing
        const indexToExpand = variants.findIndex(v => v.id === variantId);
        if (indexToExpand !== -1) {
            setExpandedIndex(indexToExpand);
        }
        
        try {
            await onRequestRegenerate(variantId);
        } finally {
            setRegeneratingId(null);
        }
    };

    // --- Styles (Retained) ---
    const modalStyles = {
        overlay: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(30, 41, 59, 0.9)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        },
        modal: {
            backgroundColor: 'white', borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)', width: '95%', maxWidth: '900px',
            maxHeight: '95vh', height: '100%', display: 'flex', flexDirection: 'column',
            overflowY: 'hidden', 
        },
        header: {
            padding: '20px 24px', borderBottom: '1px solid #e0e7ff', 
            backgroundColor: '#f1f5f9', color: '#1e293b', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', zIndex: 10, flexShrink: 0, 
        },
        body: {
            padding: '24px', backgroundColor: 'white',
            flexGrow: 1, overflowY: 'auto', 
        },
        card: {
            marginBottom: '16px', border: '1px solid #d1d5db',
            borderRadius: '8px', overflow: 'hidden', transition: 'all 0.3s ease-in-out',
        },
        cardHeader: {
            padding: '16px 20px', fontWeight: '600', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid transparent',
            gap: '10px',
        },
        cardContent: {
            padding: '20px', whiteSpace: 'pre-wrap', fontSize: '14px',
            color: '#1f2937', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb',
        },
        title: {
            fontSize: '1.25rem', margin: 0, color: '#1e293b',
        },
        actionButton: {
            padding: '6px 12px', fontSize: '13px', fontWeight: '500',
            borderRadius: '4px', border: '1px solid #d1d5db', cursor: 'pointer',
            marginLeft: '8px', transition: 'background-color 0.15s ease-in-out',
        }
    };
    // --- End Styles ---
    
    if (isLoading) {
        return (
            <div style={modalStyles.overlay}>
                <div style={{ 
                    ...modalStyles.modal, 
                    maxWidth: '500px', maxHeight: '400px', padding: 0,
                    overflow: 'hidden', height: 'auto', flexShrink: 1,
                }}>
                    <SurfingLoading mode={isHistoryView ? 'history' : 'generate'} /> 
                </div>
            </div>
        );
    }
    
    if (!variants || variants.length === 0) return null;

    // **FIXED LOGIC:** Calculate Global Lock States OUTSIDE the map
    
    const isUILocked = regeneratingId !== null;
    
    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.modal}>
                <div style={modalStyles.header}>
                    <h2 style={modalStyles.title}>Generated Ad Copy Variants ({variants.length})
                        {isHistoryView && (
                            <span style={{ marginLeft: '10px', fontSize: '14px', color: '#94a3b8', fontWeight: '400' }}>
                                (History Log)
                            </span>
                        )}
                        {isStreaming && !isHistoryView && (
                            <span style={{ marginLeft: '10px', fontSize: '14px', color: '#94a3b8', fontWeight: '400' }}>
                                (Streaming)
                            </span>
                        )}
                    </h2>
                    {/* ENFORCE GLOBAL LOCK: Close Button */}
                    <button 
                        onClick={onClose} 
                        disabled={isUILocked}
                        style={{
                            background: 'none', border: 'none', fontSize: '24px', 
                            cursor: isUILocked ? 'not-allowed' : 'pointer', 
                            color: '#4b5563', padding: '4px', lineHeight: 1
                        }}
                    >
                        &times;
                    </button>
                </div>
                
                <div style={modalStyles.body}>
                    
                    <p style={{marginBottom: '20px', color: '#475569', fontSize: '14px'}}>
                        Click on any variant card to expand and view the full ad copy.
                        {isUILocked && (
                            <span style={{ color: '#f97316', marginLeft: '8px' }}>
                                (Wait for generation to complete)
                            </span>
                        )}
                    </p>
                    
                    {variants.filter(v => v.show_variant).map((variant, index) => {
                        const isExpanded = index === expandedIndex;
                        const isRegenerating = regeneratingId === variant.id;

                        // The lock condition for elements in this map is the global lock state
                        const isInteractionDisabled = isUILocked;
                        const isVariantStreaming = !!variant?.is_streaming;

                        const contentToRender = variant?.content || '';

                        return (
                            <div key={variant?.client_id || variant?.id || index} style={{
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

                                        // ENFORCE GLOBAL LOCK: Variant Header (Collapsing/Expanding)
                                        cursor: isInteractionDisabled ? 'wait' : 'pointer',
                                        pointerEvents: isInteractionDisabled ? 'none' : 'auto',
                                    }}
                                    onClick={() => toggleExpand(index)}
                                >
                                    <span style={{flexGrow: 1}}>Variant {index + 1}: {inputs.platform?.value} ({inputs.placement?.value})</span>

                                    {isVariantStreaming && (!contentToRender || contentToRender.trim().length === 0) && (
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                                            Generating...
                                        </span>
                                    )}

                                    <div onClick={(e) => e.stopPropagation()} style={{display: 'flex', alignItems: 'center'}}>
                                        <button 
                                            style={{
                                                ...modalStyles.actionButton,
                                                backgroundColor: '#10b981', color: 'white', border: 'none',
                                            }}
                                            onClick={() => handleCopy(contentToRender, index + 1)}
                                            // ENFORCE GLOBAL LOCK: Copy Button
                                            disabled={isInteractionDisabled || isVariantStreaming}
                                        >
                                            Copy
                                        </button>

                                        <button 
                                            style={{
                                                ...modalStyles.actionButton,
                                                backgroundColor: isInteractionDisabled ? '#9ca3af' : '#f97316',
                                                color: 'white',
                                                border: 'none',
                                                // Disable if currently regenerating (API call) OR if any typing is active
                                                cursor: isInteractionDisabled ? 'wait' : 'pointer'
                                            }}
                                            onClick={() => handleRegenerate(variant.id)}
                                            // ENFORCE GLOBAL LOCK: Regenerate Button
                                            disabled={isInteractionDisabled || isVariantStreaming || !variant?.id}
                                        >
                                            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                                        </button>

                                        <button
                                            style={{
                                                ...modalStyles.actionButton,
                                                backgroundColor: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                cursor: isInteractionDisabled ? 'default' : 'pointer'
                                            }}
                                            onClick={() => handleDownload({ ...variant, content: contentToRender }, index)}
                                            // ENFORCE GLOBAL LOCK: Download Button
                                            disabled={isInteractionDisabled || isVariantStreaming}
                                        >
                                            Download
                                        </button>
                                    </div>

                                    <span style={{ opacity: isInteractionDisabled ? 0.3 : 1 }}>{isExpanded ? '▲' : '▼'}</span>
                                </div>

                                {isExpanded && (
                                    <div style={modalStyles.cardContent}>
                                        <div style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
                                            <p style={{ fontWeight: 'bold', margin: '0 0 8px 0' }}>Variant Content:</p>

                                            {isVariantStreaming && (!contentToRender || contentToRender.trim().length === 0) ? (
                                                <SurfingLoading mode="generate" embedded={true} />
                                            ) : (
                                                <p style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap', color: '#1f2937' }}>
                                                    {contentToRender}
                                                </p>
                                            )}
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
                                ...modalStyles.actionButton,
                                padding: '10px 20px', 
                                backgroundColor: '#f9fafb',
                                color: '#4b5563',
                                border: '1px solid #d1d5db', 
                            }}
                            // ENFORCE GLOBAL LOCK: Close Modal Button
                            disabled={isUILocked}
                        >
                            Close Modal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariantModalContent;