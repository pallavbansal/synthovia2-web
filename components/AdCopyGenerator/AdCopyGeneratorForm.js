import React, { useState, useEffect, useCallback } from 'react';
import { Tooltip } from 'react-tooltip';

// --- API Configuration (Defined internally to prevent build issues) ---
const BASE_URL = 'https://olive-gull-905765.hostingersite.com/public/api/v1';
const API = {
    GET_FIELD_OPTIONS: `${BASE_URL}/ad-copy/options?field_type=all`,
    GENERATE_AD_COPY: `${BASE_URL}/ad-copy/generate`,
    // New endpoint for fetching old variants using request_id
    GET_VARIANTS_LOG: (requestId) => `${BASE_URL}/ad-copy/${requestId}/variants`,
    // New endpoint for regenerating a single variant using variant_id
    REGENERATE_VARIANT: (variantId) => `${BASE_URL}/ad-copy/variants/${variantId}/regenerate`,
    AUTH_TOKEN: '3|WwYYaSEAfSr1guYBFdPQlPtGg0dKphy1sVMDLBmX647db358',
};
const AUTH_HEADER = `Bearer ${API.AUTH_TOKEN}`;
// --------------------------------------------------------------------

const defaultFieldOptions = {
    platform: [],
    placement: [],
    campaign_objective: [],
    tone_style: [],
    headline_focus: [],
    primary_text_length: [],
    cta_type: [],
    emotional_angle: [],
    asset_reuse_strategy: [],
    brand_voice_personality: [],
};

// --- Helper Functions (Retained) ---
const mapSelectionToApiObject = (fieldName, selectedLabel, options, isAutoSelect = false) => {
    if (isAutoSelect && selectedLabel.includes('Auto-')) {
        return { type: "auto-detect", id: null, value: selectedLabel };
    }
    if (fieldName === 'campaign_objective' && selectedLabel === 'Custom Objective') {
        return { type: "custom", id: null, value: selectedLabel };
    }
    
    let optionList = options[fieldName];
    if (fieldName === 'primary_text_length') {
        optionList = options.primary_text_length;
    }

    const selectedOption = optionList?.find(opt => 
        selectedLabel === opt.label.replace('\t', '→')
    );

    if (selectedOption) {
        return {
            type: "predefined",
            id: selectedOption.id,
            value: selectedLabel 
        };
    }
    return { type: "custom", id: null, value: selectedLabel };
};

const getLabelFromKey = (selectedKey, fieldName, options) => {
    let optionList = options[fieldName];
    if (fieldName === 'adTextLength') {
        optionList = options.primary_text_length;
    }

    if (!optionList) return selectedKey;

    const selectedOption = optionList.find(opt => opt.key === selectedKey);
    
    if (selectedOption) {
        return selectedOption.label.replace('\t', '→');
    }
    return selectedKey;
};


// --------------------------------------------------------------------
// MODAL COMPONENT LOGIC
// --------------------------------------------------------------------

