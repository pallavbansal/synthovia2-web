// components/AdCopyGenerator/AdCopyGeneratorForm.js
import React, { useState, useEffect } from 'react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

const AdCopyGeneratorForm = () => {
  const [formData, setFormData] = useState({
    platform: 'Meta (Facebook & Instagram)',
    placement: 'Facebook/Instagram Feed',
    campaignObjective: 'Brand Awareness',
    customObjective: '',
    targetAudience: [], // Changed to array to store audience segments
    productServices: '',
    keyBenefits: [],
    variants: 3,
    tone: 'Auto-Detect (Based on Platform)',
    headlineFocus: 'Auto-Select (Recommended)',
    adTextLength: 'Auto-Length (Platform Optimized)',
    ctaType: 'Learn More',
    emotionalAngle: 'Pain → Solution',
    complianceNote: '',
    brandVoice: '',
    assetReuseStrategy: 'Auto-Detect (Recommended)',
    offerPricing: '',
    audiencePain: [],
    campaignDuration: { start: '', end: '' },
    geoLanguageTarget: '',
    proofCredibility: [],
    showAdvanced: false
  });
  
  // State for audience input
  const [audienceInput, setAudienceInput] = useState('');
  const [showAudienceSuggestions, setShowAudienceSuggestions] = useState(false);

  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [mounted, setMounted] = useState(false);
  const [availablePlacements, setAvailablePlacements] = useState([]);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    setMounted(true);
    updatePlacements('Meta (Facebook & Instagram)');
  }, []);

  // Platform options
  const platformOptions = [
    'Meta (Facebook & Instagram)',
    'Google Ads',
    'LinkedIn Ads',
    'YouTube Ads',
    'Twitter / X Ads',
    'TikTok Ads',
    'Display / Programmatic (Generic)'
  ];

  // Platform-specific placements
  const platformPlacements = {
    'Meta (Facebook & Instagram)': [
      'Facebook Feed',
      'Instagram Feed',
      'Instagram Stories',
      'Instagram Reels',
      'Facebook Right Column',
      'Facebook Marketplace'
    ],
    'Google Ads': [
      'Search (Headlines/Descriptions)',
      'Performance Max (Assets bundle)',
      'Display Responsive (Short/long headlines + descriptions)',
      'Discovery (Headline + description)',
      'Shopping (copy limits apply)'
    ],
    'LinkedIn Ads': [
      'Sponsored Content (Single Image)',
      'Carousel',
      'Video',
      'Text Ads',
      'Message / Conversation Ads'
    ],
    'YouTube Ads': [
      'In-Stream Skippable',
      'In-Feed (Discovery)',
      'Bumper (6s—hook only)'
    ],
    'Twitter / X Ads': [
      'Promoted Post (Text)',
      'Image/Video Post (Text + hook)'
    ],
    'TikTok Ads': [
      'In-Feed (Short punchy text)',
      'Spark Ad (Creator-style tone)'
    ],
    'Display / Programmatic (Generic)': [
      'Responsive Display (Short/long headline + description)'
    ]
  };

  const campaignObjectiveOptions = [
    'Brand Awareness',
    'Reach / Impressions',
    'Engagement',
    'Traffic / Website Visits',
    'Lead Generation',
    'Conversions / Sales',
    'App Installs',
    'Video Views',
    'Event Promotion',
    'Product Launch',
    'Service Promotion',
    'Community Growth',
    'Retargeting / Remarketing',
    'Seasonal / Festive Offers',
    'Custom Objective'
  ];

  const toneOptions = [
    'Auto-Detect (Based on Platform)',
    'Professional / Corporate',
    'Friendly / Conversational',
    'Inspirational / Motivational',
    'Playful / Fun',
    'Luxury / Premium',
    'Bold / Confident',
    'Empathetic / Caring',
    'Minimal / Modern',
    'Adventurous / Energetic',
    'Witty / Clever',
    'Trustworthy / Authoritative',
    'Urgent / Limited-Time Offer',
    'Educational / Informative',
    'Romantic / Emotional',
    'Edgy / Youthful',
    'Relatable / Down-to-Earth',
    'Visionary / Futuristic',
    'Sarcastic / Bold Humor',
    'Calm / Neutral'
  ];

  const headlineFocusOptions = [
    'Auto-Select (Recommended)',
    'Benefit-Focused',
    'Problem-Solution',
    'Question Hook',
    'Number / Statistic',
    'Fear of Missing Out (FOMO)',
    'Curiosity / Teaser',
    'Emotional / Relatable',
    'Testimonial Style',
    'Comparison / Superiority',
    'Transformation Hook',
    'Desire-Driven',
    'Pain Avoidance',
    'Educational / Tip-Based',
    'Authority / Credibility'
  ];

  const adTextLengthOptions = [
    'Auto-Length (Platform Optimized)',
    'Short (Under 50 words)',
    'Medium (50–100 words)',
    'Long (100–150 words)',
    'Extended (150–250 words)'
  ];

  const ctaTypeOptions = [
    'Learn More',
    'Sign Up Now',
    'Shop Now',
    'Get Started',
    'Download Now',
    'Try for Free',
    'Book a Demo',
    'Subscribe',
    'Join Now',
    'Contact Us',
    'Get Offer',
    'Buy Now',
    'Donate Now',
    'Watch Video',
    'Read More',
    'Request a Quote',
    'Apply Now',
    'Join the Waitlist',
    'Message Us / DM Now',
    'Custom CTA'
  ];

  const emotionalAngleOptions = [
    'Pain → Solution',
    'FOMO (Fear of Missing Out)',
    'Social Proof',
    'Authority / Expertise',
    'Gain / Aspiration',
    'Relief / Stress-Free',
    'Curiosity / Mystery',
    'Logic / Data-Driven',
    'Trust & Safety',
    'Joy / Celebration',
    'Empathy / Understanding',
    'Transformation',
    'Empowerment / Confidence',
    'Urgency / Scarcity',
    'Neutral / Informative'
  ];

  const assetReuseOptions = [
    'Auto-Detect (Recommended)',
    'Prospecting (Cold Audience)',
    'Retargeting (Warm Audience)',
    'Remarketing (Existing Leads)',
    'Upsell / Cross-Sell (Customers)',
    'Loyalty / Re-Engagement'
  ];

  const audienceSuggestions = {
    b2b: [
      'Startup Founders',
      'Marketing Managers',
      'Small Business Owners',
      'SaaS Product Teams',
      'HR & Recruitment Professionals',
      'Agencies & Freelancers'
    ],
    b2c: [
      'Students',
      'Creators & Influencers',
      'Parents',
      'Fitness Enthusiasts',
      'Travelers',
      'Shoppers',
      'Tech-Savvy Gen Z'
    ]
  };

  const updatePlacements = (platform) => {
    setAvailablePlacements(platformPlacements[platform] || []);
    if (platformPlacements[platform] && platformPlacements[platform].length > 0) {
      setFormData(prev => ({
        ...prev,
        placement: platformPlacements[platform][0]
      }));
    }
  };

  const handlePlatformChange = (e) => {
    const platform = e.target.value;
    updatePlacements(platform);
    setFormData(prev => ({
      ...prev,
      platform,
      placement: ''
    }));
  };

  const handleAudienceInput = (e) => {
    const value = e.target.value;
    setAudienceInput(value);
    setShowAudienceSuggestions(value.length > 0);
  };

  const addAudienceChip = (chip) => {
    if (!formData.targetAudience.includes(chip)) {
      const newAudience = [...formData.targetAudience, chip];
      setFormData(prev => ({
        ...prev,
        targetAudience: newAudience
      }));
    }
    setAudienceInput('');
    setShowAudienceSuggestions(false);
  };

  const removeAudienceChip = (chipToRemove) => {
    const newAudience = formData.targetAudience.filter(chip => chip !== chipToRemove);
    setFormData(prev => ({
      ...prev,
      targetAudience: newAudience
    }));
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle custom objective field visibility
    if (name === 'campaignObjective' && value !== 'Custom Objective') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        customObjective: ''
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      campaignDuration: {
        ...prev.campaignDuration,
        [name]: value
      }
    }));
  };

  const handleArrayChange = (e, field) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newItem = e.target.value.trim();
      if (formData[field].length < 10) {
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
    setShowSummary(true);
    // Scroll to the summary section
    setTimeout(() => {
      const summaryElement = document.getElementById('form-summary');
      if (summaryElement) {
        summaryElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleGenerate = () => {
    // Actual form submission logic here
    showNotification('Generating your ad copy...', 'info');
    // Reset form or redirect as needed
  };

  const handleReset = () => {
    setFormData({
      platform: 'Meta (Facebook & Instagram)',
      placement: 'Facebook/Instagram Feed',
      campaignObjective: 'Brand Awareness',
      customObjective: '',
      targetAudience: [],
      productServices: '',
      keyBenefits: [],
      variants: 3,
      tone: 'Auto-Detect (Based on Platform)',
      headlineFocus: 'Auto-Select (Recommended)',
      adTextLength: 'Auto-Length (Platform Optimized)',
      ctaType: 'Learn More',
      emotionalAngle: 'Pain → Solution',
      complianceNote: '',
      brandVoice: '',
      assetReuseStrategy: 'Auto-Detect (Recommended)',
      offerPricing: '',
      audiencePain: [],
      campaignDuration: { start: '', end: '' },
      geoLanguageTarget: '',
      proofCredibility: [],
      showAdvanced: false
    });
    setAudienceInput('');
    setShowAudienceSuggestions(false);
    showNotification('Form has been reset', 'info');
  };

  const toggleAdvanced = () => {
    setFormData(prev => ({
      ...prev,
      showAdvanced: !prev.showAdvanced
    }));
  };

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
    toast: { position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', color: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999 },
    summaryContainer: {
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      padding: '24px',
      border: '1px solid #e5e7eb',
      marginTop: '16px'
    },
    summaryTitle: {
      marginTop: 0,
      marginBottom: '20px',
      color: '#111827',
      fontSize: '1.25rem',
      fontWeight: 600
    },
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '24px',
      marginBottom: '16px'
    },
    summarySection: {
      backgroundColor: 'white',
      padding: '16px',
      borderRadius: '6px',
      border: '1px solid #e5e7eb'
    },
    summarySectionTitle: {
      marginTop: 0,
      marginBottom: '12px',
      color: '#374151',
      fontSize: '1rem',
      fontWeight: 600,
      paddingBottom: '8px',
      borderBottom: '1px solid #e5e7eb'
    },
    summaryChip: {
      display: 'inline-block',
      backgroundColor: '#e0f2fe',
      color: '#0369a1',
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      fontWeight: 500
    },
    complianceNote: {
      backgroundColor: '#f3f4f6',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '0.875rem',
      lineHeight: '1.5',
      color: '#4b5563',
      marginTop: '8px',
      whiteSpace: 'pre-wrap'
    }
  };

  if (!mounted) return null;

  return (
    <div style={styles.container}>
      {/* Notification Toast */}
      {notification.show && (
        <div style={{
          ...styles.toast,
          backgroundColor: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
          borderColor: notification.type === 'error' ? '#fecaca' : '#bbf7d0',
          color: notification.type === 'error' ? '#b91c1c' : '#166534',
        }}>
          {notification.message}
          <button onClick={() => setNotification({...notification, show: false})} style={styles.toastClose}>&times;</button>
        </div>
      )}

      {!showSummary ? (
        <div style={styles.card}>
          {/* Header */}
          <div style={styles.header}>
            <h1 style={styles.title}>Ad Copy Generator</h1>
            <p style={styles.subtitle}>Create compelling ad copy for your campaigns</p>
            <div style={styles.progressBar}>
              <div style={{...styles.progressFill, width: '50%'}}></div>
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                {/* Platform & Placement - Two-Step Selector */}
                <div className="col-md-6">
                  <div style={styles.formGroup}>
                    <label htmlFor="platform" style={styles.label}>
                      Ad Platform <span style={{ color: '#ef4444' }}>*</span>
                      <span 
                        style={styles.infoIcon} 
                        data-tooltip-id="platform-tooltip" 
                        data-tooltip-content="Select the platform where your ad will run. This determines the available ad formats and requirements."
                      >
                        i
                      </span>
                    </label>
                    <Tooltip id="platform-tooltip" />
                    <select
                      id="platform"
                      name="platform"
                      value={formData.platform}
                      onChange={handlePlatformChange}
                      style={styles.input}
                      required
                    >
                      {platformOptions.map((platform, index) => (
                        <option key={index} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="col-md-6">
                  <div style={styles.formGroup}>
                    <label htmlFor="placement" style={styles.label}>
                      Ad Placement <span style={{ color: '#ef4444' }}>*</span>
                      <span 
                        style={styles.infoIcon} 
                        data-tooltip-id="placement-tooltip" 
                        data-tooltip-content="Select where your ad will be displayed on the platform. Options update based on your platform selection."
                      >
                        i
                      </span>
                    </label>
                    <Tooltip id="placement-tooltip" />
                    <select
                      id="placement"
                      name="placement"
                      value={formData.placement}
                      onChange={handleChange}
                      style={styles.input}
                      required
                      disabled={!formData.platform}
                    >
                      <option value="">Select a platform first</option>
                      {availablePlacements.map((placement, index) => (
                        <option key={index} value={placement}>
                          {placement}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Campaign Objective */}
                <div className="col-12">
                  <div style={styles.formGroup}>
                    <label htmlFor="campaignObjective" style={styles.label}>
                      Campaign Objective <span style={{ color: '#ef4444' }}>*</span>
                      <span 
                        style={styles.infoIcon} 
                        data-tooltip-id="campaignObjective-tooltip" 
                        data-tooltip-html="Define what you want to achieve with this campaign. This determines the tone, CTA, and messaging direction.<br/><br/>
                        <strong>Brand Awareness:</strong> Broad, memorable brand messaging<br/>
                        <strong>Reach/Impressions:</strong> Short, repetitive hooks for maximum recall<br/>
                        <strong>Engagement:</strong> Interactive content for comments/shares<br/>
                        <strong>Traffic:</strong> Action-driven text for website visits<br/>
                        <strong>Lead Gen:</strong> Persuasive copy for signups<br/>
                        <strong>Sales:</strong> Urgent, benefit-focused CTAs"
                      >
                        i
                      </span>
                    </label>
                    <Tooltip id="campaignObjective-tooltip" />
                    <select
                      id="campaignObjective"
                      name="campaignObjective"
                      value={formData.campaignObjective}
                      onChange={handleChange}
                      style={styles.input}
                      required
                    >
                      {campaignObjectiveOptions.map((objective, index) => (
                        <option key={index} value={objective}>
                          {objective}
                        </option>
                      ))}
                    </select>
                    
                    {formData.campaignObjective === 'Custom Objective' && (
                      <div style={{ marginTop: '12px' }}>
                        <input
                          type="text"
                          name="customObjective"
                          value={formData.customObjective}
                          onChange={handleChange}
                          style={styles.input}
                          placeholder="Describe your custom objective"
                          required={formData.campaignObjective === 'Custom Objective'}
                        />
                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                          Please describe what you want to achieve with this campaign.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Target Audience */}
                <div className="col-12">
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      Target Audience <span style={{ color: '#ef4444' }}>*</span>
                      <span 
                        style={styles.infoIcon} 
                        data-tooltip-id="targetAudience-tooltip" 
                        data-tooltip-html="Define your ideal customer profile. Add multiple audience segments for better targeting.<br/><br/>
                        <strong>Examples:</strong><br/>
                        • Age & Gender: 'Women 25-34', 'Men 35-44'<br/>
                        • Interests: 'Fitness Enthusiasts', 'Tech Early Adopters'<br/>
                        • Professions: 'Marketing Managers', 'Small Business Owners'<br/>
                        • Behaviors: 'Frequent Travelers', 'Online Shoppers'"
                      >
                        i
                      </span>
                    </label>
                    <Tooltip id="targetAudience-tooltip" />
                    
                    {/* Audience Chips */}
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px', 
                  marginBottom: '8px',
                  minHeight: '40px',
                  alignItems: 'center',
                  padding: '4px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: formData.targetAudience.length > 0 ? '#f9fafb' : 'white'
                }}>
                  {formData.targetAudience.length === 0 && (
                    <span style={{ color: '#9ca3af', fontSize: '14px', marginLeft: '8px' }}>
                      Add audience segments (e.g., 'Women 25-34', 'Fitness Enthusiasts')
                    </span>
                  )}
                  {formData.targetAudience.map((chip, index) => (
                    <span 
                      key={index} 
                      style={{
                        ...styles.badge,
                        ...styles.badgePrimary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px'
                      }}
                    >
                      {chip}
                      <button 
                        type="button" 
                        onClick={() => removeAudienceChip(chip)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                          lineHeight: 1,
                          padding: '0 0 0 4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255,255,255,0.2)'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Audience Input with Suggestions */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={audienceInput}
                    onChange={handleAudienceInput}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && audienceInput.trim()) {
                        e.preventDefault();
                        addAudienceChip(audienceInput.trim());
                      }
                    }}
                    style={{
                      ...styles.input,
                      marginBottom: 0,
                      borderTopLeftRadius: audienceInput ? '6px 6px 0 0' : '6px',
                      borderBottomLeftRadius: audienceInput ? '0' : '6px',
                      borderBottomRightRadius: audienceInput ? '0' : '6px'
                    }}
                    placeholder="Type and press Enter to add audience segments"
                  />
                  
                  {/* Suggestions Dropdown */}
                  {audienceInput && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #d1d5db',
                      borderTop: 'none',
                      borderBottomLeftRadius: '6px',
                      borderBottomRightRadius: '6px',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}>
                      {Object.entries(audienceSuggestions).map(([category, suggestions]) => {
                        const filtered = suggestions.filter(s => 
                          s.toLowerCase().includes(audienceInput.toLowerCase()) && 
                          !formData.targetAudience.includes(s)
                        );
                        
                        if (filtered.length === 0) return null;
                        
                        return (
                          <div key={category}>
                            <div style={{
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#4b5563',
                              backgroundColor: '#f3f4f6',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}>
                              {category}
                            </div>
                            {filtered.map((suggestion, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  addAudienceChip(suggestion);
                                  setAudienceInput('');
                                }}
                                style={{
                                  padding: '8px 16px',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.15s',
                                  ':hover': {
                                    backgroundColor: '#f3f4f6'
                                  }
                                }}
                              >
                                {suggestion}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                      
                      {/* Add custom option */}
                      {audienceInput && !Object.values(audienceSuggestions)
                        .flat()
                        .some(s => s.toLowerCase() === audienceInput.toLowerCase()) && (
                        <div
                          onClick={() => {
                            addAudienceChip(audienceInput);
                            setAudienceInput('');
                          }}
                          style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            backgroundColor: '#f8fafc',
                            borderTop: '1px solid #e5e7eb',
                            color: '#3b82f6',
                            fontWeight: 500
                          }}
                        >
                          Add "{audienceInput}" as custom audience
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Product/Services */}
              <div className="col-12">
                <div style={styles.formGroup}>
                  <label htmlFor="productServices" style={styles.label}>
                    Product/Services <span style={{ color: '#ef4444' }}>*</span>
                    <span 
                      style={styles.infoIcon} 
                      data-tooltip-id="productServices-tooltip" 
                      data-tooltip-html="Provide detailed information about your product or service. Include unique selling points, features, and any technical specifications that make your offering stand out."
                    >
                      i
                    </span>
                  </label>
                  <Tooltip id="productServices-tooltip" />
                  <textarea
                    id="productServices"
                    name="productServices"
                    value={formData.productServices}
                    onChange={handleChange}
                    style={{...styles.textarea, minHeight: '100px'}}
                    placeholder="Describe your product or service in detail. What makes it unique? What problems does it solve?"
                    required
                  />
                </div>
              </div>

              {/* Tone */}
              <div className="col-md-6">
                <div style={styles.formGroup}>
                  <label htmlFor="tone" style={styles.label}>
                    Tone <span style={{ color: '#ef4444' }}>*</span>
                    <span 
                      style={styles.infoIcon}
                      data-tooltip-id="tone-tooltip"
                      data-tooltip-html="Select the tone that best matches your brand voice and campaign goals.<br/><br/>
                      <strong>Auto-Detect (Recommended):</strong> Automatically selects the best tone based on platform and objective<br/>
                      <strong>Professional/Corporate:</strong> Formal, business-appropriate language<br/>
                      <strong>Friendly/Conversational:</strong> Casual, approachable tone<br/>
                      <strong>Inspirational:</strong> Uplifting and motivational"
                    >
                      i
                    </span>
                  </label>
                  <Tooltip id="tone-tooltip" />
                  <select
                    id="tone"
                    name="tone"
                    value={formData.tone}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  >
                    {toneOptions.map((tone, index) => (
                      <option key={index} value={tone}>
                        {tone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Headline Focus */}
              <div className="col-md-6">
                <div style={styles.formGroup}>
                  <label htmlFor="headlineFocus" style={styles.label}>
                    Headline Focus
                    <span 
                      style={styles.infoIcon}
                      data-tooltip-id="headlineFocus-tooltip"
                      data-tooltip-html="Choose the primary focus for your ad headlines to optimize for engagement.<br/><br/>
                      <strong>Auto-Select (Recommended):</strong> Let the system choose the best approach<br/>
                      <strong>Benefit-Focused:</strong> Highlight key benefits<br/>
                      <strong>Problem-Solution:</strong> Present a problem and your solution"
                    >
                      i
                    </span>
                  </label>
                  <Tooltip id="headlineFocus-tooltip" />
                  <select
                    id="headlineFocus"
                    name="headlineFocus"
                    value={formData.headlineFocus}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    {headlineFocusOptions.map((focus, index) => (
                      <option key={index} value={focus}>
                        {focus}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ad Text Length */}
              <div className="col-md-6">
                <div style={styles.formGroup}>
                  <label htmlFor="adTextLength" style={styles.label}>
                    Ad Text Length
                    <span 
                      style={styles.infoIcon}
                      data-tooltip-id="adTextLength-tooltip"
                      data-tooltip-html="Select the desired length for your ad copy.<br/><br/>
                      <strong>Auto-Length (Recommended):</strong> Optimizes length based on platform best practices<br/>
                      <strong>Short:</strong> Concise, attention-grabbing copy (under 50 words)<br/>
                      <strong>Medium:</strong> Balanced detail and brevity (50-100 words)"
                    >
                      i
                    </span>
                  </label>
                  <Tooltip id="adTextLength-tooltip" />
                  <select
                    id="adTextLength"
                    name="adTextLength"
                    value={formData.adTextLength}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    {adTextLengthOptions.map((length, index) => (
                      <option key={index} value={length}>
                        {length}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CTA Type */}
              <div className="col-md-6">
                <div style={styles.formGroup}>
                  <label htmlFor="ctaType" style={styles.label}>
                    Call to Action (CTA)
                    <span 
                      style={styles.infoIcon}
                      data-tooltip-id="ctaType-tooltip"
                      data-tooltip-html="Select the primary action you want users to take.<br/><br/>
                      <strong>Learn More:</strong> For informational content<br/>
                      <strong>Shop Now:</strong> Direct product purchases<br/>
                      <strong>Sign Up:</strong> For lead generation"
                    >
                      i
                    </span>
                  </label>
                  <Tooltip id="ctaType-tooltip" />
                  <select
                    id="ctaType"
                    name="ctaType"
                    value={formData.ctaType}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    {ctaTypeOptions.map((cta, index) => (
                      <option key={index} value={cta}>
                        {cta}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Key Benefits */}
              <div className="col-12">
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Key Benefits
                    <span style={styles.infoIcon} data-tooltip-id="keyBenefits-tooltip" data-tooltip-content="List the main benefits of your product/service (press Enter to add)">i</span>
                  </label>
                  <Tooltip id="keyBenefits-tooltip" />
                  <input
                    type="text"
                    style={styles.input}
                    placeholder="Add a benefit and press Enter"
                    onKeyPress={(e) => handleArrayChange(e, 'keyBenefits')}
                    disabled={formData.keyBenefits.length >= 10}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                    {formData.keyBenefits.map((benefit, index) => (
                      <span key={index} style={{...styles.badge, ...styles.badgePrimary}}>
                        {benefit}
                        <button type="button" style={styles.removeBtn} onClick={() => removeItem('keyBenefits', index)}>×</button>
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
                    <span style={styles.infoIcon} data-tooltip-id="variants-tooltip" data-tooltip-content="How many different ad variations would you like to generate?">i</span>
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

              {/* Tone */}
              <div className="col-md-6">
                <div style={styles.formGroup}>
                  <label htmlFor="tone" style={styles.label}>
                    Tone
                    <span style={styles.infoIcon} data-tooltip-id="tone-tooltip" data-tooltip-content="Select the tone for your ad copy">i</span>
                  </label>
                  <Tooltip id="tone-tooltip" />
                  <select
                    id="tone"
                    name="tone"
                    value={formData.tone}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="">Select Tone</option>
                    {toneOptions.map((tone, index) => (
                      <option key={index} value={tone}>{tone}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ad Text Length */}
              <div className="col-md-6">
                <div style={styles.formGroup}>
                  <label htmlFor="adTextLength" style={styles.label}>
                    Ad Text Length
                  </label>
                  <select
                    id="adTextLength"
                    name="adTextLength"
                    value={formData.adTextLength}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    {adTextLengthOptions.map((length, index) => (
                      <option key={index} value={length}>{length}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CTA Type */}
              <div className="col-md-6">
                <div style={styles.formGroup}>
                  <label htmlFor="ctaType" style={styles.label}>
                    Call-to-Action
                  </label>
                  <select
                    id="ctaType"
                    name="ctaType"
                    value={formData.ctaType}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="">Select CTA Type</option>
                    {ctaTypeOptions.map((cta, index) => (
                      <option key={index} value={cta}>{cta}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Emotional Angle */}
              <div className="col-md-6">
                <div style={styles.formGroup}>
                  <label htmlFor="emotionalAngle" style={styles.label}>
                    Emotional Angle
                  </label>
                  <select
                    id="emotionalAngle"
                    name="emotionalAngle"
                    value={formData.emotionalAngle}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="">Select Emotional Angle</option>
                    {emotionalAngleOptions.map((angle, index) => (
                      <option key={index} value={angle}>{angle}</option>
                    ))}
                  </select>
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
                  {/* Headline Focus */}
                  <div className="col-12">
                    <div style={styles.formGroup}>
                      <label htmlFor="headlineFocus" style={styles.label}>
                        Headline Focus
                        <span style={styles.infoIcon} data-tooltip-id="headlineFocus-tooltip" data-tooltip-content="What should be the main focus of your ad headline?">i</span>
                      </label>
                      <Tooltip id="headlineFocus-tooltip" />
                      <input
                        type="text"
                        id="headlineFocus"
                        name="headlineFocus"
                        value={formData.headlineFocus}
                        onChange={handleChange}
                        style={styles.input}
                        placeholder="e.g., Problem-solving, Benefits, Features"
                      />
                    </div>
                  </div>

                  {/* Brand Voice */}
                  <div className="col-12">
                    <div style={styles.formGroup}>
                      <label htmlFor="brandVoice" style={styles.label}>
                        Brand Voice
                      </label>
                      <input
                        type="text"
                        id="brandVoice"
                        name="brandVoice"
                        value={formData.brandVoice}
                        onChange={handleChange}
                        style={styles.input}
                        placeholder="Describe your brand's tone and personality"
                      />
                    </div>
                  </div>

                  {/* Offer & Pricing */}
                  <div className="col-md-6">
                    <div style={styles.formGroup}>
                      <label htmlFor="offerPricing" style={styles.label}>
                        Offer & Pricing
                      </label>
                      <input
                        type="text"
                        id="offerPricing"
                        name="offerPricing"
                        value={formData.offerPricing}
                        onChange={handleChange}
                        style={styles.input}
                        placeholder="e.g., 20% off, Free trial, Limited time offer"
                      />
                    </div>
                  </div>

                  {/* Asset Reuse Strategy */}
                  <div className="col-md-6">
                    <div style={styles.formGroup}>
                      <label htmlFor="assetReuseStrategy" style={styles.label}>
                        Asset Reuse Strategy
                      </label>
                      <select
                        id="assetReuseStrategy"
                        name="assetReuseStrategy"
                        value={formData.assetReuseStrategy}
                        onChange={handleChange}
                        style={styles.input}
                      >
                        <option value="">Select Strategy</option>
                        {assetReuseOptions.map((strategy, index) => (
                          <option key={index} value={strategy}>{strategy}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Audience Pain Points */}
                  <div className="col-12">
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        Audience Pain Points
                        <span style={styles.infoIcon} data-tooltip-id="audiencePain-tooltip" data-tooltip-content="What problems or pain points does your product/service solve? (press Enter to add)">i</span>
                      </label>
                      <Tooltip id="audiencePain-tooltip" />
                      <input
                        type="text"
                        style={styles.input}
                        placeholder="Add a pain point and press Enter"
                        onKeyPress={(e) => handleArrayChange(e, 'audiencePain')}
                      />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                        {formData.audiencePain.map((pain, index) => (
                          <span key={index} style={{...styles.badge, ...styles.badgeSecondary}}>
                            {pain}
                            <button type="button" style={styles.removeBtn} onClick={() => removeItem('audiencePain', index)}>×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Campaign Duration */}
                  <div className="col-md-6">
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Campaign Start Date</label>
                      <input
                        type="date"
                        name="start"
                        value={formData.campaignDuration.start}
                        onChange={handleDateChange}
                        style={styles.input}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Campaign End Date</label>
                      <input
                        type="date"
                        name="end"
                        value={formData.campaignDuration.end}
                        onChange={handleDateChange}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  {/* Geo & Language Targeting */}
                  <div className="col-12">
                    <div style={styles.formGroup}>
                      <label htmlFor="geoLanguageTarget" style={styles.label}>
                        Geo & Language Targeting
                      </label>
                      <input
                        type="text"
                        id="geoLanguageTarget"
                        name="geoLanguageTarget"
                        value={formData.geoLanguageTarget}
                        onChange={handleChange}
                        style={styles.input}
                        placeholder="e.g., United States, English"
                      />
                    </div>
                  </div>

                  {/* Proof & Credibility */}
                  <div className="col-12">
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        Proof & Credibility Elements
                        <span style={styles.infoIcon} data-tooltip-id="proofCredibility-tooltip" data-tooltip-content="Add trust signals (press Enter to add)">i</span>
                      </label>
                      <Tooltip id="proofCredibility-tooltip" />
                      <input
                        type="text"
                        style={styles.input}
                        placeholder="e.g., '10,000+ happy customers', 'Rated 4.9/5 stars'"
                        onKeyPress={(e) => handleArrayChange(e, 'proofCredibility')}
                      />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                        {formData.proofCredibility.map((item, index) => (
                          <span key={index} style={{...styles.badge, ...styles.badgeSuccess}}>
                            {item}
                            <button type="button" style={styles.removeBtn} onClick={() => removeItem('proofCredibility', index)}>×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Compliance Note */}
                  <div className="col-12">
                    <div style={styles.formGroup}>
                      <label htmlFor="complianceNote" style={styles.label}>
                        Compliance Note
                      </label>
                      <textarea
                        id="complianceNote"
                        name="complianceNote"
                        value={formData.complianceNote}
                        onChange={handleChange}
                        style={{...styles.textarea, minHeight: '80px'}}
                        placeholder="Any legal disclaimers or compliance requirements for your ads"
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
                    Review & Generate
                  </button>
                </div>
              </div>
                </div>
            </div>
          </form>
        </div>
      </div>
      ) : (
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Review Your Selections</h1>
          <p style={styles.subtitle}>Please review your ad copy details before generating</p>
          <div style={styles.progressBar}>
            <div style={{...styles.progressFill, width: '100%'}}></div>
          </div>
        </div>
        <div style={{ padding: '24px' }}>
          <div id="form-summary" className="col-12 mt-5" style={styles.summaryContainer}>
            <h4 style={styles.summaryTitle}>Review Your Selections</h4>
            <div style={styles.summaryGrid}>
              <div style={styles.summarySection}>
                <h5 style={styles.summarySectionTitle}>Campaign Details</h5>
                <p><strong>Platform:</strong> {formData.platform}</p>
                <p><strong>Placement:</strong> {formData.placement}</p>
                <p><strong>Campaign Objective:</strong> {formData.campaignObjective}</p>
                {formData.customObjective && <p><strong>Custom Objective:</strong> {formData.customObjective}</p>}
                <p><strong>Number of Variants:</strong> {formData.variants}</p>
              </div>

              <div style={styles.summarySection}>
                <h5 style={styles.summarySectionTitle}>Targeting</h5>
                <p><strong>Target Audience:</strong></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {formData.targetAudience.length > 0 ? (
                    formData.targetAudience.map((audience, index) => (
                      <span key={index} style={styles.summaryChip}>{audience}</span>
                    ))
                  ) : (
                    <span style={{ color: '#6b7280' }}>No audience segments added</span>
                  )}
                </div>
                {formData.geoLanguageTarget && (
                  <p><strong>Geo/Language:</strong> {formData.geoLanguageTarget}</p>
                )}
              </div>

              <div style={styles.summarySection}>
                <h5 style={styles.summarySectionTitle}>Content Style</h5>
                <p><strong>Tone:</strong> {formData.tone}</p>
                <p><strong>Headline Focus:</strong> {formData.headlineFocus}</p>
                <p><strong>Ad Text Length:</strong> {formData.adTextLength}</p>
                <p><strong>CTA:</strong> {formData.ctaType}</p>
                <p><strong>Emotional Angle:</strong> {formData.emotionalAngle}</p>
              </div>

              {formData.showAdvanced && (
                <div style={styles.summarySection}>
                  <h5 style={styles.summarySectionTitle}>Advanced Settings</h5>
                  {formData.brandVoice && <p><strong>Brand Voice:</strong> {formData.brandVoice}</p>}
                  {formData.offerPricing && <p><strong>Offer & Pricing:</strong> {formData.offerPricing}</p>}
                  {formData.assetReuseStrategy && <p><strong>Asset Reuse:</strong> {formData.assetReuseStrategy}</p>}
                  {formData.complianceNote && (
                    <div>
                      <p><strong>Compliance Note:</strong></p>
                      <p style={styles.complianceNote}>{formData.complianceNote}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setShowSummary(false)}
                style={{...styles.btn, ...styles.btnOutline}}
              >
                Back to Edit
              </button>
              <button 
                type="button" 
                onClick={handleGenerate}
                style={{...styles.btn, ...styles.btnPrimary}}
              >
                Generate Ad Copy
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default AdCopyGeneratorForm;