import React, { useState, useEffect } from 'react';
import SurfingLoading from './SurfingLoading';

const TypingEffect = ({ text }) => {
    return (
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{text}</p>
    );
};

// --- NEW: Hashtag Grid System Component ---
const HashtagGridSystem = ({ text }) => {
    // Logic to separate the main body from the hashtags section
    const parts = text.split(/Hashtags:/i);
    const bodyText = parts[0];
    const hashtagPart = parts[1] || "";

    // Extract hashtags based on # symbol
    const tags = hashtagPart.trim().split(/\s+/).filter(tag => tag.startsWith('#'));

    if (tags.length === 0) return <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{text}</p>;

    return (
        <div>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', marginBottom: '16px' }}>{bodyText.trim()}</p>
            
            <p style={{ fontWeight: 'bold', margin: '0 0 8px 0', color: '#1e293b' }}>Hashtags:</p>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px 12px',
                backgroundColor: '#111827', // Dark professional background
                padding: '16px',
                borderRadius: '8px',
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontSize: '13px',
                border: '1px solid #374151'
            }}>
                {tags.map((tag, idx) => (
                    <div key={idx} style={{ 
                        color: '#ff4b4b', // Proper red hashtags as per screenshot
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {tag}
                    </div>
                ))}
            </div>
        </div>
    );
};


const VariantModalContent = ({ 
    variants, 
    onClose, 
    inputs, 
    onRequestRegenerate, 
    showNotification,
    isLoading, 
    isHistoryView = false,
}) => {
    
    const [expandedIndex, setExpandedIndex] = useState(0); 
    const [regeneratingId, setRegeneratingId] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const updateIsMobile = () => {
            setIsMobile(window.innerWidth <= 480);
        };

        updateIsMobile();
        window.addEventListener('resize', updateIsMobile);
        return () => window.removeEventListener('resize', updateIsMobile);
    }, []);

    const toggleExpand = (index) => {
        setExpandedIndex(index === expandedIndex ? null : index);
    };

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

    const modalStyles = {
        overlay: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(30, 41, 59, 0.9)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '12px' : '20px'
        },
        modal: {
            backgroundColor: 'white', borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)', width: '95%', maxWidth: '900px',
            maxHeight: '95vh', height: '100%', display: 'flex', flexDirection: 'column',
            overflowY: 'hidden', 
            ...(isMobile
                ? {
                      width: '100%',
                      maxWidth: '100%',
                      maxHeight: '90vh',
                      height: 'auto',
                  }
                : null),
        },
        header: {
            padding: isMobile ? '14px 16px' : '20px 24px', borderBottom: '1px solid #e0e7ff', 
            backgroundColor: '#f1f5f9', color: '#1e293b', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', zIndex: 10, flexShrink: 0, 
        },
        body: {
            padding: isMobile ? '14px' : '24px', backgroundColor: 'white',
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
            ...(isMobile
                ? {
                      flexWrap: 'wrap',
                      alignItems: 'flex-start',
                      padding: '12px 14px',
                  }
                : null),
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
            marginLeft: isMobile ? '0px' : '8px', transition: 'background-color 0.15s ease-in-out',
        }
    };
    
    if (isLoading) {
        return (
            <div style={modalStyles.overlay}>
                <div style={{
                    ...modalStyles.modal,
                    maxWidth: '500px',
                    maxHeight: '400px',
                    padding: 0,
                    overflow: 'hidden',
                    height: 'auto',
                    flexShrink: 1,
                }}>
                    <SurfingLoading mode={isHistoryView ? 'history' : 'generate'} />
                </div>
            </div>
        );
    }

    
    if (!variants || variants.length === 0) return null;

    const isAnyStreaming = (variants || []).some(v => v && v.is_streaming);
    const isUILocked = (regeneratingId !== null) || isAnyStreaming;

    
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
                    </h2>
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
                        const isInteractionDisabled = isUILocked || !variant?.id || variant?.is_streaming;

                        return (
                            <div key={variant.id || index} style={{
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
                                        cursor: isInteractionDisabled ? 'wait' : 'pointer',
                                        pointerEvents: isInteractionDisabled ? 'none' : 'auto', 
                                    }}
                                    onClick={() => toggleExpand(index)}
                                >
                                    <span style={{flexGrow: 1, minWidth: 0}}>Variant {index + 1}: {inputs.platform?.value} ({inputs.placement?.value})</span>
                                    
                                    <div 
                                        onClick={(e) => e.stopPropagation()} 
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            flexWrap: isMobile ? 'wrap' : 'nowrap',
                                            gap: isMobile ? '8px' : '0px',
                                            width: isMobile ? '100%' : 'auto',
                                            justifyContent: isMobile ? 'flex-start' : 'flex-end',
                                        }}
                                    >
                                        <button 
                                            style={{
                                                ...modalStyles.actionButton,
                                                backgroundColor: '#10b981', color: 'white', border: 'none',
                                            }}
                                            onClick={() => handleCopy(variant.content, index + 1)}
                                            disabled={isInteractionDisabled} 
                                        >
                                            Copy
                                        </button>

                                        <button 
                                            style={{
                                                ...modalStyles.actionButton,
                                                backgroundColor: isInteractionDisabled ? '#9ca3af' : '#f97316', 
                                                color: 'white', 
                                                border: 'none',
                                                cursor: isInteractionDisabled ? 'wait' : 'pointer'
                                            }}
                                            onClick={() => handleRegenerate(variant.id)}
                                            disabled={isInteractionDisabled} 
                                        >
                                            {isRegenerating ? 'Regenerating...' : (variant?.is_streaming ? 'Generating...' : 'Regenerate')}
                                        </button>
                                        
                                        <button
                                            style={{
                                                ...modalStyles.actionButton,
                                                backgroundColor: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                cursor: isInteractionDisabled ? 'default' : 'pointer'
                                            }}
                                            onClick={() => handleDownload(variant, index)}
                                            disabled={isInteractionDisabled}
                                        >
                                            Download
                                        </button>
                                    </div>
                                    <span style={{ opacity: isInteractionDisabled ? 0.3 : 1 }}>{isExpanded ? '▲' : '▼'}</span>
                                </div>
                                
                                {isExpanded && (
                                    <div style={modalStyles.cardContent}>
                                        <div style={{ margin: 0, fontFamily: 'inherit' }}>
                                            <p style={{ fontWeight: 'bold', margin: '0 0 8px 0' }}>Variant Content:</p>

                                            {variant?.is_streaming && !(variant?.content || '').trim() ? (
                                                <div style={{ padding: '8px 0' }}>
                                                    <SurfingLoading mode={isHistoryView ? 'history' : 'generate'} />
                                                </div>
                                            ) : (
                                                <HashtagGridSystem text={variant.content} />
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