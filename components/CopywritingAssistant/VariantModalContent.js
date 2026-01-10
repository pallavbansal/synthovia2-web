import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
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
}) => {
    console.log("check copy response:",variants);
    const [expandedIndex, setExpandedIndex] = useState(0); 
    const [regeneratingId, setRegeneratingId] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        if (variants.length > 0) {
            setExpandedIndex(0);
        }
    }, [variants.length, isHistoryView]);

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

            // Use generic fallback text since specific input names like 'platform' are missing here
            const useCase = inputs?.use_case?.value || 'N/A Use Case';
            const language = inputs?.language?.value || 'N/A Language'; 

            link.href = url;
            link.download = `copywriting_variant_${index + 1}_${useCase}_${language}.txt`.replace(/\s+/g, '_');

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

    const processContent = (content) => {
        if (!content) return '';
        // Replace <strong> tags with markdown ** **
        return content
            .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
            .replace(/<b>(.*?)<\/b>/g, '**$1**');
    };

    const markdownComponents = {
        h1: ({ children, ...props }) => (
            <h1
                style={{
                    color: '#111827',
                    fontSize: '28px',
                    lineHeight: 1.2,
                    fontWeight: 700,
                    margin: '0 0 12px 0',
                }}
                {...props}
            >
                {children}
            </h1>
        ),
        h2: ({ children, ...props }) => (
            <h2
                style={{
                    color: '#111827',
                    fontSize: '22px',
                    lineHeight: 1.25,
                    fontWeight: 700,
                    margin: '16px 0 10px 0',
                }}
                {...props}
            >
                {children}
            </h2>
        ),
        h3: ({ children, ...props }) => (
            <h3
                style={{
                    color: '#111827',
                    fontSize: '18px',
                    lineHeight: 1.3,
                    fontWeight: 700,
                    margin: '14px 0 8px 0',
                }}
                {...props}
            >
                {children}
            </h3>
        ),
        h4: ({ children, ...props }) => (
            <h4
                style={{
                    color: '#111827',
                    fontSize: '16px',
                    lineHeight: 1.35,
                    fontWeight: 700,
                    margin: '12px 0 6px 0',
                }}
                {...props}
            >
                {children}
            </h4>
        ),
        h5: ({ children, ...props }) => (
            <h5
                style={{
                    color: '#111827',
                    fontSize: '14px',
                    lineHeight: 1.4,
                    fontWeight: 700,
                    margin: '10px 0 6px 0',
                }}
                {...props}
            >
                {children}
            </h5>
        ),
        h6: ({ children, ...props }) => (
            <h6
                style={{
                    color: '#111827',
                    fontSize: '13px',
                    lineHeight: 1.4,
                    fontWeight: 700,
                    margin: '10px 0 6px 0',
                }}
                {...props}
            >
                {children}
            </h6>
        ),
    };

    // --- Styles (Retained) ---
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
    const isAnyStreaming = (variants || []).some((v) => !!v?.is_streaming);
    const isUILocked = isAnyStreaming || (regeneratingId !== null);
    
    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.modal}>
                <div style={modalStyles.header}>
                    {/* Updated Title */}
                    <h2 style={modalStyles.title}>Generated Copywriting Variants ({variants.length})
                        {isHistoryView && (
                            <span style={{ marginLeft: '10px', fontSize: '14px', color: '#94a3b8', fontWeight: '400' }}>
                                (History Log)
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
                        Click on any variant card to expand and view the full copy.
                        {isUILocked && (
                            <span style={{ color: '#f97316', marginLeft: '8px' }}>
                                (Wait for generation to complete)
                            </span>
                        )}
                    </p>
                    
                    {variants.filter(v => v.show_variant).map((variant, index) => {
                        const isExpanded = index === expandedIndex;
                        const isRegenerating = regeneratingId === variant.id;
                        
                        const isInteractionDisabled = isUILocked || !variant?.id || !!variant?.is_streaming;

                        let contentToRender = processContent(variant.content);

                        // Safely access copywriting fields
                        const displayUseCase = inputs?.use_case?.value || 'Content';
                        const displayLanguage = inputs?.language?.value || 'N/A';
                        const displayTone = inputs?.tone_of_voice?.value || 'N/A';

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
                                        
                                        // ENFORCE GLOBAL LOCK: Variant Header (Collapsing/Expanding)
                                        cursor: isInteractionDisabled ? 'wait' : 'pointer',
                                        pointerEvents: isInteractionDisabled ? 'none' : 'auto', 
                                    }}
                                    onClick={() => toggleExpand(index)}
                                >
                                    {/* FIX APPLIED HERE: Use Copywriting Assistant Keys */}
                                    <span style={{flexGrow: 1, minWidth: 0}}>
                                        Variant {index + 1}: {displayUseCase} ({displayLanguage}, {displayTone})
                                    </span>
                                    
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
                                            onClick={() => handleCopy(contentToRender, index + 1)}
                                            // ENFORCE GLOBAL LOCK: Copy Button
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
                                                // Disable if currently regenerating (API call) OR if any typing is active
                                                cursor: isInteractionDisabled ? 'wait' : 'pointer'
                                            }}
                                            onClick={() => handleRegenerate(variant.id)}
                                            // ENFORCE GLOBAL LOCK: Regenerate Button
                                            disabled={isInteractionDisabled} 
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
                                            onClick={() => handleDownload(variant, index)}
                                            // ENFORCE GLOBAL LOCK: Download Button
                                            disabled={isInteractionDisabled}
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
                                            
                                            <div style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap', color: '#1f2937'}}>
                                                <ReactMarkdown components={markdownComponents}>{contentToRender}</ReactMarkdown>
                                            </div>
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