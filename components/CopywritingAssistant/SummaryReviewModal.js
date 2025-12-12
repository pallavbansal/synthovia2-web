// components/CopywritingAssistant/SummaryReviewModal.js

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
    maxWidth: '800px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    zIndex: 1001,
    maxHeight: '85vh',
    overflowY: 'auto',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
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
    gap: '8px',
  },
  btnGenerate: {
    backgroundColor: '#10b981',
    color: 'white',
  },
  btnOutline: {
    backgroundColor: 'white',
    color: '#6b7280',
    border: '1px solid #d1d5db',
  },
};

const SummaryReviewModal = ({
  formData,
  useCaseOptions,
  toneOptions,
  languageOptions,
  lengthTargetOptions,
  ctaStyleOptions,
  readingLevelOptions,
  targetPlatformOptions,
  contentStyleOptions,
  emotionalIntentOptions,
  writingFrameworkOptions,
  outputStructureOptions,
  grammarStrictnessOptions,
  formattingOptionsList,
  onGenerate,
  onEdit,
  onViewLog,
  isGenerating,
}) => {
  const findLabel = (options, value) => {
    const match = (options || []).find((opt) => opt.value === value || opt.key === value);
    return match?.label || value || 'N/A';
  };

  const getFormattingLabels = () => {
    return (formData.formattingOptions || []).map((val) => {
      const match = (formattingOptionsList || []).find(
        (opt) => opt.key === val || opt.value === val
      );
      return match?.label || val;
    });
  };

  const renderListValue = (value) => {
    if (Array.isArray(value)) {
      if (!value.length) return 'N/A';
      return value.join(', ');
    }
    return value || 'N/A';
  };

  return (
    <div style={styles.overlay} onClick={onEdit}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Review & Confirm Copywriting Request</h2>
          <button style={styles.closeButton} onClick={onEdit}>
            ×
          </button>
        </div>

        <div style={styles.body}>
          <h3 style={styles.sectionTitle}>🎯 Core Request Details</h3>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Use Case Mode:</span>
            <div style={styles.valueBox}>
              {formData.useCaseMode === 'custom' ? 'Custom' : 'Predefined'}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Use Case:</span>
            <div style={styles.valueBox}>
              {formData.useCaseMode === 'custom'
                ? formData.customUseCase || 'N/A'
                : findLabel(useCaseOptions, formData.useCase)}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Tone Mode:</span>
            <div style={styles.valueBox}>
              {formData.toneMode === 'custom' ? 'Custom' : 'Predefined'}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Tone of Voice:</span>
            <div style={styles.valueBox}>
              {formData.toneMode === 'custom'
                ? formData.customTone || 'N/A'
                : findLabel(toneOptions, formData.toneOfVoice)}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Primary Goal:</span>
            <div style={styles.valueBox}>{formData.primaryGoal || 'N/A'}</div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Target Audience Mode:</span>
            <div style={styles.valueBox}>
              {/* Mirrors targetAudience handling in the form (multi-tag vs text) */}
              {Array.isArray(formData.targetAudience) ? 'Multi-Segment' : 'Single Description'}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Target Audience:</span>
            <div style={styles.valueBox}>{renderListValue(formData.targetAudience)}</div>
          </div>

          <div style={{ ...styles.item, gridColumn: '1 / -1' }}>
            <span style={styles.itemLabel}>Key Points:</span>
            <div style={styles.valueBox}>{formData.keyPoints || 'No key points provided.'}</div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Website / Copy Context:</span>
            <div style={styles.valueBox}>{formData.websiteCopy || 'N/A'}</div>
          </div>

          <h3 style={styles.sectionTitle}>⚙️ Advanced Customization</h3>

          {/* Language */}
          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Language Mode:</span>
            <div style={styles.valueBox}>
              {formData.languageMode === 'custom' ? 'Custom' : 'Predefined'}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Language / Locale:</span>
            <div style={styles.valueBox}>
              {formData.languageMode === 'custom'
                ? formData.customLanguage || 'N/A'
                : findLabel(languageOptions, formData.language)}
            </div>
          </div>

          {/* Length Target */}
          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Length Target:</span>
            <div style={styles.valueBox}>
              {findLabel(lengthTargetOptions, formData.lengthTarget)}
              {formData.lengthTarget === 'custom' && formData.customWordCount
                ? ` (${formData.customWordCount} words)`
                : ''}
            </div>
          </div>

          {/* Variants & Creativity */}
          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Variants & Creativity:</span>
            <div style={styles.valueBox}>
              Variants: {formData.variants} | Creativity: {formData.creativityLevel}/10
            </div>
          </div>

          {/* Keywords */}
          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Keywords:</span>
            <div style={styles.valueBox}>{formData.keywords || 'N/A'}</div>
          </div>

          {/* CTA Style */}
          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>CTA Style Mode:</span>
            <div style={styles.valueBox}>
              {formData.ctaStyleMode === 'custom' ? 'Custom' : 'Predefined'}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>CTA Style:</span>
            <div style={styles.valueBox}>
              {formData.ctaStyleMode === 'custom'
                ? formData.customCtaStyle || 'N/A'
                : (formData.ctaStyle
                    ? findLabel(ctaStyleOptions, formData.ctaStyle)
                    : 'N/A')}
            </div>
          </div>

          {/* Reference Text / Rewrite */}
          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Reference Text:</span>
            <div style={styles.valueBox}>{formData.referenceText || 'N/A'}</div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Rewrite Mode:</span>
            <div style={styles.valueBox}>{formData.rewriteMode ? 'Enabled' : 'Disabled'}</div>
          </div>

          {/* Reading Level */}
          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Reading Level Mode:</span>
            <div style={styles.valueBox}>
              {formData.readingLevelMode === 'custom' ? 'Custom' : 'Predefined'}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Reading Level:</span>
            <div style={styles.valueBox}>
              {formData.readingLevelMode === 'custom'
                ? formData.customReadingLevel || 'N/A'
                : findLabel(readingLevelOptions, formData.readingLevel)}
            </div>
          </div>

          {/* Target Platform */}
          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Platform Mode:</span>
            <div style={styles.valueBox}>
              {formData.targetPlatformMode === 'custom' ? 'Custom' : 'Predefined'}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Target Platform:</span>
            <div style={styles.valueBox}>
              {formData.targetPlatformMode === 'custom'
                ? formData.customTargetPlatform || 'N/A'
                : (formData.targetPlatform
                    ? findLabel(targetPlatformOptions, formData.targetPlatform)
                    : 'Any Platform')}
            </div>
          </div>

          {/* Brand Voice */}
          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Brand Voice Mode:</span>
            <div style={styles.valueBox}>
              {formData.brandVoiceMode === 'custom' ? 'Custom' : 'Predefined'}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Brand Voice Reference:</span>
            <div style={styles.valueBox}>
              {formData.brandVoiceMode === 'custom'
                ? formData.customBrandVoice || 'N/A'
                : (formData.brandVoice || 'N/A')}
            </div>
          </div>

          {/* Content Style Preference */}
          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Content Style Mode:</span>
            <div style={styles.valueBox}>
              {formData.contentStyleMode === 'custom' ? 'Custom' : 'Predefined'}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Content Style Preference:</span>
            <div style={styles.valueBox}>
              {formData.contentStyleMode === 'custom'
                ? formData.customContentStyle || 'N/A'
                : (formData.contentStyle
                    ? findLabel(contentStyleOptions, formData.contentStyle)
                    : 'N/A')}
            </div>
          </div>

          {/* Emotional Intent */}
          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Emotional Intent Mode:</span>
            <div style={styles.valueBox}>
              {formData.emotionalIntentMode === 'custom' ? 'Custom' : 'Predefined'}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Emotional Intent:</span>
            <div style={styles.valueBox}>
              {formData.emotionalIntentMode === 'custom'
                ? formData.customEmotionalIntent || 'N/A'
                : (formData.emotionalIntent
                    ? findLabel(emotionalIntentOptions, formData.emotionalIntent)
                    : 'Neutral')}
            </div>
          </div>

          {/* Include / Exclude Words */}
          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Include Words:</span>
            <div style={styles.valueBox}>{renderListValue(formData.includeWords)}</div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Exclude Words:</span>
            <div style={styles.valueBox}>{renderListValue(formData.excludeWords)}</div>
          </div>

          {/* Writing Framework */}
          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Writing Framework Mode:</span>
            <div style={styles.valueBox}>
              {formData.writingFrameworkMode === 'custom' ? 'Custom' : 'Predefined'}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Writing Framework:</span>
            <div style={styles.valueBox}>
              {formData.writingFrameworkMode === 'custom'
                ? formData.customWritingFramework || 'N/A'
                : (formData.writingFramework
                    ? findLabel(writingFrameworkOptions, formData.writingFramework)
                    : 'Standard')}
            </div>
          </div>

          {/* Output Structure */}
          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Output Structure:</span>
            <div style={styles.valueBox}>
              {findLabel(outputStructureOptions, formData.outputStructure)}
            </div>
          </div>

          {/* Formatting & Proofreading */}
          <div style={{ ...styles.item, gridColumn: '1 / -1' }}>
            <span style={styles.itemLabel}>Formatting & Proofreading:</span>
            <div style={styles.tagContainer}>
              <span
                style={{
                  ...styles.badge,
                  backgroundColor: formData.proofreading ? '#10b981' : '#f87171',
                  color: 'white',
                }}
              >
                Proofreading: {formData.proofreading ? 'Enabled' : 'Disabled'}
              </span>
              {getFormattingLabels().map((label, index) => (
                <span
                  key={index}
                  style={{ ...styles.badge, ...styles.badgeSecondary }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Grammar Strictness */}
          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Grammar Strictness Mode:</span>
            <div style={styles.valueBox}>
              {!formData.proofreading
                ? 'N/A (Proofreading disabled)'
                : formData.grammarStrictnessMode === 'custom'
                  ? 'Custom'
                  : 'Predefined'}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Grammar Strictness:</span>
            <div style={styles.valueBox}>
              {!formData.proofreading
                ? 'N/A (Proofreading disabled)'
                : formData.grammarStrictnessMode === 'custom'
                  ? formData.customGrammarStrictness || 'N/A'
                  : (formData.grammarStrictness
                      ? findLabel(grammarStrictnessOptions, formData.grammarStrictness)
                      : 'N/A')}
            </div>
          </div>

          {/* Reference URL */}
          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Reference URL:</span>
            <div style={styles.valueBox}>{formData.referenceUrl || 'N/A'}</div>
          </div>

          {/* Compliance Notes */}
          {formData.complianceNotes && (
            <div style={{ ...styles.item, gridColumn: '1 / -1' }}>
              <span style={styles.itemLabel}>Compliance Notes:</span>
              <div style={styles.valueBox}>{formData.complianceNotes}</div>
            </div>
          )}
        </div>

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
            {isGenerating ? 'Generating...' : '🚀 Confirm & Generate Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummaryReviewModal;
