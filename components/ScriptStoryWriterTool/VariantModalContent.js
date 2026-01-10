import React, { useEffect, useState } from 'react';
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
    const [expandedIndex, setExpandedIndex] = useState(0);
    const [regeneratingId, setRegeneratingId] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if ((variants || []).length > 0) setExpandedIndex(0);
    }, [variants?.length]);

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
            textarea.value = text || '';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            if (showNotification) showNotification(`Variant ${variantId} copied to clipboard!`, 'success');
        } catch (err) {
            if (showNotification) showNotification('Failed to copy text.', 'error');
        }
    };

    const handleDownload = (variant, index) => {
        if (!variant || !variant.content) {
            if (showNotification) showNotification('No content available to download for this variant.', 'error');
            return;
        }

        try {
            const blob = new Blob([variant.content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            const platform = inputs?.platform?.value || 'platform';
            link.href = url;
            link.download = `script_variant_${index + 1}_${platform}.txt`.replace(/\s+/g, '_');

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            if (showNotification) showNotification('Failed to download variant as a file.', 'error');
        }
    };

    const handleRegenerate = async (variantId) => {
        if (!onRequestRegenerate) return;

        setRegeneratingId(variantId);
        const indexToExpand = (variants || []).findIndex((v) => v.id === variantId);
        if (indexToExpand !== -1) setExpandedIndex(indexToExpand);

        try {
            await onRequestRegenerate(variantId);
        } finally {
            setRegeneratingId(null);
        }
    };

    const modalStyles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '12px' : '20px',
        },
        modal: {
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            width: '95%',
            maxWidth: '900px',
            maxHeight: '95vh',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
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
            padding: isMobile ? '14px 16px' : '20px 24px',
            borderBottom: '1px solid #e0e7ff',
            backgroundColor: '#f1f5f9',
            color: '#1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
            flexShrink: 0,
        },
        title: {
            fontSize: '1.25rem',
            margin: 0,
            color: '#1e293b',
        },
        body: {
            padding: isMobile ? '14px' : '24px',
            backgroundColor: 'white',
            flexGrow: 1,
            overflowY: 'auto',
        },
        card: {
            marginBottom: '16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            overflow: 'hidden',
            transition: 'all 0.3s ease-in-out',
        },
        cardHeader: {
            padding: '16px 20px',
            fontWeight: '600',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid transparent',
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
            padding: '20px',
            whiteSpace: 'pre-wrap',
            fontSize: '14px',
            color: '#1f2937',
            backgroundColor: '#f9fafb',
            borderTop: '1px solid #e5e7eb',
        },
        actionButton: {
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: '500',
            borderRadius: '4px',
            border: '1px solid #d1d5db',
            cursor: 'pointer',
            marginLeft: isMobile ? '0px' : '8px',
            transition: 'background-color 0.15s ease-in-out',
        },
    };

    if (isLoading) {
        return (
            <div style={modalStyles.overlay}>
                <div
                    style={{
                        ...modalStyles.modal,
                        maxWidth: '500px',
                        maxHeight: '400px',
                        padding: 0,
                        overflow: 'hidden',
                        height: 'auto',
                        flexShrink: 1,
                    }}
                >
                    <SurfingLoading mode={isHistoryView ? 'history' : 'generate'} />
                </div>
            </div>
        );
    }

    if (!variants || variants.length === 0) return null;

    const isAnyStreaming = (variants || []).some((v) => v && v.is_streaming);
    const isUILocked = regeneratingId !== null || isAnyStreaming;

    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.modal}>
                <div style={modalStyles.header}>
                    <h2 style={modalStyles.title}>
                        Generated Script Variants ({variants.length})
                        {isHistoryView && (
                            <span
                                style={{
                                    marginLeft: '10px',
                                    fontSize: '14px',
                                    color: '#94a3b8',
                                    fontWeight: '400',
                                }}
                            >
                                (History Log)
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={isUILocked}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: isUILocked ? 'not-allowed' : 'pointer',
                            color: '#4b5563',
                            padding: '4px',
                            lineHeight: 1,
                        }}
                    >
                        &times;
                    </button>
                </div>

                <div style={modalStyles.body}>
                    <p style={{ marginBottom: '20px', color: '#475569', fontSize: '14px' }}>
                        Click on any variant card to expand and view the full script.
                        {isUILocked && (
                            <span style={{ color: '#f97316', marginLeft: '8px' }}>(Wait for generation to complete)</span>
                        )}
                    </p>

                    {(variants || []).filter((v) => v?.show_variant !== false).map((variant, index) => {
                        const isExpanded = index === expandedIndex;
                        const isRegenerating = regeneratingId === variant.id;
                        const isInteractionDisabled = isUILocked || !variant?.id || !!variant?.is_streaming;
                        const contentToRender = variant?.content || '';

                        return (
                            <div
                                key={variant?.client_id || variant?.id || index}
                                style={{
                                    ...modalStyles.card,
                                    border: isExpanded ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                                    boxShadow: isExpanded
                                        ? '0 4px 8px -2px rgba(59, 130, 246, 0.2)'
                                        : '0 1px 3px rgba(0,0,0,0.05)',
                                    opacity: isRegenerating ? 0.6 : 1,
                                }}
                            >
                                <div
                                    style={{
                                        ...modalStyles.cardHeader,
                                        backgroundColor: isExpanded ? '#eff6ff' : '#f8fafc',
                                        borderBottom: isExpanded ? '1px solid #bfdbfe' : '1px solid transparent',
                                        cursor: isUILocked ? 'not-allowed' : 'pointer',
                                        pointerEvents: isUILocked ? 'none' : 'auto',
                                    }}
                                    onClick={() => toggleExpand(index)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ color: '#1e293b' }}>Variant {index + 1}</span>
                                        {variant?.is_streaming && (
                                            <span style={{ fontSize: '12px', color: '#f97316' }}>Streaming...</span>
                                        )}
                                    </div>
                                    <div
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
                                            type="button"
                                            style={{
                                                ...modalStyles.actionButton,
                                                backgroundColor: isInteractionDisabled ? '#e5e7eb' : '#f3f4f6',
                                                color: isInteractionDisabled ? '#9ca3af' : '#1f2937',
                                                cursor: isInteractionDisabled ? 'not-allowed' : 'pointer',
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopy(contentToRender, variant.id || index + 1);
                                            }}
                                            disabled={isInteractionDisabled}
                                        >
                                            Copy
                                        </button>

                                        <button
                                            type="button"
                                            style={{
                                                ...modalStyles.actionButton,
                                                backgroundColor: isInteractionDisabled ? '#e5e7eb' : '#f3f4f6',
                                                color: isInteractionDisabled ? '#9ca3af' : '#1f2937',
                                                cursor: isInteractionDisabled ? 'not-allowed' : 'pointer',
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(variant, index);
                                            }}
                                            disabled={isInteractionDisabled}
                                        >
                                            Download
                                        </button>

                                        <button
                                            type="button"
                                            style={{
                                                ...modalStyles.actionButton,
                                                backgroundColor: isInteractionDisabled ? '#e5e7eb' : '#f3f4f6',
                                                color: isInteractionDisabled ? '#9ca3af' : '#1f2937',
                                                cursor: isInteractionDisabled ? 'not-allowed' : 'pointer',
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRegenerate(variant.id);
                                            }}
                                            disabled={isInteractionDisabled || !onRequestRegenerate}
                                        >
                                            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                                        </button>

                                        <span style={{ marginLeft: isMobile ? '0px' : '12px', color: '#64748b' }}>
                                            {isExpanded ? '▲' : '▼'}
                                        </span>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div style={modalStyles.cardContent}>
                                        {variant?.is_streaming && !(variant?.content || '').trim() ? (
                                            <div style={{ padding: '8px 0' }}>
                                                <SurfingLoading mode={isHistoryView ? 'history' : 'generate'} />
                                            </div>
                                        ) : (
                                            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{contentToRender}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default VariantModalContent;
