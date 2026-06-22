import React, { useCallback, useEffect, useReducer } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './SettingsModal.css';
import { resolveApiBase } from './apiBase';
import MiniPreview from './components/settings/MiniPreview';
import Toggle from './components/settings/Toggle';
import Slider from './components/settings/Slider';
import Section from './components/settings/Section';
import SettingRow from './components/settings/SettingRow';
import Segment from './components/settings/Segment';
import ApiSlot from './components/settings/ApiSlot';

/* eslint-disable react-hooks/exhaustive-deps */

const API_URL = resolveApiBase();
const MODE_STORAGE_KEY = 'zaire_custom_modes_v1';
const CUSTOM_MODE_LOCKED_ZONES = ['Bottom Console'];

const fetchJsonOrThrow = async (url, options = {}) => {
  const opts = { ...options };
  opts.headers = { ...opts.headers };
  const licenseKey = localStorage.getItem('zaire_license_key');
  if (licenseKey) {
    opts.headers['x-zaire-license'] = licenseKey;
    opts.headers['x-zaire-machine-id'] = 'BROWSER_HUD';
  }
  const response = await fetch(url, opts);
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (!contentType.includes('application/json')) {
    const text = await response.text();
    const preview = text.slice(0, 40).replace(/\s+/g, ' ');
    throw new Error(`Expected JSON but received: ${preview || 'unknown response'}`);
  }

  return response.json();
};

const isNetworkFetchError = (error) =>
  error instanceof TypeError ||
  /failed to fetch|networkerror|load failed/i.test(error?.message || '');

const ensureOk = async (response, contextLabel) => {
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const detail = text ? ` ${text.slice(0, 120)}` : '';
    throw new Error(`${contextLabel} failed: HTTP ${response.status}.${detail}`.trim());
  }
  return response;
};

const sanitizeModeComponents = (components = []) =>
  components.filter((component) => !CUSTOM_MODE_LOCKED_ZONES.includes(component.zone));

const sanitizeModeRecord = (mode) => ({
  ...mode,
  components: sanitizeModeComponents(mode.components || [])
});

const formatLicenseTimestamp = (value, fallback) => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleString();
};

const INITIAL_MODAL_VIEW_STATE = {
  activePage: 'hud',
  scanlines: true,
  adaptiveColor: true,
  urgentFlash: true,
  transitionSpeed: 'NORMAL',
  gridOverlayDensity: '48px',
  nightModeStart: '21:00',
  responseDepth: 'TURBO',
  routingPolicy: 'Auto',
  voiceWake: 85,
  faceConfidence: 92,
  intruderSnapshot: true,
  memoryDepth: 60,
  retentionPeriod: 'Forever',
  gazeMemoryEnabled: false,
  crossModeSharing: true,
  alertLevel: 'TACTICAL',
  neuralDarwinism: true,
  ambientNoise: true,
  privateSession: false,
  missionDigest: true,
  defaultDnaProfile: 'STARK_FORGE',
  selectedTemplateId: 'lawyer',
  creatorStep: 1,
  voiceActor: 'Nova',
  baseTone: 'Default',
  characteristics: 'Warm',
  fastAnswers: false,
  zaireInstructions: '',
  userName: '',
  userOccupation: '',
  userAbout: ''
};

const modalViewReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    default:
      return state;
  }
};

const settingsLocalStateReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        [action.field]: typeof action.value === 'function' ? action.value(state[action.field]) : action.value
      };
    default:
      return state;
  }
};

const blankCustomApiDraft = {
  id: null,
  name: '',
  baseUrl: '',
  headerKey: '',
  token: '',
  hasToken: false,
  enabled: true,
  mask: ''
};

const buildInitialSettingsLocalState = (customModes) => ({
  creatorDraft: blankCreatorDraft,
  localModes: customModes && customModes.length ? customModes : defaultCustomModes,
  aiSlots: [
    { provider: 'Groq', apiKey: '', hasKey: false, model: '', purpose: 'Primary', baseUrl: '', enabled: true },
    { provider: 'OpenAI', apiKey: '', hasKey: false, model: '', purpose: 'Coding', baseUrl: '', enabled: true },
    { provider: 'Empty', apiKey: '', hasKey: false, model: '', purpose: 'Fallback', baseUrl: '', enabled: false }
  ],
  licenseKeyInput: '',
  licensingInfo: null,
  licensingError: null,
  licensingLoading: false,
  memoryDashboard: null,
  memorySearchQuery: '',
  memoryDashboardLoading: false,
  memoryActionStatus: '',
  briefingsData: [],
  briefingsLoading: false,
  aiVaultSaveStatus: '',
  customApis: [],
  customApiDraft: blankCustomApiDraft,
  customApiStatus: ''
});

const buildPersistedSettingsPayload = ({
  scanlines,
  adaptiveColor,
  urgentFlash,
  transitionSpeed,
  gridOverlayDensity,
  nightModeStart,
  responseDepth,
  routingPolicy,
  voiceWake,
  faceConfidence,
  intruderSnapshot,
  memoryDepth,
  retentionPeriod,
  gazeMemoryEnabled,
  crossModeSharing,
  alertLevel,
  neuralDarwinism,
  ambientNoise,
  privateSession,
  missionDigest,
  defaultDnaProfile,
  voiceActor,
  baseTone,
  characteristics,
  fastAnswers,
  zaireInstructions,
  userName,
  userOccupation,
  userAbout,
  halalFilterEnabled,
  autoLintEnabled
}) => ({
  interfaceSettings: {
    scanlines,
    adaptiveColor,
    urgentFlash,
    transitionSpeed,
    gridOverlayDensity,
    nightModeStart
  },
  neuralSettings: {
    responseDepth,
    routingPolicy,
    voiceWake,
    ambientNoise
  },
  securitySettings: {
    faceConfidence,
    intruderSnapshot
  },
  memorySettings: {
    memoryDepth,
    retentionPeriod,
    gazeMemoryEnabled,
    crossModeSharing,
    privateSession
  },
  alertSettings: {
    alertLevel,
    missionDigest
  },
  specialistSettings: {
    neuralDarwinism,
    defaultDnaProfile,
    halalFilterEnabled,
    autoLintEnabled
  },
  personalization: {
    voiceActor,
    baseTone,
    characteristics,
    fastAnswers,
    zaireInstructions,
    userName,
    userOccupation,
    userAbout
  }
});

const createReducerFieldSetter = (dispatch, field) => (value) => {
  dispatch({ type: 'SET_FIELD', field, value });
};

const createProviderSwitchPatch = (provider, previousSlot = {}) => {
  const nextProvider = String(provider || 'Empty');
  const enabled = nextProvider !== 'Empty';
  return {
    ...previousSlot,
    provider: nextProvider,
    enabled,
    apiKey: '',
    hasKey: false,
    mask: '',
    model: nextProvider === previousSlot.provider ? previousSlot.model || '' : '',
    baseUrl: nextProvider === previousSlot.provider ? previousSlot.baseUrl || '' : ''
  };
};

const estimateMemoryStatsLabel = (dashboard) => {
  if (!dashboard?.stats) return '0 facts · 0 study entries · 0 KB';
  return dashboard.stats.summary || '0 facts · 0 study entries · 0 KB';
};

const formatMemoryOldestDate = (value) => {
  if (!value) return 'No long-term memories stored yet';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Unknown' : parsed.toLocaleDateString();
};

const formatMemoryEntryDate = (value) => {
  if (!value) return 'UNKNOWN DATE';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'UNKNOWN DATE' : parsed.toLocaleDateString();
};

const normalizeMemoryDashboard = (stats, memories) => ({
  stats: stats || null,
  memories: Array.isArray(memories)
    ? memories.map((memory) => ({
        ...memory,
        displayDate: formatMemoryEntryDate(memory?.timestamp)
      }))
    : []
});

const AI_SYSTEMS_LIBRARY = [
  {
    category: 'COMMAND TIER',
    items: [
      { id: 'Command Surface', score: '★★★★★', usedIn: '98%', cost: 'Medium', feature: 'Mission Context' },
      { id: 'Mission Control', score: '★★★★★', usedIn: '95%', cost: 'High', feature: 'Status HUD' },
      { id: 'Execution Console', score: '★★★★☆', usedIn: '88%', cost: 'Medium', feature: 'Build Progress' },
      { id: 'Timeline Command', score: '★★★★☆', usedIn: '72%', cost: 'Low', feature: 'Milestone Tracking' }
    ]
  },
  {
    category: 'OPERATIONS TIER',
    items: [
      { id: 'Mission Board', score: '★★★★★', usedIn: '91%', cost: 'Low', feature: 'Agent Assignment' },
      { id: 'Swarm Operations', score: '★★★★★', usedIn: '84%', cost: 'High', feature: 'Live Thoughts' },
      { id: 'Decision Center', score: '★★★☆☆', usedIn: '60%', cost: 'High', feature: 'Accepted/Rejected' }
    ]
  },
  {
    category: 'INTELLIGENCE TIER',
    items: [
      { id: 'Intelligence Stream', score: '★★★★★', usedIn: '76%', cost: 'Medium', feature: 'Breaking Scans' },
      { id: 'Opportunity Scanner', score: '★★★★☆', usedIn: '54%', cost: 'High', feature: 'Market Gaps' },
      { id: 'Risk Radar', score: '★★★★☆', usedIn: '42%', cost: 'High', feature: 'Severity Matrix' }
    ]
  },
  {
    category: 'MEMORY TIER',
    items: [
      { id: 'Neural Memory', score: '★★★★★', usedIn: '95%', cost: 'High', feature: 'Entity Links' },
      { id: 'Knowledge Vault', score: '★★★★☆', usedIn: '68%', cost: 'Medium', feature: 'Vector DB' },
      { id: 'AI Personality Core', score: '★★★☆☆', usedIn: '45%', cost: 'Low', feature: 'Behavior Editor' }
    ]
  },
  {
    category: 'DEVELOPMENT & BUSINESS',
    items: [
      { id: 'Engineering Studio', score: '★★★★★', usedIn: '42%', cost: 'High', feature: '4-Pane Layout' },
      { id: 'Digital Twin', score: '★★★★☆', usedIn: '38%', cost: 'High', feature: 'Multi-Device Render' },
      { id: 'Revenue Center', score: '★★★★☆', usedIn: '30%', cost: 'Medium', feature: 'MRR Tracking' },
      { id: 'Strategy Map', score: '★★★☆☆', usedIn: '25%', cost: 'Medium', feature: 'Goal Graphs' }
    ]
  },
  {
    category: 'VISUALIZATION LAYER',
    items: [
      { id: 'Neural Graph', score: '★★★★★', usedIn: '84%', cost: 'High', feature: 'Agent Network' },
      { id: 'Market Matrix', score: '★★★★☆', usedIn: '25%', cost: 'High', feature: 'Heatmap' },
      { id: 'Whale Scanner', score: '★★★★☆', usedIn: '18%', cost: 'High', feature: 'Tx Feed' }
    ]
  }
];

const modeTemplates = [
  {
    id: 'startup-founder',
    color: '#f97316',
    name: 'STARTUP FOUNDER',
    desc: 'Pitch decks, product strategy, market analysis, and user interviews.',
    category: 'Business',
    icon: 'lucide-rocket',
    outputStyle: 'Strategic, Action-Oriented',
    specialists: ['Project Manager', 'Market Analyst', 'Planner Agent'],
    components: [
      { type: 'Command Surface', zone: 'Main Workspace', index: 0 },
      { type: 'Mission Board', zone: 'Right Inspector', index: 0 },
      { type: 'Neural Memory', zone: 'Left Sidebar', index: 0 },
      { type: 'Execution Console', zone: 'Bottom Console', index: 0 }
    ],
    permissions: { fileSystem: true, internetAccess: true, shellExecution: false },
    persona: 'Strategic, direct, execution-focused',
  },
  {
    id: 'crypto-trader',
    color: '#10b981',
    name: 'TRADER LAB',
    desc: 'Experimental lab for market analysis, execution feeds, and risk workflows.',
    category: 'Finance',
    icon: 'lucide-trending-up',
    outputStyle: 'Analytical, Numbers-First',
    specialists: ['Market Analyst', 'Critic Agent', 'Executor Agent'],
    components: [
      { type: 'Whale Scanner', zone: 'Left Sidebar', index: 0 },
      { type: 'Market Matrix', zone: 'Main Workspace', index: 0 },
      { type: 'Tactical Terminal', zone: 'Bottom Console', index: 0 }
    ],
    permissions: { internetAccess: true, shellExecution: false },
    persona: 'Aggressive, analytical, risk-aware',
  },
  {
    id: 'youtube-creator',
    color: '#ef4444',
    name: 'YOUTUBE CREATOR',
    desc: 'Script writing, title A/B testing, hook generation, and analytics.',
    category: 'Content',
    icon: 'lucide-video',
    outputStyle: 'Creative, High-Energy',
    specialists: ['Writer Agent', 'Critic Agent', 'Research Agent'],
    components: [
      { type: 'Chat Panel', zone: 'Right Inspector', index: 0 },
      { type: 'Document Viewer', zone: 'Main Workspace', index: 0 },
      { type: 'Timeline', zone: 'Bottom Console', index: 0 }
    ],
    permissions: { fileSystem: true, internetAccess: true, hardwareMedia: true },
    persona: 'Creative, engaging, audience-first',
  },
  {
    id: 'software-engineer',
    color: '#3b82f6',
    name: 'SOFTWARE ENGINEER',
    desc: 'Code architecture, pair programming, and continuous deployment.',
    category: 'Development',
    icon: 'lucide-code',
    outputStyle: 'Technical, Concise',
    specialists: ['Code Architect', 'Critic Agent', 'Executor Agent'],
    components: [
      { type: 'Chat Panel', zone: 'Left Sidebar', index: 0 },
      { type: 'Code Studio', zone: 'Main Workspace', index: 0 },
      { type: 'Memory Vault', zone: 'Right Inspector', index: 0 },
      { type: 'Tactical Terminal', zone: 'Bottom Console', index: 0 }
    ],
    permissions: { fileSystem: true, internetAccess: true, shellExecution: true },
    persona: 'Logical, rigorous, best-practices focused',
  },
  {
    id: 'university-student',
    color: '#a855f7',
    name: 'PROFESSOR LAB',
    desc: 'Experimental lab for tutoring, study guides, and structured learning flows.',
    category: 'Education',
    icon: 'lucide-book',
    outputStyle: 'Explanatory, Step-by-Step',
    specialists: ['Research Agent', 'Writer Agent', 'Planner Agent'],
    components: [
      { type: 'Chat Panel', zone: 'Left Sidebar', index: 0 },
      { type: 'Neural Graph', zone: 'Main Workspace', index: 0 },
      { type: 'Memory Vault', zone: 'Right Inspector', index: 0 }
    ],
    permissions: { fileSystem: true, internetAccess: true },
    persona: 'Patient, explanatory, academic',
  },
  {
    id: 'research-scientist',
    color: '#06b6d4',
    name: 'SWARM LAB',
    desc: 'Experimental lab for multi-agent research, synthesis, and hypothesis testing.',
    category: 'Research',
    icon: 'lucide-microscope',
    outputStyle: 'Academic, Rigorous',
    specialists: ['Research Agent', 'Market Analyst', 'Critic Agent'],
    components: [
      { type: 'Swarm Operations', zone: 'Left Sidebar', index: 0 },
      { type: 'Intelligence Stream', zone: 'Main Workspace', index: 0 },
      { type: 'Neural Graph', zone: 'Right Inspector', index: 0 }
    ],
    permissions: { fileSystem: true, internetAccess: true },
    persona: 'Objective, precise, inquisitive',
  },
  {
    id: 'sales-operator',
    color: '#eab308',
    name: 'SALES OPERATOR',
    desc: 'Lead generation, cold email sequencing, and CRM updating.',
    category: 'Sales',
    icon: 'lucide-phone',
    outputStyle: 'Persuasive, Professional',
    specialists: ['Writer Agent', 'Planner Agent', 'Executor Agent'],
    components: [
      { type: 'Chat Panel', zone: 'Left Sidebar', index: 0 },
      { type: 'Task Queue', zone: 'Main Workspace', index: 0 },
      { type: 'Notes Panel', zone: 'Right Inspector', index: 0 }
    ],
    permissions: { fileSystem: false, internetAccess: true },
    persona: 'Charming, persistent, results-driven',
  },
  {
    id: 'marketing-agency',
    color: '#ec4899',
    name: 'MARKETING AGENCY',
    desc: 'Ad copy, SEO optimization, brand strategy, and social schedules.',
    category: 'Marketing',
    icon: 'lucide-megaphone',
    outputStyle: 'Creative, Conversion-Focused',
    specialists: ['Writer Agent', 'Market Analyst', 'Planner Agent'],
    components: [
      { type: 'Chat Panel', zone: 'Left Sidebar', index: 0 },
      { type: 'Calendar Panel', zone: 'Main Workspace', index: 0 },
      { type: 'Live Preview', zone: 'Right Inspector', index: 0 }
    ],
    permissions: { internetAccess: true, fileSystem: true },
    persona: 'Trend-aware, persuasive, metrics-focused',
  }
];

