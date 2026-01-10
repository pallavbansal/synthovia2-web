import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getAuthHeader } from '@/utils/auth';
import ToggleButton from '../Form/ToggleButton';
import SummaryReviewModal from './SummaryReviewModal';
import VariantModalContent from './VariantModalContent';

import UserNav from "../Common/UserNav";

import API from "@/utils/api";

// Default field options
const defaultFieldOptions = {
    platforms: [
        { id: 1, key: 'tiktok', label: 'TikTok' },
        { id: 2, key: 'reels', label: 'Reels' },
        { id: 3, key: 'shorts', label: 'Shorts' },
        { id: 4, key: 'youtube', label: 'YouTube' },
        { id: 5, key: 'podcast', label: 'Podcast' },
        { id: 6, key: 'video_ad', label: 'Video Ad' },
    ],
    goals: [
        { id: 1, key: 'awareness', label: 'Awareness' },
        { id: 2, key: 'educate', label: 'Educate' },
        { id: 3, key: 'entertain', label: 'Entertain' },
        { id: 4, key: 'lead_gen', label: 'Lead Generation' },
        { id: 5, key: 'sales', label: 'Sales / Conversions' },
        { id: 6, key: 'community', label: 'Community / Engagement' },
    ],
    tones: [
        { id: 1, key: 'professional', label: 'Professional' },
        { id: 2, key: 'friendly', label: 'Friendly' },
        { id: 3, key: 'energetic', label: 'Energetic' },
        { id: 4, key: 'humorous', label: 'Humorous' },
        { id: 5, key: 'dramatic', label: 'Dramatic' },
        { id: 6, key: 'inspiring', label: 'Inspiring' },
    ],
    scriptStyles: [
        { id: 1, key: 'conversational', label: 'Conversational' },
        { id: 2, key: 'storytelling', label: 'Storytelling' },
        { id: 3, key: 'tutorial', label: 'Tutorial / How-To' },
        { id: 4, key: 'listicle', label: 'Listicle' },
        { id: 5, key: 'ad', label: 'Direct Response / Ad' },
        { id: 6, key: 'interview', label: 'Interview' },
    ],
    hookStyles: [
        { id: 1, key: 'question', label: 'Question' },
        { id: 2, key: 'shock', label: 'Shocking statement / stat' },
        { id: 3, key: 'story', label: 'Quick story' },
        { id: 4, key: 'promise', label: 'Big promise' },
        { id: 5, key: 'contrarian', label: 'Contrarian take' },
    ],
    ctaTypes: [
        { id: 1, key: 'like_follow', label: 'Like / Follow' },
        { id: 2, key: 'subscribe', label: 'Subscribe' },
        { id: 3, key: 'comment', label: 'Comment' },
        { id: 4, key: 'visit', label: 'Visit Website' },
        { id: 5, key: 'download', label: 'Download' },
        { id: 6, key: 'buy', label: 'Buy Now' },
    ],
    narrationStyles: [
        { id: 1, key: 'first_person', label: 'First Person (I/We)' },
        { id: 2, key: 'second_person', label: 'Second Person (You)' },
        { id: 3, key: 'third_person', label: 'Third Person (They/He/She)' },
        { id: 4, key: 'voiceover', label: 'Voiceover' },
        { id: 5, key: 'dialogue', label: 'Dialogue' },
    ],
    outputFormats: [
        { id: 1, key: 'plain_text', label: 'Plain Text (.txt)' },
        { id: 2, key: 'html', label: 'HTML Export (.html)' },
    ],
    structureDepths: [
        { id: 1, key: 'simple', label: 'Simple (25 – 35 %)' },
        { id: 2, key: 'medium', label: 'Medium (50 – 70 %)' },
        { id: 3, key: 'advanced', label: 'Advanced (80 – 100 %)' },
    ],
    visualTones: [
        { id: 1, key: 'bright', label: 'Bright & Energetic' },
        { id: 2, key: 'cinematic', label: 'Cinematic' },
        { id: 3, key: 'moody', label: 'Moody' },
        { id: 4, key: 'minimal', label: 'Minimal' },
        { id: 5, key: 'colorful', label: 'Colorful' },
    ],
    languages: [
        { id: 1, key: 'en', label: 'English' },
        { id: 2, key: 'hi', label: 'Hindi' },
        { id: 3, key: 'es', label: 'Spanish' },
        { id: 4, key: 'fr', label: 'French' },
        { id: 5, key: 'de', label: 'German' },
    ],
};

