import React, { useState, useEffect, useCallback } from 'react';
import { Tooltip } from 'react-tooltip';

// --- API Configuration (Defined internally to prevent build issues) ---
const BASE_URL = 'https://olive-gull-905765.hostingersite.com/public/api/v1';
const API = {
    GET_FIELD_OPTIONS: `${BASE_URL}/ad-copy/options?field_type=all`,
    GENERATE_AD_COPY: `${BASE_URL}/ad-copy/generate`,
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
};

// Helper function to map the form selection (label) back to the complex API object format
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

// Helper to find the corresponding label for a selected key/value.
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
// UPDATED MODAL COMPONENT LOGIC (Improved Colors and Contrast)
// --------------------------------------------------------------------

const VariantModalContent = ({ variants, onClose, inputs }) => {
    // Start with the first variant expanded by default
    const [expandedIndex, setExpandedIndex] = useState(0); 

    const toggleExpand = (index) => {
        setExpandedIndex(index === expandedIndex ? null : index);
    };

    const modalStyles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(30, 41, 59, 0.9)', // Darker, less distracting overlay (slate-800/90)
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        },
        modal: {
            backgroundColor: 'white', // Ensure modal background is bright white
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
            borderBottom: '1px solid #e0e7ff', // Light blue border
            backgroundColor: '#f1f5f9', // Very light grey background for header (slate-100)
            color: '#1e293b', // Dark text color
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        body: {
            padding: '24px',
            backgroundColor: 'white', // Ensure body background is bright white
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
            backgroundColor: '#ffffff', // White header background for better contrast
            cursor: 'pointer',
            fontWeight: '600',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid transparent',
        },
        cardContent: {
            padding: '20px',
            whiteSpace: 'pre-wrap',
            fontSize: '14px',
            color: '#1f2937', // Darker text for readability
            backgroundColor: '#f9fafb', // Light separator color for content background
            borderTop: '1px solid #e5e7eb',
        },
        title: {
            fontSize: '1.25rem',
            margin: 0,
            color: '#1e293b',
        },
        // Reusing styles from AdCopyGeneratorForm for buttons/etc.
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
                    <p style={{marginBottom: '20px', color: '#475569', fontSize: '14px'}}>
                        Click on any variant card to expand and view the full ad copy.
                    </p>
                    {variants.map((variant, index) => {
                        const isExpanded = index === expandedIndex;
                        return (
                            <div key={index} style={{
                                ...modalStyles.card,
                                border: isExpanded ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                                boxShadow: isExpanded ? '0 4px 8px -2px rgba(59, 130, 246, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                            }}>
                                <div 
                                    style={{
                                        ...modalStyles.cardHeader,
                                        backgroundColor: isExpanded ? '#e0f2fe' : '#ffffff', // Light blue highlight when expanded
                                        borderBottom: isExpanded ? '1px solid #93c5fd' : '1px solid transparent',
                                        color: isExpanded ? '#0369a1' : '#1f2937', // Darker text for contrast
                                    }}
                                    onClick={() => toggleExpand(index)}
                                >
                                    <span>Variant {index + 1}: {inputs.platform?.value} ({inputs.placement?.value})</span>
                                    <span>{isExpanded ? '▲ Collapse' : '▼ Expand'}</span>
                                </div>
                                {isExpanded && (
                                    <div style={modalStyles.cardContent}>
                                        <div style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{variant}</div>
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
// UPDATED AdCopyGeneratorForm COMPONENT (Retained all previous logic)
// --------------------------------------------------------------------

const AdCopyGeneratorForm = () => {
  const [formData, setFormData] = useState({
    platform: 'Meta (Facebook & Instagram)',
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
    showAdvanced: false
  });
  
  const [audienceInput, setAudienceInput] = useState('');
  const [showAudienceSuggestions, setShowAudienceSuggestions] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [mounted, setMounted] = useState(false);
  const [availablePlacements, setAvailablePlacements] = useState([]);
  const [fieldOptions, setFieldOptions] = useState(defaultFieldOptions);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // NEW STATE for modal and data
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [generatedVariantsData, setGeneratedVariantsData] = useState({ variants: [], inputs: {} });

  // Hardcoded audience suggestions
  const audienceSuggestions = {
    'Demographics': ['Women 25-34', 'Men 35-44', 'Parents of Toddlers'],
    'Interests': ['Fitness Enthusiasts', 'Tech Early Adopters', 'Travel Lovers'],
    'Professions': ['Marketing Managers', 'Small Business Owners', 'Software Engineers']
  };

  const showNotification = useCallback((message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  }, []);

  const updatePlacements = useCallback((platformLabel, allPlacements = fieldOptions.placement) => {
    const filteredPlacements = allPlacements.filter(opt => 
      opt.parent_label === platformLabel
    );

    setAvailablePlacements(filteredPlacements);
    
    const newPlacement = filteredPlacements.length > 0 ? filteredPlacements[0].label : '';
    setFormData(prev => ({
      ...prev,
      placement: newPlacement || ''
    }));
  }, [fieldOptions.placement]);

  // Main logic for fetching options with exponential backoff
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
            
            // Set initial defaults and placements
            const defaultPlatform = loadedOptions.platform.find(opt => opt.label === formData.platform)?.label || formData.platform;
            let initialPlacements = loadedOptions.placement.filter(p => p.parent_label === defaultPlatform);
            let initialPlacement = initialPlacements[0]?.label || '';
            
            setAvailablePlacements(initialPlacements);

            setFormData(prev => ({
                ...prev,
                platform: defaultPlatform,
                placement: initialPlacement,
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
    
  }, []);
  
  // Re-run placement filtering when platform changes
  useEffect(() => {
    updatePlacements(formData.platform);
  }, [formData.platform, updatePlacements]);

  
  const handlePlatformChange = (e) => {
    const selectedKey = e.target.value;
    const platformLabel = getLabelFromKey(selectedKey, 'platform', fieldOptions);

    setFormData(prev => ({
      ...prev,
      platform: platformLabel,
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

  // Generic handler for all standard dropdowns (converts key to label for state storage)
  const handleChange = (e) => {
    const { name, value: selectedKey, type, checked } = e.target;
    
    if (type === 'checkbox') {
        setFormData(prev => ({ ...prev, [name]: checked }));
        return;
    }

    let labelToStore = selectedKey;
    if (selectedKey) {
        const fieldOptionsKey = name === 'adTextLength' ? 'primary_text_length' : name;
        labelToStore = getLabelFromKey(selectedKey, fieldOptionsKey, fieldOptions);

        if (name === 'campaignObjective' && labelToStore !== 'Custom Objective') {
            setFormData(prev => ({
                ...prev,
                [name]: labelToStore,
                customObjective: ''
            }));
            return;
        }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: labelToStore
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
    setTimeout(() => {
      const summaryElement = document.getElementById('form-summary');
      if (summaryElement) {
        summaryElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const formatPayload = () => {
    const parseGeoLanguage = (input) => {
      if (!input) return { locale: null, language: null };
      const parts = input.split(',').map(p => p.trim());
      
      const geo = parts[0]?.trim();
      const lang = parts.length > 1 ? parts[1]?.trim() : null;

      return {
        locale: geo || null,
        language: lang || null,
      };
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
        // SUCCESS: Store the generated data and show the modal
        setGeneratedVariantsData({ variants: result.variants, inputs: result.inputs });
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

  const handleReset = () => {
    setFormData({
      platform: 'Meta (Facebook & Instagram)',
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
      showAdvanced: false
    });
    setAudienceInput('');
    setShowAudienceSuggestions(false);
    setShowSummary(false);
    setGeneratedVariantsData({ variants: [], inputs: {} }); // Clear variant data
    setShowVariantsModal(false); // Hide modal
    showNotification('Form has been reset', 'info');
  };

  const toggleAdvanced = () => {
    setFormData(prev => ({
      ...prev,
      showAdvanced: !prev.showAdvanced
    }));
  };

  // Styles (Defined for the main component's structure)
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
                    <select
                      id="platform"
                      name="platform"
                      // Use key for value attribute, label for display
                      value={fieldOptions.platform.find(opt => opt.label === formData.platform)?.key || formData.platform}
                      onChange={handlePlatformChange}
                      style={styles.input}
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
                    <select
                      id="placement"
                      name="placement"
                      // Use key for value attribute, label for display
                      value={fieldOptions.placement.find(opt => opt.label === formData.placement)?.key || formData.placement}
                      onChange={handleChange}
                      style={styles.input}
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
                    <select
                      id="campaignObjective"
                      name="campaignObjective"
                      // Use key for value attribute, label for display
                      value={fieldOptions.campaign_objective.find(opt => opt.label === formData.campaignObjective)?.key || formData.campaignObjective}
                      onChange={handleChange}
                      style={styles.input}
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
                       <option value="Custom Objective">Custom Objective</option>
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
                    <select
                      id="tone"
                      name="tone"
                      // Use key for value attribute, label for display
                      value={fieldOptions.tone_style.find(opt => opt.label === formData.tone)?.key || formData.tone}
                      onChange={handleChange}
                      style={styles.input}
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
                    <select
                      id="headlineFocus"
                      name="headlineFocus"
                      // Use key for value attribute, label for display
                      value={fieldOptions.headline_focus.find(opt => opt.label === formData.headlineFocus)?.key || formData.headlineFocus}
                      onChange={handleChange}
                      style={styles.input}
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
                      style={styles.input}
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
                    <select
                      id="ctaType"
                      name="ctaType"
                      // Use key for value attribute, label for display
                      value={fieldOptions.cta_type.find(opt => opt.label === formData.ctaType)?.key || formData.ctaType}
                      onChange={handleChange}
                      style={styles.input}
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
                    <select
                      id="emotionalAngle"
                      name="emotionalAngle"
                      // Use key for value attribute, label for display
                      value={fieldOptions.emotional_angle.find(opt => opt.label.replace('\t', '→') === formData.emotionalAngle)?.key || formData.emotionalAngle}
                      onChange={handleChange}
                      style={styles.input}
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
                          // Use key for value attribute, label for display
                          value={fieldOptions.asset_reuse_strategy.find(opt => opt.label === formData.assetReuseStrategy)?.key || formData.assetReuseStrategy}
                          onChange={handleChange}
                          style={styles.input}
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
        />
      )}
    </div>
  );
};

export default AdCopyGeneratorForm;