// components/CopywritingAssistant/CopywritingAssistantForm.js
import React, { useState } from 'react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

const CopywritingAssistantForm = () => {
  // State for all form fields
  const [formData, setFormData] = useState({
    useCase: '',
    primaryGoal: '',
    targetAudience: '',
    toneMode: 'predefined',
    toneOfVoice: '',
    customTone: '',
    language: 'English',
    lengthTarget: 'medium',
    customWordCount: 180,
    keyPoints: '',
    variants: 3,
    showAdvanced: false,
    keywords: '',
    ctaStyle: '',
    referenceText: '',
    rewriteMode: false,
    readingLevel: 'standard',
    targetPlatform: '',
    brandVoice: '',
    contentStyle: '',
    formattingOptions: [],
    includeWords: [],
    excludeWords: [],
    emotionalIntent: '',
    complianceNotes: '',
    writingFramework: '',
    outputStructure: 'markdown',
    creativityLevel: 5,
    referenceUrl: '',
    proofreading: true,
    grammarStrictness: 'medium'
  });

  // Options for dropdowns
  const useCaseOptions = [
    'Blog Post', 'Product Description', 'Email Campaign', 
    'Social Media Post', 'Landing Page', 'Ad Copy', 'Press Release'
  ];

  const toneOptions = [
    'Professional', 'Friendly', 'Conversational', 'Formal', 
    'Casual', 'Persuasive', 'Informative', 'Humorous'
  ];

  const languageOptions = [
    'English', 'Spanish', 'French', 'German', 'Italian', 
    'Portuguese', 'Dutch', 'Russian', 'Japanese', 'Chinese'
  ];

  const ctaStyleOptions = [
    'Direct', 'Question', 'Value Proposition', 'Scarcity', 
    'Urgency', 'Curiosity', 'Command'
  ];

  // Handler functions
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayChange = (e, field) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newItem = e.target.value.trim();
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], newItem]
      }));
      e.target.value = '';
    }
  };

  const removeItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const toggleAdvanced = () => {
    setFormData(prev => ({
      ...prev,
      showAdvanced: !prev.showAdvanced
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  // Styles (similar to AdCopyGenerator)
  const styles = {
    container: { maxWidth: '1100px', margin: '0 auto', padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
    card: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' },
    header: { padding: '24px 32px', borderBottom: '1px solid #e5e7eb' },
    title: { margin: 0, fontSize: '24px', fontWeight: '600', color: '#111827' },
    subtitle: { margin: '6px 0 0', fontSize: '14px', color: '#6b7280' },
    formGroup: { marginBottom: '20px' },
    label: { display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' },
    input: { width: '100%', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5', color: '#374151', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', transition: 'all 0.15s ease-in-out', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5', color: '#374151', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', transition: 'all 0.15s ease-in-out', boxSizing: 'border-box', resize: 'vertical', minHeight: '80px' },
    btn: { padding: '10px 20px', fontSize: '14px', fontWeight: '500', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.15s ease-in-out', display: 'inline-flex', alignItems: 'center', gap: '8px' },
    btnPrimary: { backgroundColor: '#3b82f6', color: 'white' },
    btnOutline: { backgroundColor: 'white', color: '#6b7280', border: '1px solid #d1d5db' },
    infoIcon: { display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', textAlign: 'center', lineHeight: '16px', fontSize: '11px', cursor: 'help', marginLeft: '6px' },
    badge: { display: 'inline-flex', alignItems: 'center', padding: '4px 10px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '9999px', fontSize: '0.875rem', marginRight: '8px', marginBottom: '8px' },
    removeBtn: { background: 'none', border: 'none', color: '#0369a1', cursor: 'pointer', marginLeft: '6px', fontSize: '12px' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Copywriting Assistant Tool</h1>
          <p style={styles.subtitle}>Generate high-quality copy for your needs</p>
        </div>

        <div style={{ padding: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              {/* Use Case */}
              <div className="col-md-6">
                <div style={styles.formGroup}>
                  <label htmlFor="useCase" style={styles.label}>
                    Use Case <span style={{ color: '#ef4444' }}>*</span>
                    <span style={styles.infoIcon} data-tooltip-id="useCase-tooltip" data-tooltip-content="Select the type of content you want to create">i</span>
                  </label>
                  <Tooltip id="useCase-tooltip" />
                  <select
                    id="useCase"
                    name="useCase"
                    value={formData.useCase}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  >
                    <option value="">Select a use case</option>
                    {useCaseOptions.map((option, index) => (
                      <option key={index} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Primary Goal */}
              <div className="col-12">
                <div style={styles.formGroup}>
                  <label htmlFor="primaryGoal" style={styles.label}>
                    Primary Goal <span style={{ color: '#ef4444' }}>*</span>
                    <span style={styles.infoIcon} data-tooltip-id="primaryGoal-tooltip" data-tooltip-content="Describe the main objective of your content (max 150 words)">i</span>
                  </label>
                  <Tooltip id="primaryGoal-tooltip" />
                  <textarea
                    id="primaryGoal"
                    name="primaryGoal"
                    value={formData.primaryGoal}
                    onChange={handleChange}
                    style={{...styles.textarea, minHeight: '80px'}}
                    placeholder="What do you want to achieve with this content?"
                    maxLength={750} // ~150 words
                    required
                  />
                </div>
              </div>

              {/* Target Audience */}
              <div className="col-12">
                <div style={styles.formGroup}>
                  <label htmlFor="targetAudience" style={styles.label}>
                    Target Audience <span style={{ color: '#ef4444' }}>*</span>
                    <span style={styles.infoIcon} data-tooltip-id="audience-tooltip" data-tooltip-content="Describe your target audience (max 120 words)">i</span>
                  </label>
                  <Tooltip id="audience-tooltip" />
                  <textarea
                    id="targetAudience"
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleChange}
                    style={{...styles.textarea, minHeight: '60px'}}
                    placeholder="Who is your target audience? (e.g., age, interests, profession)"
                    maxLength={600} // ~120 words
                    required
                  />
                </div>
              </div>

              {/* Tone Selection */}
              <div className="col-12">
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Tone Selection <span style={{ color: '#ef4444' }}>*</span>
                    <span style={styles.infoIcon} data-tooltip-id="toneMode-tooltip" data-tooltip-content="Choose between predefined tones or define a custom tone">i</span>
                  </label>
                  <Tooltip id="toneMode-tooltip" />
                  <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="toneMode"
                        value="predefined"
                        checked={formData.toneMode === 'predefined'}
                        onChange={handleChange}
                        style={{ marginRight: '8px' }}
                      />
                      Predefined
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="toneMode"
                        value="custom"
                        checked={formData.toneMode === 'custom'}
                        onChange={handleChange}
                        style={{ marginRight: '8px' }}
                      />
                      Custom
                    </label>
                  </div>
                </div>
              </div>

              {/* Tone of Voice (shown when predefined is selected) */}
              {formData.toneMode === 'predefined' && (
                <div className="col-md-6">
                  <div style={styles.formGroup}>
                    <label htmlFor="toneOfVoice" style={styles.label}>
                      Tone of Voice <span style={{ color: '#ef4444' }}>*</span>
                      <span style={styles.infoIcon} data-tooltip-id="tone-tooltip" data-tooltip-content="Select the tone that best matches your brand voice">i</span>
                    </label>
                    <Tooltip id="tone-tooltip" />
                    <select
                      id="toneOfVoice"
                      name="toneOfVoice"
                      value={formData.toneOfVoice}
                      onChange={handleChange}
                      style={styles.input}
                      required={formData.toneMode === 'predefined'}
                    >
                      <option value="">Select a tone</option>
                      {toneOptions.map((tone, index) => (
                        <option key={index} value={tone.toLowerCase()}>{tone}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Custom Tone (shown when custom is selected) */}
              {formData.toneMode === 'custom' && (
                <div className="col-md-6">
                  <div style={styles.formGroup}>
                    <label htmlFor="customTone" style={styles.label}>
                      Custom Tone <span style={{ color: '#ef4444' }}>*</span>
                      <span style={styles.infoIcon} data-tooltip-id="customTone-tooltip" data-tooltip-content="Describe your desired tone in a few words (max 12 words)">i</span>
                    </label>
                    <Tooltip id="customTone-tooltip" />
                    <input
                      type="text"
                      id="customTone"
                      name="customTone"
                      value={formData.customTone}
                      onChange={handleChange}
                      style={styles.input}
                      placeholder="e.g., Friendly, professional, and slightly humorous"
                      maxLength={100}
                      required={formData.toneMode === 'custom'}
                    />
                  </div>
                </div>
              )}

              {/* Language */}
              <div className="col-md-6">
                <div style={styles.formGroup}>
                  <label htmlFor="language" style={styles.label}>
                    Language <span style={{ color: '#ef4444' }}>*</span>
                    <span style={styles.infoIcon} data-tooltip-id="language-tooltip" data-tooltip-content="Select the language for your content">i</span>
                  </label>
                  <Tooltip id="language-tooltip" />
                  <select
                    id="language"
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  >
                    {languageOptions.map((lang, index) => (
                      <option key={index} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Length Target */}
              <div className="col-md-6">
                <div style={styles.formGroup}>
                  <label htmlFor="lengthTarget" style={styles.label}>
                    Length Target <span style={{ color: '#ef4444' }}>*</span>
                    <span style={styles.infoIcon} data-tooltip-id="length-tooltip" data-tooltip-content="Select or specify your desired word count">i</span>
                  </label>
                  <Tooltip id="length-tooltip" />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                      id="lengthTarget"
                      name="lengthTarget"
                      value={formData.lengthTarget}
                      onChange={handleChange}
                      style={{...styles.input, flex: 1}}
                    >
                      <option value="short">Short (~100 words)</option>
                      <option value="medium">Medium (~180 words)</option>
                      <option value="long">Long (~300 words)</option>
                      <option value="custom">Custom</option>
                    </select>
                    {formData.lengthTarget === 'custom' && (
                      <input
                        type="number"
                        name="customWordCount"
                        value={formData.customWordCount}
                        onChange={handleChange}
                        min="50"
                        max="2000"
                        style={{...styles.input, width: '100px'}}
                        placeholder="Words"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Key Points */}
              <div className="col-12">
                <div style={styles.formGroup}>
                  <label htmlFor="keyPoints" style={styles.label}>
                    Key Points <span style={{ color: '#ef4444' }}>*</span>
                    <span style={styles.infoIcon} data-tooltip-id="keyPoints-tooltip" data-tooltip-content="List the main points to include in your content (max 1200 characters)">i</span>
                  </label>
                  <Tooltip id="keyPoints-tooltip" />
                  <textarea
                    id="keyPoints"
                    name="keyPoints"
                    value={formData.keyPoints}
                    onChange={handleChange}
                    style={{...styles.textarea, minHeight: '100px'}}
                    placeholder="Enter the key points you want to cover, one per line"
                    maxLength={1200}
                    required
                  />
                </div>
              </div>

              {/* Number of Variants */}
              <div className="col-12">
                <div style={styles.formGroup}>
                  <label htmlFor="variants" style={styles.label}>
                    Number of Variants: {formData.variants}
                    <span style={styles.infoIcon} data-tooltip-id="variants-tooltip" data-tooltip-content="How many different versions of the content would you like to generate?">i</span>
                  </label>
                  <Tooltip id="variants-tooltip" />
                  <input
                    type="range"
                    id="variants"
                    name="variants"
                    min="1"
                    max="5"
                    value={formData.variants}
                    onChange={handleChange}
                    style={{width: '100%'}}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                  </div>
                </div>
              </div>

              {/* Advanced Features Toggle */}
              <div className="col-12">
                <button
                  type="button"
                  onClick={toggleAdvanced}
                  style={{
                    ...styles.btn,
                    ...styles.btnOutline,
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {formData.showAdvanced ? '▼' : '▶'} Advanced Features
                </button>
              </div>

              {/* Advanced Features */}
              {formData.showAdvanced && (
                <>
                  {/* Keywords */}
                  <div className="col-12">
                    <div style={styles.formGroup}>
                      <label htmlFor="keywords" style={styles.label}>
                        Keywords
                        <span style={styles.infoIcon} data-tooltip-id="keywords-tooltip" data-tooltip-content="Add keywords to include in your content (max 250 characters)">i</span>
                      </label>
                      <Tooltip id="keywords-tooltip" />
                      <input
                        type="text"
                        id="keywords"
                        name="keywords"
                        value={formData.keywords}
                        onChange={handleChange}
                        style={styles.input}
                        placeholder="e.g., digital marketing, seo, content strategy"
                        maxLength={250}
                      />
                    </div>
                  </div>

                  {/* CTA Style */}
                  <div className="col-md-6">
                    <div style={styles.formGroup}>
                      <label htmlFor="ctaStyle" style={styles.label}>
                        CTA Style
                        <span style={styles.infoIcon} data-tooltip-id="cta-tooltip" data-tooltip-content="Select the style for your call-to-action">i</span>
                      </label>
                      <Tooltip id="cta-tooltip" />
                      <select
                        id="ctaStyle"
                        name="ctaStyle"
                        value={formData.ctaStyle}
                        onChange={handleChange}
                        style={styles.input}
                      >
                        <option value="">Select CTA Style</option>
                        {ctaStyleOptions.map((style, index) => (
                          <option key={index} value={style.toLowerCase().replace(' ', '-')}>{style}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Reference Text */}
                  <div className="col-12">
                    <div style={styles.formGroup}>
                      <label htmlFor="referenceText" style={styles.label}>
                        Reference Text
                        <span style={styles.infoIcon} data-tooltip-id="reference-tooltip" data-tooltip-content="Add any reference text or examples (max 5000 characters)">i</span>
                      </label>
                      <Tooltip id="reference-tooltip" />
                      <textarea
                        id="referenceText"
                        name="referenceText"
                        value={formData.referenceText}
                        onChange={handleChange}
                        style={{...styles.textarea, minHeight: '100px'}}
                        placeholder="Paste any reference text or examples here"
                        maxLength={5000}
                      />
                    </div>
                  </div>

                  {/* Rewrite Mode */}
                  <div className="col-12">
                    <div style={styles.formGroup}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          name="rewriteMode"
                          checked={formData.rewriteMode}
                          onChange={handleChange}
                          style={{ marginRight: '8px' }}
                        />
                        <span>Rewrite Mode</span>
                        <span style={{...styles.infoIcon, marginLeft: '8px'}} data-tooltip-id="rewrite-tooltip" data-tooltip-content="Enable to rewrite the reference text in a different style">i</span>
                        <Tooltip id="rewrite-tooltip" />
                      </label>
                    </div>
                  </div>

                  {/* Reading Level */}
                  <div className="col-md-6">
                    <div style={styles.formGroup}>
                      <label htmlFor="readingLevel" style={styles.label}>
                        Reading Level
                        <span style={styles.infoIcon} data-tooltip-id="reading-tooltip" data-tooltip-content="Select the reading level for your content">i</span>
                      </label>
                      <Tooltip id="reading-tooltip" />
                      <select
                        id="readingLevel"
                        name="readingLevel"
                        value={formData.readingLevel}
                        onChange={handleChange}
                        style={styles.input}
                      >
                        <option value="basic">Basic (6th grade)</option>
                        <option value="standard">Standard (8th-10th grade)</option>
                        <option value="advanced">Advanced (College level)</option>
                        <option value="expert">Expert (Professional/Technical)</option>
                      </select>
                    </div>
                  </div>

                  {/* Target Platform */}
                  <div className="col-md-6">
                    <div style={styles.formGroup}>
                      <label htmlFor="targetPlatform" style={styles.label}>
                        Target Platform
                        <span style={styles.infoIcon} data-tooltip-id="platform-tooltip" data-tooltip-content="Select the platform where this content will be published">i</span>
                      </label>
                      <Tooltip id="platform-tooltip" />
                      <select
                        id="targetPlatform"
                        name="targetPlatform"
                        value={formData.targetPlatform}
                        onChange={handleChange}
                        style={styles.input}
                      >
                        <option value="">Any Platform</option>
                        <option value="blog">Blog</option>
                        <option value="website">Website</option>
                        <option value="social">Social Media</option>
                        <option value="email">Email</option>
                        <option value="print">Print</option>
                      </select>
                    </div>
                  </div>

                  {/* Include Words */}
                  <div className="col-md-6">
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        Include Words
                        <span style={styles.infoIcon} data-tooltip-id="include-tooltip" data-tooltip-content="Words that must be included in the content (press Enter to add)">i</span>
                      </label>
                      <Tooltip id="include-tooltip" />
                      <input
                        type="text"
                        style={styles.input}
                        placeholder="Add a word and press Enter"
                        onKeyPress={(e) => handleArrayChange(e, 'includeWords')}
                      />
                      <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '8px' }}>
                        {formData.includeWords.map((word, index) => (
                          <span key={index} style={styles.badge}>
                            {word}
                            <button type="button" style={styles.removeBtn} onClick={() => removeItem('includeWords', index)}>×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Exclude Words */}
                  <div className="col-md-6">
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        Exclude Words
                        <span style={styles.infoIcon} data-tooltip-id="exclude-tooltip" data-tooltip-content="Words that should not appear in the content (press Enter to add)">i</span>
                      </label>
                      <Tooltip id="exclude-tooltip" />
                      <input
                        type="text"
                        style={styles.input}
                        placeholder="Add a word and press Enter"
                        onKeyPress={(e) => handleArrayChange(e, 'excludeWords')}
                      />
                      <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '8px' }}>
                        {formData.excludeWords.map((word, index) => (
                          <span key={index} style={styles.badge}>
                            {word}
                            <button type="button" style={styles.removeBtn} onClick={() => removeItem('excludeWords', index)}>×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Emotional Intent */}
                  <div className="col-md-6">
                    <div style={styles.formGroup}>
                      <label htmlFor="emotionalIntent" style={styles.label}>
                        Emotional Intent
                        <span style={styles.infoIcon} data-tooltip-id="emotional-tooltip" data-tooltip-content="Select the emotional tone for your content">i</span>
                      </label>
                      <Tooltip id="emotional-tooltip" />
                      <select
                        id="emotionalIntent"
                        name="emotionalIntent"
                        value={formData.emotionalIntent}
                        onChange={handleChange}
                        style={styles.input}
                      >
                        <option value="">None (Neutral)</option>
                        <option value="happy">Happy/Joyful</option>
                        <option value="excited">Excited/Enthusiastic</option>
                        <option value="trust">Trustworthy/Reliable</option>
                        <option value="calm">Calm/Peaceful</option>
                        <option value="sad">Sad/Empathetic</option>
                        <option value="angry">Angry/Passionate</option>
                        <option value="fearful">Fearful/Urgent</option>
                      </select>
                    </div>
                  </div>

                  {/* Compliance Notes */}
                  <div className="col-12">
                    <div style={styles.formGroup}>
                      <label htmlFor="complianceNotes" style={styles.label}>
                        Compliance Notes
                        <span style={styles.infoIcon} data-tooltip-id="compliance-tooltip" data-tooltip-content="Any legal or compliance requirements (max 200 words)">i</span>
                      </label>
                      <Tooltip id="compliance-tooltip" />
                      <textarea
                        id="complianceNotes"
                        name="complianceNotes"
                        value={formData.complianceNotes}
                        onChange={handleChange}
                        style={{...styles.textarea, minHeight: '80px'}}
                        placeholder="Add any compliance requirements or legal disclaimers"
                        maxLength={1000} // ~200 words
                      />
                    </div>
                  </div>

                  {/* Writing Framework */}
                  <div className="col-md-6">
                    <div style={styles.formGroup}>
                      <label htmlFor="writingFramework" style={styles.label}>
                        Writing Framework
                        <span style={styles.infoIcon} data-tooltip-id="framework-tooltip" data-tooltip-content="Select a writing framework to structure your content">i</span>
                      </label>
                      <Tooltip id="framework-tooltip" />
                      <select
                        id="writingFramework"
                        name="writingFramework"
                        value={formData.writingFramework}
                        onChange={handleChange}
                        style={styles.input}
                      >
                        <option value="">None (Standard Structure)</option>
                        <option value="aida">AIDA (Attention, Interest, Desire, Action)</option>
                        <option value="pas">PAS (Problem, Agitation, Solution)</option>
                        <option value="fear">FOMO (Fear of Missing Out)</option>
                        <option value="star">STAR (Situation, Task, Action, Result)</option>
                        <option value="bab">Before-After-Bridge</option>
                      </select>
                    </div>
                  </div>

                  {/* Output Structure Type */}
                  <div className="col-md-6">
                    <div style={styles.formGroup}>
                      <label htmlFor="outputStructure" style={styles.label}>
                        Output Structure
                        <span style={styles.infoIcon} data-tooltip-id="output-tooltip" data-tooltip-content="Select the format for the generated content">i</span>
                      </label>
                      <Tooltip id="output-tooltip" />
                      <select
                        id="outputStructure"
                        name="outputStructure"
                        value={formData.outputStructure}
                        onChange={handleChange}
                        style={styles.input}
                      >
                        <option value="markdown">Markdown</option>
                        <option value="html">HTML</option>
                        <option value="json">JSON</option>
                      </select>
                    </div>
                  </div>

                  {/* Creativity Level */}
                  <div className="col-12">
                    <div style={styles.formGroup}>
                      <label htmlFor="creativityLevel" style={styles.label}>
                        Creativity Level: {formData.creativityLevel}/10
                        <span style={styles.infoIcon} data-tooltip-id="creativity-tooltip" data-tooltip-content="Adjust how creative or conservative the output should be">i</span>
                      </label>
                      <Tooltip id="creativity-tooltip" />
                      <input
                        type="range"
                        id="creativityLevel"
                        name="creativityLevel"
                        min="1"
                        max="10"
                        value={formData.creativityLevel}
                        onChange={handleChange}
                        style={{width: '100%'}}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        <span>More Predictable</span>
                        <span>More Creative</span>
                      </div>
                    </div>
                  </div>

                  {/* Reference URL */}
                  <div className="col-12">
                    <div style={styles.formGroup}>
                      <label htmlFor="referenceUrl" style={styles.label}>
                        Reference URL
                        <span style={styles.infoIcon} data-tooltip-id="url-tooltip" data-tooltip-content="Add a URL for reference or to extract content from">i</span>
                      </label>
                      <Tooltip id="url-tooltip" />
                      <input
                        type="url"
                        id="referenceUrl"
                        name="referenceUrl"
                        value={formData.referenceUrl}
                        onChange={handleChange}
                        style={styles.input}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  {/* Proofreading & Optimization */}
                  <div className="col-12">
                    <div style={styles.formGroup}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          name="proofreading"
                          checked={formData.proofreading}
                          onChange={handleChange}
                          style={{ marginRight: '8px' }}
                        />
                        <span>Enable Proofreading & Optimization</span>
                        <span style={{...styles.infoIcon, marginLeft: '8px'}} data-tooltip-id="proofreading-tooltip" data-tooltip-content="Automatically check for grammar, readability, and SEO optimization">i</span>
                        <Tooltip id="proofreading-tooltip" />
                      </label>
                    </div>
                  </div>

                  {/* Grammar Strictness (shown when proofreading is enabled) */}
                  {formData.proofreading && (
                    <div className="col-12">
                      <div style={styles.formGroup}>
                        <label htmlFor="grammarStrictness" style={styles.label}>
                          Grammar Strictness
                          <span style={styles.infoIcon} data-tooltip-id="grammar-tooltip" data-tooltip-content="How strictly should grammar and style rules be applied?">i</span>
                        </label>
                        <Tooltip id="grammar-tooltip" />
                        <select
                          id="grammarStrictness"
                          name="grammarStrictness"
                          value={formData.grammarStrictness}
                          onChange={handleChange}
                          style={styles.input}
                        >
                          <option value="light">Light (Fewer Corrections)</option>
                          <option value="medium">Medium (Balanced)</option>
                          <option value="strict">Strict (Most Correct)</option>
                          <option value="custom">Custom (Advanced)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Submit Button */}
              <div className="col-12" style={{ marginTop: '20px' }}>
                <button
                  type="submit"
                  style={{
                    ...styles.btn,
                    ...styles.btnPrimary,
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  Generate Copy
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Output Section (initially hidden) */}
      {formData.submitted && (
        <div style={{ marginTop: '40px' }}>
          <h2 style={{ marginBottom: '20px', color: '#111827' }}>Generated Content</h2>
          <div style={{ display: 'grid', gap: '20px' }}>
            {[...Array(parseInt(formData.variants))].map((_, index) => (
              <div key={index} style={{
                ...styles.card,
                padding: '24px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ margin: '0 0 8px 0', color: '#111827' }}>Variant {index + 1}</h3>
                  <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '12px 0' }}></div>
                </div>
                <div style={{ lineHeight: '1.6', color: '#374151' }}>
                  {/* This is where the generated content would be displayed */}
                  <p>Generated content will appear here. This is a preview of how the formatted content will look.</p>
                  <p>Each variant will show different approaches based on your input parameters.</p>
                </div>
                <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                  <button
                    style={{
                      ...styles.btn,
                      ...styles.btnOutline,
                      padding: '8px 16px',
                      fontSize: '14px'
                    }}
                  >
                    Copy to Clipboard
                  </button>
                  <button
                    style={{
                      ...styles.btn,
                      ...styles.btnOutline,
                      padding: '8px 16px',
                      fontSize: '14px'
                    }}
                  >
                    Save Draft
                  </button>
                  <button
                    style={{
                      ...styles.btn,
                      ...styles.btnOutline,
                      padding: '8px 16px',
                      fontSize: '14px'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    style={{
                      ...styles.btn,
                      ...styles.btnOutline,
                      padding: '8px 16px',
                      fontSize: '14px'
                    }}
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CopywritingAssistantForm;