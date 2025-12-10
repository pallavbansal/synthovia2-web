import React, { useState } from 'react';

/**
 * Renders a modal displaying generated caption & hashtag variants with options to copy or regenerate.
 * Layout and styling aligned with CopywritingAssistant VariantsModal design.
 */
const VariantModalContent = ({ variants, onClose, inputs, onRequestRegenerate, showNotification }) => {
    console.log("check it in VariantModalContent :",variants);
    const [expandedIndex, setExpandedIndex] = useState(0);
    const [regeneratingId, setRegeneratingId] = useState(null);

    const toggleExpand = (index) => {
        setExpandedIndex(index === expandedIndex ? null : index);
    };

    const handleCopy = (text, variantIndex) => {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            if (showNotification) {
                showNotification(`Variant ${variantIndex} copied to clipboard!`, 'success');
            }
        } catch (err) {
            if (showNotification) {
                showNotification('Failed to copy text.', 'error');
            }
        }
    };

    const handleRegenerate = async (variantId) => {
        if (!onRequestRegenerate) return;
        setRegeneratingId(variantId);
        try {
            await onRequestRegenerate(variantId);
        } finally {
            setRegeneratingId(null);
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
            const postLength = inputs?.post_length?.value || 'PostLength';

            link.href = url;
            link.download = `caption_variant_${index + 1}_${platform}_${postLength}.txt`.replace(/\s+/g, '_');

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            if (showNotification) {
                showNotification('Failed to download variant as a file.', 'error');
            }
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
            padding: '20px',
        },
        modal: {
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            width: '95%',
            maxWidth: '900px',
            maxHeight: '95vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
        },
        header: {
            padding: '20px 24px',
            borderBottom: '1px solid #e0e7ff',
            backgroundColor: '#f1f5f9',
            color: '#1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        body: {
            padding: '24px',
            backgroundColor: 'white',
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
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            fontWeight: '600',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid transparent',
            gap: '10px',
        },
        cardContent: {
            padding: '20px',
            whiteSpace: 'pre-wrap',
            fontSize: '14px',
            color: '#1f2937',
            backgroundColor: '#f9fafb',
            borderTop: '1px solid #e5e7eb',
        },
        title: {
            fontSize: '1.25rem',
            margin: 0,
            color: '#1e293b',
        },
        actionButton: {
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: '500',
            borderRadius: '4px',
            border: '1px solid #d1d5db',
            cursor: 'pointer',
            marginLeft: '8px',
            transition: 'background-color 0.15s ease-in-out',
        },
    };

    if (!variants || variants.length === 0) return null;

    // Fallback/Safety Check for Inputs object keys
    const platformLabel = inputs.platform?.value || 'Unknown Platform';
    const postLengthLabel = inputs.post_length?.value || 'Unknown Length';
    // Use the combined labels for display
    const contextLabel = `${platformLabel} (${postLengthLabel})`;

    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.modal}>
                <div style={modalStyles.header}>
                    <h2 style={modalStyles.title}>Generated Caption & Hashtag Variants ({variants.length})</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
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
                        Click on any variant to expand and view the full caption and hashtags. Use the Copy button to copy a variant.
                    </p>
                    {variants
                        .filter((v) => v.show_variant)
                        .map((variant, index) => {
                            const isExpanded = index === expandedIndex;
                            const isRegenerating = regeneratingId === variant.id;

                            return (
                                <div
                                    key={variant.id || index}
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
                                            backgroundColor: isExpanded ? '#e0f2fe' : '#ffffff',
                                            borderBottom: isExpanded ? '1px solid #93c5fd' : '1px solid transparent',
                                            color: isExpanded ? '#0369a1' : '#1f2937',
                                        }}
                                        onClick={() => toggleExpand(index)}
                                    >
                                        <span style={{ flexGrow: 1 }}>Variant {index + 1}: {contextLabel}</span>

                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ display: 'flex', alignItems: 'center' }}
                                        >
                                            <button
                                                style={{
                                                    ...modalStyles.actionButton,
                                                    backgroundColor: '#10b981',
                                                    color: 'white',
                                                    border: 'none',
                                                }}
                                                onClick={() => handleCopy(variant.content, index + 1)}
                                            >
                                                Copy
                                            </button>
                                            <button
                                                style={{
                                                    ...modalStyles.actionButton,
                                                    backgroundColor: isRegenerating ? '#9ca3af' : '#f97316',
                                                    color: 'white',
                                                    border: 'none',
                                                    cursor: isRegenerating ? 'wait' : 'pointer',
                                                }}
                                                onClick={() => handleRegenerate(variant.id)}
                                                disabled={isRegenerating}
                                            >
                                                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                                            </button>
                                            <button
                                                style={{
                                                    ...modalStyles.actionButton,
                                                    backgroundColor: '#3b82f6',
                                                    color: 'white',
                                                    border: 'none',
                                                }}
                                                onClick={() => handleDownload(variant, index)}
                                            >
                                                Download
                                            </button>
                                        </div>

                                        <span>{isExpanded ? '▲' : '▼'}</span>
                                    </div>
                                    {isExpanded && (
                                        <div style={modalStyles.cardContent}>
                                            <div
                                                style={{
                                                    margin: 0,
                                                    fontFamily: 'inherit',
                                                    whiteSpace: 'pre-wrap',
                                                }}
                                            >
                                                <p style={{ fontWeight: 'bold', margin: '0 0 8px 0' }}>Variant Content:</p>
                                                {variant.content}
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
                                padding: '10px 20px',
                                fontSize: '14px',
                                fontWeight: '500',
                                borderRadius: '6px',
                                border: '1px solid #d1d5db',
                                cursor: 'pointer',
                                backgroundColor: '#f9fafb',
                                color: '#4b5563',
                                transition: 'background-color 0.15s ease-in-out',
                            }}
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