const VariantModalContent = ({ variants, onClose, inputs, onRequestRegenerate, showNotification }) => {
    const [expandedIndex, setExpandedIndex] = useState(0); 
    const [regeneratingId, setRegeneratingId] = useState(null);

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

    const handleRegenerate = async (variantId) => {
        setRegeneratingId(variantId);
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
            padding: '20px'
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
        }
    };

    if (!variants || variants.length === 0) return null;

    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.modal}>
                <div style={modalStyles.header}>
                    <h2 style={modalStyles.title}>Generated Ad Copy Variants ({variants.length})</h2>
                    <button 
                        onClick={onClose} 
                        style={{
                            background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', 
                            color: '#4b5563', padding: '4px', lineHeight: 1
                        }}
                    >
                        &times;
                    </button>
                </div>
                <div style={modalStyles.body}>
                    <p style={{marginBottom: '20px', color: '#475569', fontSize: '14px'}}>
                        Click on any variant card to expand and view the full ad copy.
                    </p>
                    {variants.filter(v => v.show_variant).map((variant, index) => {
                        const isExpanded = index === expandedIndex;
                        const isRegenerating = regeneratingId === variant.id;

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
                                    }}
                                    onClick={() => toggleExpand(index)}
                                >
                                    <span style={{flexGrow: 1}}>Variant {index + 1}: {inputs.platform?.value} ({inputs.placement?.value})</span>
                                    
                                    <div onClick={(e) => e.stopPropagation()} style={{display: 'flex', alignItems: 'center'}}>
                                        {/* Copy Button */}
                                        <button 
                                            style={{
                                                ...modalStyles.actionButton,
                                                backgroundColor: '#10b981', color: 'white', border: 'none',
                                            }}
                                            onClick={() => handleCopy(variant.content, index + 1)}
                                        >
                                            Copy
                                        </button>

                                        {/* Regenerate Button */}
                                        <button 
                                            style={{
                                                ...modalStyles.actionButton,
                                                backgroundColor: isRegenerating ? '#9ca3af' : '#f97316', 
                                                color: 'white', 
                                                border: 'none',
                                                cursor: isRegenerating ? 'wait' : 'pointer'
                                            }}
                                            onClick={() => handleRegenerate(variant.id)}
                                            disabled={isRegenerating}
                                        >
                                            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                                        </button>
                                    </div>
                                    
                                    <span>{isExpanded ? '▲' : '▼'}</span>
                                </div>
                                {isExpanded && (
                                    <div style={modalStyles.cardContent}>
                                        <div style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
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
                                transition: 'background-color 0.15s ease-in-out'
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


// --------------------------------------------------------------------
// UPDATED AdCopyGeneratorForm COMPONENT (Fixing Platform Change)
// --------------------------------------------------------------------

const AdCopyGeneratorForm = () => {
  // Hardcoded audience suggestions (moved inside the component function)
  const audienceSuggestions = {
    'Demographics': ['Women 25-34', 'Men 35-44', 'Parents of Toddlers'],
    'Interests': ['Fitness Enthusiasts', 'Tech Early Adopters', 'Travel Lovers'],
    'Professions': ['Marketing Managers', 'Small Business Owners', 'Software Engineers']
  };

  const [formData, setFormData] = useState({
    platform: 'Meta (Facebook & Instagram)',
    platformMode: 'predefined',
    platformCustom: '',
    placement: 'Facebook Feed',
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
    showAdvanced: false,
    usp: '',
    featureHighlight: '',
    problemScenario: '',
    brandVoicePersonalityMode: 'predefined',
    brandVoicePersonalityOption: '',
    brandVoicePersonalityCustom: ''
  });
  
  const [audienceInput, setAudienceInput] = useState('');
  const [showAudienceSuggestions, setShowAudienceSuggestions] = useState(false);
  const [placementMode, setPlacementMode] = useState('predefined');
  const [placementCustom, setPlacementCustom] = useState('');
  const [campaignObjectiveMode, setCampaignObjectiveMode] = useState('predefined');
  const [toneMode, setToneMode] = useState('predefined');
  const [toneCustom, setToneCustom] = useState('');
  const [headlineFocusMode, setHeadlineFocusMode] = useState('predefined');
  const [headlineFocusCustom, setHeadlineFocusCustom] = useState('');
  const [ctaTypeMode, setCtaTypeMode] = useState('predefined');
  const [ctaTypeCustom, setCtaTypeCustom] = useState('');
  const [emotionalAngleMode, setEmotionalAngleMode] = useState('predefined');
  const [emotionalAngleCustom, setEmotionalAngleCustom] = useState('');
  
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [mounted, setMounted] = useState(false);
  const [availablePlacements, setAvailablePlacements] = useState([]);
  const [fieldOptions, setFieldOptions] = useState(defaultFieldOptions);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [requestId, setRequestId] = useState(null);
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [generatedVariantsData, setGeneratedVariantsData] = useState({ 
      variants: [], 
      inputs: {}, 
  });

  const showNotification = useCallback((message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  }, []);

  // REFACTORED: updatePlacements now accepts and uses the options list directly
  const updatePlacements = useCallback((platformLabel, allPlacements) => {
    if (!allPlacements) return;

    const filteredPlacements = allPlacements.filter(opt => 
      opt.parent_label === platformLabel
    );

    setAvailablePlacements(filteredPlacements);
    
    // Set the new default placement to the first available option
    const newPlacement = filteredPlacements.length > 0 ? filteredPlacements[0].label : '';
    setFormData(prev => ({
      ...prev,
      placement: newPlacement || ''
    }));
  }, []); // Empty dependency array, relies on caller to pass data

  // Initial Data Load (Retained)
  useEffect(() => {
    setMounted(true);

    const fetchFieldOptions = async () => {
      const maxRetries = 3;
      let attempt = 0;
      setLoadingOptions(true);
      setOptionsError('');

      while (attempt < maxRetries) {
        try {
          if (attempt > 0) {
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          const response = await fetch(API.GET_FIELD_OPTIONS, {
            headers: { Authorization: AUTH_HEADER },
          });
          
          if (response.status === 429 && attempt < maxRetries - 1) {
            attempt++;
            continue;
          }

          if (!response.ok) {
            throw new Error(`Failed to fetch field options (Status: ${response.status})`);
          }

          const apiData = await response.json();
          
          if (apiData && apiData.data && typeof apiData.data === 'object') {
            const loadedOptions = {
                ...defaultFieldOptions,
                ...apiData.data
            };
            setFieldOptions(loadedOptions);
            
            const defaultPlatform = loadedOptions.platform.find(opt => opt.label === formData.platform)?.label || formData.platform;
            
            // Pass loaded placement data directly
            updatePlacements(defaultPlatform, loadedOptions.placement);
            
            // Update other defaults
            setFormData(prev => ({
                ...prev,
                platform: defaultPlatform,
                // placement is handled by updatePlacements
                campaignObjective: loadedOptions.campaign_objective.find(opt => opt.label === prev.campaignObjective)?.label || prev.campaignObjective,
                tone: loadedOptions.tone_style.find(opt => opt.label === prev.tone || prev.tone.includes('Auto'))?.label || prev.tone,
                headlineFocus: loadedOptions.headline_focus.find(opt => opt.label === prev.headlineFocus || prev.headlineFocus.includes('Auto'))?.label || prev.headlineFocus,
                adTextLength: loadedOptions.primary_text_length.find(opt => opt.label === prev.adTextLength || prev.adTextLength.includes('Auto'))?.label || prev.adTextLength,
                ctaType: loadedOptions.cta_type.find(opt => opt.label === prev.ctaType)?.label || prev.ctaType,
                emotionalAngle: loadedOptions.emotional_angle.find(opt => opt.label.replace('\t', '→') === prev.emotionalAngle)?.label.replace('\t', '→') || prev.emotionalAngle,
                assetReuseStrategy: loadedOptions.asset_reuse_strategy.find(opt => opt.label === prev.assetReuseStrategy || prev.assetReuseStrategy.includes('Auto'))?.label || prev.assetReuseStrategy,
            }));
            
            setLoadingOptions(false);
            return;
          } else {
            throw new Error('Invalid data structure from API');
          }
        } catch (error) {
          attempt++;
          if (attempt >= maxRetries) {
            setOptionsError('Unable to load field options. Default options are being used.');
            setLoadingOptions(false);
            return;
          }
        }
      }
    };

    fetchFieldOptions();
    
  }, []); // Initial load only

  // FIXED: Runtime Platform Change Effect
  useEffect(() => {
    // This effect runs whenever formData.platform or fieldOptions.placement (master list) changes.
    // It explicitly passes the current, updated options list to updatePlacements.
    updatePlacements(formData.platform, fieldOptions.placement);
  }, [formData.platform, fieldOptions.placement, updatePlacements]);

  
  const handlePlatformChange = (e) => {
    const selectedKey = e.target.value;
    const platformLabel = getLabelFromKey(selectedKey, 'platform', fieldOptions);

    // This simply updates the platform label in state.
    // The useEffect hook above handles calling updatePlacements to filter based on this new label.
    setFormData(prev => ({ ...prev, platform: platformLabel }));
  };

  const handleAudienceInput = (e) => {
    const value = e.target.value;
    setAudienceInput(value);
    setShowAudienceSuggestions(value.length > 0);
  };

  const addAudienceChip = (chip) => {
    if (!formData.targetAudience.includes(chip)) {
      setFormData(prev => ({ ...prev, targetAudience: [...prev.targetAudience, chip] }));
    }
    setAudienceInput('');
    setShowAudienceSuggestions(false);
  };

  const removeAudienceChip = (chipToRemove) => {
    setFormData(prev => ({ ...prev, targetAudience: prev.targetAudience.filter(chip => chip !== chipToRemove) }));
  };

  const handleChange = (e) => {
    const { name, value: selectedKey, type, checked } = e.target;
    
    if (type === 'checkbox') {
        setFormData(prev => ({ ...prev, [name]: checked }));
        return;
    }

    // Special handling for Ad Platform custom text
    if (name === 'platformCustom') {
        setFormData(prev => ({
          ...prev,
          platformCustom: selectedKey,
          platform: selectedKey,
        }));
        return;
    }

    // Special handling for Brand Voice Personality mode and option
    if (name === 'brandVoicePersonalityMode') {
        setFormData(prev => ({
          ...prev,
          brandVoicePersonalityMode: selectedKey,
          // Reset custom / option when switching modes
          brandVoicePersonalityCustom: selectedKey === 'custom' ? prev.brandVoicePersonalityCustom : '',
        }));
        return;
    }

    if (name === 'brandVoicePersonalityOption') {
        // Map key -> label from API options list so UI shows label consistently
        const option = (fieldOptions.brand_voice_personality || []).find(opt => opt.key === selectedKey);
        const label = option ? option.label : selectedKey;
        setFormData(prev => ({ ...prev, brandVoicePersonalityOption: label }));
        return;
    }

    let labelToStore = selectedKey;
    if (selectedKey) {
        const fieldOptionsKey = name === 'adTextLength' ? 'primary_text_length' : name;
        if (e.target.tagName === 'SELECT') {
            labelToStore = getLabelFromKey(selectedKey, fieldOptionsKey, fieldOptions);
        }
        
        if (name === 'campaignObjective' && labelToStore !== 'Custom Objective') {
            setFormData(prev => ({ ...prev, [name]: labelToStore, customObjective: '' }));
            return;
        }
    }
    
    setFormData(prev => ({ ...prev, [name]: labelToStore }));
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

  const validateForm = () => {
    const missing = [];

    if (!formData.platform) missing.push('Ad Platform');
    if (!formData.placement) missing.push('Ad Placement');
    if (!formData.campaignObjective) missing.push('Campaign Objective');
    if (formData.campaignObjective === 'Custom Objective' && !formData.customObjective.trim()) {
      missing.push('Custom Objective');
    }

    if (!formData.targetAudience || formData.targetAudience.length === 0) {
      missing.push('Target Audience');
    }

    if (!formData.productServices.trim()) missing.push('Product/Services');

    if (!formData.tone) missing.push('Tone');
    if (!formData.headlineFocus) missing.push('Headline Focus');
    // Ad Text Length is optional; default Auto-Length can be sent without validation
    if (!formData.ctaType) missing.push('Call to Action (CTA)');
    if (!formData.variants) missing.push('Number of Variants');
    if (!formData.emotionalAngle) missing.push('Emotional Angle');

    if (!formData.keyBenefits || formData.keyBenefits.length === 0) {
      missing.push('Key Benefits');
    }

    // All advanced fields (Brand Voice, USP, Feature Highlight, Problem Scenario,
    // Offer & Pricing, Asset Reuse Strategy, Audience Pain Points, Campaign Duration,
    // Geo & Language, Proof & Credibility, Compliance Note, Brand Voice Personality)
    // are intentionally optional and therefore not validated here.

    return missing;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const missingFields = validateForm();

    if (missingFields.length > 0) {
      const message = `Please fill all required fields: ${missingFields.join(', ')}`;
      showNotification(message, 'error');
      return;
    }

    setShowSummary(true);
    setTimeout(() => {
      const summaryElement = document.getElementById('form-summary');
      if (summaryElement) {
        summaryElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const toggleAdvanced = () => {
    setFormData(prev => ({
      ...prev,
      showAdvanced: !prev.showAdvanced
    }));
  };

  const formatPayload = () => {
    const parseGeoLanguage = (input) => {
      if (!input) return { locale: null, language: null };
      const parts = input.split(',').map(p => p.trim());
      const geo = parts[0]?.trim();
      const lang = parts.length > 1 ? parts[1]?.trim() : null;
      return { locale: geo || null, language: lang || null };
    };

    const payload = {
      platform: mapSelectionToApiObject('platform', formData.platform, fieldOptions.platform, true),
      placement: mapSelectionToApiObject('placement', formData.placement, fieldOptions.placement, true),
      campaign_objective: formData.campaignObjective === 'Custom Objective' ? 
        { type: 'custom', id: null, value: formData.customObjective || 'Custom Objective' } : 
        mapSelectionToApiObject('campaign_objective', formData.campaignObjective, fieldOptions.campaign_objective, false),
      target_audience: formData.targetAudience,
      key_benefits: formData.keyBenefits,
      audience_pain_points: formData.audiencePain,
      proof_elements: formData.proofCredibility,
      product_description: formData.productServices,
      number_of_variants: parseInt(formData.variants, 10),
      compliance_notes: formData.complianceNote,
      brand_voice: formData.brandVoice,
      offer_pricing_details: formData.offerPricing,
      tone_style: mapSelectionToApiObject('tone_style', formData.tone, fieldOptions.tone_style, true),
      headline_focus: mapSelectionToApiObject('headline_focus', formData.headlineFocus, fieldOptions.headline_focus, true),
      primary_text_length: mapSelectionToApiObject('primary_text_length', formData.adTextLength, fieldOptions, true),
      cta_type: mapSelectionToApiObject('cta_type', formData.ctaType, fieldOptions.cta_type, false),
      emotional_angle: mapSelectionToApiObject('emotional_angle', formData.emotionalAngle, fieldOptions.emotional_angle, false),
      asset_reuse_strategy: mapSelectionToApiObject('asset_reuse_strategy', formData.assetReuseStrategy, fieldOptions.asset_reuse_strategy, true),
      campaign_duration: formData.campaignDuration,
      geographic_language_target: parseGeoLanguage(formData.geoLanguageTarget),
      usp: formData.usp,
      feature_highlight: formData.featureHighlight,
      problem_scenario: formData.problemScenario,
      brand_voice_personality: (() => {
        const mode = formData.brandVoicePersonalityMode;
        const customValue = formData.brandVoicePersonalityCustom;

        if (mode === 'custom') {
          return {
            type: 'custom',
            id: null,
            value: customValue || ''
          };
        }

        // Predefined option: find matching option by label from API options
        const options = fieldOptions.brand_voice_personality || [];
        const selected = options.find(opt => opt.label === formData.brandVoicePersonalityOption);

        if (selected) {
          return {
            type: 'predefined',
            id: selected.id ?? null,
            value: selected.label,
          };
        }

        return {
          type: 'predefined',
          id: null,
          value: formData.brandVoicePersonalityOption || ''
        };
      })(),
    };
    
    return payload;
  };

  const handleGenerate = async () => {
    if (isGenerating) return;

    const payload = formatPayload();
    
    if (!payload.product_description || payload.target_audience.length === 0 || (!payload.campaign_objective.value && payload.campaign_objective.type === 'custom')) {
        showNotification('Please fill out all required fields (marked with *)', 'error');
        return;
    }

    setIsGenerating(true);
    showNotification('Generating ad copy, please wait...', 'info');

    try {
      const response = await fetch(API.GENERATE_AD_COPY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': AUTH_HEADER,
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorData = {};
        try {
            errorData = await response.json();
        } catch (e) {
            throw new Error(`API call failed with status: ${response.status} (${response.statusText}).`);
        }
        throw new Error(errorData.message || `API call failed with status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.variants && Array.isArray(result.variants) && result.variants.length > 0) {
        // SUCCESS: Store request ID and variant data
        setRequestId(result.request_id);
        
        // Map raw string variants to the required object structure if IDs are missing
        const structuredVariants = result.variants.map((content, index) => ({
            id: content.id || `temp-${Date.now()}-${index}`, // Use real ID if present, otherwise generate temporary ID
            content: content.content || content,
            show_variant: content.show_variant || true, // Assume true if key is missing
        }));

        setGeneratedVariantsData({ variants: structuredVariants, inputs: result.inputs });
        setShowVariantsModal(true);
        showNotification('Ad copy generated successfully!', 'success');
      } else {
        throw new Error("Generation successful, but no variants were returned.");
      }
      
    } catch (error) {
      console.error('Generation Error:', error);
      showNotification(`Error: ${error.message || 'Failed to generate ad copy.'}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateVariant = async (variantId) => {
      const variantIndex = generatedVariantsData.variants.findIndex(v => v.id === variantId);
      if (variantIndex === -1) return;

      showNotification(`Regenerating Variant ${variantIndex + 1}...`, 'info');

      try {
          const response = await fetch(API.REGENERATE_VARIANT(variantId), {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': AUTH_HEADER,
              },
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || `Regeneration failed with status: ${response.status}`);
          }
          
          const result = await response.json();
          
          // Update the specific variant content in the state
          setGeneratedVariantsData(prev => {
              const newVariants = [...prev.variants];
              const updatedVariantIndex = newVariants.findIndex(v => v.id === result.variant_id);
              
              if (updatedVariantIndex !== -1) {
                  newVariants[updatedVariantIndex] = {
                      ...newVariants[updatedVariantIndex],
                      content: result.new_content,
                  };
              } else {
                  // Fallback: If regeneration API returned a new ID, add it (unlikely for regeneration)
                  newVariants.push({
                      id: result.variant_id,
                      content: result.new_content,
                      show_variant: true,
                  });
              }
              
              return { ...prev, variants: newVariants };
          });

          showNotification(`Variant ${variantIndex + 1} successfully regenerated!`, 'success');

      } catch (error) {
          console.error('Regeneration Error:', error);
          showNotification(`Regeneration Error: ${error.message}`, 'error');
      }
  };

  const handleViewLog = async () => {
    if (!requestId) {
        showNotification("No previous generation history found.", 'error');
        return;
    }

    setIsGenerating(true);
    showNotification("Fetching previous variants...", 'info');
    
    try {
        const response = await fetch(API.GET_VARIANTS_LOG(requestId), {
            headers: { 'Authorization': AUTH_HEADER },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to fetch log: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.variants && Array.isArray(result.variants) && result.variants.length > 0) {
             const structuredVariants = result.variants.map(variant => ({
                id: variant.id, 
                content: variant.content,
                show_variant: variant.show_variant || true,
            }));

            setGeneratedVariantsData({ variants: structuredVariants, inputs: result.inputs });
            setShowVariantsModal(true);
            showNotification('Log loaded successfully!', 'success');
        } else {
            showNotification('No variants found in the log.', 'error');
        }

    } catch (error) {
        console.error('Log View Error:', error);
        showNotification(`Error loading log: ${error.message || 'Failed to fetch variants log.'}`, 'error');
    } finally {
        setIsGenerating(false);
    }
  };
  
  // Reset handler (Retained)
  const handleReset = () => {
    setFormData({
      platform: 'Meta (Facebook & Instagram)',
      platformMode: 'predefined',
      platformCustom: '',
      placement: 'Facebook Feed',
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
      showAdvanced: false,
      usp: '',
      featureHighlight: '',
      problemScenario: '',
      brandVoicePersonalityMode: 'predefined',
      brandVoicePersonalityOption: '',
      brandVoicePersonalityCustom: ''
    });
    setPlacementMode('predefined');
    setPlacementCustom('');
    setCampaignObjectiveMode('predefined');
    setToneMode('predefined');
    setToneCustom('');
    setHeadlineFocusMode('predefined');
    setHeadlineFocusCustom('');
    setCtaTypeMode('predefined');
    setCtaTypeCustom('');
    setEmotionalAngleMode('predefined');
    setEmotionalAngleCustom('');
    
    setAudienceInput('');
    setShowAudienceSuggestions(false);
    setShowSummary(false);
    setGeneratedVariantsData({ variants: [], inputs: {} });
    setShowVariantsModal(false);
    setRequestId(null); // Clear request ID
    showNotification('Form has been reset', 'info');
  };

// Styles (Defined for the main component's structure)
  const styles = {
    container: { maxWidth: '1100px', margin: '0 auto', padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', backgroundColor: '#0a0e1a', minHeight: '100vh' },
    card: { backgroundColor: '#141b2d', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid #1e293b' },
    header: { padding: '24px 32px', borderBottom: '1px solid #1e293b', backgroundColor: '#0f1624' },
    title: { margin: 0, fontSize: '24px', fontWeight: '600', color: '#f8fafc' },
    subtitle: { margin: '6px 0 0', fontSize: '14px', color: '#94a3b8' },
    formGroup: { marginBottom: '20px' },
    label: { display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#e2e8f0' },
    input: { width: '100%', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5', color: '#e2e8f0', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', transition: 'all 0.15s ease-in-out', boxSizing: 'border-box' },
    select: { width: '100%', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5', color: '#e2e8f0', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', transition: 'all 0.15s ease-in-out', boxSizing: 'border-box', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '20px', paddingRight: '40px', cursor: 'pointer' },
    textarea: { width: '100%', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5', color: '#e2e8f0', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', transition: 'all 0.15s ease-in-out', boxSizing: 'border-box', resize: 'vertical', minHeight: '80px' },
    badge: { display: 'inline-flex', alignItems: 'center', padding: '6px 12px', fontSize: '13px', fontWeight: '500', borderRadius: '6px', gap: '6px' },
    badgePrimary: { backgroundColor: '#3b82f6', color: 'white' },
    badgeSecondary: { backgroundColor: '#475569', color: 'white' },
    badgeSuccess: { backgroundColor: '#10b981', color: 'white' },
    btn: { padding: '10px 20px', fontSize: '14px', fontWeight: '500', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.15s ease-in-out', display: 'inline-flex', alignItems: 'center', gap: '8px' },
    btnPrimary: { backgroundColor: '#3b82f6', color: 'white' },
    btnSuccess: { backgroundColor: '#10b981', color: 'white' },
    btnOutline: { backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155' },
    btnDanger: { backgroundColor: '#ef4444', color: 'white' },
    infoIcon: { display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', textAlign: 'center', lineHeight: '16px', fontSize: '11px', cursor: 'help', marginLeft: '6px' },
    removeBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '18px', height: '18px', borderRadius: '50%', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
    rangeInput: { width: '100%', height: '6px', borderRadius: '3px', background: '#334155', outline: 'none' },
    checkboxGroup: { display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px' },
    checkboxItem: { display: 'flex', alignItems: 'center', gap: '8px' },
    radioGroup: { display: 'flex', gap: '16px', marginTop: '8px' },
    radioItem: { display: 'flex', alignItems: 'center', gap: '8px' },
    toast: { position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', color: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999 },
    summaryContainer: {
      backgroundColor: '#0f1624',
      borderRadius: '8px',
      padding: '24px',
      border: '1px solid #1e293b',
      marginTop: '16px'
    },
    summaryTitle: {
      marginTop: 0,
      marginBottom: '20px',
      color: '#f8fafc',
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
      backgroundColor: '#141b2d',
      padding: '16px',
      borderRadius: '6px',
      border: '1px solid #1e293b'
    },
    summarySectionTitle: {
      marginTop: 0,
      marginBottom: '12px',
      color: '#e2e8f0',
      fontSize: '1rem',
      fontWeight: 600,
      paddingBottom: '8px',
      borderBottom: '1px solid #1e293b'
    },
    summaryChip: {
      display: 'inline-block',
      backgroundColor: '#1e3a8a',
      color: '#93c5fd',
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      fontWeight: 500
    },
    complianceNote: {
      backgroundColor: '#1e293b',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '0.875rem',
      lineHeight: '1.5',
      color: '#94a3b8',
      marginTop: '8px',
      whiteSpace: 'pre-wrap'
    }
  };


  if (!mounted) return null;

  return (
    <div style={styles.container}>
      {/* -------------------- Notification Toast -------------------- */}
      {notification.show && (
        <div style={{
          ...styles.toast,
          backgroundColor: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
          borderColor: notification.type === 'error' ? '#fecaca' : '#bbf7d0',
          color: notification.type === 'error' ? '#b91c1c' : '#166534',
        }}>
          {notification.message}
          <button onClick={() => setNotification({...notification, show: false})} style={{
            background: 'none', border: 'none', color: 'inherit', marginLeft: '10px', cursor: 'pointer', fontSize: '18px'
          }}>&times;</button>
        </div>
      )}

      {/* -------------------- Main Form / Summary View -------------------- */}
      {!showSummary ? (
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>Ad Copy Generator</h1>
            <p style={styles.subtitle}>Create compelling ad copy for your campaigns</p>
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
                        data-tooltip-content="Select the platform where your ad will run."
                      >
                        i
                      </span>
                    </label>
                    <Tooltip id="platform-tooltip" />
                    {/* Platform mode: Predefined vs Custom */}
                    <div style={styles.radioGroup}>
                      <label style={styles.radioItem}>
                        <input
                          type="radio"
                          name="platformMode"
                          value="predefined"
                          checked={formData.platformMode === 'predefined'}
                          onChange={(e) => {
                            const mode = e.target.value;
                            setFormData(prev => {
                              const next = { ...prev, platformMode: mode };
                              if (mode === 'predefined') {
                                const predefinedLabels = (fieldOptions.platform || []).map(opt => opt.label);
                                if (!predefinedLabels.includes(prev.platform)) {
                                  const defaultLabel = (fieldOptions.platform && fieldOptions.platform[0]?.label) || prev.platform;
                                  next.platform = defaultLabel;
                                }
                              }
                              if (mode === 'custom') {
                                next.platform = prev.platformCustom || '';
                              }
                              return next;
                            });
                          }}
                        />
                        <span>Predefined</span>
                      </label>
                      <label style={styles.radioItem}>
                        <input
                          type="radio"
                          name="platformMode"
                          value="custom"
                          checked={formData.platformMode === 'custom'}
                          onChange={(e) => {
                            const mode = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              platformMode: mode,
                              platform: prev.platformCustom || '',
                            }));
                          }}
                        />
                        <span>Custom</span>
                      </label>
                    </div>

                    {formData.platformMode === 'predefined' && (
                      <select
                        id="platform"
                        name="platform"
                        // Use key for value attribute, label for display
                        value={fieldOptions.platform.find(opt => opt.label === formData.platform)?.key || formData.platform}
                        onChange={handlePlatformChange}
                        style={{ ...styles.select, marginTop: '8px' }}
                        required
                      >
                        {loadingOptions && <option value="">Loading Platforms...</option>}
                        {fieldOptions.platform && fieldOptions.platform.map((option) => (
                          <option
                            key={option.key || option.id}
                            value={option.key}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {formData.platformMode === 'custom' && (
                      <input
                        type="text"
                        id="platformCustom"
                        name="platformCustom"
                        value={formData.platformCustom}
                        onChange={handleChange}
                        style={{ ...styles.input, marginTop: '8px' }}
                        placeholder="Enter custom ad platform"
                        required
                      />
                    )}
                    {optionsError && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{optionsError}</p>}
                  </div>
                </div>

                <div className="col-md-6">
                  <div style={styles.formGroup}>
                    <label htmlFor="placement" style={styles.label}>
                      Ad Placement <span style={{ color: '#ef4444' }}>*</span>
                      <span 
                        style={styles.infoIcon} 
                        data-tooltip-id="placement-tooltip" 
                        data-tooltip-content="Select where your ad will be displayed on the platform."
                      >
                        i
                      </span>
                    </label>
                    <Tooltip id="placement-tooltip" />
                    <div style={styles.radioGroup}>
                      <label style={styles.radioItem}>
                        <input
                          type="radio"
                          name="placementMode"
                          value="predefined"
                          checked={placementMode === 'predefined'}
                          onChange={() => {
                            setPlacementMode('predefined');
                            setFormData(prev => {
                              const labels = availablePlacements.map(p => p.label);
                              let nextPlacement = prev.placement;
                              if (!labels.includes(nextPlacement) && availablePlacements[0]) {
                                nextPlacement = availablePlacements[0].label;
                              }
                              return { ...prev, placement: nextPlacement };
                            });
                          }}
                        />
                        <span>Predefined</span>
                      </label>
                      <label style={styles.radioItem}>
                        <input
                          type="radio"
                          name="placementMode"
                          value="custom"
                          checked={placementMode === 'custom'}
                          onChange={() => {
                            setPlacementMode('custom');
                            setFormData(prev => ({
                              ...prev,
                              placement: placementCustom || '',
                            }));
                          }}
                        />
                        <span>Custom</span>
                      </label>
                    </div>

                    {placementMode === 'predefined' && (
                      <select
                        id="placement"
                        name="placement"
                        // Use key for value attribute, label for display
                        value={fieldOptions.placement.find(opt => opt.label === formData.placement)?.key || formData.placement}
                        onChange={handleChange}
                        style={{ ...styles.select, marginTop: '8px' }}
                        required
                        disabled={!formData.platform || availablePlacements.length === 0}
                      >
                        <option value="">Select Placement</option>
                        {availablePlacements.map((option) => (
                          <option
                            key={option.key || option.id}
                            value={option.key} 
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {placementMode === 'custom' && (
                      <input
                        type="text"
                        id="placementCustom"
                        value={placementCustom}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPlacementCustom(val);
                          setFormData(prev => ({ ...prev, placement: val }));
                        }}
                        style={{ ...styles.input, marginTop: '8px' }}
                        placeholder="Enter custom ad placement"
                        required
                      />
                    )}
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
                        data-tooltip-html="Define what you want to achieve with this campaign."
                      >
                        i
                      </span>
                    </label>
                    <Tooltip id="campaignObjective-tooltip" />
                    <div style={styles.radioGroup}>
                      <label style={styles.radioItem}>
                        <input
                          type="radio"
                          name="campaignObjectiveMode"
                          value="predefined"
                          checked={campaignObjectiveMode === 'predefined'}
                          onChange={() => {
                            setCampaignObjectiveMode('predefined');
                            setFormData(prev => {
                              const opts = fieldOptions.campaign_objective || [];
                              const labels = opts.map(o => o.label);
                              let next = prev.campaignObjective;
                              if (!labels.includes(next) && opts[0]) {
                                next = opts[0].label;
                              }
                              return { ...prev, campaignObjective: next };
                            });
                          }}
                        />
                        <span>Predefined</span>
                      </label>
                      <label style={styles.radioItem}>
                        <input
                          type="radio"
                          name="campaignObjectiveMode"
                          value="custom"
                          checked={campaignObjectiveMode === 'custom'}
                          onChange={() => {
                            setCampaignObjectiveMode('custom');
                            setFormData(prev => ({ ...prev, campaignObjective: 'Custom Objective' }));
                          }}
                        />
                        <span>Custom</span>
                      </label>
                    </div>

                    {campaignObjectiveMode === 'predefined' && (
                      <select
                        id="campaignObjective"
                        name="campaignObjective"
                        // Use key for value attribute, label for display
                        value={fieldOptions.campaign_objective.find(opt => opt.label === formData.campaignObjective)?.key || formData.campaignObjective}
                        onChange={handleChange}
                        style={{ ...styles.select, marginTop: '8px' }}
                        required
                      >
                        {fieldOptions.campaign_objective && fieldOptions.campaign_objective.map((option) => (
                          <option
                            key={option.key || option.id}
                            value={option.key}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {campaignObjectiveMode === 'custom' && (
                      <div style={{ marginTop: '12px' }}>
                        <input
                          type="text"
                          name="customObjective"
                          value={formData.customObjective}
                          onChange={handleChange}
                          style={styles.select}
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
                        data-tooltip-html="Define your ideal customer profile. Add multiple audience segments."
                      >
                        i
                      </span>
                    </label>
                    <Tooltip id="targetAudience-tooltip" />
                    
                    {/* Audience Chips and Input (No change here as it's a multi-select custom input) */}
                    {/* ... (Audience Input/Chips render logic remains the same) ... */}
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
                          borderBottomLeftRadius: showAudienceSuggestions ? '0' : '6px',
                          borderBottomRightRadius: showAudienceSuggestions ? '0' : '6px'
                        }}
                        placeholder="Type and press Enter to add audience segments"
                        required={formData.targetAudience.length === 0}
                      />
                      
                      {showAudienceSuggestions && (
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
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          maxHeight: '200px',
                          overflowY: 'auto'
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
                                    style={{ padding: '8px 16px', cursor: 'pointer'}}
                                  >
                                    {suggestion}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                          
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
                              Add **"{audienceInput}"** as custom audience
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
                        data-tooltip-html="Provide detailed information about your product or service."
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
                        data-tooltip-html="Select the tone that best matches your brand voice."
                      >
                        i
                      </span>
                    </label>
                    <Tooltip id="tone-tooltip" />
                    <div style={styles.radioGroup}>
                      <label style={styles.radioItem}>
                        <input
                          type="radio"
                          name="toneMode"
                          value="predefined"
                          checked={toneMode === 'predefined'}
                          onChange={() => {
                            setToneMode('predefined');
                            setFormData(prev => ({ ...prev, tone: 'Auto-Detect (Based on Platform)' }));
                          }}
                        />
                        <span>Predefined</span>
                      </label>
                      <label style={styles.radioItem}>
                        <input
                          type="radio"
                          name="toneMode"
                          value="custom"
                          checked={toneMode === 'custom'}
                          onChange={() => {
                            setToneMode('custom');
                            setFormData(prev => ({ ...prev, tone: toneCustom || '' }));
                          }}
                        />
                        <span>Custom</span>
                      </label>
                    </div>

                    {toneMode === 'predefined' && (
                      <select
                        id="tone"
                        name="tone"
                        // Use key for value attribute, label for display
                        value={fieldOptions.tone_style.find(opt => opt.label === formData.tone)?.key || formData.tone}
                        onChange={handleChange}
                        style={{ ...styles.select, marginTop: '8px' }}
                        required
                      >
                        <option value="Auto-Detect (Based on Platform)">Auto-Detect (Based on Platform)</option>
                        {fieldOptions.tone_style && fieldOptions.tone_style.map((option) => (
                          <option
                            key={option.key || option.id}
                            value={option.key}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {toneMode === 'custom' && (
                      <input
                        type="text"
                        id="toneCustom"
                        value={toneCustom}
                        onChange={(e) => {
                          const val = e.target.value;
                          setToneCustom(val);
                          setFormData(prev => ({ ...prev, tone: val }));
                        }}
                        style={{ ...styles.input, marginTop: '8px' }}
                        placeholder="Enter custom tone"
                        required
                      />
                    )}
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
                        data-tooltip-html="Choose the primary focus for your ad headlines."
                      >
                        i
                      </span>
                    </label>
                    <Tooltip id="headlineFocus-tooltip" />
                    <div style={styles.radioGroup}>
                      <label style={styles.radioItem}>
                        <input
                          type="radio"
                          name="headlineFocusMode"
                          value="predefined"
                          checked={headlineFocusMode === 'predefined'}
                          onChange={() => {
                            setHeadlineFocusMode('predefined');
                            setFormData(prev => ({ ...prev, headlineFocus: 'Auto-Select (Recommended)' }));
                          }}
                        />
                        <span>Predefined</span>
                      </label>
                      <label style={styles.radioItem}>
                        <input
                          type="radio"
                          name="headlineFocusMode"
                          value="custom"
                          checked={headlineFocusMode === 'custom'}
                          onChange={() => {
                            setHeadlineFocusMode('custom');
                            setFormData(prev => ({ ...prev, headlineFocus: headlineFocusCustom || '' }));
                          }}
                        />
                        <span>Custom</span>
                      </label>
                    </div>

                    {headlineFocusMode === 'predefined' && (
                      <select
                        id="headlineFocus"
                        name="headlineFocus"
                        // Use key for value attribute, label for display
                        value={fieldOptions.headline_focus.find(opt => opt.label === formData.headlineFocus)?.key || formData.headlineFocus}
                        onChange={handleChange}
                        style={{ ...styles.select, marginTop: '8px' }}
                      >
                        <option value="Auto-Select (Recommended)">Auto-Select (Recommended)</option>
                        {fieldOptions.headline_focus && fieldOptions.headline_focus.map((option) => (
                          <option
                            key={option.key || option.id}
                            value={option.key}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {headlineFocusMode === 'custom' && (
                      <input
                        type="text"
                        id="headlineFocusCustom"
                        value={headlineFocusCustom}
                        onChange={(e) => {
                          const val = e.target.value;
                          setHeadlineFocusCustom(val);
                          setFormData(prev => ({ ...prev, headlineFocus: val }));
                        }}
                        style={{ ...styles.input, marginTop: '8px' }}
                        placeholder="Enter custom headline focus"
                        required
                      />
                    )}
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
                        data-tooltip-html="Select the desired length for your ad copy."
                      >
                        i
                      </span>
                    </label>
                    <Tooltip id="adTextLength-tooltip" />
                    <select
                      id="adTextLength"
                      name="adTextLength"
                      // Use key for value attribute, label for display
                      value={fieldOptions.primary_text_length.find(opt => opt.label === formData.adTextLength)?.key || formData.adTextLength}
                      onChange={handleChange}
                      style={styles.select}
                    >
                      <option value="Auto-Length (Platform Optimized)">Auto-Length (Platform Optimized)</option>
                      {fieldOptions.primary_text_length && fieldOptions.primary_text_length.map((option) => (
                        <option
                          key={option.key || option.id}
                          value={option.key}
                        >
                          {option.label}
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
                        data-tooltip-html="Select the primary action you want users to take."
                      >
                        i
                      </span>
                    </label>
                    <Tooltip id="ctaType-tooltip" />
                    <div style={styles.radioGroup}>
                      <label style={styles.radioItem}>
                        <input
                          type="radio"
                          name="ctaTypeMode"
                          value="predefined"
                          checked={ctaTypeMode === 'predefined'}
                          onChange={() => {
                            setCtaTypeMode('predefined');
                            setFormData(prev => ({ ...prev, ctaType: 'Learn More' }));
                          }}
                        />
                        <span>Predefined</span>
                      </label>
                      <label style={styles.radioItem}>
                        <input
                          type="radio"
                          name="ctaTypeMode"
                          value="custom"
                          checked={ctaTypeMode === 'custom'}
                          onChange={() => {
                            setCtaTypeMode('custom');
                            setFormData(prev => ({ ...prev, ctaType: ctaTypeCustom || '' }));
                          }}
                        />
                        <span>Custom</span>
                      </label>
                    </div>

                    {ctaTypeMode === 'predefined' && (
                      <select
                        id="ctaType"
                        name="ctaType"
                        // Use key for value attribute, label for display
                        value={fieldOptions.cta_type.find(opt => opt.label === formData.ctaType)?.key || formData.ctaType}
                        onChange={handleChange}
                        style={{ ...styles.select, marginTop: '8px' }}
                      >
                        <option value="">Select CTA Type</option>
                        {fieldOptions.cta_type && fieldOptions.cta_type.map((option) => (
                          <option
                            key={option.key || option.id}
                            value={option.key}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {ctaTypeMode === 'custom' && (
                      <input
                        type="text"
                        id="ctaTypeCustom"
                        value={ctaTypeCustom}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCtaTypeCustom(val);
                          setFormData(prev => ({ ...prev, ctaType: val }));
                        }}
                        style={{ ...styles.input, marginTop: '8px' }}
                        placeholder="Enter custom CTA"
                        required
                      />
                    )}
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

                    {/* Chips container with inline placeholder when empty, mirroring Target Audience UX */}
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
                      backgroundColor: formData.keyBenefits.length > 0 ? '#f9fafb' : 'white'
                    }}>
                      {formData.keyBenefits.length === 0 && (
                        <span style={{ color: '#9ca3af', fontSize: '14px', marginLeft: '8px' }}>
                          Type and press Enter to add key benefits
                        </span>
                      )}
                      {formData.keyBenefits.map((benefit, index) => (
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
                          {benefit}
                          <button 
                            type="button" 
                            style={styles.removeBtn} 
                            onClick={() => removeItem('keyBenefits', index)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Input to add new key benefits, same interaction as before */}
                    <input
                      type="text"
                      style={styles.input}
                      placeholder="Type and press Enter to add key benefits"
                      onKeyPress={(e) => handleArrayChange(e, 'keyBenefits')}
                      disabled={formData.keyBenefits.length >= 10}
                    />
                  </div>
                </div>

                {/* Number of Variants */}
                <div className="col-12">
                  <div style={styles.formGroup}>
                    <label htmlFor="variants" style={styles.label}>
                      Number of Variants: **{formData.variants}**
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

                {/* Emotional Angle */}
                <div className="col-md-6">
                  <div style={styles.formGroup}>
                    <label htmlFor="emotionalAngle" style={styles.label}>
                      Emotional Angle
                    </label>
                    <div style={styles.radioGroup}>
                      <label style={styles.radioItem}>
                        <input
                          type="radio"
                          name="emotionalAngleMode"
                          value="predefined"
                          checked={emotionalAngleMode === 'predefined'}
                          onChange={() => {
                            setEmotionalAngleMode('predefined');
                            setFormData(prev => ({ ...prev, emotionalAngle: 'Pain → Solution' }));
                          }}
                        />
                        <span>Predefined</span>
                      </label>
                      <label style={styles.radioItem}>
                        <input
                          type="radio"
                          name="emotionalAngleMode"
                          value="custom"
                          checked={emotionalAngleMode === 'custom'}
                          onChange={() => {
                            setEmotionalAngleMode('custom');
                            setFormData(prev => ({ ...prev, emotionalAngle: emotionalAngleCustom || '' }));
                          }}
                        />
                        <span>Custom</span>
                      </label>
                    </div>

                    {emotionalAngleMode === 'predefined' && (
                      <select
                        id="emotionalAngle"
                        name="emotionalAngle"
                        // Use key for value attribute, label for display
                        value={fieldOptions.emotional_angle.find(opt => opt.label.replace('\t', '→') === formData.emotionalAngle)?.key || formData.emotionalAngle}
                        onChange={handleChange}
                        style={{ ...styles.select, marginTop: '8px' }}
                      >
                        <option value="">Select Emotional Angle</option>
                        {fieldOptions.emotional_angle && fieldOptions.emotional_angle.map((option) => (
                          <option
                            key={option.key || option.id}
                            value={option.key} 
                          >
                            {option.label.replace('\t', '→')}
                          </option>
                        ))}
                      </select>
                    )}

                    {emotionalAngleMode === 'custom' && (
                      <input
                        type="text"
                        id="emotionalAngleCustom"
                        value={emotionalAngleCustom}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEmotionalAngleCustom(val);
                          setFormData(prev => ({ ...prev, emotionalAngle: val }));
                        }}
                        style={{ ...styles.input, marginTop: '8px' }}
                        placeholder="Enter custom emotional angle"
                        required
                      />
                    )}
                  </div>
                </div>

                <hr style={{ width: '100%', border: 'none', borderTop: '1px solid #e5e7eb', margin: '5px 0' }} />

                {/* Advanced Features Toggle */}
                <div className="col-12">
                  <button
                    type="button"
                    style={{
                    ...styles.btn,
                    ...styles.btnOutline,
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                    onClick={toggleAdvanced}
                  >
                    {formData.showAdvanced ? '▼ Hide Advanced Features' : '▶ Show Advanced Features'}
                  </button>
                </div>

                {/* Advanced Features */}
                {formData.showAdvanced && (
                  <>
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
                          style={styles.select}
                          placeholder="Describe your brand's tone and personality"
                        />
                      </div>
                    </div>

                    {/* USP (Unique Selling Proposition) */}
                    <div className="col-12">
                      <div style={styles.formGroup}>
                        <label htmlFor="usp" style={styles.label}>
                          USP (Unique Selling Proposition)
                        </label>
                        <textarea
                          id="usp"
                          name="usp"
                          value={formData.usp}
                          onChange={handleChange}
                          style={{...styles.textarea, minHeight: '80px'}}
                          placeholder="Strongest differentiator vs competitors. E.g., 'First AI tool with multi-variant regeneration in one click.'"
                        />
                      </div>
                    </div>

                    {/* Feature Highlight */}
                    <div className="col-12">
                      <div style={styles.formGroup}>
                        <label htmlFor="featureHighlight" style={styles.label}>
                          Feature Highlight
                        </label>
                        <textarea
                          id="featureHighlight"
                          name="featureHighlight"
                          value={formData.featureHighlight}
                          onChange={handleChange}
                          style={{...styles.textarea, minHeight: '80px'}}
                          placeholder="Most important product feature showcased. E.g., 'Automated campaign generation in 30 seconds.'"
                        />
                      </div>
                    </div>

                    {/* Problem Scenario */}
                    <div className="col-12">
                      <div style={styles.formGroup}>
                        <label htmlFor="problemScenario" style={styles.label}>
                          Problem Scenario
                        </label>
                        <textarea
                          id="problemScenario"
                          name="problemScenario"
                          value={formData.problemScenario}
                          onChange={handleChange}
                          style={{...styles.textarea, minHeight: '80px'}}
                          placeholder="When/where customer needs your solution. E.g., 'When agencies need to scale content fast without hiring more writers during seasonal sales events.'"
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
                          // Use key for value attribute, label for display
                          value={fieldOptions.asset_reuse_strategy.find(opt => opt.label === formData.assetReuseStrategy)?.key || formData.assetReuseStrategy}
                          onChange={handleChange}
                          style={styles.select}
                        >
                          <option value="">Select Strategy</option>
                          <option value="Auto-Detect (Recommended)">Auto-Detect (Recommended)</option>
                          {fieldOptions.asset_reuse_strategy && fieldOptions.asset_reuse_strategy.map((option) => (
                            <option
                              key={option.key || option.id}
                              value={option.key}
                            >
                              {option.label}
                            </option>
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

                    {/* Brand Voice Personality */}
                    <div className="col-md-6">
                      <div style={styles.formGroup}>
                        <label htmlFor="brandVoicePersonality" style={styles.label}>
                          Brand Voice Personality
                        </label>
                        <div style={{ ...styles.radioGroup, marginBottom: '8px' }}>
                          <label style={styles.radioItem}>
                            <input
                              type="radio"
                              name="brandVoicePersonalityMode"
                              value="predefined"
                              checked={formData.brandVoicePersonalityMode === 'predefined'}
                              onChange={handleChange}
                            />
                            <span>Predefined</span>
                          </label>
                          <label style={styles.radioItem}>
                            <input
                              type="radio"
                              name="brandVoicePersonalityMode"
                              value="custom"
                              checked={formData.brandVoicePersonalityMode === 'custom'}
                              onChange={handleChange}
                            />
                            <span>Custom</span>
                          </label>
                        </div>

                        {formData.brandVoicePersonalityMode === 'predefined' && (
                          <select
                            name="brandVoicePersonalityOption"
                            // Use key from API as value, map to label in handleChange
                            value={(fieldOptions.brand_voice_personality || []).find(opt => opt.label === formData.brandVoicePersonalityOption)?.key || ''}
                            onChange={handleChange}
                            style={styles.select}
                          >
                            <option value="">Select Brand Voice Personality</option>
                            {(fieldOptions.brand_voice_personality || []).map((option) => (
                              <option
                                key={option.key || option.id}
                                value={option.key}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}

                        {formData.brandVoicePersonalityMode === 'custom' && (
                          <input
                            type="text"
                            name="brandVoicePersonalityCustom"
                            value={formData.brandVoicePersonalityCustom}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="Describe your brand voice personality (e.g., Calm, Educational, Bold)"
                          />
                        )}
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
                      disabled={isGenerating}
                    >
                      Reset Form
                    </button>
                    <button 
                      type="submit" 
                      style={{...styles.btn, ...styles.btnPrimary}}
                      disabled={isGenerating}
                    >
                      {isGenerating ? 'Generating...' : 'Review & Generate'}
                    </button>
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
                {formData.usp && (
                  <p><strong>USP:</strong> {formData.usp}</p>
                )}
                {formData.featureHighlight && (
                  <p><strong>Feature Highlight:</strong> {formData.featureHighlight}</p>
                )}
                {formData.problemScenario && (
                  <p><strong>Problem Scenario:</strong> {formData.problemScenario}</p>
                )}
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
                  {(formData.brandVoicePersonalityMode === 'predefined' && formData.brandVoicePersonalityOption) && (
                    <p><strong>Brand Voice Personality:</strong> {formData.brandVoicePersonalityOption}</p>
                  )}
                  {(formData.brandVoicePersonalityMode === 'custom' && formData.brandVoicePersonalityCustom) && (
                    <p><strong>Brand Voice Personality (Custom):</strong> {formData.brandVoicePersonalityCustom}</p>
                  )}
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
              {requestId && (
                <button
                  type="button"
                  onClick={handleViewLog}
                  style={{...styles.btn, ...styles.btnSuccess, backgroundColor: '#fcd34d', color: '#111827'}}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Loading Log...' : 'View Log'}
                </button>
              )}
              <button 
                type="button" 
                onClick={() => setShowSummary(false)}
                style={{...styles.btn, ...styles.btnOutline}}
                disabled={isGenerating}
              >
                Back to Edit
              </button>
              <button 
                type="button" 
                onClick={handleGenerate}
                style={{...styles.btn, ...styles.btnPrimary}}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Ad Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
      
      {/* -------------------- Variant Display Modal -------------------- */}
      {showVariantsModal && (
        <VariantModalContent 
            variants={generatedVariantsData.variants} 
            inputs={generatedVariantsData.inputs}
            onClose={() => setShowVariantsModal(false)} 
            onRequestRegenerate={handleRegenerateVariant}
            showNotification={showNotification}
        />
      )}
    </div>
  );
};

export default AdCopyGeneratorForm;