const defaultCustomModes = [
  {
    id: 'brand-mode',
    color: '#fbbf24',
    name: 'BRAND MODE',
    desc: 'Manages inventory, Stripe revenue, and social metrics',
    capabilities: ['WEB SEARCH', 'FILE SYSTEM', 'CHARTS'],
    persona: 'Operator, brand strategist, growth-aware',
    enabled: true,
  },
  {
    id: 'health-sentinel',
    color: '#ec4899',
    name: 'HEALTH SENTINEL',
    desc: 'Tracks gym schedule, meals, sleep, and daily progress',
    capabilities: ['FILE SYSTEM', 'CHARTS'],
    persona: 'Accountability coach, calm but firm',
    enabled: true,
  },
];

const blankCreatorDraft = {
  identity: {
    name: '',
    desc: '',
    category: '',
    color: '#00d4ff',
    icon: '',
    outputStyle: 'Action Plan',
    targetUser: ''
  },
  intelligence: {
    goals: '',
    purpose: '',
    neverDo: '',
    persona: '',
    preQuestions: '',
    successDefinition: '',
    specialists: [],
    capabilities: ['WEB SEARCH', 'FILE SYSTEM']
  },
  interface: {
    components: [
      { type: 'Chat Panel', zone: 'Main Workspace', index: 0 },
      { type: 'Task Queue', zone: 'Left Sidebar', index: 0 }
    ],
    themeDensity: 'compact',
    animationStyle: 'neural'
  },
  permissions: {
    fileSystem: false,
    shellExecution: false,
    internetAccess: true,
    costWarnings: true,
    screenCapture: false,
    hardwareMedia: false
  }
};

const buildModeExpertBlueprint = (draft) => {
  const safeList = Array.isArray(draft.capabilities) ? draft.capabilities.filter(Boolean) : [];
  const primaryMission = String(draft.goals || draft.desc || '').trim() || 'Deliver expert specialist help for the user.';
  const helpBoundaries = String(draft.neverDo || '').trim() || 'Never fabricate facts, hidden access, or completed work.';

  return {
    primaryMission,
    expertiseChecklist: [
      `Master the domain implied by "${draft.name || 'this specialist'}" before responding.`,
      'Translate the user specification into concrete best practices, terminology, and quality standards.',
      'Prefer senior-level judgment, clear structure, and decision-ready recommendations.',
      'State assumptions and risks when they materially affect the answer.'
    ],
    operatingGuidelines: [
      `Persona anchor: ${String(draft.persona || 'Disciplined senior specialist').trim()}`,
      `Preferred output: ${String(draft.preferredOutput || 'Action Plan').trim()}`,
      `Routing priority: ${String(draft.routingPriority || 'Balanced').trim()}`,
      `Capabilities in scope: ${safeList.length ? safeList.join(', ') : 'General specialist reasoning'}`
    ],
    refusalRules: [
      helpBoundaries,
      'Do not claim research, tool usage, or verification that did not actually happen.',
      'If live verification is needed, say so plainly and continue with the best grounded guidance available.'
    ]
  };
};

