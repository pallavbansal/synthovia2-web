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
            <span style={styles.itemLabel}>Use Case:</span>
            <div style={styles.valueBox}>
              {findLabel(useCaseOptions, formData.useCase)}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Tone of Voice:</span>
            <div style={styles.valueBox}>
              {formData.toneMode === 'custom'
                ? `Custom: ${formData.customTone || 'N/A'}`
                : findLabel(toneOptions, formData.toneOfVoice)}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Primary Goal:</span>
            <div style={styles.valueBox}>{formData.primaryGoal || 'N/A'}</div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Target Audience:</span>
            <div style={styles.valueBox}>{formData.targetAudience || 'N/A'}</div>
          </div>

          <div style={{ ...styles.item, gridColumn: '1 / -1' }}>
            <span style={styles.itemLabel}>Key Points:</span>
            <div style={styles.valueBox}>{formData.keyPoints || 'No key points provided.'}</div>
          </div>

          <h3 style={styles.sectionTitle}>⚙️ Advanced Customization</h3>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Language:</span>
            <div style={styles.valueBox}>
              {findLabel(languageOptions, formData.language)}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Length Target:</span>
            <div style={styles.valueBox}>
              {findLabel(lengthTargetOptions, formData.lengthTarget)}
              {formData.lengthTarget === 'custom' && formData.customWordCount
                ? ` (${formData.customWordCount} words)`
                : ''}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>CTA Style:</span>
            <div style={styles.valueBox}>
              {findLabel(ctaStyleOptions, formData.ctaStyle) || 'N/A'}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Reading Level:</span>
            <div style={styles.valueBox}>
              {findLabel(readingLevelOptions, formData.readingLevel)}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Target Platform:</span>
            <div style={styles.valueBox}>
              {findLabel(targetPlatformOptions, formData.targetPlatform) || 'Any Platform'}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Content Style Preference:</span>
            <div style={styles.valueBox}>
              {findLabel(contentStyleOptions, formData.contentStyle) || 'N/A'}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Emotional Intent:</span>
            <div style={styles.valueBox}>
              {findLabel(emotionalIntentOptions, formData.emotionalIntent) || 'Neutral'}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Writing Framework:</span>
            <div style={styles.valueBox}>
              {findLabel(writingFrameworkOptions, formData.writingFramework) || 'Standard'}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Output Structure:</span>
            <div style={styles.valueBox}>
              {findLabel(outputStructureOptions, formData.outputStructure)}
            </div>
          </div>

          <div style={{ ...styles.item, gridColumn: 'span 1' }}>
            <span style={styles.itemLabel}>Creativity & Variants:</span>
            <div style={styles.valueBox}>
              Variants: {formData.variants} | Creativity: {formData.creativityLevel}/10
            </div>
          </div>

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
