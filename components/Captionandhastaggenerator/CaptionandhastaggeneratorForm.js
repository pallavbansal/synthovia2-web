// components/Captionandhastaggenerator/Captionandhastaggeneratorform.js
import React, { useState, useEffect } from 'react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

const Captionandhastaggeneratorform = () => {
  const [formData, setFormData] = useState({
    platformType: 'predefined',
    platform: '',
    customPlatform: '',
    postType: '',
    postTheme: '',
    primaryGoal: '',
    toneSelection: 'predefined',
    toneOfVoice: '',
    customTone: '',
    targetAudience: [],
    variants: 3,
    showAdvanced: false,
    requiredKeywords: [],
    language: 'en',
    emotionalIntent: '',
    postLength: 'medium',
    formattingOptions: [],
    includeCta: '',
    customCta: '',
    captionStyle: 'standard',
    hashtagStyle: 'inline',
    excludeWords: [],
    creativityLevel: 5,
    proofread: true,
    hashtagLimit: 15,
    complianceNotes: ''
  });

  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Options for dropdowns
  const platformOptions = ['Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'TikTok', 'Pinterest'];
  const postTypeOptions = ['Post', 'Story', 'Reel', 'Carousel', 'Video', 'Live'];
  const toneOptions = ['Professional', 'Casual', 'Friendly', 'Humorous', 'Inspirational', 'Educational'];
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'ja', label: 'Japanese' }
  ];
  const emotionalIntentOptions = ['Neutral', 'Happy', 'Excited', 'Motivational', 'Urgent', 'Curious'];
  const postLengthOptions = [
    { value: 'short', label: 'Short (1-2 sentences)' },
    { value: 'medium', label: 'Medium (3-4 sentences)' },
    { value: 'long', label: 'Long (5+ sentences)' }
  ];
  const formattingOptions = [
    { value: 'emoji', label: 'Add Emojis' },
    { value: 'hashtags', label: 'Include Hashtags' },
    { value: 'mentions', label: 'Add Mentions' },
    { value: 'linebreaks', label: 'Use Line Breaks' }
  ];
  const ctaOptions = [
    { value: 'learn-more', label: 'Learn More' },
    { value: 'shop-now', label: 'Shop Now' },
    { value: 'sign-up', label: 'Sign Up' },
    { value: 'book-now', label: 'Book Now' },
    { value: 'custom', label: 'Custom' }
  ];
  const captionStyleOptions = [
    { value: 'standard', label: 'Standard' },
    { value: 'question', label: 'Question' },
    { value: 'how-to', label: 'How-to' },
    { value: 'list', label: 'List' },
    { value: 'quote', label: 'Quote' }
  ];
  const hashtagStyleOptions = [
    { value: 'inline', label: 'Inline with Text' },
    { value: 'end', label: 'At the End' },
    { value: 'first-comment', label: 'In First Comment' }
  ];

  // Styles
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
    badge: { display: 'inline-flex', alignItems: 'center', padding: '6px 12px', fontSize: '13px', fontWeight: '500', borderRadius: '6px', gap: '6px' },
    badgePrimary: { backgroundColor: '#3b82f6', color: 'white' },
    badgeSecondary: { backgroundColor: '#6b7280', color: 'white' },
    badgeSuccess: { backgroundColor: '#10b981', color: 'white' },
    btn: { padding: '10px 20px', fontSize: '14px', fontWeight: '500', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.15s ease-in-out', display: 'inline-flex', alignItems: 'center', gap: '8px' },
    btnPrimary: { backgroundColor: '#3b82f6', color: 'white' },
    btnSuccess: { backgroundColor: '#10b981', color: 'white' },
    btnOutline: { backgroundColor: 'white', color: '#6b7280', border: '1px solid #d1d5db' },
    btnDanger: { backgroundColor: '#ef4444', color: 'white' },
    infoIcon: { display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', textAlign: 'center', lineHeight: '16px', fontSize: '11px', cursor: 'help', marginLeft: '6px' },
    removeBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '18px', height: '18px', borderRadius: '50%', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
    rangeInput: { width: '100%', height: '6px', borderRadius: '3px', background: '#e5e7eb', outline: 'none' },
    checkboxGroup: { display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px' },
    checkboxItem: { display: 'flex', alignItems: 'center', gap: '8px' },
    radioGroup: { display: 'flex', gap: '16px', marginTop: '8px' },
    radioItem: { display: 'flex', alignItems: 'center', gap: '8px' },
    toast: { position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', color: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999 }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

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
      const maxItems = field === 'requiredKeywords' ? 30 : 10;
      if (formData[field].length < maxItems) {
        setFormData(prev => ({
          ...prev,
          [field]: [...prev[field], newItem]
        }));
        e.target.value = '';
      }
    }
  };

  const removeItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    showNotification('Generating captions...', 'success');
  };

  const handleReset = () => {
    setFormData({
      platformType: 'predefined',
      platform: '',
      customPlatform: '',
      postType: '',
      postTheme: '',
      primaryGoal: '',
      toneSelection: 'predefined',
      toneOfVoice: '',
      customTone: '',
      targetAudience: [],
      variants: 3,
      requiredKeywords: [],
      language: 'en',
      emotionalIntent: '',
      postLength: 'medium',
      formattingOptions: [],
      includeCta: '',
      customCta: '',
      captionStyle: 'standard',
      hashtagStyle: 'inline',
      excludeWords: [],
      creativityLevel: 5,
      proofread: true,
      hashtagLimit: 15,
      complianceNotes: ''
    });
    showNotification('Form has been reset', 'info');
  };

  const toggleAdvanced = () => {
    setFormData(prev => ({
      ...prev,
      showAdvanced: !prev.showAdvanced
    }));
  };

  if (!mounted) return null;

  return (
    <div style={styles.container}>
      {/* Notification Toast */}
      {notification.show && (
        <div style={{
          ...styles.toast,
          backgroundColor: notification.type === 'success' ? '#10b981' : notification.type === 'error' ? '#ef4444' : '#3b82f6'
        }}>
          {notification.message}
        </div>
      )}

      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Caption & Hashtag Generator</h1>
          <p style={styles.subtitle}>Create engaging captions and hashtags for your social media posts</p>
        </div>

        <div style={{ padding: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              {/* Platform Type */}
              <div className="col-12">
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Platform Type <span style={{ color: '#ef4444' }}>*</span>
                    <span style={styles.infoIcon} data-tooltip-id="platformType-tooltip" data-tooltip-content="Select whether to use a predefined platform or enter a custom one">i</span>
                  </label>
                  <Tooltip id="platformType-tooltip" />
                  <div style={styles.radioGroup}>
                    <label style={styles.radioItem}>
                      <input
                        type="radio"
                        id="predefined"
                        name="platformType"
                        value="predefined"
                        checked={formData.platformType === 'predefined'}
                        onChange={handleChange}
                        style={{ marginRight: '8px' }}
                        required
                      />
                      Predefined
                    </label>
                    <label style={styles.radioItem}>
                      <input
                        type="radio"
                        id="custom"
                        name="platformType"
                        value="custom"
                        checked={formData.platformType === 'custom'}
                        onChange={handleChange}
                        style={{ marginRight: '8px' }}
                      />
                      Custom
                    </label>
                  </div>
                </div>
              </div>

              {/* Platform Dropdown or Custom Platform Input */}
              {formData.platformType === 'predefined' ? (
                <div className="col-md-6">
                  <div style={styles.formGroup}>
                    <label htmlFor="platform" style={styles.label}>
                      Platform <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      id="platform"
                      name="platform"
                      value={formData.platform}
                      onChange={handleChange}
                      style={styles.input}
                      required
                    >
                      <option value="">Select Platform</option>
                      {platformOptions.map((platform, index) => (
                        <option key={index} value={platform}>{platform}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="col-md-6">
                  <div style={styles.formGroup}>
                    <label htmlFor="customPlatform" style={styles.label}>
                      Custom Platform <span style={{ color: '#ef4444' }}>*</span>
                      <span style={styles.infoIcon} data-tooltip-id="customPlatform-tooltip" data-tooltip-content="Enter your custom platform name (max 5 words)">i</span>
                    </label>
                    <Tooltip id="customPlatform-tooltip" />
                    <input
                      type="text"
                      id="customPlatform"
                      name="customPlatform"
                      value={formData.customPlatform}
                      onChange={handleChange}
                      style={styles.input}
                      maxLength={50}
                      placeholder="e.g., My Custom Platform"
                      required={formData.platformType === 'custom'}
                    />
                  </div>
                </div>
              )}

              {/* Post Type */}
              <div className="col-md-6">
                <div style={styles.formGroup}>
                  <label htmlFor="postType" style={styles.label}>
                    Post Type <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="postType"
                    name="postType"
                    value={formData.postType}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  >
                    <option value="">Select Post Type</option>
                    {postTypeOptions.map((type, index) => (
                      <option key={index} value={type.toLowerCase()}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Post Theme/Topic */}
              <div className="col-12">
                <div style={styles.formGroup}>
                  <label htmlFor="postTheme" style={styles.label}>
                    Post Theme / Topic <span style={{ color: '#ef4444' }}>*</span>
                    <span style={styles.infoIcon} data-tooltip-id="postTheme-tooltip" data-tooltip-content="Describe the main theme or topic of your post (max 120 words)">i</span>
                  </label>
                  <Tooltip id="postTheme-tooltip" />
                  <textarea
                    id="postTheme"
                    name="postTheme"
                    value={formData.postTheme}
                    onChange={handleChange}
                    style={{...styles.textarea, minHeight: '100px'}}
                    maxLength={1200}
                    placeholder="What is your post about?"
                    required
                  />
                </div>
              </div>

              {/* Primary Goal */}
              <div className="col-12">
                <div style={styles.formGroup}>
                  <label htmlFor="primaryGoal" style={styles.label}>
                    Primary Goal <span style={{ color: '#ef4444' }}>*</span>
                    <span style={styles.infoIcon} data-tooltip-id="primaryGoal-tooltip" data-tooltip-content="What is the main goal of this post? (max 60 words)">i</span>
                  </label>
                  <Tooltip id="primaryGoal-tooltip" />
                  <input
                    type="text"
                    id="primaryGoal"
                    name="primaryGoal"
                    value={formData.primaryGoal}
                    onChange={handleChange}
                    style={styles.input}
                    maxLength={300}
                    placeholder="e.g., Increase engagement, drive traffic to website, etc."
                    required
                  />
                </div>
              </div>

              {/* Tone Selection */}
              <div className="col-12">
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Tone Selection <span style={{ color: '#ef4444' }}>*</span>
                    <span style={styles.infoIcon} data-tooltip-id="toneSelection-tooltip" data-tooltip-content="Select whether to use a predefined tone or enter a custom one">i</span>
                  </label>
                  <Tooltip id="toneSelection-tooltip" />
                  <div style={styles.radioGroup}>
                    <label style={styles.radioItem}>
                      <input
                        type="radio"
                        id="tone-predefined"
                        name="toneSelection"
                        value="predefined"
                        checked={formData.toneSelection === 'predefined'}
                        onChange={handleChange}
                        style={{ marginRight: '8px' }}
                        required
                      />
                      Predefined
                    </label>
                    <label style={styles.radioItem}>
                      <input
                        type="radio"
                        id="tone-custom"
                        name="toneSelection"
                        value="custom"
                        checked={formData.toneSelection === 'custom'}
                        onChange={handleChange}
                        style={{ marginRight: '8px' }}
                      />
                      Custom
                    </label>
                  </div>

                  {formData.toneSelection === 'predefined' ? (
                    <select
                      id="toneOfVoice"
                      name="toneOfVoice"
                      value={formData.toneOfVoice}
                      onChange={handleChange}
                      style={{...styles.input, marginTop: '8px'}}
                      required
                    >
                      <option value="">Select Tone of Voice</option>
                      {toneOptions.map((tone, index) => (
                        <option key={index} value={tone.toLowerCase()}>{tone}</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ marginTop: '8px' }}>
                      <label htmlFor="customTone" style={styles.label}>
                        Custom Tone <span style={{ color: '#ef4444' }}>*</span>
                        <span style={styles.infoIcon} data-tooltip-id="customTone-tooltip" data-tooltip-content="Describe your custom tone (max 8 words)">i</span>
                      </label>
                      <Tooltip id="customTone-tooltip" />
                      <input
                        type="text"
                        id="customTone"
                        name="customTone"
                        value={formData.customTone}
                        onChange={handleChange}
                        style={styles.input}
                        maxLength={60}
                        placeholder="e.g., Playful and witty"
                        required={formData.toneSelection === 'custom'}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Target Audience */}
              <div className="col-12">
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Target Audience <span style={{ color: '#ef4444' }}>*</span>
                    <span style={styles.infoIcon} data-tooltip-id="targetAudience-tooltip" data-tooltip-content="Enter your target audience (press Enter to add multiple, max 10)">i</span>
                  </label>
                  <Tooltip id="targetAudience-tooltip" />
                  <input
                    type="text"
                    style={styles.input}
                    placeholder="Add an audience segment and press Enter (e.g., Young professionals, age 25-35)"
                    onKeyPress={(e) => handleArrayChange(e, 'targetAudience')}
                    disabled={formData.targetAudience.length >= 10}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                    {formData.targetAudience.map((audience, index) => (
                      <span key={index} style={{...styles.badge, ...styles.badgePrimary}}>
                        {audience}
                        <button type="button" style={styles.removeBtn} onClick={() => removeItem('targetAudience', index)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Number of Variants */}
              <div className="col-12">
                <div style={styles.formGroup}>
                  <label htmlFor="variants" style={styles.label}>
                    Number of Variants: {formData.variants}
                    <span style={styles.infoIcon} data-tooltip-id="variants-tooltip" data-tooltip-content="Choose how many caption variations to generate">i</span>
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
                    style={styles.rangeInput}
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
                  style={{...styles.btn, ...styles.btnOutline, padding: '0', border: 'none', background: 'none', color: '#3b82f6'}}
                  onClick={toggleAdvanced}
                >
                  {formData.showAdvanced ? '▼ Hide Advanced Features' : '▶ Show Advanced Features'}
                </button>
              </div>

              {/* Advanced Features */}
              {formData.showAdvanced && (
                <>
                  {/* Required Keywords/Hashtags */}
                  <div className="col-12">
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        Required Keywords/Hashtags
                        <span style={styles.infoIcon} data-tooltip-id="requiredKeywords-tooltip" data-tooltip-content="Add keywords or hashtags that must be included (press Enter to add multiple, max 30)">i</span>
                      </label>
                      <Tooltip id="requiredKeywords-tooltip" />
                      <input
                        type="text"
                        style={styles.input}
                        placeholder="Add a keyword or hashtag and press Enter"
                        onKeyPress={(e) => handleArrayChange(e, 'requiredKeywords')}
                        disabled={formData.requiredKeywords.length >= 30}
                      />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                        {formData.requiredKeywords.map((keyword, index) => (
                          <span key={index} style={{...styles.badge, ...styles.badgeSuccess}}>
                            {keyword}
                            <button type="button" style={styles.removeBtn} onClick={() => removeItem('requiredKeywords', index)}>×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Language/Locale */}
                  <div className="col-md-6">
                    <div style={styles.formGroup}>
                      <label htmlFor="language" style={styles.label}>Language / Locale</label>
                      <select
                        id="language"
                        name="language"
                        value={formData.language}
                        onChange={handleChange}
                        style={styles.input}
                      >
                        {languageOptions.map((lang) => (
                          <option key={lang.value} value={lang.value}>{lang.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Emotional Intent */}
                  <div className="col-md-6">
                    <div style={styles.formGroup}>
                      <label htmlFor="emotionalIntent" style={styles.label}>
                        Emotional Intent
                        <span style={styles.infoIcon} data-tooltip-id="emotionalIntent-tooltip" data-tooltip-content="Select the emotional tone for your caption">i</span>
                      </label>
                      <Tooltip id="emotionalIntent-tooltip" />
                      <select
                        id="emotionalIntent"
                        name="emotionalIntent"
                        value={formData.emotionalIntent}
                        onChange={handleChange}
                        style={styles.input}
                      >
                        <option value="">Select Emotional Intent</option>
                        {emotionalIntentOptions.map((emotion, index) => (
                          <option key={index} value={emotion.toLowerCase()}>{emotion}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Post Length */}
                  <div className="col-md-6">
                    <div style={styles.formGroup}>
                      <label htmlFor="postLength" style={styles.label}>Post Length</label>
                      <select
                        id="postLength"
                        name="postLength"
                        value={formData.postLength}
                        onChange={handleChange}
                        style={styles.input}
                      >
                        {postLengthOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Formatting Options */}
                  <div className="col-md-6">
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        Formatting Options
                        <span style={styles.infoIcon} data-tooltip-id="formattingOptions-tooltip" data-tooltip-content="Select formatting options for your caption">i</span>
                      </label>
                      <Tooltip id="formattingOptions-tooltip" />
                      <div style={styles.checkboxGroup}>
                        {formattingOptions.map((option) => (
                          <label key={option.value} style={styles.checkboxItem}>
                            <input
                              type="checkbox"
                              id={`format-${option.value}`}
                              name="formattingOptions"
                              value={option.value}
                              checked={formData.formattingOptions.includes(option.value)}
                              onChange={(e) => {
                                const { value, checked } = e.target;
                                setFormData(prev => ({
                                  ...prev,
                                  formattingOptions: checked
                                    ? [...prev.formattingOptions, value]
                                    : prev.formattingOptions.filter(opt => opt !== value)
                                }));
                              }}
                              style={{ marginRight: '8px' }}
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Include CTA */}
                  <div className="col-md-6">
                    <div style={styles.formGroup}>
                      <label htmlFor="includeCta" style={styles.label}>Include CTA</label>
                      <select
                        id="includeCta"
                        name="includeCta"
                        value={formData.includeCta}
                        onChange={handleChange}
                        style={styles.input}
                      >
                        <option value="">No CTA</option>
                        {ctaOptions.map((cta) => (
                          <option key={cta.value} value={cta.value}>{cta.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Custom CTA (shown only when CTA is set to custom) */}
                  {formData.includeCta === 'custom' && (
                    <div className="col-md-6">
                      <div style={styles.formGroup}>
                        <label htmlFor="customCta" style={styles.label}>
                          Custom CTA
                          <span style={styles.infoIcon} data-tooltip-id="customCta-tooltip" data-tooltip-content="Enter your custom call-to-action (max 12 words)">i</span>
                        </label>
                        <Tooltip id="customCta-tooltip" />
                        <input
                          type="text"
                          id="customCta"
                          name="customCta"
                          value={formData.customCta}
                          onChange={handleChange}
                          style={styles.input}
                          maxLength={100}
                          placeholder="e.g., Join us now!"
                        />
                      </div>
                    </div>
                  )}

                  {/* Caption Style */}
                  <div className="col-md-6">
                    <div style={styles.formGroup}>
                      <label htmlFor="captionStyle" style={styles.label}>Caption Style</label>
                      <select
                        id="captionStyle"
                        name="captionStyle"
                        value={formData.captionStyle}
                        onChange={handleChange}
                        style={styles.input}
                      >
                        {captionStyleOptions.map((style) => (
                          <option key={style.value} value={style.value}>{style.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Platform Hashtag Style */}
                  <div className="col-md-6">
                    <div style={styles.formGroup}>
                      <label htmlFor="hashtagStyle" style={styles.label}>Hashtag Style</label>
                      <select
                        id="hashtagStyle"
                        name="hashtagStyle"
                        value={formData.hashtagStyle}
                        onChange={handleChange}
                        style={styles.input}
                      >
                        {hashtagStyleOptions.map((style) => (
                          <option key={style.value} value={style.value}>{style.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Exclude Words/Topics */}
                  <div className="col-12">
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        Exclude Words/Topics
                        <span style={styles.infoIcon} data-tooltip-id="excludeWords-tooltip" data-tooltip-content="Add words or topics to avoid in the generated captions">i</span>
                      </label>
                      <Tooltip id="excludeWords-tooltip" />
                      <input
                        type="text"
                        style={styles.input}
                        placeholder="Add a word or topic to exclude and press Enter"
                        onKeyPress={(e) => handleArrayChange(e, 'excludeWords')}
                      />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                        {formData.excludeWords.map((word, index) => (
                          <span key={index} style={{...styles.badge, ...styles.badgeSecondary}}>
                            {word}
                            <button type="button" style={styles.removeBtn} onClick={() => removeItem('excludeWords', index)}>×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Creativity Level */}
                  <div className="col-12">
                    <div style={styles.formGroup}>
                      <label htmlFor="creativityLevel" style={styles.label}>
                        Creativity Level: {formData.creativityLevel}/10
                        <span style={styles.infoIcon} data-tooltip-id="creativityLevel-tooltip" data-tooltip-content="Adjust how creative or conservative the generated captions should be">i</span>
                      </label>
                      <Tooltip id="creativityLevel-tooltip" />
                      <input
                        type="range"
                        id="creativityLevel"
                        name="creativityLevel"
                        min="1"
                        max="10"
                        value={formData.creativityLevel}
                        onChange={handleChange}
                        style={styles.rangeInput}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        <span>More Conservative</span>
                        <span>More Creative</span>
                      </div>
                    </div>
                  </div>

                  {/* Proofread & Optimize */}
                  <div className="col-12">
                    <div style={styles.formGroup}>
                      <label style={{...styles.label, display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <input
                          type="checkbox"
                          id="proofread"
                          name="proofread"
                          checked={formData.proofread}
                          onChange={handleChange}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span>Proofread & Optimize</span>
                        <span style={styles.infoIcon} data-tooltip-id="proofread-tooltip" data-tooltip-content="Automatically proofread and optimize the generated captions">i</span>
                      </label>
                      <Tooltip id="proofread-tooltip" />
                    </div>
                  </div>

                  {/* Hashtag Limit */}
                  <div className="col-md-6">
                    <div style={styles.formGroup}>
                      <label htmlFor="hashtagLimit" style={styles.label}>
                        Hashtag Limit
                        <span style={styles.infoIcon} data-tooltip-id="hashtagLimit-tooltip" data-tooltip-content="Maximum number of hashtags to include (max 30)">i</span>
                      </label>
                      <Tooltip id="hashtagLimit-tooltip" />
                      <input
                        type="number"
                        id="hashtagLimit"
                        name="hashtagLimit"
                        min="0"
                        max="30"
                        value={formData.hashtagLimit}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  {/* Compliance Notes */}
                  <div className="col-12">
                    <div style={styles.formGroup}>
                      <label htmlFor="complianceNotes" style={styles.label}>
                        Compliance Notes
                        <span style={styles.infoIcon} data-tooltip-id="complianceNotes-tooltip" data-tooltip-content="Add any compliance requirements or legal disclaimers (max 150 words)">i</span>
                      </label>
                      <Tooltip id="complianceNotes-tooltip" />
                      <textarea
                        id="complianceNotes"
                        name="complianceNotes"
                        value={formData.complianceNotes}
                        onChange={handleChange}
                        style={{...styles.textarea, minHeight: '80px'}}
                        maxLength={1500}
                        placeholder="Any compliance requirements or legal disclaimers"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <div className="col-12 mt-4">
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button" 
                    style={{...styles.btn, ...styles.btnOutline}}
                    onClick={handleReset}
                  >
                    Reset Form
                  </button>
                  <button 
                    type="submit" 
                    style={{...styles.btn, ...styles.btnPrimary}}
                  >
                    Generate Caption
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Captionandhastaggeneratorform;