const ScriptStoryWriterTool = () => {
    const [formData, setFormData] = useState({
        scriptTitle: '',
        platform: '',
        platformMode: 'predefined',
        platformCustom: '',

        goal: '',
        goalMode: 'predefined',
        goalCustom: '',

        targetAudience: [],

        tone: '',
        toneMode: 'predefined',
        toneCustom: '',

        durationSeconds: 60,
        durationPresetSeconds: null,

        variantsCount: 1,

        textLengthMode: 'predefined',
        textLength: 'auto',
        textLengthCustom: '',

        scriptStyle: '',
        scriptStyleMode: 'predefined',
        scriptStyleCustom: '',

        includeHook: true,
        hookStyle: '',
        hookStyleCustomPattern: '',

        includeCta: true,
        ctaType: '',
        ctaTypeMode: 'predefined',
        ctaTypeCustom: '',

        narrationStyle: '',
        narrationStyleMode: 'predefined',
        narrationStyleCustom: '',

        outputFormat: 'plain_text',
        structureDepth: 'medium',

        visualTone: '',
        visualToneMode: 'predefined',
        visualToneCustom: '',

        complianceMode: '',

        language: '',
        languageMode: 'predefined',
        languageCustom: '',

        customInstructions: '',

        showAdvanced: false,
    });

    const [audienceInput, setAudienceInput] = useState('');
    const [customDurationInput, setCustomDurationInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showVariantsModal, setShowVariantsModal] = useState(false);
    const [isApiLoading, setIsApiLoading] = useState(false);
    const [generatedVariantsData, setGeneratedVariantsData] = useState({
        variants: [],
        inputs: {},
    });
    const [fieldOptions, setFieldOptions] = useState(defaultFieldOptions);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [mounted, setMounted] = useState(false);

    const streamControllersRef = useRef([]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const response = await fetch(API.SCRIPT_WRITER_GET_OPTIONS, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': getAuthHeader(),
                    },
                });

                if (!response.ok) return;

                const result = await response.json();
                const data = result?.data;
                if (!data || !(result?.status_code === 1 || result?.success)) return;

                const normalize = (items) =>
                    (Array.isArray(items) ? items : [])
                        .slice()
                        .sort((a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0))
                        .map((item) => ({
                            id: item?.id,
                            key: item?.key,
                            label: item?.label,
                        }))
                        .filter((item) => item.key || item.label);

                const nextFieldOptions = {
                    ...defaultFieldOptions,
                    platforms: normalize(data.platform),
                    goals: normalize(data.goal),
                    tones: normalize(data.tone),
                    scriptStyles: normalize(data.script_style),
                    narrationStyles: normalize(data.narration_pov).map((v) => ({
                        ...v,
                        key: v.key || String(v.id),
                    })),
                    hookStyles: normalize(data.hook_style),
                    ctaTypes: normalize(data.cta_type),
                    visualTones: normalize(data.visual_tone),
                    languages: normalize(data.language_locale),
                    outputFormats: normalize(data.output_format).map((v) => ({
                        ...v,
                        key: v.key || String(v.id),
                    })),
                    textLengths: normalize(data.text_length),
                };

                setFieldOptions(nextFieldOptions);

                setFormData((prev) => {
                    if (prev.languageMode === 'custom') return prev;
                    const currentLanguageId = prev.language;
                    const hasCurrent = nextFieldOptions.languages.some(
                        (opt) => String(opt.id) === String(currentLanguageId)
                    );
                    if (hasCurrent) return prev;

                    const firstId = nextFieldOptions.languages?.[0]?.id;
                    return {
                        ...prev,
                        language: firstId ? String(firstId) : prev.language,
                    };
                });
            } catch (e) {
            }
        };

        fetchOptions();
    }, []);

    const styles = {
          container: { 
              maxWidth: '1100px', 
              margin: '0 auto', 
              padding: '24px', 
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 
              backgroundColor: '#0a0e1a', 
              minHeight: '100vh' 
          },
          card: { 
              backgroundColor: '#141b2d', 
              borderRadius: '12px', 
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)', 
              overflow: 'hidden', 
              border: '1px solid #1e293b' 
          },
          header: { 
              padding: '24px 32px', 
              borderBottom: '1px solid #1e293b', 
          },
          title: { 
              margin: 0, 
              fontSize: '24px', 
              fontWeight: '600', 
              color: '#f8fafc' 
          },
          subtitle: { 
              margin: '6px 0 0', 
              fontSize: '14px', 
              color: '#94a3b8' 
          },
          formGroup: { 
              marginBottom: '20px' 
          },
          label: { 
              display: 'block', 
              marginBottom: '6px', 
              fontSize: '16px', 
              fontWeight: '500', 
              color: '#e2e8f0' 
          },
          input: { 
              width: '100%', 
              padding: '10px 14px', 
              fontSize: '14px', 
              lineHeight: '1.5', 
              color: '#e2e8f0', 
              backgroundColor: '#1e293b', 
              border: '1px solid #334155', 
              borderRadius: '6px', 
              transition: 'all 0.15s ease-in-out', 
              boxSizing: 'border-box' 
          },
          select: { 
              width: '100%', 
              height: '42px', 
              padding: '10px 14px', 
              fontSize: '14px', 
              lineHeight: '1.5', 
              color: '#e2e8f0', 
              backgroundColor: '#1e293b', 
              border: '1px solid #334155', 
              borderRadius: '6px', 
              transition: 'all 0.15s ease-in-out', 
              boxSizing: 'border-box', 
              appearance: 'none', 
              backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', 
              backgroundRepeat: 'no-repeat', 
              backgroundPosition: 'right 10px center', 
              backgroundSize: '20px', 
              paddingRight: '40px', 
              cursor: 'pointer' 
          },
          textarea: { 
              width: '100%', 
              padding: '10px 14px', 
              fontSize: '14px', 
              lineHeight: '1.5', 
              color: '#e2e8f0', 
              backgroundColor: '#1e293b', 
              border: '1px solid #334155', 
              borderRadius: '6px', 
              transition: 'all 0.15s ease-in-out', 
              boxSizing: 'border-box', 
              resize: 'vertical', 
              minHeight: '80px' 
          },
          badge: { 
              display: 'inline-flex', 
              alignItems: 'center', 
              padding: '6px 12px', 
              fontSize: '13px', 
              fontWeight: '500', 
              borderRadius: '6px', 
              gap: '6px' 
          },
          badgePrimary: { 
              backgroundColor: '#3b82f6', 
              color: 'white' 
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
              gap: '8px' 
          },
          btnPrimary: {
              backgroundColor: '#3b82f6',
              color: 'white',
          },
          btnOutline: { 
              backgroundColor: 'transparent', 
              color: '#94a3b8', 
              border: '1px solid #334155' 
          },
          infoIcon: { 
              display: 'inline-block', 
              width: '16px', 
              height: '16px', 
              borderRadius: '50%', 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              textAlign: 'center', 
              lineHeight: '16px', 
              fontSize: '11px', 
              cursor: 'help', 
              marginLeft: '6px' 
          },
          removeBtn: { 
              background: 'rgba(255,255,255,0.2)', 
              border: 'none', 
              color: 'white', 
              width: '18px', 
              height: '18px', 
              borderRadius: '50%', 
              cursor: 'pointer', 
              fontSize: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: 0 
          },
          toast: { 
              position: 'fixed', 
              top: '20px', 
              right: '20px', 
              padding: '16px 24px', 
              color: 'white', 
              borderRadius: '8px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
              zIndex: 9999 
          },
          toolTip: { 
              width: '40%' 
          },
          radioGroup: { 
              display: 'flex', 
              gap: '16px', 
              marginTop: '8px',
              marginBottom: '8px'
          },
          radioItem: { 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: '#e2e8f0',
              fontSize: '14px'
          },
      };

      const renderModeToggle = (modeKey, onSetMode) => (
          <div style={styles.radioGroup}>
              <label style={styles.radioItem}>
                  <input
                      type="radio"
                      name={modeKey}
                      value="predefined"
                      checked={formData[modeKey] === 'predefined'}
                      onChange={() => onSetMode('predefined')}
                  />
                  <span>Predefined</span>
              </label>
              <label style={styles.radioItem}>
                  <input
                      type="radio"
                      name={modeKey}
                      value="custom"
                      checked={formData[modeKey] === 'custom'}
                      onChange={() => onSetMode('custom')}
                  />
                  <span>Custom</span>
              </label>
          </div>
      );
  
      const handleInputChange = (e) => {
          const { name, value } = e.target;
          setFormData(prev => ({
              ...prev,
              [name]: value
          }));
      };
  
      const handleTagInput = (e) => {
          if (e.key === 'Enter' && e.target.value.trim()) {
              e.preventDefault();
              const newTag = e.target.value.trim();
              if (!formData.targetAudience.includes(newTag)) {
                  setFormData(prev => ({
                      ...prev,
                      targetAudience: [...prev.targetAudience, newTag]
                  }));
              }
              setAudienceInput('');
          }
      };
  
      const removeTag = (tag) => {
          setFormData(prev => ({
              ...prev,
              targetAudience: prev.targetAudience.filter(t => t !== tag)
          }));
      };
  
      const formatDuration = (seconds) => {
          if (!seconds && seconds !== 0) return '';
          if (seconds < 60) return `${seconds}s`;
          const minutes = Math.floor(seconds / 60);
          const remaining = seconds % 60;
          if (remaining === 0) return `${minutes}m`;
          return `${minutes}m ${remaining}s`;
      };
  
      const estimateWords = (seconds) => {
          const wordsPerMinute = 150;
          return Math.max(1, Math.round((seconds / 60) * wordsPerMinute));
      };
  
      const durationPresets = useMemo(() => {
          const key = formData.platformMode === 'custom' ? 'custom' : formData.platform;
          if (key === 'youtube') return [120, 180, 300, 420, 600, 900];
          if (key === 'podcast') return [300, 600, 900, 1200, 1800];
          if (key === 'video_ad') return [15, 30, 45, 60, 90];
          if (key === 'tiktok' || key === 'reels' || key === 'shorts' || key === 'instagram_reel' || key === 'youtube_shorts') return [15, 30, 45, 60, 90];
          return [15, 30, 45, 60, 90];
      }, [formData.platform, formData.platformMode]);
  
      const sliderSnap = (rawSeconds) => {
          const seconds = Math.max(15, Math.min(1800, rawSeconds));
          const step = seconds <= 90 ? 5 : seconds <= 300 ? 15 : 30;
          return Math.round(seconds / step) * step;
      };
  
      const handleDurationSliderChange = (e) => {
          const raw = Number(e.target.value);
          const snapped = sliderSnap(raw);
          setFormData(prev => ({
              ...prev,
              durationSeconds: snapped,
              durationPresetSeconds: null,
          }));
      };
  
      const handleDurationPresetClick = (seconds) => {
          setFormData(prev => ({
              ...prev,
              durationSeconds: seconds,
              durationPresetSeconds: seconds,
          }));
      };
  
      const parseDurationToSeconds = (input) => {
          const value = (input || '').trim().toLowerCase();
          if (!value) return null;
  
          const compact = value.replace(/\s+/g, '');
          const mmss = compact.match(/^(\d+):(\d{1,2})$/);
          if (mmss) {
              const m = Number(mmss[1]);
              const s = Number(mmss[2]);
              if (Number.isFinite(m) && Number.isFinite(s)) return (m * 60) + s;
          }
  
          const minutesMatch = compact.match(/^(\d+)m$/);
          if (minutesMatch) return Number(minutesMatch[1]) * 60;
  
          const secondsMatch = compact.match(/^(\d+)s$/);
          if (secondsMatch) return Number(secondsMatch[1]);
  
          const plain = compact.match(/^(\d+)$/);
          if (plain) return Number(plain[1]);
  
          const mixed = compact.match(/^(\d+)m(\d+)s$/);
          if (mixed) return (Number(mixed[1]) * 60) + Number(mixed[2]);
  
          return null;
      };
  
      const applyCustomDuration = () => {
          const seconds = parseDurationToSeconds(customDurationInput);
          if (seconds === null || !Number.isFinite(seconds)) {
              showNotification('Enter a valid duration like 45s or 2m 30s', 'error');
              return;
          }
  
          if (seconds < 10 || seconds > 180) {
              showNotification('Custom duration must be between 10s and 3m (180s)', 'error');
              return;
          }
  
          setFormData(prev => ({
              ...prev,
              durationSeconds: seconds,
              durationPresetSeconds: null,
          }));
          setCustomDurationInput('');
      };
  
      const showNotification = (message, type) => {
          setNotification({ show: true, message, type });
          setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
      };

      const validateForm = () => {
          const missing = [];

          if (!String(formData.scriptTitle || '').trim()) missing.push('Title');

          if (formData.platformMode === 'custom') {
              if (!String(formData.platformCustom || '').trim()) missing.push('Platform');
          } else {
              if (!String(formData.platform || '').trim()) missing.push('Platform');
          }

          if (formData.goalMode === 'custom') {
              if (!String(formData.goalCustom || '').trim()) missing.push('Goal');
          } else {
              if (!String(formData.goal || '').trim()) missing.push('Goal');
          }

          const audience = Array.isArray(formData.targetAudience)
              ? formData.targetAudience.map((v) => String(v || '').trim()).filter(Boolean)
              : [];
          if (audience.length < 1) missing.push('Target Audience');

          if (formData.toneMode === 'custom') {
              if (!String(formData.toneCustom || '').trim()) missing.push('Tone');
          } else {
              if (!String(formData.tone || '').trim()) missing.push('Tone');
          }

          if (formData.scriptStyleMode === 'custom') {
              if (!String(formData.scriptStyleCustom || '').trim()) missing.push('Script Style');
          } else {
              if (!String(formData.scriptStyle || '').trim()) missing.push('Script Style');
          }

          if (formData.textLengthMode === 'custom') {
              const parsed = parseInt(formData.textLengthCustom, 10);
              if (!Number.isFinite(parsed) || parsed < 1 || parsed > 1000) missing.push('Text Length');
          } else {
              const selected = String(formData.textLength || '').trim();
              if (!selected) {
                  missing.push('Text Length');
              }
          }

          const variants = parseInt(formData.variantsCount, 10);
          if (!Number.isFinite(variants) || variants < 1) missing.push('Number of Variants');

          return missing;
      };

      const abortAllStreams = () => {
          const controllers = streamControllersRef.current || [];
          controllers.forEach((c) => {
              try {
                  c.abort();
              } catch (e) {
              }
          });
          streamControllersRef.current = [];
      };

      const toggleAdvanced = () => {
          setFormData((prev) => ({
              ...prev,
              showAdvanced: !prev.showAdvanced,
          }));
      };

      const buildPayload = () => {
          const buildSelectObject = ({ mode, valueKey, customValue, options }) => {
              if (mode === 'custom') {
                  return {
                      type: 'custom',
                      id: null,
                      value: customValue || '',
                  };
              }

              const opt = (options || []).find((o) => String(o.key) === String(valueKey) || String(o.id) === String(valueKey));
              return {
                  type: 'predefined',
                  id: opt?.id ?? null,
                  value: opt?.label ?? (valueKey || ''),
              };
          };

          const selectedLanguage =
              formData.languageMode === 'custom'
                  ? { type: 'custom', id: null, value: formData.languageCustom || '' }
                  : (() => {
                        const opt = (fieldOptions.languages || []).find((o) => String(o.id) === String(formData.language));
                        return { type: 'predefined', id: opt?.id ?? null, value: opt?.label ?? '' };
                    })();

          const outputFormatObj = buildSelectObject({
              mode: 'predefined',
              valueKey: formData.outputFormat,
              customValue: '',
              options: fieldOptions.outputFormats,
          });

          const textLengthObj =
              formData.textLengthMode === 'custom'
                  ? {
                        type: 'custom',
                        id: null,
                        value: (() => {
                            const parsed = parseInt(formData.textLengthCustom, 10);
                            if (!Number.isFinite(parsed) || parsed <= 0) return null;
                            return Math.min(1000, parsed);
                        })(),
                    }
                  : formData.textLength === 'auto' || !formData.textLength
                      ? { type: 'auto-detect', id: null, value: null }
                      : buildSelectObject({
                            mode: 'predefined',
                            valueKey: formData.textLength,
                            customValue: '',
                            options: fieldOptions.textLengths,
                        });

          return {
              title: formData.scriptTitle,
              platform: buildSelectObject({
                  mode: formData.platformMode,
                  valueKey: formData.platform,
                  customValue: formData.platformCustom,
                  options: fieldOptions.platforms,
              }),
              goal: buildSelectObject({
                  mode: formData.goalMode,
                  valueKey: formData.goal,
                  customValue: formData.goalCustom,
                  options: fieldOptions.goals,
              }),
              target_audience: formData.targetAudience,
              tone: buildSelectObject({
                  mode: formData.toneMode,
                  valueKey: formData.tone,
                  customValue: formData.toneCustom,
                  options: fieldOptions.tones,
              }),
              script_style: buildSelectObject({
                  mode: formData.scriptStyleMode,
                  valueKey: formData.scriptStyle,
                  customValue: formData.scriptStyleCustom,
                  options: fieldOptions.scriptStyles,
              }),
              narration_pov: buildSelectObject({
                  mode: formData.narrationStyleMode,
                  valueKey: formData.narrationStyle,
                  customValue: formData.narrationStyleCustom,
                  options: fieldOptions.narrationStyles,
              }),
              structure_depth: formData.structureDepth,
              duration_seconds: formData.durationSeconds,
              text_length: textLengthObj,
              include_hook: !!formData.includeHook,
              hook_style: formData.includeHook
                  ? buildSelectObject({
                        mode: 'predefined',
                        valueKey: formData.hookStyle,
                        customValue: '',
                        options: fieldOptions.hookStyles,
                    })
                  : null,
              include_cta: !!formData.includeCta,
              cta_type: formData.includeCta
                  ? buildSelectObject({
                        mode: formData.ctaTypeMode,
                        valueKey: formData.ctaType,
                        customValue: formData.ctaTypeCustom,
                        options: fieldOptions.ctaTypes,
                    })
                  : null,
              visual_tone: buildSelectObject({
                  mode: formData.visualToneMode,
                  valueKey: formData.visualTone,
                  customValue: formData.visualToneCustom,
                  options: fieldOptions.visualTones,
              }),
              compliance_mode: formData.complianceMode,
              language_locale: selectedLanguage,
              output_format: outputFormatObj,
              include_metadata: false,
              variants_count: Math.max(1, parseInt(formData.variantsCount || 1, 10)),
              custom_ai_instructions: formData.customInstructions,
              instruction_mode: 'strict',
          };
      };

      const handleEditFromSummary = () => {
          setShowSummary(false);
      };

      const handleCloseVariantsModal = () => {
          abortAllStreams();
          setShowVariantsModal(false);
          setIsApiLoading(false);
      };

      const handleGenerate = async () => {
          try {
              abortAllStreams();
              setIsGenerating(true);

              const missingFields = validateForm();
              if (missingFields.length > 0) {
                  showNotification(`Please fill all required fields: ${missingFields.join(', ')}`, 'error');
                  setIsGenerating(false);
                  return;
              }

              const payload = buildPayload();

              showNotification('Generating scripts, please wait...', 'info');

              const variantCount = Math.max(1, parseInt(payload?.variants_count || 1, 10));
              const clientRequestKey = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

              setIsApiLoading(false);
              setGeneratedVariantsData({
                  variants: Array.from({ length: variantCount }).map((_, index) => ({
                      client_id: `${clientRequestKey}-${index}`,
                      id: null,
                      content: '',
                      show_variant: true,
                      is_streaming: true,
                  })),
                  inputs: payload,
              });

              setShowVariantsModal(true);
              setShowSummary(false);

              const streamSingleVariant = async (variantIndex) => {
                  const controller = new AbortController();
                  streamControllersRef.current = [...streamControllersRef.current, controller];

                  const payloadForStream = {
                      ...payload,
                      variants_count: 1,
                  };

                  const response = await fetch(API.SCRIPT_WRITER_GENERATE_STREAM, {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                          'Accept': 'application/json',
                          'Authorization': getAuthHeader(),
                      },
                      body: JSON.stringify(payloadForStream),
                      signal: controller.signal,
                  });

                  if (!response.ok) {
                      let errorData = {};
                      try {
                          errorData = await response.json();
                      } catch (e) {
                      }
                      throw new Error(errorData.message || `API call failed with status: ${response.status}`);
                  }

                  const contentType = response.headers.get('content-type') || '';
                  const looksLikeJson =
                      contentType.includes('application/json') && !contentType.includes('text/event-stream');

                  if (looksLikeJson || !response.body) {
                      const result = await response.json();
                      const content =
                          result?.content ||
                          result?.data?.content ||
                          result?.data?.script ||
                          result?.script ||
                          '';
                      const safeContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

                      setGeneratedVariantsData((prev) => {
                          const next = [...(prev.variants || [])];
                          if (next[variantIndex]) {
                              next[variantIndex] = {
                                  ...next[variantIndex],
                                  id: next[variantIndex].id || result?.variant_id || null,
                                  content: safeContent,
                                  is_streaming: false,
                              };
                          }
                          return { ...prev, variants: next };
                      });
                      return;
                  }

                  if (!response.body) {
                      throw new Error('Streaming is not supported in this browser/environment');
                  }

                  const reader = response.body.getReader();
                  const decoder = new TextDecoder('utf-8');
                  let buffer = '';

                  const processLine = (rawLine) => {
                      if (!rawLine) return;
                      let line = rawLine.trim();
                      if (!line) return;
                      if (line.startsWith('data:')) {
                          line = line.slice('data:'.length).trim();
                      }
                      if (!line) return;

                      if (line.startsWith(',')) line = line.slice(1).trim();
                      if (line.endsWith(',')) line = line.slice(0, -1).trim();
                      if (!line) return;

                      let msg;
                      try {
                          msg = JSON.parse(line);
                      } catch (e) {
                          buffer = `${line}\n${buffer}`;
                          return;
                      }

                      if (!msg || typeof msg !== 'object') return;

                      if (msg.type === 'meta') {
                          if (msg.variant_id) {
                              setGeneratedVariantsData((prev) => {
                                  const next = [...(prev.variants || [])];
                                  if (next[variantIndex]) {
                                      next[variantIndex] = { ...next[variantIndex], id: msg.variant_id };
                                  }
                                  return { ...prev, variants: next };
                              });
                          }
                          return;
                      }

                      if (msg.type === 'delta') {
                          const deltaText = msg.content || '';
                          if (!deltaText) return;
                          setGeneratedVariantsData((prev) => {
                              const next = [...(prev.variants || [])];
                              if (next[variantIndex]) {
                                  next[variantIndex] = {
                                      ...next[variantIndex],
                                      content: `${next[variantIndex].content || ''}${deltaText}`,
                                  };
                              }
                              return { ...prev, variants: next };
                          });
                          return;
                      }

                      if (msg.type === 'done') {
                          setGeneratedVariantsData((prev) => {
                              const next = [...(prev.variants || [])];
                              if (next[variantIndex]) {
                                  next[variantIndex] = {
                                      ...next[variantIndex],
                                      id: next[variantIndex].id || msg.variant_id || null,
                                      content: msg.content || next[variantIndex].content || '',
                                      is_streaming: false,
                                  };
                              }
                              return { ...prev, variants: next };
                          });
                      }
                  };

                  try {
                      for (;;) {
                          const { value, done } = await reader.read();
                          if (done) break;
                          buffer += decoder.decode(value, { stream: true });
                          const parts = buffer.split(/\r?\n/);
                          buffer = parts.pop() || '';
                          parts.forEach(processLine);
                      }

                      const final = buffer.trim();
                      if (final) {
                          processLine(final);
                      }
                  } finally {
                      try {
                          reader.releaseLock();
                      } catch (e) {
                      }
                  }
              };

              const results = await Promise.allSettled(
                  Array.from({ length: variantCount }).map((_, index) => streamSingleVariant(index))
              );

              const hasError = results.some((r) => r.status === 'rejected');
              if (hasError) {
                  setGeneratedVariantsData((prev) => {
                      const next = (prev.variants || []).map((v, i) => {
                          const r = results[i];
                          if (r && r.status === 'rejected') {
                              return {
                                  ...v,
                                  is_streaming: false,
                                  content:
                                      (v.content || '') ||
                                      (r.reason?.message ? `Error: ${r.reason.message}` : 'Error: Failed to generate'),
                              };
                          }
                          return v;
                      });
                      return { ...prev, variants: next };
                  });
              } else {
                  showNotification('Scripts generated successfully!', 'success');
              }
          } catch (error) {
              console.error('Error generating scripts:', error);
              showNotification(`Error: ${error.message || 'Failed to generate scripts'}`, 'error');
              setShowVariantsModal(false);
          } finally {
              setIsGenerating(false);
              setIsApiLoading(false);
          }
      };

      const handleRegenerateVariant = async (variantId) => {
          if (!variantId) return;

          const payload = buildPayload();
          const variantIndex = (generatedVariantsData.variants || []).findIndex((v) => v?.id === variantId);
          if (variantIndex === -1) return;

          showNotification(`Regenerating Variant ${variantIndex + 1}...`, 'info');

          const controller = new AbortController();
          streamControllersRef.current = [...(streamControllersRef.current || []), controller];

          setGeneratedVariantsData((prev) => {
              const next = [...(prev.variants || [])];
              if (next[variantIndex]) {
                  next[variantIndex] = {
                      ...next[variantIndex],
                      content: '',
                      is_streaming: true,
                  };
              }
              return { ...prev, variants: next };
          });

          try {
              const payloadForStream = {
                  ...payload,
                  variants_count: 1,
              };

              const response = await fetch(API.SCRIPT_WRITER_GENERATE_STREAM, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json',
                      'Authorization': getAuthHeader(),
                  },
                  body: JSON.stringify(payloadForStream),
                  signal: controller.signal,
              });

              if (!response.ok) {
                  let errorData = {};
                  try {
                      errorData = await response.json();
                  } catch (e) {
                  }
                  throw new Error(errorData.message || `API call failed with status: ${response.status}`);
              }

              const contentType = response.headers.get('content-type') || '';
              const looksLikeJson = contentType.includes('application/json') && !contentType.includes('text/event-stream');

              if (looksLikeJson || !response.body) {
                  const result = await response.json();
                  const content = result?.content || result?.data?.content || result?.data?.script || result?.script || '';
                  const safeContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
                  setGeneratedVariantsData((prev) => {
                      const next = [...(prev.variants || [])];
                      if (next[variantIndex]) {
                          next[variantIndex] = {
                              ...next[variantIndex],
                              content: safeContent,
                              is_streaming: false,
                          };
                      }
                      return { ...prev, variants: next };
                  });
                  showNotification(`Variant ${variantIndex + 1} regenerated!`, 'success');
                  return;
              }

              const reader = response.body.getReader();
              const decoder = new TextDecoder('utf-8');
              let buffer = '';
              let sawAnyDelta = false;

              const processLine = (rawLine) => {
                  if (!rawLine) return;
                  let line = rawLine.trim();
                  if (!line) return;
                  if (line.startsWith('data:')) {
                      line = line.slice('data:'.length).trim();
                  }
                  if (!line) return;

                  if (line.startsWith(',')) line = line.slice(1).trim();
                  if (line.endsWith(',')) line = line.slice(0, -1).trim();
                  if (!line) return;

                  let msg;
                  try {
                      msg = JSON.parse(line);
                  } catch (e) {
                      buffer = `${line}\n${buffer}`;
                      return;
                  }

                  if (!msg || typeof msg !== 'object') return;

                  if (msg.type === 'meta') {
                      if (msg.variant_id) {
                          setGeneratedVariantsData((prev) => {
                              const next = [...(prev.variants || [])];
                              if (next[variantIndex]) {
                                  next[variantIndex] = { ...next[variantIndex], id: msg.variant_id };
                              }
                              return { ...prev, variants: next };
                          });
                      }
                      return;
                  }

                  if (msg.type === 'delta') {
                      const deltaText = msg.content || '';
                      if (!deltaText) return;
                      sawAnyDelta = true;
                      setGeneratedVariantsData((prev) => {
                          const next = [...(prev.variants || [])];
                          if (next[variantIndex]) {
                              next[variantIndex] = {
                                  ...next[variantIndex],
                                  content: `${next[variantIndex].content || ''}${deltaText}`,
                              };
                          }
                          return { ...prev, variants: next };
                      });
                      return;
                  }

                  if (msg.type === 'done') {
                      setGeneratedVariantsData((prev) => {
                          const next = [...(prev.variants || [])];
                          if (next[variantIndex]) {
                              next[variantIndex] = {
                                  ...next[variantIndex],
                                  id: next[variantIndex].id || msg.variant_id || null,
                                  content: msg.content || next[variantIndex].content || '',
                                  is_streaming: false,
                              };
                          }
                          return { ...prev, variants: next };
                      });
                  }
              };

              try {
                  for (;;) {
                      const { value, done } = await reader.read();
                      if (done) break;

                      buffer += decoder.decode(value, { stream: true });
                      const parts = buffer.split(/\r?\n/);
                      buffer = parts.pop() || '';
                      parts.forEach(processLine);
                  }

                  const final = buffer.trim();
                  if (final) {
                      processLine(final);
                  }
              } finally {
                  try {
                      reader.releaseLock();
                  } catch (e) {
                  }
              }

              if (!sawAnyDelta) {
                  showNotification('Regeneration finished (no stream delta).', 'info');
              } else {
                  showNotification(`Variant ${variantIndex + 1} regenerated!`, 'success');
              }
          } catch (error) {
              console.error('Error regenerating script:', error);
              showNotification(`Regeneration Error: ${error.message || 'Failed to regenerate'}`, 'error');
              setGeneratedVariantsData((prev) => {
                  const next = [...(prev.variants || [])];
                  if (next[variantIndex]) {
                      next[variantIndex] = {
                          ...next[variantIndex],
                          is_streaming: false,
                          content: next[variantIndex].content || `Error: ${error.message || 'Failed to regenerate'}`,
                      };
                  }
                  return { ...prev, variants: next };
              });
          }
      };
  
      const handleSubmit = async (e) => {
          e.preventDefault();
          setIsLoading(true);
          
          try {
              const missingFields = validateForm();
              if (missingFields.length > 0) {
                  showNotification(`Please fill all required fields: ${missingFields.join(', ')}`, 'error');
                  return;
              }

              setShowSummary(true);
              
          } catch (error) {
              console.error('Error preparing script request:', error);
              showNotification('Failed to open review modal. Please try again.', 'error');
          } finally {
              setIsLoading(false);
          }
      };
  
      const handleReset = () => {
          setFormData({
              scriptTitle: '',
              platform: '',
              platformMode: 'predefined',
              platformCustom: '',
              goal: '',
              goalMode: 'predefined',
              goalCustom: '',
              targetAudience: [],
              tone: '',
              toneMode: 'predefined',
              toneCustom: '',
              durationSeconds: 60,
              durationPresetSeconds: null,
              variantsCount: 1,
              textLengthMode: 'predefined',
              textLength: 'auto',
              textLengthCustom: '',
              scriptStyle: '',
              scriptStyleMode: 'predefined',
              scriptStyleCustom: '',
              includeHook: true,
              hookStyle: '',
              hookStyleCustomPattern: '',
              includeCta: true,
              ctaType: '',
              ctaTypeMode: 'predefined',
              ctaTypeCustom: '',
              narrationStyle: '',
              narrationStyleMode: 'predefined',
              narrationStyleCustom: '',
              outputFormat: 'plain_text',
              structureDepth: 'medium',
              visualTone: '',
              visualToneMode: 'predefined',
              visualToneCustom: '',
              complianceMode: '',
              language: '',
              languageMode: 'predefined',
              languageCustom: '',
              customInstructions: '',

              showAdvanced: false,
          });
          setAudienceInput('');
          setCustomDurationInput('');
          showNotification('Form has been reset', 'info');
      };
  
      if (!mounted) return null;
  
  return (
    <>
      <div className="rbt-main-content mb--0">
        <div className="rbt-daynamic-page-content center-width">
          <div className="rbt-dashboard-content">
            <UserNav title="Script & Story Writer Tool" />

            <div className="content-page pb--50">
               <div style={styles.container}>
            {notification.show && (
                <div style={{
                    ...styles.toast,
                    backgroundColor: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
                    borderColor: notification.type === 'error' ? '#fecaca' : '#bbf7d0',
                    color: notification.type === 'error' ? '#b91c1c' : '#166534',
                }}>
                    {notification.message}
                    <button onClick={() => setNotification({ ...notification, show: false })} style={{
                        background: 'none', border: 'none', color: 'inherit', marginLeft: '10px', cursor: 'pointer', fontSize: '18px'
                    }}>&times;</button>
                </div>
            )}

            <div style={styles.header}>
                <h1 style={styles.title}>Script Writing Generator</h1>
                <p style={styles.subtitle}>Generate platform-ready scripts with structure, hooks and CTA</p>
            </div>

            <div style={styles.card}>
                <div style={{ padding: '24px' }}>
                    <form onSubmit={handleSubmit}>
                        <div className="row g-4">
                            {/* Main (non-advanced) fields */}
                            {!formData.showAdvanced && (
                                <>
                            <div className="col-12">
                                <div style={styles.formGroup}>
                                    <label htmlFor="scriptTitle" style={styles.label}>
                                        Script Title / Topic <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        style={styles.input}
                                        id="scriptTitle"
                                        name="scriptTitle"
                                        value={formData.scriptTitle}
                                        onChange={handleInputChange}
                                        placeholder="e.g., How to grow on YouTube Shorts"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label htmlFor="platform" style={styles.label}>
                                        Platform <span style={{ color: '#ef4444' }}>*</span>
                                    </label>

                                    {renderModeToggle('platformMode', (mode) => {
                                        if (mode === 'custom') {
                                            setFormData((prev) => ({
                                                ...prev,
                                                platformMode: 'custom',
                                                platform: '',
                                                durationPresetSeconds: null,
                                            }));
                                            return;
                                        }

                                        setFormData((prev) => ({
                                            ...prev,
                                            platformMode: 'predefined',
                                            platformCustom: '',
                                            platform: '',
                                            durationPresetSeconds: null,
                                        }));
                                    })}

                                    {formData.platformMode === 'predefined' && (
                                        <select
                                            style={styles.select}
                                            id="platform"
                                            name="platform"
                                            value={formData.platform}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    platform: value,
                                                    durationPresetSeconds: null,
                                                }));
                                            }}
                                            required
                                        >
                                            <option value="">Select platform</option>
                                            {fieldOptions.platforms.map(option => (
                                                <option key={option.id || option.key} value={option.key}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {formData.platformMode === 'custom' && (
                                        <div style={{ marginTop: '10px' }}>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                name="platformCustom"
                                                value={formData.platformCustom}
                                                onChange={handleInputChange}
                                                placeholder="Enter custom platform"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label htmlFor="goal" style={styles.label}>
                                        Goal / Objective <span style={{ color: '#ef4444' }}>*</span>
                                    </label>

                                    {renderModeToggle('goalMode', (mode) => {
                                        if (mode === 'custom') {
                                            setFormData((prev) => ({
                                                ...prev,
                                                goalMode: 'custom',
                                                goal: '',
                                            }));
                                            return;
                                        }

                                        setFormData((prev) => ({
                                            ...prev,
                                            goalMode: 'predefined',
                                            goalCustom: '',
                                            goal: '',
                                        }));
                                    })}

                                    {formData.goalMode === 'predefined' && (
                                        <select
                                            style={styles.select}
                                            id="goal"
                                            name="goal"
                                            value={formData.goal}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    goal: value,
                                                }));
                                            }}
                                            required
                                        >
                                            <option value="">Select goal</option>
                                            {fieldOptions.goals.map(option => (
                                                <option key={option.id || option.key} value={option.key}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {formData.goalMode === 'custom' && (
                                        <div style={{ marginTop: '10px' }}>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                name="goalCustom"
                                                value={formData.goalCustom}
                                                onChange={handleInputChange}
                                                placeholder="Enter custom goal"
                                                required
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
                                    </label>

                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '8px',
                                        marginBottom: '8px',
                                        minHeight: '40px',
                                        alignItems: 'center',
                                        padding: '4px',
                                        border: '1px solid #334155',
                                        borderRadius: '6px',
                                        backgroundColor: '#1e293b'
                                    }}>
                                        {formData.targetAudience.length === 0 && (
                                            <span style={{ color: '#9ca3af', fontSize: '14px', marginLeft: '8px' }}>
                                                Type and press Enter to add audience tags
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
                                                    style={styles.removeBtn}
                                                    onClick={() => removeTag(chip)}
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>

                                    <input
                                        type="text"
                                        style={styles.input}
                                        id="audienceInput"
                                        value={audienceInput}
                                        onChange={(e) => setAudienceInput(e.target.value)}
                                        onKeyDown={handleTagInput}
                                        placeholder="Type and press Enter to add audience tags"
                                        required={formData.targetAudience.length === 0}
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label htmlFor="tone" style={styles.label}>
                                        Tone / Emotion <span style={{ color: '#ef4444' }}>*</span>
                                    </label>

                                    {renderModeToggle('toneMode', (mode) => {
                                        if (mode === 'custom') {
                                            setFormData((prev) => ({
                                                ...prev,
                                                toneMode: 'custom',
                                                tone: '',
                                            }));
                                            return;
                                        }

                                        setFormData((prev) => ({
                                            ...prev,
                                            toneMode: 'predefined',
                                            toneCustom: '',
                                            tone: '',
                                        }));
                                    })}

                                    {formData.toneMode === 'predefined' && (
                                        <select
                                            style={styles.select}
                                            id="tone"
                                            name="tone"
                                            value={formData.tone}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    tone: value,
                                                }));
                                            }}
                                            required
                                        >
                                            <option value="">Select tone</option>
                                            {fieldOptions.tones.map(option => (
                                                <option key={option.id || option.key} value={option.key}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {formData.toneMode === 'custom' && (
                                        <div style={{ marginTop: '10px' }}>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                name="toneCustom"
                                                value={formData.toneCustom}
                                                onChange={handleInputChange}
                                                placeholder="Enter custom tone"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Video Length / Duration <span style={{ color: '#ef4444' }}>*</span>
                                    </label>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                        {durationPresets.map((seconds) => {
                                            const active = formData.durationPresetSeconds === seconds;
                                            return (
                                                <button
                                                    key={seconds}
                                                    type="button"
                                                    style={{
                                                        ...styles.badge,
                                                        backgroundColor: active ? '#3b82f6' : '#1e293b',
                                                        color: active ? 'white' : '#e2e8f0',
                                                        border: '1px solid #334155',
                                                        cursor: 'pointer',
                                                    }}
                                                    onClick={() => handleDurationPresetClick(seconds)}
                                                >
                                                    {formatDuration(seconds)}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div style={{ marginBottom: '10px' }}>
                                        <input
                                            type="range"
                                            min={15}
                                            max={1800}
                                            step={1}
                                            value={formData.durationSeconds}
                                            onChange={handleDurationSliderChange}
                                            style={{ width: '100%' }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', color: '#94a3b8', fontSize: '13px' }}>
                                            <span>15s</span>
                                            <span>{formatDuration(formData.durationSeconds)} — Target ≈ {estimateWords(formData.durationSeconds)} words</span>
                                            <span>30m</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            type="text"
                                            style={styles.input}
                                            value={customDurationInput}
                                            onChange={(e) => setCustomDurationInput(e.target.value)}
                                            placeholder="Custom (10s–180s), e.g., 45s or 2m 30s"
                                        />
                                        <button
                                            type="button"
                                            style={{ ...styles.btn, ...styles.btnOutline, whiteSpace: 'nowrap' }}
                                            onClick={applyCustomDuration}
                                            disabled={!customDurationInput.trim()}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="col-12">
                                <div style={styles.formGroup}>
                                    <label htmlFor="variantsCount" style={styles.label}>
                                        Number of Variants: {formData.variantsCount}
                                    </label>
                                    <input
                                        type="range"
                                        id="variantsCount"
                                        name="variantsCount"
                                        min="1"
                                        max="5"
                                        value={formData.variantsCount}
                                        onChange={handleInputChange}
                                        style={{ width: '100%' }}
                                    />
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: '12px',
                                            color: '#94a3b8',
                                            marginTop: '6px',
                                        }}
                                    >
                                        <span>1</span>
                                        <span>2</span>
                                        <span>3</span>
                                        <span>4</span>
                                        <span>5</span>
                                    </div>
                                </div>
                            </div>

                            <div className="col-12">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Text Length</label>

                                    <div style={styles.radioGroup}>
                                        <label style={styles.radioItem}>
                                            <input
                                                type="radio"
                                                name="textLengthMode"
                                                value="predefined"
                                                checked={formData.textLengthMode === 'predefined'}
                                                onChange={() =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        textLengthMode: 'predefined',
                                                        textLengthCustom: '',
                                                        textLength: prev.textLength || 'auto',
                                                    }))
                                                }
                                            />
                                            <span>Predefined</span>
                                        </label>
                                        <label style={styles.radioItem}>
                                            <input
                                                type="radio"
                                                name="textLengthMode"
                                                value="custom"
                                                checked={formData.textLengthMode === 'custom'}
                                                onChange={() =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        textLengthMode: 'custom',
                                                    }))
                                                }
                                            />
                                            <span>Custom</span>
                                        </label>
                                    </div>

                                    {formData.textLengthMode === 'predefined' && (
                                        <select
                                            style={styles.select}
                                            name="textLength"
                                            value={formData.textLength || 'auto'}
                                            onChange={(e) => {
                                                const selected = e.target.value;
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    textLengthMode: 'predefined',
                                                    textLength: selected,
                                                    textLengthCustom: '',
                                                }));
                                            }}
                                        >
                                            <option value="auto">Auto-detect</option>
                                            {(fieldOptions.textLengths || []).map((opt) => (
                                                <option key={opt.id || opt.key} value={opt.key}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {formData.textLengthMode === 'custom' && (
                                        <div style={{ marginTop: '10px' }}>
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                min={1}
                                                max={1000}
                                                step={1}
                                                style={styles.input}
                                                value={formData.textLengthCustom}
                                                onChange={(e) => {
                                                    const raw = e.target.value;
                                                    if (raw === '') {
                                                        setFormData((prev) => ({ ...prev, textLengthCustom: '' }));
                                                        return;
                                                    }
                                                    const parsed = parseInt(raw, 10);
                                                    const clamped = Number.isFinite(parsed)
                                                        ? Math.min(1000, Math.max(1, parsed))
                                                        : '';
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        textLengthCustom: clamped === '' ? '' : String(clamped),
                                                    }));
                                                }}
                                                placeholder="Enter max words/length (1–1000)"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Script Style <span style={{ color: '#ef4444' }}>*</span>
                                    </label>

                                    {renderModeToggle('scriptStyleMode', (mode) => {
                                        if (mode === 'custom') {
                                            setFormData((prev) => ({
                                                ...prev,
                                                scriptStyleMode: 'custom',
                                                scriptStyle: '',
                                            }));
                                            return;
                                        }

                                        setFormData((prev) => ({
                                            ...prev,
                                            scriptStyleMode: 'predefined',
                                            scriptStyleCustom: '',
                                            scriptStyle: '',
                                        }));
                                    })}

                                    {formData.scriptStyleMode === 'predefined' && (
                                        <select
                                            style={styles.select}
                                            name="scriptStyle"
                                            value={formData.scriptStyle}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    scriptStyle: value,
                                                }));
                                            }}
                                            required
                                        >
                                            <option value="">Select style</option>
                                            {fieldOptions.scriptStyles.map(option => (
                                                <option key={option.id || option.key} value={option.key}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {formData.scriptStyleMode === 'custom' && (
                                        <div style={{ marginTop: '10px' }}>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                name="scriptStyleCustom"
                                                value={formData.scriptStyleCustom}
                                                onChange={handleInputChange}
                                                placeholder="Enter custom script style"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                                </>
                            )}

                            {/* Advanced Features Toggle */}
                            <div className="col-12" style={{ margin: '16px 0' }}>
                                <ToggleButton showAdvanced={formData.showAdvanced} onToggle={toggleAdvanced} />
                            </div>

                            {/* Advanced fields */}
                            {formData.showAdvanced && (
                                <>

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Include Hook (Yes/No)</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.includeHook}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    includeHook: checked,
                                                    ...(checked ? {} : { hookStyle: '', hookStyleCustomPattern: '' }),
                                                }));
                                            }}
                                        />
                                        <span>{formData.includeHook ? 'Yes' : 'No'}</span>
                                    </div>
                                </div>
                            </div>

                            {formData.includeHook && (
                                <div className="col-12">
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Hook Style</label>
                                        <select
                                            style={styles.select}
                                            name="hookStyle"
                                            value={formData.hookStyle}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Select hook style</option>
                                            {fieldOptions.hookStyles.map(option => (
                                                <option key={option.id || option.key} value={option.key}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div style={{ marginTop: '10px' }}>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                name="hookStyleCustomPattern"
                                                value={formData.hookStyleCustomPattern}
                                                onChange={handleInputChange}
                                                placeholder="Optional: Custom pattern (e.g., 'Stop scrolling if...')"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Include CTA (Yes/No)</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.includeCta}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    includeCta: checked,
                                                    ...(checked ? {} : { ctaType: '', ctaTypeMode: 'predefined', ctaTypeCustom: '' }),
                                                }));
                                            }}
                                        />
                                        <span>{formData.includeCta ? 'Yes' : 'No'}</span>
                                    </div>
                                </div>
                            </div>

                            {formData.includeCta && (
                                <div className="col-md-6">
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>CTA Type</label>

                                        {renderModeToggle('ctaTypeMode', (mode) => {
                                            if (mode === 'custom') {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    ctaTypeMode: 'custom',
                                                    ctaType: '',
                                                }));
                                                return;
                                            }

                                            setFormData((prev) => ({
                                                ...prev,
                                                ctaTypeMode: 'predefined',
                                                ctaTypeCustom: '',
                                                ctaType: '',
                                            }));
                                        })}

                                        {formData.ctaTypeMode === 'predefined' && (
                                        <select
                                            style={styles.select}
                                            name="ctaType"
                                            value={formData.ctaType}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    ctaType: value,
                                                }));
                                            }}
                                        >
                                            <option value="">Select CTA</option>
                                            {fieldOptions.ctaTypes.map(option => (
                                                <option key={option.id || option.key} value={option.key}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>

                                        )}

                                        {formData.ctaTypeMode === 'custom' && (
                                            <div style={{ marginTop: '10px' }}>
                                                <input
                                                    type="text"
                                                    style={styles.input}
                                                    name="ctaTypeCustom"
                                                    value={formData.ctaTypeCustom}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter custom CTA"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Narration Style (POV)</label>

                                    {renderModeToggle('narrationStyleMode', (mode) => {
                                        if (mode === 'custom') {
                                            setFormData((prev) => ({
                                                ...prev,
                                                narrationStyleMode: 'custom',
                                                narrationStyle: '',
                                            }));
                                            return;
                                        }

                                        setFormData((prev) => ({
                                            ...prev,
                                            narrationStyleMode: 'predefined',
                                            narrationStyleCustom: '',
                                            narrationStyle: '',
                                        }));
                                    })}

                                    {formData.narrationStyleMode === 'predefined' && (
                                    <select
                                        style={styles.select}
                                        name="narrationStyle"
                                        value={formData.narrationStyle}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({
                                                ...prev,
                                                narrationStyle: value,
                                            }));
                                        }}
                                    >
                                        <option value="">Select POV</option>
                                        {fieldOptions.narrationStyles.map(option => (
                                            <option key={option.id || option.key} value={option.key}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>

                                    )}

                                    {formData.narrationStyleMode === 'custom' && (
                                        <div style={{ marginTop: '10px' }}>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                name="narrationStyleCustom"
                                                value={formData.narrationStyleCustom}
                                                onChange={handleInputChange}
                                                placeholder="Enter custom narration style"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Output Format (Export Type)</label>
                                    <select
                                        style={styles.select}
                                        name="outputFormat"
                                        value={formData.outputFormat}
                                        onChange={handleInputChange}
                                    >
                                        {fieldOptions.outputFormats.map(option => (
                                            <option key={option.key} value={option.key}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="col-12">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Script Structure Depth (Level of Detail)</label>
                                    <div style={styles.radioGroup}>
                                        {fieldOptions.structureDepths.map((opt) => (
                                            <label key={opt.key} style={styles.radioItem}>
                                                <input
                                                    type="radio"
                                                    name="structureDepth"
                                                    value={opt.key}
                                                    checked={formData.structureDepth === opt.key}
                                                    onChange={handleInputChange}
                                                />
                                                <span>{opt.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Visual Tone & Mood</label>

                                    {renderModeToggle('visualToneMode', (mode) => {
                                        if (mode === 'custom') {
                                            setFormData((prev) => ({
                                                ...prev,
                                                visualToneMode: 'custom',
                                                visualTone: '',
                                            }));
                                            return;
                                        }

                                        setFormData((prev) => ({
                                            ...prev,
                                            visualToneMode: 'predefined',
                                            visualToneCustom: '',
                                            visualTone: '',
                                        }));
                                    })}

                                    {formData.visualToneMode === 'predefined' && (
                                        <select
                                            style={styles.select}
                                            name="visualTone"
                                            value={formData.visualTone}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    visualTone: value,
                                                }));
                                            }}
                                        >
                                            <option value="">Select mood</option>
                                            {fieldOptions.visualTones.map(option => (
                                                <option key={option.id || option.key} value={option.key}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {formData.visualToneMode === 'custom' && (
                                        <div style={{ marginTop: '10px' }}>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                name="visualToneCustom"
                                                value={formData.visualToneCustom}
                                                onChange={handleInputChange}
                                                placeholder="Enter custom mood"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Compliance Mode (Content & Claim Safety Controls)</label>
                                    <input
                                        type="text"
                                        style={styles.input}
                                        name="complianceMode"
                                        value={formData.complianceMode}
                                        onChange={handleInputChange}
                                        placeholder="e.g., No medical claims, No financial guarantees"
                                    />
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Language & Localization</label>

                                    {renderModeToggle('languageMode', (mode) => {
                                        if (mode === 'custom') {
                                            setFormData((prev) => ({
                                                ...prev,
                                                languageMode: 'custom',
                                            }));
                                            return;
                                        }

                                        setFormData((prev) => ({
                                            ...prev,
                                            languageMode: 'predefined',
                                            languageCustom: '',
                                            language: prev.language || (fieldOptions.languages?.[0]?.id ? String(fieldOptions.languages[0].id) : ''),
                                        }));
                                    })}

                                    {formData.languageMode === 'predefined' && (
                                        <select
                                            style={styles.select}
                                            name="language"
                                            value={formData.language}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    language: value,
                                                }));
                                            }}
                                        >
                                            {fieldOptions.languages.map(option => (
                                                <option key={option.id || option.key} value={String(option.id)}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {formData.languageMode === 'custom' && (
                                        <div style={{ marginTop: '10px' }}>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                name="languageCustom"
                                                value={formData.languageCustom}
                                                onChange={handleInputChange}
                                                placeholder="Enter custom language / locale (e.g., English (US))"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-12">
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Custom Instructions / AI Guidance</label>
                                    <textarea
                                        style={{ ...styles.textarea, minHeight: '120px' }}
                                        name="customInstructions"
                                        value={formData.customInstructions}
                                        onChange={handleInputChange}
                                        placeholder="Any specific guidance for the AI (format, pacing, forbidden phrases, etc.)"
                                    />
                                </div>
                            </div>

                                </>
                            )}

                            {/* Submit Buttons */}
                            <div className="col-12 mt-4">
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        type="button"
                                        style={{ ...styles.btn, ...styles.btnOutline }}
                                        onClick={handleReset}
                                        disabled={isLoading}
                                    >
                                        Reset Form
                                    </button>
                                    <button
                                        type="submit"
                                        style={{ ...styles.btn, ...styles.btnPrimary }}
                                        disabled={isLoading || isGenerating || isApiLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <span>Generating...</span>
                                                <div style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    border: '2px solid rgba(255,255,255,0.3)',
                                                    borderTopColor: 'white',
                                                    borderRadius: '50%',
                                                    animation: 'spin 1s linear infinite',
                                                    display: 'inline-block',
                                                    marginLeft: '8px'
                                                }} />
                                            </>
                                        ) : 'Review & Generate'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>

                    {showSummary && (
                        <SummaryReviewModal
                            formData={formData}
                            onGenerate={handleGenerate}
                            onEdit={handleEditFromSummary}
                            onViewLog={null}
                            isGenerating={isGenerating}
                        />
                    )}

                    {showVariantsModal && (
                        <VariantModalContent
                            variants={generatedVariantsData.variants}
                            inputs={generatedVariantsData.inputs}
                            onClose={handleCloseVariantsModal}
                            onRequestRegenerate={handleRegenerateVariant}
                            showNotification={showNotification}
                            isLoading={isApiLoading}
                            isHistoryView={false}
                        />
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ScriptStoryWriterTool;