const navGroups = [
  {
    label: 'INTERFACE',
    items: [
      { id: 'hud', label: 'HUD & VISUALS', icon: '\u25c8' },
      { id: 'modes', label: 'SPECIALISTS', icon: '\u25c7', badge: '4' },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { id: 'ai', label: 'AI VAULT', icon: '\u25ce', badge: '3 max' },
      { id: 'apis', label: 'API KEYS', icon: '\u25cf', badge: 'NEW', danger: true },
      { id: 'neural', label: 'NEURAL CONFIG', icon: '\u2735' },
    ],
  },
  {
    label: 'CUSTOM MODES',
    items: [
      { id: 'creator', label: 'MODE CREATOR', icon: '\u272a', tag: 'NEW' },
      { id: 'mymodes', label: 'MY MODES', icon: '\u25a7', badge: '2' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { id: 'voice', label: 'VOICE & WAKE', icon: '\u25c9' },
      { id: 'personalize', label: 'PERSONALIZATION', icon: '\u263A', tag: 'NEW' },
      { id: 'security', label: 'PROTECTION', icon: '\u25a3' },
      { id: 'licensing', label: 'LICENSING', icon: '\uD83D\uDD12', badge: 'SECURE' },
      { id: 'memory', label: 'MEMORY', icon: '\u25a6' },
      { id: 'briefing', label: 'WEEKLY BRIEFINGS', icon: '\u25ce', tag: 'NEW' },
      { id: 'notif', label: 'ALERTS', icon: '\u25cc' },
    ],
  },
];

function useSettingsModalController({
  isOpen,
  onClose,
  activeMode,
  focusModeEnabled,
  setFocusModeEnabled,
  performanceProfile,
  coreModeVisibility,
  onCoreModeVisibilityChange,
  blobColor,
  setBlobColor,
  blobSize,
  setBlobSize,
  hudOpacity,
  setHudOpacity,
  neuralGlowEnabled,
  setNeuralGlowEnabled,
  holographicTiltEnabled,
  setHolographicTiltEnabled,
  halalFilterEnabled,
  setHalalFilterEnabled,
  autoLintEnabled,
  setAutoLintEnabled,
  onEnterDragMode,
  biometricData,
  customModes,
  onCustomModesChange,
  billingStatus
}) {
  const { getToken } = useAuth();
  const [modalViewState, dispatchModalView] = useReducer(modalViewReducer, INITIAL_MODAL_VIEW_STATE);
  const {
    activePage,
    scanlines,
    adaptiveColor,
    urgentFlash,
    transitionSpeed,
    gridOverlayDensity,
    nightModeStart,
    responseDepth,
    routingPolicy,
    voiceWake,
    faceConfidence,
    intruderSnapshot,
    memoryDepth,
    retentionPeriod,
    gazeMemoryEnabled,
    crossModeSharing,
    alertLevel,
    neuralDarwinism,
    ambientNoise,
    privateSession,
    missionDigest,
    defaultDnaProfile,
    selectedTemplateId,
    creatorStep,
    voiceActor,
    baseTone,
    characteristics,
    fastAnswers,
    zaireInstructions,
    userName,
    userOccupation,
    userAbout
  } = modalViewState;
  const [settingsLocalState, dispatchSettingsLocalState] = useReducer(
    settingsLocalStateReducer,
    customModes,
    buildInitialSettingsLocalState
  );
  const {
    creatorDraft,
    localModes,
    aiSlots,
    licenseKeyInput,
    licensingInfo,
    licensingError,
    licensingLoading,
    memoryDashboard,
    memorySearchQuery,
    memoryDashboardLoading,
    memoryActionStatus,
    briefingsData,
    briefingsLoading,
    aiVaultSaveStatus,
    customApis,
    customApiDraft,
    customApiStatus
  } = settingsLocalState;
  const setCreatorDraft = createReducerFieldSetter(dispatchSettingsLocalState, 'creatorDraft');
  const setLocalModes = createReducerFieldSetter(dispatchSettingsLocalState, 'localModes');
  const setAiSlots = createReducerFieldSetter(dispatchSettingsLocalState, 'aiSlots');
  const setLicenseKeyInput = createReducerFieldSetter(dispatchSettingsLocalState, 'licenseKeyInput');
  const setLicensingInfo = createReducerFieldSetter(dispatchSettingsLocalState, 'licensingInfo');
  const setLicensingError = createReducerFieldSetter(dispatchSettingsLocalState, 'licensingError');
  const setLicensingLoading = createReducerFieldSetter(dispatchSettingsLocalState, 'licensingLoading');
  const setMemoryDashboard = createReducerFieldSetter(dispatchSettingsLocalState, 'memoryDashboard');
  const setMemorySearchQuery = createReducerFieldSetter(dispatchSettingsLocalState, 'memorySearchQuery');
  const setMemoryDashboardLoading = createReducerFieldSetter(dispatchSettingsLocalState, 'memoryDashboardLoading');
  const setMemoryActionStatus = createReducerFieldSetter(dispatchSettingsLocalState, 'memoryActionStatus');
  const setBriefingsData = createReducerFieldSetter(dispatchSettingsLocalState, 'briefingsData');
  const setBriefingsLoading = createReducerFieldSetter(dispatchSettingsLocalState, 'briefingsLoading');
  const setAiVaultSaveStatus = createReducerFieldSetter(dispatchSettingsLocalState, 'aiVaultSaveStatus');
  const setCustomApis = createReducerFieldSetter(dispatchSettingsLocalState, 'customApis');
  const setCustomApiDraft = createReducerFieldSetter(dispatchSettingsLocalState, 'customApiDraft');
  const setCustomApiStatus = createReducerFieldSetter(dispatchSettingsLocalState, 'customApiStatus');
  const settingsWarningState = React.useRef({
    briefingsLogged: false,
    memoryLogged: false,
    vaultLogged: false,
    customModesLogged: false
  });

  const fetchBriefings = async () => {
    setBriefingsLoading(true);
    try {
      const data = await fetchJsonOrThrow(`${API_URL}/api/briefings`);
      if (data.success) {
        setBriefingsData(data.briefings || []);
      }
      settingsWarningState.current.briefingsLogged = false;
    } catch (err) {
      setBriefingsData([]);
      if (!isNetworkFetchError(err) && !settingsWarningState.current.briefingsLogged) {
        console.warn('Briefings fetch failed:', err.message);
        settingsWarningState.current.briefingsLogged = true;
      }
    } finally {
      setBriefingsLoading(false);
    }
  };

  const generateBriefing = async () => {
    try {
      await fetchJsonOrThrow(`${API_URL}/api/briefings/generate`, { method: 'POST' });
      // Reload briefings after a short delay to see it in 'running' state
      setTimeout(fetchBriefings, 2000);
    } catch (err) {
      console.error('Generate briefing failed:', err.message);
    }
  };

  const fetchLicensingInfo = async () => {
    setLicensingLoading(true);
    try {
      const storedLicense = billingStatus?.details?.license_key || localStorage.getItem('zaire_license_key') || '';
      if (storedLicense) {
        setLicenseKeyInput(storedLicense);
        const data = await fetchJsonOrThrow(`${API_URL}/api/license/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            license_key: storedLicense,
            machine_id: 'BROWSER_HUD'
          })
        });
        if (data.valid) {
          setLicensingInfo(data);
          setLicensingError(null);
        } else {
          setLicensingError(data.error || 'INVALID_KEY');
          setLicensingInfo(null);
        }
      }
    } catch (err) {
      console.warn('Licensing check failed:', err.message);
    } finally {
      setLicensingLoading(false);
    }
  };

  const fetchMemoryDashboard = async () => {
    setMemoryDashboardLoading(true);
    try {
      const data = await fetchJsonOrThrow(`${API_URL}/memory/dashboard`);
      if (data.success) {
        setMemoryDashboard(normalizeMemoryDashboard(data.stats, data.memories));
      }
      settingsWarningState.current.memoryLogged = false;
    } catch (err) {
      setMemoryDashboard(null);
      if (!isNetworkFetchError(err) && !settingsWarningState.current.memoryLogged) {
        console.warn('Memory dashboard fetch failed:', err.message);
        settingsWarningState.current.memoryLogged = true;
      }
    } finally {
      setMemoryDashboardLoading(false);
    }
  };

  const clearMemoryDomain = async (domain, label) => {
    if (!window.confirm(`Proceed with ${label.toUpperCase()}?`)) return;
    setMemoryActionStatus(`Executing ${label.toUpperCase()}...`);
    try {
      const data = await fetchJsonOrThrow(`${API_URL}/memory/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });
      if (data.success) {
        setMemoryDashboard(normalizeMemoryDashboard(data.dashboard?.stats, data.dashboard?.memories));
        setMemoryActionStatus(`${label.toUpperCase()} complete.`);
      } else {
        setMemoryActionStatus(data.error || `${label} failed.`);
      }
    } catch (err) {
      setMemoryActionStatus(`${label} failed: ${err.message}`);
    }
  };

  const loadMemorySettingsConfig = useCallback(async () => {
    try {
      const data = await fetchJsonOrThrow(`${API_URL}/config`);
      const configRoot = data?.success ? (data.data || {}) : {};
      const interfaceSettings = configRoot.interfaceSettings || {};
      const neuralSettings = configRoot.neuralSettings || {};
      const securitySettings = configRoot.securitySettings || {};
      const memorySettings = configRoot.memorySettings || {};
      const alertSettings = configRoot.alertSettings || {};
      const specialistSettings = configRoot.specialistSettings || {};
      const personalization = configRoot.personalization || configRoot.voice || {};
      const desktopProfile = configRoot.desktopProfile || {};
      const slotConfig = Array.isArray(configRoot.aiVault?.slots) ? configRoot.aiVault.slots.slice(0, 3) : [];
      const externalApis = Array.isArray(configRoot.externalApis) ? configRoot.externalApis : [];
      if (typeof interfaceSettings.scanlines === 'boolean') dispatchModalView({ type: 'SET_FIELD', field: 'scanlines', value: interfaceSettings.scanlines });
      if (typeof interfaceSettings.adaptiveColor === 'boolean') dispatchModalView({ type: 'SET_FIELD', field: 'adaptiveColor', value: interfaceSettings.adaptiveColor });
      if (typeof interfaceSettings.urgentFlash === 'boolean') dispatchModalView({ type: 'SET_FIELD', field: 'urgentFlash', value: interfaceSettings.urgentFlash });
      if (interfaceSettings.transitionSpeed !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'transitionSpeed', value: interfaceSettings.transitionSpeed });
      if (interfaceSettings.gridOverlayDensity !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'gridOverlayDensity', value: interfaceSettings.gridOverlayDensity });
      if (interfaceSettings.nightModeStart !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'nightModeStart', value: interfaceSettings.nightModeStart });

      if (neuralSettings.responseDepth !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'responseDepth', value: neuralSettings.responseDepth });
      if (neuralSettings.routingPolicy !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'routingPolicy', value: neuralSettings.routingPolicy });
      if (neuralSettings.voiceWake !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'voiceWake', value: neuralSettings.voiceWake });
      if (typeof neuralSettings.ambientNoise === 'boolean') dispatchModalView({ type: 'SET_FIELD', field: 'ambientNoise', value: neuralSettings.ambientNoise });

      if (securitySettings.faceConfidence !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'faceConfidence', value: securitySettings.faceConfidence });
      if (typeof securitySettings.intruderSnapshot === 'boolean') dispatchModalView({ type: 'SET_FIELD', field: 'intruderSnapshot', value: securitySettings.intruderSnapshot });

      if (memorySettings.retentionPeriod) {
        dispatchModalView({ type: 'SET_FIELD', field: 'retentionPeriod', value: memorySettings.retentionPeriod });
      }
      if (memorySettings.memoryDepth !== undefined) {
        dispatchModalView({ type: 'SET_FIELD', field: 'memoryDepth', value: memorySettings.memoryDepth });
      }
      if (typeof memorySettings.gazeMemoryEnabled === 'boolean') {
        dispatchModalView({ type: 'SET_FIELD', field: 'gazeMemoryEnabled', value: memorySettings.gazeMemoryEnabled });
      }
      if (typeof memorySettings.crossModeSharing === 'boolean') {
        dispatchModalView({ type: 'SET_FIELD', field: 'crossModeSharing', value: memorySettings.crossModeSharing });
      }
      if (typeof memorySettings.privateSession === 'boolean') {
        dispatchModalView({ type: 'SET_FIELD', field: 'privateSession', value: memorySettings.privateSession });
      }

      if (alertSettings.alertLevel !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'alertLevel', value: alertSettings.alertLevel });
      if (typeof alertSettings.missionDigest === 'boolean') dispatchModalView({ type: 'SET_FIELD', field: 'missionDigest', value: alertSettings.missionDigest });

      if (typeof specialistSettings.neuralDarwinism === 'boolean') dispatchModalView({ type: 'SET_FIELD', field: 'neuralDarwinism', value: specialistSettings.neuralDarwinism });
      if (specialistSettings.defaultDnaProfile !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'defaultDnaProfile', value: specialistSettings.defaultDnaProfile });
      if (typeof specialistSettings.halalFilterEnabled === 'boolean') setHalalFilterEnabled(specialistSettings.halalFilterEnabled);
      if (typeof specialistSettings.autoLintEnabled === 'boolean') setAutoLintEnabled(specialistSettings.autoLintEnabled);

      if (personalization.voiceActor !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'voiceActor', value: personalization.voiceActor });
      if (personalization.baseTone !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'baseTone', value: personalization.baseTone });
      if (personalization.characteristics !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'characteristics', value: personalization.characteristics });
      if (personalization.fastAnswers !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'fastAnswers', value: personalization.fastAnswers });
      if (personalization.zaireInstructions !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'zaireInstructions', value: personalization.zaireInstructions });
      if (personalization.userName !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'userName', value: personalization.userName });
      if (personalization.userOccupation !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'userOccupation', value: personalization.userOccupation });
      if (personalization.userAbout !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'userAbout', value: personalization.userAbout });

      if (desktopProfile?.licensing?.cachedLicenseKey && !localStorage.getItem('zaire_license_key')) {
        localStorage.setItem('zaire_license_key', desktopProfile.licensing.cachedLicenseKey);
        setLicenseKeyInput(desktopProfile.licensing.cachedLicenseKey);
      }

      if (slotConfig.length > 0) {
        const normalized = Array.from({ length: 3 }, (_, index) => {
          const slot = slotConfig[index];
          if (!slot) {
            return { provider: 'Empty', apiKey: '', hasKey: false, model: '', purpose: index === 0 ? 'Primary' : index === 1 ? 'Coding' : 'Fallback', baseUrl: '', enabled: false };
          }
          return {
            provider: slot.provider || 'Empty',
            apiKey: '',
            hasKey: Boolean(slot.hasKey),
            model: slot.model || '',
            purpose: slot.purpose || (index === 0 ? 'Primary' : index === 1 ? 'Coding' : 'Fallback'),
            baseUrl: slot.baseUrl || '',
            enabled: Boolean(slot.enabled),
            mask: slot.hasKey ? 'Saved Locally' : ''
          };
        });
        setAiSlots(normalized);
      }

      setCustomApis(externalApis.map((entry, index) => ({
        id: entry.id || `service-${index + 1}`,
        name: entry.name || '',
        baseUrl: entry.baseUrl || '',
        headerKey: entry.headerKey || '',
        token: '',
        hasToken: Boolean(entry.hasToken),
        enabled: entry.enabled !== false,
        mask: entry.mask || (entry.hasToken ? 'Saved Locally' : '')
      })));
    } catch (_) {}
  }, [setAiSlots, setAutoLintEnabled, setCustomApis, setHalalFilterEnabled, setLicenseKeyInput]);

  useEffect(() => {
    if (isOpen) {
      fetchLicensingInfo();
      fetchMemoryDashboard();
      fetchBriefings();
      
      getToken().then(token => {
        if (!token) return;
        fetch(`${API_URL}/api/settings`, { headers: { 'Authorization': `Bearer ${token}` } })
          .then(r => r.json())
          .then(data => {
            if (data.success && data.settings) {
              const { agent, voice } = data.settings;
              if (agent) {
                if (agent.memoryDepth !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'memoryDepth', value: agent.memoryDepth });
                if (agent.retentionPeriod !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'retentionPeriod', value: agent.retentionPeriod });
                if (agent.gazeMemoryEnabled !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'gazeMemoryEnabled', value: agent.gazeMemoryEnabled });
                if (agent.crossModeSharing !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'crossModeSharing', value: agent.crossModeSharing });
                if (agent.privateSession !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'privateSession', value: agent.privateSession });
              }
              if (voice) {
                if (voice.voiceActor !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'voiceActor', value: voice.voiceActor });
                if (voice.baseTone !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'baseTone', value: voice.baseTone });
                if (voice.characteristics !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'characteristics', value: voice.characteristics });
                if (voice.fastAnswers !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'fastAnswers', value: voice.fastAnswers });
                if (voice.zaireInstructions !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'zaireInstructions', value: voice.zaireInstructions });
                if (voice.userName !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'userName', value: voice.userName });
                if (voice.userOccupation !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'userOccupation', value: voice.userOccupation });
                if (voice.userAbout !== undefined) dispatchModalView({ type: 'SET_FIELD', field: 'userAbout', value: voice.userAbout });
              }
            }
          })
          .catch(() => {});
      });
    }
  }, [isOpen, getToken]);

  useEffect(() => {
    if (!isOpen) return;
    loadMemorySettingsConfig();
  }, [isOpen, loadMemorySettingsConfig]);

  const activateNewKey = async () => {
    if (!licenseKeyInput.trim()) return;
    setLicensingLoading(true);
    setLicensingError(null);
    try {
      const data = await fetchJsonOrThrow(`${API_URL}/api/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license_key: licenseKeyInput.trim(),
          machine_id: 'BROWSER_HUD',
          machine_name: 'ZAIRE Web HUD Console',
          os_version: 'Web Client'
        })
      });
      if (data.valid) {
        localStorage.setItem('zaire_license_key', licenseKeyInput.trim());
        window.dispatchEvent(new CustomEvent('ZAIRE_PERSIST_CONFIG', {
          detail: {
            desktopProfile: {
              licensing: {
                cachedLicenseKey: licenseKeyInput.trim()
              }
            }
          }
        }));
        setLicensingInfo(data);
        setLicensingError(null);
      } else {
        setLicensingError(data.error || 'INVALID_KEY');
        setLicensingInfo(null);
      }
    } catch (err) {
      setLicensingError('CONNECTION_FAILED');
    } finally {
      setLicensingLoading(false);
    }
  };

  const deactivateDevice = async (machineId) => {
    if (!licensingInfo?.license_key) return;
    setLicensingLoading(true);
    try {
      const data = await fetchJsonOrThrow(`${API_URL}/api/license/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license_key: licensingInfo.license_key,
          machine_id: machineId
        })
      });
      if (data.success) {
        fetchLicensingInfo();
      } else {
        alert(data.error || 'Failed to deactivate device.');
      }
    } catch (err) {
      alert('Connection failed.');
    } finally {
      setLicensingLoading(false);
    }
  };

  useEffect(() => {
    if (Array.isArray(customModes) && customModes.length > 0) {
      setLocalModes(customModes.map(sanitizeModeRecord));
    }
  }, [customModes]);

  const loadAiProviders = useCallback(async () => {
    try {
      const token = await getToken().catch(() => null);
      if (!token) return;
      const data = await fetchJsonOrThrow(`${API_URL}/api/vault/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const vault = data?.vault_status;
      const slotStatuses = Array.isArray(data?.slots) ? data.slots : [];
      if (vault || slotStatuses.length > 0) {
        setAiSlots((previousSlots) => {
          const slots = Array.isArray(previousSlots) && previousSlots.length
            ? previousSlots
            : buildInitialSettingsLocalState([]).aiSlots;

          return slots.map((slot, index) => {
            const matchingSlot = slotStatuses.find((entry) => Number(entry.slot) === index + 1);
            const providerKey = String(slot.provider || '').toLowerCase();
            let providerStatus = null;
            if (providerKey.includes('groq')) providerStatus = vault?.groq;
            else if (providerKey.includes('openrouter')) providerStatus = vault?.openrouter;
            else if (providerKey.includes('openai') && !providerKey.includes('azure')) providerStatus = vault?.openai;
            else if (providerKey.includes('gemini')) providerStatus = vault?.gemini;
            else if (providerKey.includes('anthropic')) providerStatus = vault?.anthropic;
            else if (providerKey.includes('deepseek')) providerStatus = vault?.deepseek;
            else if (providerKey.includes('cohere')) providerStatus = vault?.cohere;
            else if (providerKey.includes('mistral')) providerStatus = vault?.mistral;
            else if (providerKey.includes('siliconflow')) providerStatus = vault?.siliconflow;

            if (!providerStatus && !matchingSlot) return slot;

            return {
              ...slot,
              hasKey: Boolean(slot.hasKey || providerStatus?.configured || matchingSlot?.hasKey),
              mask: matchingSlot?.mask || providerStatus?.mask || slot.mask || ''
            };
          });
        });
      }
      settingsWarningState.current.vaultLogged = false;
    } catch (err) {
      if (!isNetworkFetchError(err) && !settingsWarningState.current.vaultLogged) {
        console.warn('Failed to fetch from vault:', err.message);
        settingsWarningState.current.vaultLogged = true;
      }
    }
  }, [getToken, setAiSlots]);

  useEffect(() => {
    if (!isOpen) return;
    loadAiProviders();
  }, [isOpen, loadAiProviders]);

  const setModalField = useCallback((field, value) => {
    dispatchModalView({ type: 'SET_FIELD', field, value });
  }, []);
  const setActivePage = useCallback((value) => setModalField('activePage', value), [setModalField]);
  const setScanlines = useCallback((value) => setModalField('scanlines', value), [setModalField]);
  const setAdaptiveColor = useCallback((value) => setModalField('adaptiveColor', value), [setModalField]);
  const setUrgentFlash = useCallback((value) => setModalField('urgentFlash', value), [setModalField]);
  const setTransitionSpeed = useCallback((value) => setModalField('transitionSpeed', value), [setModalField]);
  const setGridOverlayDensity = useCallback((value) => setModalField('gridOverlayDensity', value), [setModalField]);
  const setNightModeStart = useCallback((value) => setModalField('nightModeStart', value), [setModalField]);
  const setResponseDepth = useCallback((value) => setModalField('responseDepth', value), [setModalField]);
  const setRoutingPolicy = useCallback((value) => setModalField('routingPolicy', value), [setModalField]);
  const setVoiceWake = useCallback((value) => setModalField('voiceWake', value), [setModalField]);
  const setFaceConfidence = useCallback((value) => setModalField('faceConfidence', value), [setModalField]);
  const setIntruderSnapshot = useCallback((value) => setModalField('intruderSnapshot', value), [setModalField]);
  const setMemoryDepth = useCallback((value) => setModalField('memoryDepth', value), [setModalField]);
  const setRetentionPeriod = useCallback((value) => setModalField('retentionPeriod', value), [setModalField]);
  const setGazeMemoryEnabled = useCallback((value) => setModalField('gazeMemoryEnabled', value), [setModalField]);
  const setCrossModeSharing = useCallback((value) => setModalField('crossModeSharing', value), [setModalField]);
  const setAlertLevel = useCallback((value) => setModalField('alertLevel', value), [setModalField]);
  const setNeuralDarwinism = useCallback((value) => setModalField('neuralDarwinism', value), [setModalField]);
  const setAmbientNoise = useCallback((value) => setModalField('ambientNoise', value), [setModalField]);
  const setPrivateSession = useCallback((value) => setModalField('privateSession', value), [setModalField]);
  const setMissionDigest = useCallback((value) => setModalField('missionDigest', value), [setModalField]);
  const setDefaultDnaProfile = useCallback((value) => setModalField('defaultDnaProfile', value), [setModalField]);
  const setSelectedTemplateId = useCallback((value) => setModalField('selectedTemplateId', value), [setModalField]);
  const setCreatorStep = useCallback((value) => setModalField('creatorStep', value), [setModalField]);
  const setVoiceActor = useCallback((value) => setModalField('voiceActor', value), [setModalField]);
  const setBaseTone = useCallback((value) => setModalField('baseTone', value), [setModalField]);
  const setCharacteristics = useCallback((value) => setModalField('characteristics', value), [setModalField]);
  const setFastAnswers = useCallback((value) => setModalField('fastAnswers', value), [setModalField]);
  const setZaireInstructions = useCallback((value) => setModalField('zaireInstructions', value), [setModalField]);
  const setUserName = useCallback((value) => setModalField('userName', value), [setModalField]);
  const setUserOccupation = useCallback((value) => setModalField('userOccupation', value), [setModalField]);
  const setUserAbout = useCallback((value) => setModalField('userAbout', value), [setModalField]);
  const experimentalCoreModes = [
    {
      id: 'TRADER',
      name: 'TRADER LAB',
      desc: 'Market intelligence, signals, and execution workflows.'
    },
    {
      id: 'PROFESSOR',
      name: 'PROFESSOR LAB',
      desc: 'Teaching, explanation, and structured study systems.'
    },
    {
      id: 'SWARM',
      name: 'SWARM LAB',
      desc: 'Multi-agent orchestration and mission control workflows.'
    }
  ];

  const fetchCustomModes = async () => {
    try {
      const token = await getToken();
      if (!token) {
        const configData = await fetchJsonOrThrow(`${API_URL}/config`);
        const desktopModes = Array.isArray(configData?.data?.desktopProfile?.customModes)
          ? configData.data.desktopProfile.customModes.map(sanitizeModeRecord)
          : [];
        if (desktopModes.length > 0) {
          setLocalModes(desktopModes);
          localStorage.setItem(MODE_STORAGE_KEY, JSON.stringify(desktopModes));
          if (onCustomModesChange) onCustomModesChange(desktopModes);
        }
        return;
      }
      const data = await fetchJsonOrThrow(`${API_URL}/api/custom_modes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (data.success && Array.isArray(data.modes)) {
        const sanitizedModes = data.modes.map(sanitizeModeRecord);
        setLocalModes(sanitizedModes);
        localStorage.setItem(MODE_STORAGE_KEY, JSON.stringify(sanitizedModes));
        if (onCustomModesChange) onCustomModesChange(sanitizedModes);
      }
      settingsWarningState.current.customModesLogged = false;
    } catch (err) {
      if (!isNetworkFetchError(err) && !settingsWarningState.current.customModesLogged) {
        console.warn('Failed to fetch custom modes from backend, fallback to local storage:', err.message);
        settingsWarningState.current.customModesLogged = true;
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCustomModes();
    }
  }, [isOpen]);

  const updateCustomApiDraftField = useCallback((field, value) => {
    setCustomApiDraft((current) => ({ ...current, [field]: value }));
  }, [setCustomApiDraft]);

  const addOrUpdateCustomApi = useCallback(() => {
    const name = String(customApiDraft.name || '').trim();
    const baseUrl = String(customApiDraft.baseUrl || '').trim();

    if (!name || !baseUrl) {
      setCustomApiStatus('Service name and base URL are required.');
      return;
    }

    const entryId = customApiDraft.id || `service-${Date.now()}`;
    const nextEntry = {
      id: entryId,
      name,
      baseUrl,
      headerKey: String(customApiDraft.headerKey || '').trim(),
      token: String(customApiDraft.token || '').trim(),
      hasToken: Boolean(customApiDraft.token || customApiDraft.hasToken),
      enabled: customApiDraft.enabled !== false,
      mask: customApiDraft.token ? '' : (customApiDraft.mask || '')
    };

    setCustomApis((current) => {
      const items = Array.isArray(current) ? current : [];
      const existingIndex = items.findIndex((entry) => entry.id === entryId);
      if (existingIndex >= 0) {
        const clone = [...items];
        clone[existingIndex] = nextEntry;
        return clone;
      }
      return [...items, nextEntry];
    });

    setCustomApiDraft(blankCustomApiDraft);
    setCustomApiStatus(`${name} queued for secure save.`);
  }, [customApiDraft, setCustomApiDraft, setCustomApis, setCustomApiStatus]);

  const editCustomApi = useCallback((entry) => {
    setCustomApiDraft({
      id: entry.id,
      name: entry.name || '',
      baseUrl: entry.baseUrl || '',
      headerKey: entry.headerKey || '',
      token: '',
      hasToken: Boolean(entry.hasToken),
      enabled: entry.enabled !== false,
      mask: entry.mask || ''
    });
    setCustomApiStatus(`Editing ${entry.name}. Paste a new token only if you want to replace the saved one.`);
  }, [setCustomApiDraft, setCustomApiStatus]);

  const removeCustomApi = useCallback((entryId) => {
    setCustomApis((current) => (Array.isArray(current) ? current.filter((entry) => entry.id !== entryId) : []));
    setCustomApiDraft((current) => (current.id === entryId ? blankCustomApiDraft : current));
    setCustomApiStatus('Integration removed. Apply CORE_SYNC to persist the change.');
  }, [setCustomApiDraft, setCustomApis, setCustomApiStatus]);

  const verifyCustomApi = useCallback(async () => {
    const payload = {
      name: String(customApiDraft.name || '').trim(),
      baseUrl: String(customApiDraft.baseUrl || '').trim(),
      headerKey: String(customApiDraft.headerKey || '').trim(),
      token: String(customApiDraft.token || '').trim()
    };

    if (!payload.name || !payload.baseUrl) {
      setCustomApiStatus('Enter a service name and base URL before verification.');
      return;
    }

    setCustomApiStatus(`Verifying ${payload.name}...`);
    try {
      const result = await fetchJsonOrThrow(`${API_URL}/llm/external-services/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setCustomApiStatus(result.message || `${payload.name} verification complete.`);
    } catch (err) {
      setCustomApiStatus(`Verification failed: ${err.message || err}`);
    }
  }, [customApiDraft, setCustomApiStatus]);

  const openBriefingAsset = useCallback((assetPath) => {
    const normalizedPath = String(assetPath || '').trim();
    if (!normalizedPath) return;
    const assetUrl = `${API_URL}/api/briefings/asset?path=${encodeURIComponent(normalizedPath)}`;
    window.open(assetUrl, '_blank', 'noopener,noreferrer');
  }, []);

  const applyCoreSync = useCallback(async () => {
    setAiVaultSaveStatus('Saving AI Vault and system configuration...');

    const persistedSettings = buildPersistedSettingsPayload({
      scanlines,
      adaptiveColor,
      urgentFlash,
      transitionSpeed,
      gridOverlayDensity,
      nightModeStart,
      responseDepth,
      routingPolicy,
      voiceWake,
      faceConfidence,
      intruderSnapshot,
      memoryDepth,
      retentionPeriod,
      gazeMemoryEnabled,
      crossModeSharing,
      alertLevel,
      neuralDarwinism,
      ambientNoise,
      privateSession,
      missionDigest,
      defaultDnaProfile,
      voiceActor,
      baseTone,
      characteristics,
      fastAnswers,
      zaireInstructions,
      userName,
      userOccupation,
      userAbout,
      halalFilterEnabled,
      autoLintEnabled
    });

    const configPayload = {
      aiVault: {
        slots: aiSlots.slice(0, 3)
      },
      externalApis: customApis,
      ...persistedSettings,
      desktopProfile: {
        specialistToggles: {
          halalFilterEnabled,
          autoLintEnabled
        },
        licensing: {
          cachedLicenseKey: licenseKeyInput.trim() || localStorage.getItem('zaire_license_key') || ''
        }
      }
    };

    try {
      const configResponse = await fetch(`${API_URL}/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configPayload)
      });
      await ensureOk(configResponse, 'Desktop config save');

      const token = await getToken();
      if (token) {
        const vaultPayload = {
          slots: aiSlots.slice(0, 3).map((slot, index) => ({
            slot: index + 1,
            provider: slot.provider || 'Empty',
            key: slot.apiKey || '',
            model: slot.model || '',
            purpose: slot.purpose || (index === 0 ? 'Primary' : index === 1 ? 'Coding' : 'Fallback'),
            baseUrl: slot.baseUrl || '',
            enabled: Boolean(slot.enabled)
          }))
        };

        if (vaultPayload.slots.some((slot) => slot.provider !== 'Empty' && (slot.key || slot.model))) {
          const vaultResponse = await fetch(`${API_URL}/api/vault/save`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(vaultPayload)
          });
          await ensureOk(vaultResponse, 'Vault save');
        }

        const settingsResponse = await fetch(`${API_URL}/api/settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            agent: {
              ...persistedSettings.memorySettings,
              ...persistedSettings.neuralSettings,
              ...persistedSettings.specialistSettings,
              ...persistedSettings.securitySettings,
              ...persistedSettings.alertSettings,
              interfaceSettings: persistedSettings.interfaceSettings
            },
            voice: persistedSettings.personalization
          })
        });
        await ensureOk(settingsResponse, 'Settings save');
      }

      setAiSlots((previousSlots) =>
        previousSlots.map((slot) => ({
          ...slot,
          apiKey: '',
          hasKey: Boolean(slot.hasKey || slot.apiKey),
          mask: slot.mask || (slot.hasKey || slot.apiKey ? 'Saved Locally' : '')
        }))
      );
      setCustomApis((previousEntries) =>
        previousEntries.map((entry) => ({
          ...entry,
          token: '',
          hasToken: Boolean(entry.hasToken || entry.token),
          mask: entry.mask || (entry.hasToken || entry.token ? 'Saved Locally' : '')
        }))
      );
      setCustomApiDraft(blankCustomApiDraft);
      setCustomApiStatus('External integrations saved securely.');
      setAiVaultSaveStatus('AI Vault and settings saved securely.');
      window.dispatchEvent(new CustomEvent('ZAIRE_PERSIST_CONFIG', {
        detail: {
          ...configPayload,
          personalization: persistedSettings.personalization,
          memorySettings: persistedSettings.memorySettings,
          specialistSettings: persistedSettings.specialistSettings,
          alertSettings: persistedSettings.alertSettings
        }
      }));
      onClose();
    } catch (err) {
      const message = err?.message || 'Unknown save failure';
      setAiVaultSaveStatus(`Save failed: ${message}`);
      console.warn('Failed to save config remotely:', message);
    }
  }, [
    adaptiveColor,
    aiSlots,
    alertLevel,
    ambientNoise,
    autoLintEnabled,
    baseTone,
    characteristics,
    crossModeSharing,
    customApis,
    defaultDnaProfile,
    faceConfidence,
    fastAnswers,
    gazeMemoryEnabled,
    getToken,
    gridOverlayDensity,
    halalFilterEnabled,
    intruderSnapshot,
    licenseKeyInput,
    memoryDepth,
    missionDigest,
    neuralDarwinism,
    nightModeStart,
    onClose,
    privateSession,
    responseDepth,
    retentionPeriod,
    routingPolicy,
    scanlines,
    setAiVaultSaveStatus,
    setAiSlots,
    setCustomApiDraft,
    setCustomApiStatus,
    setCustomApis,
    transitionSpeed,
    urgentFlash,
    userAbout,
    userName,
    userOccupation,
    voiceActor,
    voiceWake,
    zaireInstructions
  ]);

  const factoryReset = useCallback(async () => {
    if (!window.confirm('WIPE ALL SYSTEM PREFERENCES? This clears local settings, saved vault masks, and desktop profile data.')) {
      return;
    }

    try {
      await fetchJsonOrThrow(`${API_URL}/config/reset`, { method: 'POST' });
    } catch (_) {
      // Local reset should still proceed if backend reset is unavailable.
    }

    localStorage.clear();
    window.location.reload();
  }, []);

  if (!isOpen) return () => null;

  const hudOpacityPercent = Math.round(hudOpacity * 100);
  const setHudOpacityPercent = (value) => setHudOpacity(value / 100);
  const modeCount = localModes.length;
  const filteredMemoryResults = (memoryDashboard?.memories || []).filter((memory) => {
    const query = memorySearchQuery.trim().toLowerCase();
    if (!query) return true;
    return String(memory.text || '').toLowerCase().includes(query)
      || (Array.isArray(memory.tags) && memory.tags.some((tag) => String(tag).toLowerCase().includes(query)));
  }).slice(0, 8);

  const saveCustomMode = async (mode) => {
    try {
      const token = await getToken();
      if (!token) return;
      await fetch(`${API_URL}/api/custom_modes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(mode)
      });
    } catch (err) {
      console.warn('Failed to save custom mode to backend:', err.message);
    }
  };

  const duplicateCustomMode = async (modeId) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new TypeError('No authenticated user session');
      }
      const data = await fetchJsonOrThrow(`${API_URL}/api/custom_modes/${modeId}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (data.success) {
        fetchCustomModes();
      }
    } catch (err) {
      console.warn('Failed to duplicate custom mode on backend:', err.message);
      // Fallback local duplication
      const original = localModes.find(m => m.id === modeId);
      if (original) {
        const copy = {
          ...original,
          id: `${original.id.replace(/-[0-9]+$/, '')}-copy-${Date.now()}`,
          name: `${original.name} COPY`,
          createdAt: new Date().toISOString()
        };
        const next = [copy, ...localModes];
        persistCustomModes(next);
      }
    }
  };

  const exportCustomMode = (modeId) => {
    const mode = localModes.find(m => m.id === modeId);
    if (!mode) return;
    const exportData = {
      ...mode,
      id: undefined,
      isZaireExport: true
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${mode.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_zaire_mode.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const importCustomMode = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedMode = JSON.parse(e.target.result);
        if (!importedMode.isZaireExport) {
          alert('Invalid ZAIRE mode file.');
          return;
        }
        const newMode = {
          ...importedMode,
          id: `custom-mode-${Date.now()}`,
          name: `${importedMode.name} (Imported)`,
        };
        await saveCustomMode(newMode);
        fetchCustomModes();
      } catch (err) {
        alert('Failed to parse mode file.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const deleteCustomMode = async (modeId) => {
    if (!window.confirm('Wipe this custom mode from database permanently?')) return;
    try {
      const token = await getToken();
      if (!token) {
        throw new TypeError('No authenticated user session');
      }
      const response = await fetch(`${API_URL}/api/custom_modes/${modeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchCustomModes();
      }
    } catch (err) {
      console.warn('Failed to delete custom mode from backend, executing local wipe:', err.message);
      const next = localModes.filter(m => m.id !== modeId);
      persistCustomModes(next);
    }
  };

  const persistCustomModes = (nextModes) => {
    const sanitizedModes = nextModes.map(sanitizeModeRecord);
    setLocalModes(sanitizedModes);
    localStorage.setItem(MODE_STORAGE_KEY, JSON.stringify(sanitizedModes));
    if (onCustomModesChange) onCustomModesChange(sanitizedModes);
  };

  const applyTemplateToDraft = (template) => {
    setCreatorDraft({
      identity: { 
        ...blankCreatorDraft.identity, 
        name: template.name || '', 
        desc: template.desc || '', 
        color: template.color || '#00d4ff',
        category: template.category || '',
        icon: template.icon || '',
        outputStyle: template.outputStyle || ''
      },
      intelligence: { 
        ...blankCreatorDraft.intelligence, 
        persona: template.persona || '', 
        specialists: template.specialists || [],
        capabilities: template.capabilities || []
      },
      interface: { 
        ...blankCreatorDraft.interface, 
        components: template.components || [] 
      },
      permissions: {
        ...blankCreatorDraft.permissions,
        ...(template.permissions || {})
      }
    });
    setSelectedTemplateId(template.id);
    setCreatorStep(1);
    setActivePage('creator');
  };

  const handleAddComponentToZone = (compType, zone) => {
    if (CUSTOM_MODE_LOCKED_ZONES.includes(zone)) return;
    setCreatorDraft(draft => {
      const clean = draft.interface.components.filter(c => c.type !== compType);
      const index = clean.filter(c => c.zone === zone).length;
      return {
        ...draft,
        interface: { ...draft.interface, components: [...clean, { type: compType, zone, index }] }
      };
    });
  };

  const handleRemoveComponent = (compType) => {
    setCreatorDraft(draft => ({
      ...draft,
      interface: { ...draft.interface, components: draft.interface.components.filter(c => c.type !== compType) }
    }));
  };

  const manifestMode = async () => {
    const name = creatorDraft.identity.name.trim();
    const desc = creatorDraft.identity.desc.trim();

    if (!name || !desc) {
      alert('Please specify a Mode Name and Description.');
      return;
    }

    const nextMode = {
      id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      name: name.toUpperCase(),
      desc,
      color: creatorDraft.identity.color,
      capabilities: creatorDraft.intelligence.capabilities,
      persona: creatorDraft.intelligence.persona.trim() || 'Custom ZAIRE specialist',
      goals: creatorDraft.intelligence.goals.trim(),
      neverDo: creatorDraft.intelligence.neverDo.trim(),
      preferredOutput: creatorDraft.identity.outputStyle,
      components: sanitizeModeComponents(creatorDraft.interface.components),
      routingPriority: 'Balanced',
      expertBlueprint: buildModeExpertBlueprint({
        name,
        desc,
        persona: creatorDraft.intelligence.persona,
        goals: creatorDraft.intelligence.goals,
        neverDo: creatorDraft.intelligence.neverDo,
        preferredOutput: creatorDraft.identity.outputStyle,
        routingPriority: 'Balanced',
        capabilities: creatorDraft.intelligence.capabilities
      }),
      permissions: creatorDraft.permissions,
      enabled: true,
      source: selectedTemplateId ? `template:${selectedTemplateId}` : 'custom',
      createdAt: new Date().toISOString(),
    };

    const nextModes = [nextMode, ...localModes];
    persistCustomModes(nextModes);
    await saveCustomMode(nextMode);

    setCreatorDraft(blankCreatorDraft);
    setCreatorStep(1);
    setActivePage('mymodes');
  };

  const toggleModeEnabled = async (modeId) => {
    const nextModes = localModes.map((mode) => (
      mode.id === modeId ? { ...mode, enabled: !mode.enabled } : mode
    ));
    persistCustomModes(nextModes);

    try {
      const mode = nextModes.find(m => m.id === modeId);
      const token = await getToken();
      if (!token) return;
      await fetch(`${API_URL}/api/custom_modes/${modeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enabled: mode.enabled })
      });
    } catch (err) {
      console.warn('Failed to update mode status on backend:', err.message);
    }
  };

  const toggleCoreModeEnabled = (modeId) => {
    if (!onCoreModeVisibilityChange) return;
    onCoreModeVisibilityChange((currentValue) => ({
      ...(currentValue || {}),
      [modeId]: !currentValue?.[modeId]
    }));
  };

  const renderView = () => (
    <>
      <button type="button" className="hud-settings-overlay" onClick={onClose} aria-label="Close settings overlay" />
      <div className="settings-wrap" role="dialog" aria-modal="true" aria-label="ZAIRE system control">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-brand">Z.A.I.R.E</div>
            <div className="sidebar-ver">SYSTEM CONTROL</div>
          </div>

          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-group-label">{group.label}</div>
              {group.items.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                  onClick={() => setActivePage(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.tag && <span className="tag-new">{item.tag}</span>}
                  {item.badge && (
                    <span className={`nav-badge ${item.danger ? 'nav-badge-red' : ''}`}>
                      {item.id === 'mymodes' ? modeCount : item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </aside>

        <main className="main">
          {activePage === 'hud' && (
            <div className="page active">
              <div className="page-title">HUD & VISUALS</div>
              <div className="page-sub">Calibrate the interface appearance and behavior · PERF {String(performanceProfile || 'active').toUpperCase()}</div>

              <Section title="INTERFACE CALIBRATION">
                <SettingRow name="HUD OPACITY" desc="Transparency of all holographic panels">
                  <Slider min={20} max={100} step={5} value={hudOpacityPercent} onChange={setHudOpacityPercent} />
                </SettingRow>
                <SettingRow name="NEURAL GLOW INTENSITY" desc="Bioluminescent glow strength on all elements">
                  <Toggle checked={neuralGlowEnabled} onChange={setNeuralGlowEnabled} />
                </SettingRow>
                <SettingRow name="SCANLINE OVERLAY" desc="CRT-style scanline effect across the HUD">
                  <Toggle checked={scanlines} onChange={setScanlines} />
                </SettingRow>
                <SettingRow name="HOLOGRAPHIC TILT" desc="3D perspective tracking on mouse movement">
                  <Toggle checked={holographicTiltEnabled} onChange={setHolographicTiltEnabled} />
                </SettingRow>
                <SettingRow name="ORB MAGNIFICATION" desc="Scale of the central neural core orb">
                  <Slider min={0.5} max={2.5} step={0.1} value={blobSize} onChange={setBlobSize} format={(value) => `${value.toFixed(1)}x`} />
                </SettingRow>
                <SettingRow name="CORE CHROMA" desc="Primary color emitted by the neural core">
                  <select className="hud-select" value={blobColor} onChange={(event) => setBlobColor(event.target.value)}>
                    <option value="#00d4ff">Cyan Core</option>
                    <option value="#00ff88">Emerald Sync</option>
                    <option value="#a78bfa">Violet Array</option>
                    <option value="#fbbf24">Gold Circuit</option>
                  </select>
                </SettingRow>
                <SettingRow name="GRID OVERLAY DENSITY" desc="Background tactical grid line spacing">
                  <select id="settings-grid-overlay-density" name="settings-grid-overlay-density" className="hud-select" value={gridOverlayDensity} onChange={(event) => setGridOverlayDensity(event.target.value)}>
                    <option>40px</option>
                    <option>48px</option>
                    <option>64px</option>
                    <option>OFF</option>
                  </select>
                </SettingRow>
              </Section>

              <Section title="TIME-OF-DAY AESTHETICS">
                <SettingRow name="ADAPTIVE COLOR TEMPERATURE" desc="HUD shifts from deep navy to sharp cyan automatically">
                  <Toggle checked={adaptiveColor} onChange={setAdaptiveColor} />
                </SettingRow>
                <SettingRow name="NIGHT MODE START" desc="Hour when ZAIRE dims to deep dark mode">
                  <select id="settings-night-mode-start" name="settings-night-mode-start" className="hud-select" value={nightModeStart} onChange={(event) => setNightModeStart(event.target.value)}>
                    <option>20:00</option>
                    <option>21:00</option>
                    <option>22:00</option>
                    <option>23:00</option>
                  </select>
                </SettingRow>
              </Section>

              <Section title="ANIMATION SPEED">
                <SettingRow name="TRANSITION SPEED" desc="How fast mode switches and panel animations play">
                  <Segment value={transitionSpeed} options={['INSTANT', 'NORMAL', 'CINEMATIC']} onChange={setTransitionSpeed} />
                </SettingRow>
                <SettingRow name="NEURAL INTERRUPT FLASH" desc="Full-screen flash when ZAIRE detects urgent events">
                  <Toggle checked={urgentFlash} onChange={setUrgentFlash} />
                </SettingRow>
                <SettingRow name="FOCUS MODE" desc="Reduce render load, keep the HUD quiet, and trim optional workers when you are not actively driving ZAIRE">
                  <Toggle checked={focusModeEnabled} onChange={setFocusModeEnabled} />
                </SettingRow>
                <button type="button" className="footer-btn footer-btn-apply full-width-action" onClick={onEnterDragMode}>
                  REPOSITION NEURAL CORE
                </button>
              </Section>
            </div>
          )}

          {activePage === 'modes' && (
            <div className="page active">
              <div className="page-title">SPECIALISTS</div>
              <div className="page-sub">Tune each operational mode for its task profile</div>

              <Section title="ACTIVE SPECIALIST SETTINGS">
                <SettingRow name="TRADER: HALAL FILTER" desc="Automatic screening for Shariah-compliant assets">
                  <Toggle checked={halalFilterEnabled} onChange={setHalalFilterEnabled} />
                </SettingRow>
                <SettingRow name="ENGINEER: AUTO-LINT ON SAVE" desc="Run static analysis every time a file is written">
                  <Toggle checked={autoLintEnabled} onChange={setAutoLintEnabled} />
                </SettingRow>
                <SettingRow name="DEFAULT MODE" desc="Current workspace mode used by the HUD">
                  <span className="api-status connected">{activeMode || 'STANDARD'}</span>
                </SettingRow>
                <SettingRow name="PROFESSOR: OCR DEPTH" desc="Advanced neural scanning for dense slides and papers" muted>
                  <span className="api-status empty">ULTRA_SYNC</span>
                </SettingRow>
              </Section>

              <Section title="ENGINEER SETTINGS">
                <SettingRow name="NEURAL DARWINISM" desc="Generate competing variants before final build">
                  <Toggle checked={neuralDarwinism} onChange={setNeuralDarwinism} />
                </SettingRow>
                <SettingRow name="DEFAULT DNA PROFILE" desc="Starting aesthetic for new projects">
                  <select id="settings-default-dna-profile" name="settings-default-dna-profile" className="hud-select" value={defaultDnaProfile} onChange={(event) => setDefaultDnaProfile(event.target.value)}>
                    <option>STARK_FORGE</option>
                    <option>LUXURY_DARK</option>
                    <option>MINIMAL_LUXURY</option>
                    <option>STARTUP_MODERN</option>
                  </select>
                </SettingRow>
              </Section>
            </div>
          )}

          {activePage === 'ai' && (
            <div className="page active">
              <div className="page-title">AI VAULT</div>
              <div className="page-sub">Connect up to 3 AI providers. Use your own keys and, if needed, your exact provider model IDs.</div>
              <Section title="PRIMARY INTELLIGENCE SLOTS (MAX 3)">
                <ApiSlot
                  slot="1 - PRIMARY"
                  status={(aiSlots[0]?.apiKey || aiSlots[0]?.hasKey) ? 'CONNECTED' : 'PENDING'}
                  provider={aiSlots[0]?.provider || 'Empty'}
                  purpose={aiSlots[0]?.purpose || 'Primary'}
                  model={aiSlots[0]?.model || ''}
                  apiKey={aiSlots[0]?.apiKey || ''}
                  baseUrl={aiSlots[0]?.baseUrl || ''}
                  mask={aiSlots[0]?.mask}
                  empty={(aiSlots[0]?.provider || 'Empty') === 'Empty'}
                  onChange={(patch) => setAiSlots((prev) => prev.map((s, i) => {
                    if (i !== 0) return s;
                    if (Object.prototype.hasOwnProperty.call(patch, 'provider')) {
                      return createProviderSwitchPatch(patch.provider, s);
                    }
                    return { ...s, ...patch };
                  }))}
                />
                <ApiSlot
                  slot="2 - CODING"
                  status={(aiSlots[1]?.apiKey || aiSlots[1]?.hasKey) ? 'CONNECTED' : 'PENDING'}
                  provider={aiSlots[1]?.provider || 'Empty'}
                  purpose={aiSlots[1]?.purpose || 'Coding'}
                  model={aiSlots[1]?.model || ''}
                  apiKey={aiSlots[1]?.apiKey || ''}
                  baseUrl={aiSlots[1]?.baseUrl || ''}
                  mask={aiSlots[1]?.mask}
                  empty={(aiSlots[1]?.provider || 'Empty') === 'Empty'}
                  onChange={(patch) => setAiSlots((prev) => prev.map((s, i) => {
                    if (i !== 1) return s;
                    if (Object.prototype.hasOwnProperty.call(patch, 'provider')) {
                      return createProviderSwitchPatch(patch.provider, s);
                    }
                    return { ...s, ...patch };
                  }))}
                />
                <ApiSlot
                  slot="3 - FALLBACK"
                  status={(aiSlots[2]?.apiKey || aiSlots[2]?.hasKey) ? 'CONNECTED' : 'EMPTY'}
                  provider={aiSlots[2]?.provider || 'Empty'}
                  purpose={aiSlots[2]?.purpose || 'Fallback'}
                  model={aiSlots[2]?.model || ''}
                  apiKey={aiSlots[2]?.apiKey || ''}
                  baseUrl={aiSlots[2]?.baseUrl || ''}
                  mask={aiSlots[2]?.mask}
                  empty={(aiSlots[2]?.provider || 'Empty') === 'Empty'}
                  onChange={(patch) => setAiSlots((prev) => prev.map((s, i) => {
                    if (i !== 2) return s;
                    if (Object.prototype.hasOwnProperty.call(patch, 'provider')) {
                      return createProviderSwitchPatch(patch.provider, s);
                    }
                    return { ...s, ...patch };
                  }))}
                />
                <div className="api-limit-note">Keys are saved securely on your local server.</div>
                <div className="memory-action-status" style={{ marginTop: '10px' }}>
                  {aiVaultSaveStatus || 'Choose a provider, paste its key, optionally set model/base URL, then apply CORE_SYNC.'}
                </div>
              </Section>
            </div>
          )}

          {activePage === 'apis' && (
            <div className="page active">
              <div className="page-title">API KEYS</div>
              <div className="page-sub">Register external services used by specialist modes</div>
              <Section title="CUSTOM API ENDPOINTS">
                <div className="custom-api-row">
                  <input
                    id="custom-api-service-name"
                    name="custom-api-service-name"
                    className="custom-api-input"
                    placeholder="Service name"
                    value={customApiDraft.name}
                    onChange={(e) => updateCustomApiDraftField('name', e.target.value)}
                  />
                  <input
                    id="custom-api-base-url"
                    name="custom-api-base-url"
                    className="custom-api-input"
                    placeholder="https://api.example.com"
                    value={customApiDraft.baseUrl}
                    onChange={(e) => updateCustomApiDraftField('baseUrl', e.target.value)}
                  />
                  <button type="button" className="add-btn" onClick={addOrUpdateCustomApi}>
                    {customApiDraft.id ? 'UPDATE' : 'ADD'}
                  </button>
                </div>
                <div className="custom-api-row">
                  <input
                    id="custom-api-header-key"
                    name="custom-api-header-key"
                    className="custom-api-input"
                    placeholder="Header key"
                    value={customApiDraft.headerKey}
                    onChange={(e) => updateCustomApiDraftField('headerKey', e.target.value)}
                  />
                  <input
                    id="custom-api-token"
                    name="custom-api-token"
                    className="custom-api-input"
                    placeholder={customApiDraft.mask ? `Stored securely: ${customApiDraft.mask}` : 'Optional secret / token'}
                    type="password"
                    value={customApiDraft.token}
                    onChange={(e) => updateCustomApiDraftField('token', e.target.value)}
                  />
                  <button type="button" className="api-test-btn" onClick={verifyCustomApi}>VERIFY</button>
                </div>
                <div className="memory-action-status" style={{ marginTop: '10px' }}>
                  {customApiStatus || 'Add external integrations here. Tokens are stored privately and masked after save.'}
                </div>
                <div className="memory-search-results" style={{ marginTop: '12px' }}>
                  {customApis.length === 0 ? (
                    <div className="memory-empty-copy">No external integrations registered yet.</div>
                  ) : (
                    customApis.map((entry) => (
                      <div className="memory-result-card" key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                        <div>
                          <div className="memory-result-meta">
                            <span>{entry.name}</span>
                            <span>{entry.baseUrl}</span>
                          </div>
                          <div className="memory-result-text" style={{ marginTop: '8px' }}>
                            HEADER: {entry.headerKey || 'none'} {entry.hasToken ? '· TOKEN SAVED' : '· NO TOKEN'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" className="footer-btn" onClick={() => editCustomApi(entry)}>EDIT</button>
                          <button type="button" className="footer-btn footer-btn-reset" onClick={() => removeCustomApi(entry.id)}>REMOVE</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Section>
            </div>
          )}

          {activePage === 'neural' && (
            <div className="page active">
              <div className="page-title">NEURAL CONFIG</div>
              <div className="page-sub">Control reasoning, routing, and response behavior</div>
              <Section title="NEURAL NETWORK ARRAYS">
                <SettingRow name="RESPONSE DEPTH" desc="Switch between fast responses and deep reasoning">
                  <Segment value={responseDepth} options={['TURBO', 'THINKER', 'DEEP']} onChange={setResponseDepth} />
                </SettingRow>
                <SettingRow name="ROUTING POLICY" desc="Select the model handoff strategy for complex requests">
                  <select id="settings-routing-policy" name="settings-routing-policy" className="hud-select" value={routingPolicy} onChange={(event) => setRoutingPolicy(event.target.value)}>
                    <option>Auto</option>
                    <option>Fastest</option>
                    <option>Most Accurate</option>
                    <option>Lowest Cost</option>
                  </select>
                </SettingRow>
              </Section>
            </div>
          )}

          {activePage === 'creator' && (
            <div className="page active forge-page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              
              {/* HEADER WITH PROGRESS */}
              <div className="creator-header-shell" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                 <div>
                    <div className="page-title" style={{ fontSize: '24px', letterSpacing: '4px', textShadow: '0 0 20px #f97316', marginBottom: '5px' }}>MODE CREATOR</div>
                    <div className="page-sub" style={{ color: '#f97316', marginBottom: '0' }}>Design focused operating environments with guided intelligence, interface, and permissions.</div>
                 </div>
                 <div className="creator-progress-shell" style={{ display: 'flex', gap: '20px' }}>
                    {[1, 2, 3, 4].map(step => (
                       <div key={step} className="creator-progress-step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div style={{ width: '40px', height: '4px', background: creatorStep >= step ? '#f97316' : 'rgba(255,255,255,0.1)', borderRadius: '2px', boxShadow: creatorStep >= step ? '0 0 10px #f97316' : 'none' }}></div>
                          <span style={{ fontSize: '9px', color: creatorStep >= step ? 'white' : 'gray', fontWeight: 'bold', letterSpacing: '1px' }}>
                             {step === 1 ? 'IDENTITY' : step === 2 ? 'INTELLIGENCE' : step === 3 ? 'INTERFACE' : 'PERMISSIONS'}
                          </span>
                       </div>
                    ))}
                 </div>
              </div>

              {/* MAIN CONTENT AREA */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', overflowY: 'auto', padding: '20px 0', overflowX: 'hidden' }}>
                 <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column' }}>

                    {creatorStep === 1 && (
                       <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                          <div style={{ textAlign: 'center' }}>
                             <h2 style={{ fontSize: '28px', color: 'white', fontWeight: 'bold', margin: '0 0 10px 0', letterSpacing: '2px' }}>Define Your Workspace</h2>
                             <p style={{ color: 'gray', fontSize: '14px', margin: 0 }}>Select a popular blueprint or build from scratch.</p>
                          </div>

                          <div className="creator-template-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                             {modeTemplates.map(t => (
                                <div className="creator-template-card" key={t.id} onClick={() => applyTemplateToDraft(t)} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', ':hover': { background: 'rgba(255,255,255,0.05)' } }}>
                                   <div style={{ fontSize: '14px', color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>{t.name}</div>
                                   <div style={{ fontSize: '11px', color: 'gray', lineHeight: '1.4' }}>{t.desc}</div>
                                </div>
                             ))}
                          </div>

                          <div className="creator-identity-shell" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                             <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                   <label style={{ fontSize: '11px', color: 'gray', fontWeight: 'bold', letterSpacing: '1px' }}>MODE NAME</label>
                                   <input style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '15px', borderRadius: '8px', outline: 'none', fontSize: '14px' }} placeholder="e.g. Trading Terminal" value={creatorDraft.identity.name} onChange={e => setCreatorDraft(p => ({...p, identity: {...p.identity, name: e.target.value}}))} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                   <label style={{ fontSize: '11px', color: 'gray', fontWeight: 'bold', letterSpacing: '1px' }}>CATEGORY</label>
                                   <input style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '15px', borderRadius: '8px', outline: 'none', fontSize: '14px' }} placeholder="Finance, Code..." value={creatorDraft.identity.category} onChange={e => setCreatorDraft(p => ({...p, identity: {...p.identity, category: e.target.value}}))} />
                                </div>
                             </div>

                             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', color: 'gray', fontWeight: 'bold', letterSpacing: '1px' }}>SHORT DESCRIPTION</label>
                                <input style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '15px', borderRadius: '8px', outline: 'none', fontSize: '14px' }} placeholder="What does this mode do?" value={creatorDraft.identity.desc} onChange={e => setCreatorDraft(p => ({...p, identity: {...p.identity, desc: e.target.value}}))} />
                             </div>

                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                   <label style={{ fontSize: '11px', color: 'gray', fontWeight: 'bold', letterSpacing: '1px' }}>PRIMARY COLOR</label>
                                   <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', height: '100%' }}>
                                      {['#00d4ff', '#00ff88', '#a78bfa', '#fbbf24', '#f97316', '#ec4899', '#3b82f6', '#10b981'].map(c => (
                                         <div key={c} onClick={() => setCreatorDraft(p => ({...p, identity: {...p.identity, color: c}}))} style={{ width: '32px', height: '32px', borderRadius: '50%', background: c, cursor: 'pointer', border: creatorDraft.identity.color === c ? '2px solid white' : '2px solid transparent', boxShadow: creatorDraft.identity.color === c ? `0 0 15px ${c}` : 'none', transition: 'all 0.2s' }}></div>
                                      ))}
                                   </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                   <label style={{ fontSize: '11px', color: 'gray', fontWeight: 'bold', letterSpacing: '1px' }}>ICON CLASS</label>
                                   <input style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '15px', borderRadius: '8px', outline: 'none', fontSize: '14px' }} placeholder="e.g. lucide-rocket" value={creatorDraft.identity.icon} onChange={e => setCreatorDraft(p => ({...p, identity: {...p.identity, icon: e.target.value}}))} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                   <label style={{ fontSize: '11px', color: 'gray', fontWeight: 'bold', letterSpacing: '1px' }}>OUTPUT STYLE</label>
                                   <input style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '15px', borderRadius: '8px', outline: 'none', fontSize: '14px' }} placeholder="e.g. Analytical" value={creatorDraft.identity.outputStyle} onChange={e => setCreatorDraft(p => ({...p, identity: {...p.identity, outputStyle: e.target.value}}))} />
                                </div>
                             </div>
                          </div>
                       </div>
                    )}

                    {creatorStep === 2 && (
                       <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                          <div style={{ textAlign: 'center' }}>
                             <h2 style={{ fontSize: '28px', color: 'white', fontWeight: 'bold', margin: '0 0 10px 0', letterSpacing: '2px' }}>Core Directives</h2>
                             <p style={{ color: 'gray', fontSize: '14px', margin: 0 }}>Define how this intelligence behaves and the agents it employs.</p>
                          </div>

                          <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', color: 'gray', fontWeight: 'bold', letterSpacing: '1px' }}>MAIN PURPOSE</label>
                                <input style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '15px', borderRadius: '8px', outline: 'none', fontSize: '14px' }} value={creatorDraft.intelligence.purpose} onChange={e => setCreatorDraft(p => ({...p, intelligence: {...p.intelligence, purpose: e.target.value}}))} />
                             </div>

                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                   <label style={{ fontSize: '11px', color: 'gray', fontWeight: 'bold', letterSpacing: '1px' }}>HELP WITH (GOALS)</label>
                                   <textarea style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '15px', borderRadius: '8px', outline: 'none', fontSize: '14px', height: '100px', resize: 'none' }} value={creatorDraft.intelligence.goals} onChange={e => setCreatorDraft(p => ({...p, intelligence: {...p.intelligence, goals: e.target.value}}))} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                   <label style={{ fontSize: '11px', color: 'gray', fontWeight: 'bold', letterSpacing: '1px' }}>NEVER DO</label>
                                   <textarea style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '15px', borderRadius: '8px', outline: 'none', fontSize: '14px', height: '100px', resize: 'none' }} value={creatorDraft.intelligence.neverDo} onChange={e => setCreatorDraft(p => ({...p, intelligence: {...p.intelligence, neverDo: e.target.value}}))} />
                                </div>
                             </div>

                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                   <label style={{ fontSize: '11px', color: 'gray', fontWeight: 'bold', letterSpacing: '1px' }}>EXPERT PERSONALITY</label>
                                   <input style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '15px', borderRadius: '8px', outline: 'none', fontSize: '14px' }} value={creatorDraft.intelligence.persona} onChange={e => setCreatorDraft(p => ({...p, intelligence: {...p.intelligence, persona: e.target.value}}))} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                   <label style={{ fontSize: '11px', color: 'gray', fontWeight: 'bold', letterSpacing: '1px' }}>SUCCESS DEFINITION</label>
                                   <input style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '15px', borderRadius: '8px', outline: 'none', fontSize: '14px' }} value={creatorDraft.intelligence.successDefinition} onChange={e => setCreatorDraft(p => ({...p, intelligence: {...p.intelligence, successDefinition: e.target.value}}))} />
                                </div>
                             </div>
                          </div>

                          <div style={{ display: 'flex', gap: '30px' }}>
                             <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '12px', color: 'white', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '15px', display: 'block' }}>ASSIGN SPECIALISTS</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                                   {['Research Agent', 'Planner Agent', 'Writer Agent', 'Critic Agent', 'Executor Agent', 'Code Architect', 'Market Analyst', 'Project Manager'].map(agent => {
                                      const active = creatorDraft.intelligence.specialists.includes(agent);
                                      return (
                                         <div key={agent} onClick={() => {
                                            setCreatorDraft(p => {
                                               const current = p.intelligence.specialists;
                                               const next = active ? current.filter(a => a !== agent) : [...current, agent];
                                               return {...p, intelligence: {...p.intelligence, specialists: next}};
                                            });
                                         }} style={{ padding: '15px', background: active ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.4)', border: `1px solid ${active ? creatorDraft.identity.color : 'rgba(255,255,255,0.05)'}`, borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', boxShadow: active ? `0 0 15px ${creatorDraft.identity.color}22` : 'none' }}>
                                            <span style={{ fontSize: '12px', color: active ? 'white' : 'gray', fontWeight: active ? 'bold' : 'normal' }}>{agent}</span>
                                            {active && <span style={{ color: creatorDraft.identity.color, fontSize: '14px' }}>✓</span>}
                                         </div>
                                      );
                                   })}
                                </div>
                             </div>

                             <div style={{ width: '300px', background: 'rgba(0,0,0,0.5)', border: `1px solid ${creatorDraft.identity.color}44`, borderRadius: '16px', padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <label style={{ fontSize: '12px', color: 'gray', fontWeight: 'bold', letterSpacing: '2px', display: 'block', textAlign: 'center' }}>WORKSPACE DNA</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, justifyContent: 'center' }}>
                                   {[
                                      { label: 'Analysis', value: Math.min(100, 15 + creatorDraft.intelligence.specialists.filter(a => ['Research Agent', 'Market Analyst', 'Critic Agent'].includes(a)).length * 30) },
                                      { label: 'Execution', value: Math.min(100, 15 + creatorDraft.intelligence.specialists.filter(a => ['Executor Agent', 'Code Architect', 'Project Manager'].includes(a)).length * 30) },
                                      { label: 'Creativity', value: Math.min(100, 15 + creatorDraft.intelligence.specialists.filter(a => ['Writer Agent', 'Planner Agent'].includes(a)).length * 40) },
                                      { label: 'Automation', value: Math.min(100, 15 + creatorDraft.intelligence.specialists.filter(a => ['Executor Agent', 'Code Architect', 'Planner Agent'].includes(a)).length * 30) }
                                   ].map(stat => (
                                      <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'white', fontWeight: 'bold', letterSpacing: '1px' }}>
                                            <span>{stat.label}</span>
                                            <span style={{ color: creatorDraft.identity.color }}>{stat.value}%</span>
                                         </div>
                                         <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${stat.value}%`, background: creatorDraft.identity.color, transition: 'width 0.3s ease-out' }}></div>
                                         </div>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                       </div>
                    )}

                    {creatorStep === 3 && (
                       <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '600px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                             <div style={{ textAlign: 'left' }}>
                                <h2 style={{ fontSize: '28px', color: 'white', fontWeight: 'bold', margin: '0 0 10px 0', letterSpacing: '2px' }}>Workspace Architecture</h2>
                                <p style={{ color: 'gray', fontSize: '14px', margin: 0 }}>Drag components from the library and drop them into the layout zones.</p>
                             </div>
                             
                             <div className="creator-efficiency-card" style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${creatorDraft.identity.color}44`, padding: '10px 15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <div style={{ fontSize: '10px', color: 'gray', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '4px' }}>WORKSPACE EFFICIENCY</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                   <div style={{ fontSize: '24px', color: creatorDraft.identity.color, fontWeight: 'bold', textShadow: `0 0 10px ${creatorDraft.identity.color}66` }}>
                                      {creatorDraft.interface.components.length === 0 ? '0%' : Math.min(100, creatorDraft.interface.components.length * 20 + 20)}%
                                   </div>
                                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                      {creatorDraft.interface.components.length < 2 && <span style={{ fontSize: '9px', color: '#ef4444' }}>! Missing core panels</span>}
                                      {creatorDraft.interface.components.length >= 2 && creatorDraft.interface.components.length < 5 && <span style={{ fontSize: '9px', color: '#10b981' }}>✓ Optimal load</span>}
                                      {creatorDraft.interface.components.length >= 5 && <span style={{ fontSize: '9px', color: '#f59e0b' }}>! High cognitive load</span>}
                                   </div>
                                </div>
                             </div>
                          </div>

                          <div style={{ display: 'flex', gap: '30px', flex: 1, minHeight: 0 }}>
                             {/* Left: Library & Settings */}
                             <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="creator-config-shell" style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                   <div style={{ marginBottom: '5px' }}>
                                      <label style={{ fontSize: '11px', color: 'gray', fontWeight: 'bold', marginBottom: '8px', display: 'block', letterSpacing: '1px' }}>THEME DENSITY</label>
                                      <select className="hud-select" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: '8px', outline: 'none' }} value={creatorDraft.interface.themeDensity} onChange={e => setCreatorDraft(p => ({...p, interface: {...p.interface, themeDensity: e.target.value}}))}>
                                         <option value="compact">Compact</option>
                                         <option value="comfortable">Comfortable</option>
                                         <option value="spacious">Spacious</option>
                                      </select>
                                      <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', borderLeft: `2px solid ${creatorDraft.identity.color}` }}>
                                         <div style={{ fontSize: '10px', color: 'white', fontWeight: 'bold', marginBottom: '4px' }}>{creatorDraft.interface.themeDensity === 'compact' ? 'Compact Layout' : creatorDraft.interface.themeDensity === 'spacious' ? 'Spacious Layout' : 'Comfortable Layout'}</div>
                                         <div style={{ fontSize: '10px', color: '#10b981', display: 'flex', gap: '5px' }}><span>+</span> {creatorDraft.interface.themeDensity === 'compact' ? 'More info on screen' : creatorDraft.interface.themeDensity === 'spacious' ? 'Easy to read' : 'Balanced interface'}</div>
                                         <div style={{ fontSize: '10px', color: '#10b981', display: 'flex', gap: '5px' }}><span>+</span> {creatorDraft.interface.themeDensity === 'compact' ? 'Faster workflows' : creatorDraft.interface.themeDensity === 'spacious' ? 'Less cognitive load' : 'Standard spacing'}</div>
                                         <div style={{ fontSize: '10px', color: '#ef4444', display: 'flex', gap: '5px' }}><span>-</span> {creatorDraft.interface.themeDensity === 'compact' ? 'Smaller text' : creatorDraft.interface.themeDensity === 'spacious' ? 'More scrolling' : 'No strong specialization'}</div>
                                      </div>
                                   </div>
                                   <div>
                                      <label style={{ fontSize: '11px', color: 'gray', fontWeight: 'bold', marginBottom: '8px', display: 'block', letterSpacing: '1px' }}>ANIMATION STYLE</label>
                                      <select className="hud-select" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: '8px', outline: 'none' }} value={creatorDraft.interface.animationStyle} onChange={e => setCreatorDraft(p => ({...p, interface: {...p.interface, animationStyle: e.target.value}}))}>
                                         <option value="neural">Neural (Glow & Scanlines)</option>
                                         <option value="minimal">Minimal (Instant)</option>
                                         <option value="cinematic">Cinematic (Smooth)</option>
                                      </select>
                                      <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', borderLeft: `2px solid ${creatorDraft.identity.color}` }}>
                                         <div style={{ fontSize: '10px', color: 'white', fontWeight: 'bold', marginBottom: '4px' }}>Best For:</div>
                                         <div style={{ fontSize: '10px', color: 'gray', marginBottom: '4px' }}>{creatorDraft.interface.animationStyle === 'neural' ? '• Trading\n• Cybersecurity\n• Research' : creatorDraft.interface.animationStyle === 'minimal' ? '• Engineering\n• Data Entry\n• Fast Ops' : '• Consumer Apps\n• Marketing\n• Education'}</div>
                                         <div style={{ fontSize: '10px', color: 'white', fontWeight: 'bold', marginTop: '6px' }}>Visual Style:</div>
                                         <div style={{ fontSize: '10px', color: creatorDraft.identity.color }}>{creatorDraft.interface.animationStyle === 'neural' ? 'High-tech tactical HUD' : creatorDraft.interface.animationStyle === 'minimal' ? 'Raw utility and speed' : 'Fluid motion graphics'}</div>
                                      </div>
                                   </div>
                                </div>

                                <div className="creator-library-shell" style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>
                                   <label style={{ fontSize: '12px', color: 'white', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '15px', display: 'block' }}>COMPONENT LIBRARY</label>
                                   <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '25px', paddingRight: '10px' }}>
                                      {AI_SYSTEMS_LIBRARY.map(layer => (
                                         <div key={layer.category} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ fontSize: '10px', color: 'gray', fontWeight: 'bold', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                               <span style={{ color: creatorDraft.identity.color }}>❖</span> {layer.category}
                                            </div>
                                            {layer.items.map(comp => {
                                               const alreadyPlaced = creatorDraft.interface.components.some(c => c.type === comp.id);
                                               return (
                                                  <div key={comp.id} draggable={!alreadyPlaced} onDragStart={(e) => e.dataTransfer.setData('text/plain', comp.id)} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${alreadyPlaced ? 'rgba(255,255,255,0.05)' : creatorDraft.identity.color}`, borderRadius: '8px', cursor: alreadyPlaced ? 'not-allowed' : 'grab', opacity: alreadyPlaced ? 0.3 : 1, transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                           <span style={{ color: creatorDraft.identity.color, opacity: 0.5 }}>≡</span>
                                                           <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>{comp.id}</span>
                                                        </div>
                                                        <span style={{ fontSize: '9px', color: '#f59e0b', letterSpacing: '1px' }}>{comp.score}</span>
                                                     </div>
                                                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'gray' }}>
                                                        <span>Used in {comp.usedIn}</span>
                                                        <span style={{ color: comp.cost === 'Low' ? '#10b981' : comp.cost === 'Medium' ? '#f59e0b' : '#ef4444' }}>Cost: {comp.cost}</span>
                                                     </div>
                                                     <div style={{ fontSize: '9px', color: creatorDraft.identity.color, marginTop: '2px', fontWeight: 'bold' }}>✦ {comp.feature}</div>
                                                  </div>
                                               );
                                            })}
                                         </div>
                                      ))}
                                   </div>
                                </div>
                             </div>

                             {/* Right: The Grid */}
                             <div className="creator-zone-shell" style={{ flex: 1, background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', position: 'relative' }}>
                                <div className="layout-dashboard-mock" style={{ width: '100%', height: '100%', border: 'none', background: 'transparent' }}>
                                  {['Top Status Bar', 'Left Sidebar', 'Main Workspace', 'Right Inspector', 'Bottom Console'].map((zone) => {
                                    const zoneClass =
                                      zone === 'Top Status Bar' ? 'zone-top' :
                                      zone === 'Left Sidebar' ? 'zone-left' :
                                      zone === 'Main Workspace' ? 'zone-center' :
                                      zone === 'Right Inspector' ? 'zone-right' : 'zone-bottom';

                                    const zoneComponents = creatorDraft.interface.components
                                      .filter(c => c.zone === zone)
                                      .sort((a, b) => a.index - b.index);

                                    return (
                                      <div
                                        key={zone}
                                        className={`zone ${zoneClass}`}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          const compType = e.dataTransfer.getData('text/plain');
                                          if (compType) handleAddComponentToZone(compType, zone);
                                        }}
                                        style={{ borderColor: `${creatorDraft.identity.color}33`, background: `${creatorDraft.identity.color}05`, borderRadius: '8px' }}
                                      >
                                        <div className="zone-label" style={{ background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px' }}>{zone}</div>
                                        <div className="zone-components-list">
                                          {zoneComponents.length === 0 && <div className="zone-empty-copy" style={{ opacity: 0.5 }}>Drop here</div>}
                                          {zoneComponents.map((c) => (
                                            <div key={c.type} className={`zone-component-card-visual`} style={{ border: `1px solid ${creatorDraft.identity.color}44`, background: `rgba(0, 0, 0, 0.6)`, borderRadius: '6px' }}>
                                              <div className="visual-card-header" style={{ borderBottom: `1px solid ${creatorDraft.identity.color}22` }}>
                                                <span className="visual-card-title" style={{ fontSize: '10px' }}>{c.type.toUpperCase()}</span>
                                                <button type="button" className="zone-component-remove" onClick={() => handleRemoveComponent(c.type)}>✕</button>
                                              </div>
                                              <div className="visual-card-preview-area" style={{ padding: '10px' }}><MiniPreview type={c.type} color={creatorDraft.identity.color} /></div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                             </div>
                          </div>
                       </div>
                    )}

                    {creatorStep === 4 && (
                       <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                          <div style={{ textAlign: 'center' }}>
                             <h2 style={{ fontSize: '28px', color: 'white', fontWeight: 'bold', margin: '0 0 10px 0', letterSpacing: '2px' }}>System Capabilities</h2>
                             <p style={{ color: 'gray', fontSize: '14px', margin: 0 }}>Grant access to local computing resources and web services.</p>
                          </div>

                          <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '30px' }}>
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                {[
                                   { id: 'internetAccess', label: 'Web Search', risk: 'Safe' },
                                   { id: 'fileSystem', label: 'File System', risk: 'Needs Approval' },
                                   { id: 'screenCapture', label: 'Screen Vision', risk: 'Needs Approval' },
                                   { id: 'camera', label: 'Camera', risk: 'Dangerous' },
                                   { id: 'microphone', label: 'Microphone', risk: 'Needs Approval' },
                                   { id: 'clipboard', label: 'Clipboard', risk: 'Safe' },
                                   { id: 'shellExecution', label: 'Terminal', risk: 'Dangerous' },
                                   { id: 'computerUse', label: 'Computer Use', risk: 'Dangerous' },
                                   { id: 'memory', label: 'Memory', risk: 'Safe' },
                                   { id: 'calendar', label: 'Calendar', risk: 'Needs Approval' },
                                   { id: 'email', label: 'Email', risk: 'Dangerous' },
                                   { id: 'charts', label: 'Charts', risk: 'Safe' },
                                   { id: 'apiKeys', label: 'API Keys', risk: 'Dangerous' }
                                ].map(perm => (
                                   <div key={perm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '15px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                      <div>
                                         <div style={{ fontSize: '14px', color: 'white', fontWeight: 'bold' }}>{perm.label}</div>
                                         <div style={{ fontSize: '11px', color: perm.risk === 'Dangerous' ? '#ef4444' : perm.risk === 'Needs Approval' ? '#f59e0b' : '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: perm.risk === 'Dangerous' ? '#ef4444' : perm.risk === 'Needs Approval' ? '#f59e0b' : '#10b981' }}></div>
                                            {perm.risk}
                                         </div>
                                      </div>
                                      <Toggle checked={creatorDraft.permissions[perm.id] || false} onChange={val => setCreatorDraft(p => ({...p, permissions: {...p.permissions, [perm.id]: val}}))} />
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    )}

                 </div>
              </div>

              {/* FOOTER */}
              <div className="creator-footer-shell" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px', background: 'rgba(0,0,0,0.8)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                 <button className="wiz-btn-back" style={{ visibility: creatorStep > 1 ? 'visible' : 'hidden', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', transition: 'all 0.2s' }} onClick={() => setCreatorStep(creatorStep - 1)}>BACK</button>
                 <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <button style={{ background: 'transparent', color: 'gray', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>SAVE DRAFT</button>
                    {creatorStep < 4 ? (
                       <button className="wiz-btn-next" style={{ background: 'white', color: 'black', border: 'none', padding: '12px 30px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', transition: 'all 0.2s' }} onClick={() => setCreatorStep(creatorStep + 1)}>NEXT STEP</button>
                    ) : (
                       <button className="wiz-btn-create" style={{ background: creatorDraft.identity.color, color: 'black', fontWeight: 'bold', border: 'none', padding: '12px 30px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', letterSpacing: '1px', boxShadow: `0 0 20px ${creatorDraft.identity.color}66` }} onClick={manifestMode}>MANIFEST MODE</button>
                    )}
                 </div>
              </div>

            </div>
          )}

          {activePage === 'mymodes' && (
            <div className="page active">
              <div className="page-title">MY CUSTOM MODES</div>
              <div className="page-sub">Your personally created specialist modes</div>
              <Section title="EXPERIMENTAL LABS">
                {experimentalCoreModes.map((mode) => (
                  <div className="custom-mode-card" key={mode.id}>
                    <span className="mode-color-dot" style={{ background: '#1d4ed8', boxShadow: '0 0 5px #1d4ed8' }} />
                    <div className="mode-card-copy">
                      <div className="mode-card-name">{mode.name}</div>
                      <div className="mode-card-desc">{mode.desc}</div>
                      <div className="mode-card-meta">BUILT-IN MODE · CANNOT BE DELETED</div>
                    </div>
                    <div className="mode-card-actions">
                      <button
                        type="button"
                        className="mode-action-btn"
                        onClick={() => toggleCoreModeEnabled(mode.id)}
                      >
                        {coreModeVisibility?.[mode.id] ? 'DISABLE' : 'ENABLE'}
                      </button>
                    </div>
                  </div>
                ))}
              </Section>
              <Section title="ACTIVE CUSTOM MODES">
                {localModes.map((mode) => (
                  <div className="custom-mode-card" key={mode.id}>
                    <span className="mode-color-dot" style={{ background: mode.color, boxShadow: `0 0 5px ${mode.color}` }} />
                    <div className="mode-card-copy">
                      <div className="mode-card-name">{mode.name}</div>
                      <div className="mode-card-desc">{mode.desc}</div>
                      <div className="mode-card-meta">{mode.capabilities.join(' / ')}</div>
                    </div>
                    <div className="mode-card-actions">
                      <button
                        type="button"
                        className="mode-action-btn"
                        onClick={() => toggleModeEnabled(mode.id)}
                      >
                        {mode.enabled ? 'DISABLE' : 'ENABLE'}
                      </button>
                      <button
                        type="button"
                        className="mode-action-btn"
                        onClick={() => duplicateCustomMode(mode.id)}
                      >
                        DUPLICATE
                      </button>
                      <button
                        type="button"
                        className="mode-action-btn"
                        onClick={() => exportCustomMode(mode.id)}
                      >
                        EXPORT
                      </button>
                      <button
                        type="button"
                        className="mode-action-btn"
                        onClick={() => deleteCustomMode(mode.id)}
                        style={{ color: '#ff3366', borderColor: 'rgba(255,51,102,0.2)' }}
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="create-mode-link" onClick={() => setActivePage('creator')} style={{ flex: 1, textAlign: 'center' }}>+ CREATE NEW MODE</button>
                  <label className="create-mode-link" style={{ flex: 1, textAlign: 'center', cursor: 'pointer', margin: 0 }}>
                    + IMPORT MODE
                    <input type="file" accept=".json" style={{ display: 'none' }} onChange={importCustomMode} />
                  </label>
                </div>
              </Section>
              <Section title="QUICK START TEMPLATES">
                <div className="template-list-compact">
                  {modeTemplates.slice(0, 4).map((template) => (
                    <button
                      type="button"
                      className="template-chip"
                      key={template.id}
                      onClick={() => applyTemplateToDraft(template)}
                    >
                      <span style={{ background: template.color }} />
                      {template.name}
                    </button>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {activePage === 'voice' && (
            <div className="page active">
              <div className="page-title">VOICE & WAKE</div>
              <div className="page-sub">Tune voice activation and command capture</div>
              <Section title="VOICE CONFIGURATION">
                <SettingRow name="VOICE ACTOR" desc="Select the voice persona for ZAIRE's verbal responses">
                  <select id="settings-voice-actor" name="settings-voice-actor" className="hud-select" value={voiceActor} onChange={(e) => setVoiceActor(e.target.value)}>
                    <option>Nova</option>
                    <option>Echo</option>
                    <option>Alloy</option>
                    <option>Onyx</option>
                    <option>Shimmer</option>
                  </select>
                </SettingRow>
              </Section>
              <Section title="WAKE DETECTION">
                <SettingRow name="VOICE WAKE WORD" desc="Sensitivity for ZAIRE wake detection">
                  <Slider min={0} max={100} step={1} value={voiceWake} onChange={setVoiceWake} />
                </SettingRow>
                <SettingRow name="AMBIENT NOISE REJECTION" desc="Filter background audio before command parsing">
                  <Toggle checked={ambientNoise} onChange={setAmbientNoise} />
                </SettingRow>
              </Section>
            </div>
          )}

          {activePage === 'personalize' && (
            <div className="page active">
              <div className="page-title">PERSONALIZATION</div>
              <div className="page-sub">Customize ZAIRE's conversational identity and user context</div>
              
              <Section title="AI IDENTITY">
                <SettingRow name="BASE STYLE & TONE" desc="How ZAIRE should fundamentally sound">
                  <input
                    id="settings-base-tone"
                    name="settings-base-tone"
                    type="text"
                    className="creator-input"
                    value={baseTone}
                    onChange={(e) => setBaseTone(e.target.value)}
                    placeholder="e.g., Default, Professional, Casual"
                  />
                </SettingRow>
                <SettingRow name="CHARACTERISTICS" desc="Select the defining traits of the responses">
                  <select id="settings-characteristics" name="settings-characteristics" className="hud-select" value={characteristics} onChange={(e) => setCharacteristics(e.target.value)}>
                    <option>Warm (Default)</option>
                    <option>Enthusiastic (Default)</option>
                    <option>Emoji (Default)</option>
                    <option>Analytical</option>
                    <option>Direct</option>
                  </select>
                </SettingRow>
                <SettingRow name="FAST ANSWERS" desc="Prefer shorter, direct responses over detailed reasoning">
                  <Toggle checked={fastAnswers} onChange={setFastAnswers} />
                </SettingRow>
              </Section>

              <Section title="CUSTOM INSTRUCTIONS">
                <SettingRow name="INSTRUCTIONS FOR ZAIRE" desc="Global rules for behavior (max 1000 words)">
                  <textarea
                    id="settings-zaire-instructions"
                    name="settings-zaire-instructions"
                    className="creator-textarea"
                    value={zaireInstructions}
                    onChange={(e) => setZaireInstructions(e.target.value)}
                    placeholder="Enter custom instructions..."
                    rows={4}
                  />
                </SettingRow>
              </Section>

              <Section title="ABOUT YOU">
                <SettingRow name="NAME" desc="What ZAIRE should call you">
                  <input
                    id="settings-user-name"
                    name="settings-user-name"
                    type="text"
                    className="creator-input"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Your Name"
                  />
                </SettingRow>
                <SettingRow name="OCCUPATION" desc="Your professional context">
                  <input
                    id="settings-user-occupation"
                    name="settings-user-occupation"
                    type="text"
                    className="creator-input"
                    value={userOccupation}
                    onChange={(e) => setUserOccupation(e.target.value)}
                    placeholder="Your Occupation"
                  />
                </SettingRow>
                <SettingRow name="MORE ABOUT YOU" desc="Additional context ZAIRE should know">
                  <textarea
                    id="settings-user-about"
                    name="settings-user-about"
                    className="creator-textarea"
                    value={userAbout}
                    onChange={(e) => setUserAbout(e.target.value)}
                    placeholder="Hobbies, goals, preferences..."
                    rows={3}
                  />
                </SettingRow>
              </Section>
            </div>
          )}

          {activePage === 'security' && (
            <div className="page active">
              <div className="page-title">PROTECTION</div>
              <div className="page-sub">Biometric and permission controls</div>
              <Section title="BIOMETRIC PROTECTION">
                <SettingRow name="FACIAL SCAN CONFIDENCE" desc="Strictness of biometric identity verification">
                  <Slider min={50} max={100} step={1} value={faceConfidence} onChange={setFaceConfidence} />
                </SettingRow>
                <SettingRow name="INTRUDER SNAPSHOT" desc="Auto-capture camera feed on failed authentication">
                  <Toggle checked={intruderSnapshot} onChange={setIntruderSnapshot} />
                </SettingRow>
                <div style={{ margin: '15px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}></div>
                <SettingRow name="FULLY DISABLE SECURITY" desc="Turn off all biometric scanning and locking">
                  <Toggle
                    checked={biometricData?.disabled || false}
                    onChange={(val) => {
                      if (window.toggleSecuritySystem) {
                        window.toggleSecuritySystem(val);
                      }
                    }}
                  />
                </SettingRow>
              </Section>
            </div>
          )}

          {activePage === 'briefing' && (
            <div className="page active">
              <div className="page-title">WEEKLY BRIEFINGS</div>
              <div className="page-sub">Auto-generated intelligence reports on your system usage and progress</div>
              
              <Section title="MANUAL TRIGGER">
                <SettingRow name="GENERATE NOW" desc="Force an immediate compilation of your weekly briefing">
                  <button className="footer-btn footer-btn-save" onClick={generateBriefing} disabled={briefingsLoading}>
                    {briefingsLoading ? 'GENERATING...' : 'COMPILE BRIEFING'}
                  </button>
                </SettingRow>
              </Section>
              
              <Section title="DASHBOARD ARCHIVE">
                {briefingsLoading ? (
                  <div className="memory-action-status">Syncing archive...</div>
                ) : briefingsData.length === 0 ? (
                  <div className="memory-empty-copy">No briefings generated yet.</div>
                ) : (
                  <div className="memory-search-results">
                    {briefingsData.map((b) => (
                      <div className="memory-result-card" key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div className="memory-result-meta">
                            <span>{new Date(b.created_at).toLocaleString()}</span>
                            <span>STATUS: {b.status.toUpperCase()}</span>
                          </div>
                          <div className="memory-result-text" style={{ marginTop: '8px' }}>
                            {b.summary ? b.summary.substring(0, 100) + '...' : 'Awaiting compilation...'}
                          </div>
                        </div>
                        {b.status === 'finished' && (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            {b.pdf_url && (
                              <button className="footer-btn" onClick={() => openBriefingAsset(b.pdf_url)}>
                                VIEW PDF
                              </button>
                            )}
                            {b.audio_url && (
                              <button className="footer-btn" onClick={() => openBriefingAsset(b.audio_url)}>
                                PLAY AUDIO
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>
          )}

          {activePage === 'memory' && (
            <div className="page active">
              <div className="page-title">MEMORY</div>
              <div className="page-sub">Manage retention, search, selective wipe controls, and privacy boundaries</div>
              <Section title="MEMORY STATS">
                <div className="memory-stats-grid">
                  <div className="memory-stat-card">
                    <div className="memory-stat-label">TOTAL MEMORY OBJECTS</div>
                    <div className="memory-stat-value">
                      {memoryDashboardLoading ? 'SYNCING...' : `${memoryDashboard?.stats?.factsCount || 0} FACTS`}
                    </div>
                    <div className="memory-stat-meta">{estimateMemoryStatsLabel(memoryDashboard)}</div>
                  </div>
                  <div className="memory-stat-card">
                    <div className="memory-stat-label">OLDEST MEMORY</div>
                    <div className="memory-stat-value memory-stat-value-small">
                      {memoryDashboardLoading ? 'SYNCING...' : formatMemoryOldestDate(memoryDashboard?.stats?.oldestMemoryDate)}
                    </div>
                    <div className="memory-stat-meta">
                      {memoryDashboard?.stats?.studyCount || 0} STUDY · {memoryDashboard?.stats?.tradeCount || 0} TRADE · {memoryDashboard?.stats?.visualEchoCount || 0} GAZE
                    </div>
                  </div>
                  <div className="memory-stat-card">
                    <div className="memory-stat-label">STORAGE USED</div>
                    <div className="memory-stat-value">{memoryDashboardLoading ? 'SYNCING...' : (memoryDashboard?.stats?.storageUsedLabel || '0 KB')}</div>
                    <div className="memory-stat-meta">Disk-backed long-term memory footprint</div>
                  </div>
                </div>
              </Section>
              <Section title="RECALL CONFIGURATION">
                <SettingRow name="CONTEXT RETENTION" desc="How much session context ZAIRE keeps active">
                  <Slider min={10} max={100} step={5} value={memoryDepth} onChange={setMemoryDepth} />
                </SettingRow>
                <SettingRow name="RETENTION PERIOD" desc="How long stored memory remains eligible for recall">
                  <select className="hud-select" value={retentionPeriod} onChange={(e) => setRetentionPeriod(e.target.value)}>
                    <option>7 days</option>
                    <option>30 days</option>
                    <option>90 days</option>
                    <option>Forever</option>
                  </select>
                </SettingRow>
                <SettingRow name="GAZE MEMORY" desc="Store screenshot summaries every 5 minutes when active">
                  <Toggle checked={gazeMemoryEnabled} onChange={setGazeMemoryEnabled} />
                </SettingRow>
                <SettingRow name="CROSS-MODE SHARING" desc="Allow all modes to draw from one shared memory pool">
                  <Toggle checked={crossModeSharing} onChange={setCrossModeSharing} />
                </SettingRow>
                <SettingRow name="PRIVATE SESSION MODE" desc="Temporarily disable persistent memory writes">
                  <Toggle checked={privateSession} onChange={setPrivateSession} />
                </SettingRow>
              </Section>
              <Section title="MEMORY SEARCH">
                <div className="memory-search-stack">
                  <input
                    id="memory-search-input"
                    name="memory-search-input"
                    className="custom-api-input memory-search-input"
                    placeholder="Query stored memories, tags, or facts..."
                    value={memorySearchQuery}
                    onChange={(e) => setMemorySearchQuery(e.target.value)}
                  />
                  <div className="memory-search-results">
                    {filteredMemoryResults.length === 0 ? (
                      <div className="memory-empty-copy">
                        {memoryDashboardLoading ? 'Synchronizing memory core...' : 'No matching stored memories found.'}
                      </div>
                    ) : (
                      filteredMemoryResults.map((memory) => (
                        <div className="memory-result-card" key={memory.id}>
                          <div className="memory-result-meta">
                            <span>{memory.displayDate || 'UNKNOWN DATE'}</span>
                            <span>{(memory.tags || []).slice(0, 3).join(' · ') || 'GENERAL'}</span>
                          </div>
                          <div className="memory-result-text">{memory.text}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Section>
              <Section title="SELECTIVE FORGET">
                <div className="memory-wipe-actions">
                  <button type="button" className="footer-btn footer-btn-dismiss memory-action-btn" onClick={() => clearMemoryDomain('study', 'Clear Study History')}>
                    CLEAR STUDY HISTORY
                  </button>
                  <button type="button" className="footer-btn footer-btn-dismiss memory-action-btn" onClick={() => clearMemoryDomain('trade', 'Clear Trade History')}>
                    CLEAR TRADE HISTORY
                  </button>
                  <button type="button" className="footer-btn footer-btn-reset memory-action-btn" onClick={() => clearMemoryDomain('full', 'Full Neural Wipe')}>
                    FULL NEURAL WIPE
                  </button>
                </div>
                <div className="memory-action-status">{memoryActionStatus || 'Selective wipe controls target study, trade, and full long-term memory domains.'}</div>
              </Section>
            </div>
          )}

          {activePage === 'licensing' && (
            <div className="page active">
              <div className="page-title">LICENSING & DEPLOYED DEVICES</div>
              <div className="page-sub">Verify subscription authority and manage hardware nodes</div>
              <Section title="LICENSE ACTIVATION">
                <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
                  <input
                    id="settings-license-key"
                    name="settings-license-key"
                    className="wf-input"
                    placeholder="e.g. ZAIRE-XXXX-XXXX-XXXX-XXXX"
                    value={licenseKeyInput}
                    onChange={(e) => setLicenseKeyInput(e.target.value)}
                    style={{ flex: 1, textTransform: 'uppercase', fontFamily: 'Courier New', fontWeight: 'bold', fontSize: 13 }}
                  />
                  <button type="button" className="footer-btn footer-btn-apply" style={{ padding: '0 20px', height: 35 }} onClick={activateNewKey}>
                    ACTIVATE
                  </button>
                </div>
                {licensingError && (
                  <div style={{ color: '#ff3333', fontSize: '12px', fontFamily: 'Courier New', marginBottom: 15 }}>
                    FAIL_ERROR: {licensingError === 'INVALID_KEY' ? 'INVALID OR ACTIVE SLOTS DEPLETED' : licensingError}
                  </div>
                )}
                {licensingLoading && (
                  <div style={{ color: '#00f2ff', fontSize: '12px', fontFamily: 'Courier New', marginBottom: 15 }}>
                    ESTABLISHING SECURE PORTAL DEPLOYMENT…
                  </div>
                )}
              </Section>

              {licensingInfo ? (
                <>
                  <Section title="SUBSCRIPTION MATRIX">
                    <SettingRow name="PLAN PROFILE" desc="Current operational authority level">
                      <span className="api-status connected">{licensingInfo.plan?.toUpperCase()}</span>
                    </SettingRow>
                    <SettingRow name="USER INTEGRITY EMAIL" desc="Authorized account linked to licensing">
                      <span style={{ color: '#ffffff', fontFamily: 'Courier New', fontSize: 12 }}>{licensingInfo.user_email}</span>
                    </SettingRow>
                    <SettingRow name="EXPIRY SCHEDULE" desc="Subscription expiration deadline">
                      <span style={{ color: '#fbbf24', fontFamily: 'Courier New', fontSize: 12 }}>
                        {formatLicenseTimestamp(licensingInfo.expiry, 'PERPETUAL CORES')}
                      </span>
                    </SettingRow>
                  </Section>

                  <Section title="API USAGE & METRICS">
                    <SettingRow name="MONTHLY REQUESTS" desc="Volume of backend model generation consumed">
                      <span style={{ color: '#00d4ff', fontFamily: 'Courier New', fontSize: 12 }}>
                        {licensingInfo.monthly_requests} / {licensingInfo.request_limit === 0 ? 'BYOK ONLY' : licensingInfo.request_limit}
                      </span>
                    </SettingRow>
                    <div style={{ marginTop: 10, padding: 10, border: '1px solid rgba(0,212,255,0.2)', background: 'rgba(0,0,0,0.5)', fontSize: 11, color: '#aaa', fontFamily: 'Courier New' }}>
                      {licensingInfo.request_limit === 0 ? (
                        <span style={{ color: '#fbbf24' }}>WARNING: Initiate Tier. You must supply your own API keys in the AI Vault to use ZAIRE OS. No managed requests available.</span>
                      ) : (
                        `You have consumed ${((licensingInfo.monthly_requests / licensingInfo.request_limit) * 100).toFixed(1)}% of your monthly AI quota. To lower costs, provide your own keys in AI Vault.`
                      )}
                    </div>
                  </Section>

                  <Section title="DEPLOYED HARDWARE CORES">
                    {licensingInfo.machines && licensingInfo.machines.length > 0 ? (
                      <div className="license-machine-list">
                        {licensingInfo.machines.map((m) => (
                          <div key={m.machine_id} className="license-machine-card">
                            <div className="license-machine-info">
                              <div className="license-machine-name">
                                {m.machine_name} {m.machine_id === 'BROWSER_HUD' ? '(Console)' : ''}
                              </div>
                              <div className="license-machine-meta">
                                OS: {m.os_version} | ID: {m.machine_id?.substring(0, 12)}...
                              </div>
                              <div className="license-machine-last-active">
                                LAST ACTIVE: {formatLicenseTimestamp(m.last_seen, 'Never')}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => deactivateDevice(m.machine_id)}
                              className="deactivate-device-btn"
                            >
                              DEACTIVATE
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#888', fontSize: '12px', fontStyle: 'italic' }}>
                        No physical client cores deployed. Validate on your desktop system to register.
                      </div>
                    )}
                  </Section>
                </>
              ) : (
                <div style={{ color: '#888', fontSize: 12, fontStyle: 'italic', padding: '10px 0' }}>
                  ZAIRE HUD is currently locked to Standard Free Trial capabilities. Activate a premium license to deploy Advanced Multi-Modes.
                </div>
              )}
            </div>
          )}

          {activePage === 'notif' && (
            <div className="page active">
              <div className="page-title">ALERTS</div>
              <div className="page-sub">Configure event urgency and notification surfaces</div>
              <Section title="ALERT ROUTING">
                <SettingRow name="ALERT LEVEL" desc="Default threshold for proactive notifications">
                  <Segment value={alertLevel} options={['QUIET', 'TACTICAL', 'LOUD']} onChange={setAlertLevel} />
                </SettingRow>
                <SettingRow name="MISSION DIGEST" desc="Summarize key events at the end of each session">
                  <Toggle checked={missionDigest} onChange={setMissionDigest} />
                </SettingRow>
              </Section>
            </div>
          )}
        </main>

        <footer className="settings-footer">
          <div className="footer-status">CORE_SYNC: ACTIVE // VER: 1.0</div>
          <div className="footer-btns">
            <button
              type="button"
              className="footer-btn footer-btn-reset"
              onClick={factoryReset}
            >
              FACTORY RESET
            </button>
            <button type="button" className="footer-btn footer-btn-dismiss" onClick={onClose}>DISMISS</button>
            <button
              type="button"
              className="footer-btn footer-btn-apply"
              onClick={applyCoreSync}
            >
              APPLY CORE_SYNC
            </button>
          </div>
        </footer>
      </div>
    </>
  );
  return renderView;
}

function SettingsModal(props) {
  const renderView = useSettingsModalController(props);
  return renderView();
}

export default SettingsModal;
