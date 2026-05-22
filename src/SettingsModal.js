import React, { useCallback, useEffect, useReducer } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { ZaireComponentRegistry } from './engine/ComponentRegistry';
import './SettingsModal.css';

const API_URL = process.env.REACT_APP_API_URL;
const MODE_STORAGE_KEY = 'zaire_custom_modes_v1';
const COMPONENT_LIBRARY = ZaireComponentRegistry;
const CUSTOM_MODE_LOCKED_ZONES = ['Bottom Console'];

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
  responseDepth: 'TURBO',
  voiceWake: 85,
  faceConfidence: 92,
  intruderSnapshot: true,
  memoryDepth: 60,
  alertLevel: 'TACTICAL',
  neuralDarwinism: true,
  ambientNoise: true,
  privateSession: false,
  missionDigest: true,
  selectedTemplateId: 'lawyer',
  creatorStep: 1
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
  licensingLoading: false
});

const createReducerFieldSetter = (dispatch, field) => (value) => {
  dispatch({ type: 'SET_FIELD', field, value });
};

function MiniPreview({ type, color = '#00d4ff' }) {
  const accentStyle = { color: color };
  const fillStyle = { background: color };
  const borderStyle = { borderColor: color };

  switch (type) {
    case 'Chat Panel':
      return (
        <div className="mini-chat-mock" style={borderStyle}>
          <div className="mini-bubble user" style={{ background: 'rgba(255,255,255,0.07)' }} />
          <div className="mini-bubble ai" style={{ background: `${color}15`, border: `1px solid ${color}33` }} />
          <div className="mini-chat-input-line" style={{ borderTop: `1px solid ${color}22` }} />
        </div>
      );
    case 'Task Queue':
      return (
        <div className="mini-queue-mock">
          <div className="mini-progress-row">
            <span className="dot" style={fillStyle} />
            <div className="bar"><div className="fill" style={{ width: '70%', background: color }} /></div>
          </div>
          <div className="mini-progress-row">
            <span className="dot" style={{ background: 'rgba(255,255,255,0.2)' }} />
            <div className="bar"><div className="fill" style={{ width: '35%', background: color }} /></div>
          </div>
        </div>
      );
    case 'File Browser':
      return (
        <div className="mini-files-mock">
          <div className="row" style={accentStyle}>📁 src</div>
          <div className="row indent">📄 App.js</div>
          <div className="row indent">📄 index.js</div>
        </div>
      );
    case 'Live Preview':
      return (
        <div className="mini-preview-mock" style={borderStyle}>
          <div className="mini-browser-bar" style={{ background: `${color}15`, borderBottom: `1px solid ${color}33` }}>
            <span className="dot" style={fillStyle} /><span className="dot" />
          </div>
          <div className="mini-browser-body" />
        </div>
      );
    case 'Notes Panel':
      return (
        <div className="mini-notes-mock" style={borderStyle}>
          <div className="scribble" />
          <div className="scribble" style={{ width: '70%' }} />
          <div className="scribble" style={{ width: '40%' }} />
        </div>
      );
    case 'Memory Panel':
      return (
        <div className="mini-memory-mock">
          <div className="vector-node" style={{ border: `1px solid ${color}` }}>VECTOR LINK</div>
          <div className="vector-bars">
            <div className="v-bar" style={fillStyle} />
            <div className="v-bar" style={fillStyle} />
            <div className="v-bar" style={{ background: 'rgba(255,255,255,0.1)' }} />
          </div>
        </div>
      );
    case 'Calendar Panel':
      return (
        <div className="mini-calendar-mock">
          <div className="cal-grid">
            {['slot-01', 'slot-02', 'slot-03', 'slot-04', 'slot-05', 'slot-06', 'slot-07', 'slot-08', 'slot-09', 'slot-10', 'slot-11', 'slot-12'].map((cellId, i) => (
              <div key={cellId} className={`cal-cell ${i === 4 ? 'active' : ''}`} style={i === 4 ? fillStyle : undefined} />
            ))}
          </div>
        </div>
      );
    case 'Chart Panel':
      return (
        <div className="mini-chart-mock">
          <div className="bar" style={{ height: '40%', background: color }} />
          <div className="bar" style={{ height: '75%', background: color }} />
          <div className="bar" style={{ height: '50%', background: color }} />
          <div className="bar" style={{ height: '90%', background: color }} />
        </div>
      );
    case 'Camera Feed':
      return (
        <div className="mini-camera-mock" style={borderStyle}>
          <div className="reticle" style={{ border: `1px dashed ${color}` }} />
          <span className="rec" style={accentStyle}>● REC</span>
        </div>
      );
    case 'Voice Panel':
      return (
        <div className="mini-voice-mock">
          <div className="wave" style={{ height: '6px', background: color }} />
          <div className="wave" style={{ height: '14px', background: color }} />
          <div className="wave" style={{ height: '9px', background: color }} />
          <div className="wave" style={{ height: '18px', background: color }} />
          <div className="wave" style={{ height: '5px', background: color }} />
        </div>
      );
    case 'Terminal':
      return (
        <div className="mini-terminal-mock" style={{ background: 'rgba(0,0,0,0.8)', border: `1px solid ${color}44` }}>
          <span className="prompt" style={accentStyle}>$&gt;</span>
          <span className="cursor blink" style={fillStyle} />
        </div>
      );
    case 'Code Editor':
      return (
        <div className="mini-code-mock">
          <div className="line" style={{ width: '90%', background: color, opacity: 0.8 }} />
          <div className="line" style={{ width: '60%', background: color, opacity: 0.8 }} />
          <div className="line" style={{ width: '75%', background: color, opacity: 0.8 }} />
        </div>
      );
    case 'Kanban Board':
      return (
        <div className="mini-kanban-mock">
          <div className="lane" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="card" style={{ borderLeft: `2px solid ${color}` }} />
          </div>
          <div className="lane">
            <div className="card" style={{ borderLeft: `2px solid ${color}` }} />
          </div>
        </div>
      );
    case 'Timeline':
      return (
        <div className="mini-timeline-mock">
          <span className="node" style={fillStyle} />
          <div className="connector" style={{ background: color }} />
          <span className="node" style={{ border: `1px solid ${color}` }} />
        </div>
      );
    case 'Research Panel':
      return (
        <div className="mini-research-mock">
          <div className="ticker-line" style={{ background: `${color}15`, color: color }}>NEWS // GLOBAL SCAN</div>
          <div className="ticker-bar" />
        </div>
      );
    case 'Health Tracker':
      return (
        <div className="mini-health-mock">
          <span className="pulse-heart" style={accentStyle}>♥</span>
          <span className="status-val" style={accentStyle}>99.2%</span>
        </div>
      );
    case 'Finance Panel':
      return (
        <div className="mini-finance-mock">
          <div className="val" style={accentStyle}>$48K</div>
          <div className="sub-val" style={{ color: 'var(--accent-red)' }}>-$0.24</div>
        </div>
      );
    case 'Document Viewer':
      return (
        <div className="mini-doc-mock" style={borderStyle}>
          <div className="doc-header" style={{ background: `${color}22` }}>PDF</div>
          <div className="doc-body" />
        </div>
      );
    case 'System Logs':
      return (
        <div className="mini-logs-mock" style={{ fontFamily: 'monospace', color: color }}>
          <div>[09:12] OK</div>
          <div>[09:13] VAULT</div>
        </div>
      );
    case 'Agent Status':
      return (
        <div className="mini-status-mock">
          <div className="badge" style={{ background: `${color}15`, border: `1px solid ${color}`, color: color }}>🤖 ON</div>
        </div>
      );
    default:
      return null;
  }
}

const modeTemplates = [
  {
    id: 'lawyer',
    color: '#60a5fa',
    name: 'LAWYER MODE',
    desc: 'Reviews contracts, summarizes legal risk, and prepares negotiation notes',
    capabilities: ['WEB SEARCH', 'FILE SYSTEM', 'SCREEN VISION'],
    persona: 'Precise, cautious, citation-first',
  },
  {
    id: 'doctor',
    color: '#34d399',
    name: 'DOCTOR MODE',
    desc: 'Organizes symptoms, appointment notes, medications, and health questions',
    capabilities: ['WEB SEARCH', 'FILE SYSTEM', 'SCREEN VISION'],
    persona: 'Careful, calm, safety-aware',
  },
  {
    id: 'fitness',
    color: '#fb7185',
    name: 'FITNESS COACH',
    desc: 'Plans workouts, tracks meals, sleep, recovery, and daily discipline',
    capabilities: ['FILE SYSTEM', 'CHARTS'],
    persona: 'Direct, motivating, habit-focused',
  },
  {
    id: 'therapist',
    color: '#c084fc',
    name: 'THERAPIST MODE',
    desc: 'Reflects mood patterns, journaling themes, and grounding routines',
    capabilities: ['FILE SYSTEM'],
    persona: 'Warm, reflective, non-judgmental',
  },
  {
    id: 'chef',
    color: '#f97316',
    name: 'CHEF MODE',
    desc: 'Builds meal plans, recipes, pantry lists, and nutrition-aware menus',
    capabilities: ['WEB SEARCH', 'FILE SYSTEM', 'IMAGE GEN'],
    persona: 'Creative, practical, taste-led',
  },
  {
    id: 'language',
    color: '#22d3ee',
    name: 'LANGUAGE TEACHER',
    desc: 'Creates lessons, quizzes, pronunciation drills, and immersion plans',
    capabilities: ['WEB SEARCH', 'FILE SYSTEM'],
    persona: 'Patient, structured, correction-friendly',
  },
  {
    id: 'financial',
    color: '#facc15',
    name: 'FINANCIAL PLANNER',
    desc: 'Tracks budgets, goals, spending patterns, and long-term planning',
    capabilities: ['WEB SEARCH', 'FILE SYSTEM', 'CHARTS'],
    persona: 'Conservative, clear, numbers-first',
  },
  {
    id: 'news',
    color: '#38bdf8',
    name: 'NEWS ANALYST',
    desc: 'Monitors events, extracts signal, and builds daily intelligence briefs',
    capabilities: ['WEB SEARCH', 'FILE SYSTEM', 'CHARTS'],
    persona: 'Skeptical, concise, source-aware',
  },
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
  name: '',
  desc: '',
  color: '#00d4ff',
  capabilities: ['WEB SEARCH', 'FILE SYSTEM'],
  persona: '',
  goals: '',
  neverDo: '',
  preferredOutput: 'Action Plan',
  routingPriority: 'Balanced',
  components: [
    { type: 'Chat Panel', zone: 'Main Workspace', index: 0 },
    { type: 'Task Queue', zone: 'Left Sidebar', index: 0 }
  ],
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
      { id: 'security', label: 'PROTECTION', icon: '\u25a3' },
      { id: 'licensing', label: 'LICENSING', icon: '\uD83D\uDD12', badge: 'SECURE' },
      { id: 'memory', label: 'MEMORY', icon: '\u25a6' },
      { id: 'notif', label: 'ALERTS', icon: '\u25cc' },
    ],
  },
];

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      className={`toggle ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span className="toggle-thumb" />
    </button>
  );
}

function Slider({ min, max, step, value, onChange, suffix = '%', format }) {
  const display = format ? format(value) : `${value}${suffix}`;

  return (
    <div className="slider-wrap">
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="slider-val">{display}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="setting-section">
      <div className="section-title">{title}</div>
      {children}
    </div>
  );
}

function SettingRow({ name, desc, children, muted = false }) {
  return (
    <div className="setting-row" style={muted ? { opacity: 0.42 } : undefined}>
      <div className="setting-info">
        <div className="setting-name">{name}</div>
        <div className="setting-desc">{desc}</div>
      </div>
      <div className="setting-control">{children}</div>
    </div>
  );
}

function Segment({ value, options, onChange }) {
  return (
    <div className="segment">
      {options.map((option) => (
        <button
          type="button"
          key={option}
          className={`seg-btn ${value === option ? 'active' : ''}`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function ApiSlot({ slot, status, provider, purpose, model, apiKey, baseUrl, empty = false, onChange }) {
  return (
    <div className="api-slot">
      <div className="api-slot-header">
        <span className="api-provider">SLOT {slot}</span>
        <span className={`api-status ${empty ? 'empty' : status === 'PENDING' ? 'pending' : 'connected'}`}>
          {status}
        </span>
      </div>
      <select
        className="api-provider-select"
        value={provider}
        onChange={(e) => onChange({ provider: e.target.value })}
        style={{ width: '100%', marginBottom: 6 }}
      >
        <option>OpenAI</option>
        <option>Groq</option>
        <option>Anthropic</option>
        <option>Google Gemini</option>
        <option>DeepSeek</option>
        <option>Azure OpenAI</option>
        <option>Cohere</option>
        <option>Mistral</option>
        <option>SiliconFlow</option>
        <option>Empty</option>
      </select>
      <input
        className="api-key-input"
        type="password"
        value={apiKey || ''}
        onChange={(e) => onChange({ apiKey: e.target.value, hasKey: Boolean(e.target.value) })}
        placeholder={empty ? 'Paste provider key...' : 'sk-... encrypted key stored locally'}
      />
      <input
        className="api-key-input"
        type="text"
        value={baseUrl || ''}
        onChange={(e) => onChange({ baseUrl: e.target.value })}
        placeholder="Optional custom base URL (OpenAI-compatible)"
      />
      <input
        className="api-key-input"
        type="text"
        value={model || ''}
        onChange={(e) => onChange({ model: e.target.value })}
        placeholder="Optional exact model ID from your provider account"
      />
      <div className="api-row">
        <select className="api-purpose" value={purpose} onChange={(e) => onChange({ purpose: e.target.value })}>
          <option>Primary</option>
          <option>Coding</option>
          <option>Research</option>
          <option>Vision</option>
          <option>Fallback</option>
        </select>
        <button type="button" className="api-test-btn" onClick={() => onChange({ enabled: !empty })}>SET</button>
      </div>
    </div>
  );
}

function useSettingsModalController({
  isOpen,
  onClose,
  activeMode,
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
}) {
  const [modalViewState, dispatchModalView] = useReducer(modalViewReducer, INITIAL_MODAL_VIEW_STATE);
  const {
    activePage,
    scanlines,
    adaptiveColor,
    urgentFlash,
    transitionSpeed,
    responseDepth,
    voiceWake,
    faceConfidence,
    intruderSnapshot,
    memoryDepth,
    alertLevel,
    neuralDarwinism,
    ambientNoise,
    privateSession,
    missionDigest,
    selectedTemplateId,
    creatorStep
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
    licensingLoading
  } = settingsLocalState;
  const setCreatorDraft = createReducerFieldSetter(dispatchSettingsLocalState, 'creatorDraft');
  const setLocalModes = createReducerFieldSetter(dispatchSettingsLocalState, 'localModes');
  const setAiSlots = createReducerFieldSetter(dispatchSettingsLocalState, 'aiSlots');
  const setLicenseKeyInput = createReducerFieldSetter(dispatchSettingsLocalState, 'licenseKeyInput');
  const setLicensingInfo = createReducerFieldSetter(dispatchSettingsLocalState, 'licensingInfo');
  const setLicensingError = createReducerFieldSetter(dispatchSettingsLocalState, 'licensingError');
  const setLicensingLoading = createReducerFieldSetter(dispatchSettingsLocalState, 'licensingLoading');

  const fetchLicensingInfo = async () => {
    setLicensingLoading(true);
    try {
      const storedLicense = localStorage.getItem('zaire_license_key') || '';
      if (storedLicense) {
        setLicenseKeyInput(storedLicense);
        const response = await fetch(`${API_URL}/api/license/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            license_key: storedLicense,
            machine_id: 'BROWSER_HUD'
          })
        });
        const data = await response.json();
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

  useEffect(() => {
    if (isOpen) {
      fetchLicensingInfo();
    }
  }, [isOpen]);

  const activateNewKey = async () => {
    if (!licenseKeyInput.trim()) return;
    setLicensingLoading(true);
    setLicensingError(null);
    try {
      const response = await fetch(`${API_URL}/api/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license_key: licenseKeyInput.trim(),
          machine_id: 'BROWSER_HUD',
          machine_name: 'ZAIRE Web HUD Console',
          os_version: 'Web Client'
        })
      });
      const data = await response.json();
      if (data.valid) {
        localStorage.setItem('zaire_license_key', licenseKeyInput.trim());
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
      const response = await fetch(`${API_URL}/api/license/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license_key: licensingInfo.license_key,
          machine_id: machineId
        })
      });
      const data = await response.json();
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
      const response = await fetch(`${API_URL}/llm/providers`);
      const data = await response.json();
      const slots = data?.slots;
      if (Array.isArray(slots) && slots.length > 0) {
        const normalized = [0, 1, 2].map((i) => ({
          provider: slots[i]?.provider || 'Empty',
          apiKey: slots[i]?.apiKey || '',
          hasKey: Boolean(slots[i]?.hasKey),
          model: slots[i]?.model || '',
          purpose: slots[i]?.purpose || (i === 0 ? 'Primary' : i === 1 ? 'Coding' : 'Fallback'),
          baseUrl: slots[i]?.baseUrl || '',
          enabled: Boolean(slots[i]?.enabled ?? true)
        }));
        setAiSlots(normalized);
      }
    } catch {
      // Provider discovery is best-effort when the modal opens.
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    loadAiProviders();
  }, [isOpen, loadAiProviders]);

  const { getToken } = useAuth();
  const setModalField = useCallback((field, value) => {
    dispatchModalView({ type: 'SET_FIELD', field, value });
  }, []);
  const setActivePage = useCallback((value) => setModalField('activePage', value), [setModalField]);
  const setScanlines = useCallback((value) => setModalField('scanlines', value), [setModalField]);
  const setAdaptiveColor = useCallback((value) => setModalField('adaptiveColor', value), [setModalField]);
  const setUrgentFlash = useCallback((value) => setModalField('urgentFlash', value), [setModalField]);
  const setTransitionSpeed = useCallback((value) => setModalField('transitionSpeed', value), [setModalField]);
  const setResponseDepth = useCallback((value) => setModalField('responseDepth', value), [setModalField]);
  const setVoiceWake = useCallback((value) => setModalField('voiceWake', value), [setModalField]);
  const setFaceConfidence = useCallback((value) => setModalField('faceConfidence', value), [setModalField]);
  const setIntruderSnapshot = useCallback((value) => setModalField('intruderSnapshot', value), [setModalField]);
  const setMemoryDepth = useCallback((value) => setModalField('memoryDepth', value), [setModalField]);
  const setAlertLevel = useCallback((value) => setModalField('alertLevel', value), [setModalField]);
  const setNeuralDarwinism = useCallback((value) => setModalField('neuralDarwinism', value), [setModalField]);
  const setAmbientNoise = useCallback((value) => setModalField('ambientNoise', value), [setModalField]);
  const setPrivateSession = useCallback((value) => setModalField('privateSession', value), [setModalField]);
  const setMissionDigest = useCallback((value) => setModalField('missionDigest', value), [setModalField]);
  const setSelectedTemplateId = useCallback((value) => setModalField('selectedTemplateId', value), [setModalField]);
  const setCreatorStep = useCallback((value) => setModalField('creatorStep', value), [setModalField]);

  const fetchCustomModes = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/custom_modes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.modes)) {
        const sanitizedModes = data.modes.map(sanitizeModeRecord);
        setLocalModes(sanitizedModes);
        localStorage.setItem(MODE_STORAGE_KEY, JSON.stringify(sanitizedModes));
        if (onCustomModesChange) onCustomModesChange(sanitizedModes);
      }
    } catch (err) {
      console.warn('Failed to fetch custom modes from backend, fallback to local storage:', err.message);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCustomModes();
    }
  }, [isOpen]);

  if (!isOpen) return () => null;

  const hudOpacityPercent = Math.round(hudOpacity * 100);
  const setHudOpacityPercent = (value) => setHudOpacity(value / 100);
  const selectedTemplate = modeTemplates.find((template) => template.id === selectedTemplateId) || modeTemplates[0];
  const modeCount = localModes.length;

  const saveCustomMode = async (mode) => {
    try {
      const token = await getToken();
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
      const response = await fetch(`${API_URL}/api/custom_modes/${modeId}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
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

  const deleteCustomMode = async (modeId) => {
    if (!window.confirm('Wipe this custom mode from database permanently?')) return;
    try {
      const token = await getToken();
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
    const defaultComps = [
      { type: 'Chat Panel', zone: 'Main Workspace', index: 0 },
      { type: 'Task Queue', zone: 'Left Sidebar', index: 0 }
    ];
    setCreatorDraft({
      name: template.name,
      desc: template.desc,
      color: template.color,
      capabilities: template.capabilities,
      persona: template.persona,
      goals: '',
      neverDo: '',
      preferredOutput: 'Action Plan',
      routingPriority: 'Balanced',
      components: defaultComps,
      permissions: {
        fileSystem: template.capabilities.includes('FILE SYSTEM'),
        shellExecution: false,
        internetAccess: template.capabilities.includes('WEB SEARCH'),
        costWarnings: true,
        screenCapture: template.capabilities.includes('SCREEN VISION'),
        hardwareMedia: false
      }
    });
    setSelectedTemplateId(template.id);
    setCreatorStep(1);
    setActivePage('creator');
  };

  const toggleDraftCapability = (capability) => {
    setCreatorDraft((draft) => {
      const hasCapability = draft.capabilities.includes(capability);
      return {
        ...draft,
        capabilities: hasCapability
          ? draft.capabilities.filter((item) => item !== capability)
          : [...draft.capabilities, capability],
      };
    });
  };

  const handleAddComponentToZone = (compType, zone) => {
    if (CUSTOM_MODE_LOCKED_ZONES.includes(zone)) return;
    setCreatorDraft(draft => {
      const clean = draft.components.filter(c => c.type !== compType);
      const index = clean.filter(c => c.zone === zone).length;
      return {
        ...draft,
        components: [...clean, { type: compType, zone, index }]
      };
    });
  };

  const handleRemoveComponent = (compType) => {
    setCreatorDraft(draft => ({
      ...draft,
      components: draft.components.filter(c => c.type !== compType)
    }));
  };

  const manifestMode = async () => {
    const name = creatorDraft.name.trim();
    const desc = creatorDraft.desc.trim();

    if (!name || !desc) {
      alert('Please specify a Mode Name and Description.');
      return;
    }

    const nextMode = {
      id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      name: name.toUpperCase(),
      desc,
      color: creatorDraft.color,
      capabilities: creatorDraft.capabilities,
      persona: creatorDraft.persona.trim() || 'Custom ZAIRE specialist',
      goals: creatorDraft.goals.trim(),
      neverDo: creatorDraft.neverDo.trim(),
      preferredOutput: creatorDraft.preferredOutput,
      components: sanitizeModeComponents(creatorDraft.components),
      routingPriority: creatorDraft.routingPriority,
      expertBlueprint: buildModeExpertBlueprint({
        name,
        desc,
        persona: creatorDraft.persona,
        goals: creatorDraft.goals,
        neverDo: creatorDraft.neverDo,
        preferredOutput: creatorDraft.preferredOutput,
        routingPriority: creatorDraft.routingPriority,
        capabilities: creatorDraft.capabilities
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

  const renderView = () => (
    <>
      <button type="button" className="hud-settings-overlay" onClick={onClose} aria-label="Close settings overlay" />
      <div className="settings-wrap" role="dialog" aria-modal="true" aria-label="ZAIRE system control">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-brand">Z.A.I.R.E</div>
            <div className="sidebar-ver">SYSTEM CONTROL - VER 2.0.0</div>
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
              <div className="page-sub">Calibrate the interface appearance and behavior</div>

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
                  <select className="hud-select" defaultValue="48px">
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
                  <select className="hud-select" defaultValue="21:00">
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
                  <select className="hud-select" defaultValue="STARK_FORGE">
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
                  empty={(aiSlots[0]?.provider || 'Empty') === 'Empty'}
                  onChange={(patch) => setAiSlots((prev) => prev.map((s, i) => i === 0 ? { ...s, ...patch } : s))}
                />
                <ApiSlot
                  slot="2 - CODING"
                  status={(aiSlots[1]?.apiKey || aiSlots[1]?.hasKey) ? 'CONNECTED' : 'PENDING'}
                  provider={aiSlots[1]?.provider || 'Empty'}
                  purpose={aiSlots[1]?.purpose || 'Coding'}
                  model={aiSlots[1]?.model || ''}
                  apiKey={aiSlots[1]?.apiKey || ''}
                  baseUrl={aiSlots[1]?.baseUrl || ''}
                  empty={(aiSlots[1]?.provider || 'Empty') === 'Empty'}
                  onChange={(patch) => setAiSlots((prev) => prev.map((s, i) => i === 1 ? { ...s, ...patch } : s))}
                />
                <ApiSlot
                  slot="3 - FALLBACK"
                  status={(aiSlots[2]?.apiKey || aiSlots[2]?.hasKey) ? 'CONNECTED' : 'EMPTY'}
                  provider={aiSlots[2]?.provider || 'Empty'}
                  purpose={aiSlots[2]?.purpose || 'Fallback'}
                  model={aiSlots[2]?.model || ''}
                  apiKey={aiSlots[2]?.apiKey || ''}
                  baseUrl={aiSlots[2]?.baseUrl || ''}
                  empty={(aiSlots[2]?.provider || 'Empty') === 'Empty'}
                  onChange={(patch) => setAiSlots((prev) => prev.map((s, i) => i === 2 ? { ...s, ...patch } : s))}
                />
                <div className="api-limit-note">Keys are saved locally in your ZAIRE system config and applied at runtime.</div>
              </Section>
            </div>
          )}

          {activePage === 'apis' && (
            <div className="page active">
              <div className="page-title">API KEYS</div>
              <div className="page-sub">Register external services used by specialist modes</div>
              <Section title="CUSTOM API ENDPOINTS">
                <div className="custom-api-row">
                  <input className="custom-api-input" placeholder="Service name" />
                  <input className="custom-api-input" placeholder="https://api.example.com" />
                  <button type="button" className="add-btn">ADD</button>
                </div>
                <div className="custom-api-row">
                  <input className="custom-api-input" placeholder="Header key" />
                  <input className="custom-api-input" placeholder="Encrypted token" type="password" />
                  <button type="button" className="api-test-btn">VERIFY</button>
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
                  <select className="hud-select" defaultValue="Auto">
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
            <div className="page active">
              <div className="page-title">ZAIRE MODE STUDIO</div>
              <div className="page-sub">Step-by-step modular specialist creation workspace</div>

              {/* Wizard Steps Header */}
              <div className="wizard-step-header wizard-step-header-spaced">
                <div className="wizard-step-tabs">
                  {['1. IDENTITY', '2. INTELLIGENCE', '3. INTERFACE', '4. PERMISSIONS'].map((lbl, idx) => (
                    <button
                      type="button"
                      key={lbl}
                      className={`wizard-step-tab ${creatorStep === idx + 1 ? 'active' : creatorStep > idx + 1 ? 'done' : ''}`}
                      onClick={() => setCreatorStep(idx + 1)}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
                <div className="step-indicator">
                  {[1, 2, 3, 4].map(s => (
                    <span
                      key={s}
                      className={`step-dot ${creatorStep > s ? 'done' : creatorStep === s ? 'current' : ''}`}
                    />
                  ))}
                </div>
              </div>

              {/* STEP 1: IDENTITY */}
              {creatorStep === 1 && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                  <Section title="MODE IDENTITY PROFILE">
                    <div className="wizard-field">
                      <label className="wf-label" htmlFor="creator-mode-name">MODE NAME</label>
                      <input
                        id="creator-mode-name"
                        className="wf-input"
                        placeholder="e.g. BRAND MODE, HEALTH SENTINEL, LAWYER"
                        value={creatorDraft.name}
                        onChange={(e) => setCreatorDraft((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="wizard-field">
                      <label className="wf-label" htmlFor="creator-mode-desc">ONE LINE DESCRIPTION</label>
                      <input
                        id="creator-mode-desc"
                        className="wf-input"
                        placeholder="What should this mode manage?"
                        value={creatorDraft.desc}
                        onChange={(e) => setCreatorDraft((prev) => ({ ...prev, desc: e.target.value }))}
                      />
                    </div>
                    <div className="wizard-field">
                      <div className="wf-label">CHROMA COLOR (AESTHETICS)</div>
                      <div className="color-row">
                        {['#00d4ff', '#00ff88', '#a78bfa', '#fbbf24', '#f97316', '#ec4899', '#60a5fa', '#34d399'].map((color) => (
                          <button
                            type="button"
                            className={`color-opt ${creatorDraft.color === color ? 'selected' : ''}`}
                            style={{ background: color, boxShadow: `0 0 5px ${color}` }}
                            key={color}
                            onClick={() => setCreatorDraft((prev) => ({ ...prev, color }))}
                            aria-label={`Select color ${color}`}
                          />
                        ))}
                      </div>
                    </div>
                  </Section>
                  
                  <Section title="POPULATE FROM TEMPLATE CORE">
                    <div className="template-grid">
                      {modeTemplates.map((template) => (
                        <button
                          type="button"
                          className={`template-card ${selectedTemplateId === template.id ? 'selected' : ''}`}
                          key={template.id}
                          onClick={() => applyTemplateToDraft(template)}
                        >
                          <span className="template-color" style={{ background: template.color, boxShadow: `0 0 8px ${template.color}` }} />
                          <span className="template-name">{template.name}</span>
                          <span className="template-desc">{template.desc}</span>
                          <span className="template-meta">{template.capabilities.join(' / ')}</span>
                        </button>
                      ))}
                    </div>
                  </Section>

                  <div className="wizard-nav">
                    <button type="button" className="wiz-btn wiz-btn-back" onClick={() => setCreatorDraft(blankCreatorDraft)}>WIPE DRAFT</button>
                    <button type="button" className="wiz-btn wiz-btn-next" onClick={() => setCreatorStep(2)}>NEXT: INTELLIGENCE</button>
                  </div>
                </div>
              )}

              {/* STEP 2: INTELLIGENCE */}
              {creatorStep === 2 && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                  <Section title="SPECIALIST INSTRUCTIONS">
                    <div className="wizard-field">
                      <label className="wf-label" htmlFor="creator-mode-persona">PERSONALITY DIRECTIVE</label>
                      <textarea
                        id="creator-mode-persona"
                        className="wf-textarea"
                        placeholder="How should ZAIRE think, speak, and prioritize inside this mode? (e.g. Calm, medical safety-first, direct and motivating)"
                        value={creatorDraft.persona}
                        onChange={(e) => setCreatorDraft((prev) => ({ ...prev, persona: e.target.value }))}
                      />
                    </div>
                    <div className="wizard-field">
                      <label className="wf-label" htmlFor="creator-mode-goals">MISSION OBJECTIVES (What should it help with?)</label>
                      <textarea
                        id="creator-mode-goals"
                        className="wf-textarea"
                        placeholder="List specific goals or tasks ZAIRE should optimize for in this workspace."
                        value={creatorDraft.goals}
                        onChange={(e) => setCreatorDraft((prev) => ({ ...prev, goals: e.target.value }))}
                      />
                    </div>
                    <div className="wizard-field">
                      <label className="wf-label" htmlFor="creator-mode-neverdo">NEGATIVE CONSTRAINTS (What should it never do?)</label>
                      <textarea
                        id="creator-mode-neverdo"
                        className="wf-textarea"
                        placeholder="Specify forbidden actions or bounds (e.g., never execute destructive shell commands)."
                        value={creatorDraft.neverDo || ''}
                        onChange={(e) => setCreatorDraft((prev) => ({ ...prev, neverDo: e.target.value }))}
                      />
                    </div>
                  </Section>

                  <Section title="TASK ROUTING & CAPABILITIES">
                    <div className="wizard-field">
                      <label className="wf-label" htmlFor="creator-mode-output">PREFERRED OUTPUT STYLE</label>
                      <select
                        id="creator-mode-output"
                        className="hud-select"
                        value={creatorDraft.preferredOutput}
                        onChange={(e) => setCreatorDraft((prev) => ({ ...prev, preferredOutput: e.target.value }))}
                      >
                        <option>Action Plan</option>
                        <option>Deep Analysis</option>
                        <option>Checklist</option>
                        <option>Executive Summary</option>
                        <option>Teach Me</option>
                      </select>
                    </div>
                    <div className="wizard-field">
                      <div className="wf-label">ROUTING PRIORITY</div>
                      <Segment
                        value={creatorDraft.routingPriority}
                        options={['Speed', 'Balanced', 'Reasoning']}
                        onChange={(value) => setCreatorDraft((prev) => ({ ...prev, routingPriority: value }))}
                      />
                    </div>
                    <div className="wizard-field">
                      <div className="wf-label">ACTIVE SYSTEM CAPABILITIES</div>
                      <div className="component-grid">
                        {['WEB SEARCH', 'FILE SYSTEM', 'SCREEN VISION', 'COMPUTER USE', 'CHARTS', 'IMAGE GEN'].map((item) => (
                          <button
                            type="button"
                            className={`comp-opt ${creatorDraft.capabilities.includes(item) ? 'selected' : ''}`}
                            key={item}
                            onClick={() => toggleDraftCapability(item)}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </Section>

                  <div className="wizard-nav">
                    <button type="button" className="wiz-btn wiz-btn-back" onClick={() => setCreatorStep(1)}>BACK</button>
                    <button type="button" className="wiz-btn wiz-btn-next" onClick={() => setCreatorStep(3)}>NEXT: INTERFACE BUILDER</button>
                  </div>
                </div>
              )}

              {/* STEP 3: INTERFACE */}
              {creatorStep === 3 && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                  <Section title="MODE INTERFACE BUILDER">
                    <div style={{ fontSize: '12px', color: 'rgba(0, 212, 255, 0.4)', marginBottom: 10 }}>
                      Drag components from the library or click the green "+" button to assign them to layout zones.
                    </div>

                    <div className="layout-builder-container">
                      {/* Component Library Column */}
                      <div className="layout-library">
                        <div className="library-title">COMPONENT LIBRARY</div>
                        <div className="library-scroll">
                          {COMPONENT_LIBRARY.map((comp) => {
                            const alreadyPlaced = creatorDraft.components.some(c => c.type === comp.type);
                            return (
                              <div
                                key={comp.type}
                                className="library-item"
                                draggable={!alreadyPlaced}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', comp.type);
                                }}
                                style={alreadyPlaced ? { opacity: 0.35, cursor: 'not-allowed' } : { borderColor: `${creatorDraft.color}22` }}
                              >
                                <div className="lib-item-info">
                                  <span className="lib-item-icon">{comp.icon}</span>
                                  <div className="lib-item-text">
                                    <div className="lib-item-name">{comp.type}</div>
                                    <div className="lib-item-desc">{comp.desc}</div>
                                  </div>
                                </div>
                                {!alreadyPlaced && (
                                  <select
                                    className="library-item-add-btn"
                                    value=""
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleAddComponentToZone(comp.type, e.target.value);
                                        e.target.value = '';
                                      }
                                    }}
                                    style={{ color: creatorDraft.color }}
                                  >
                                    <option value="" disabled>+</option>
                                    <option value="Top Status Bar">Top</option>
                                    <option value="Left Sidebar">Left</option>
                                    <option value="Main Workspace">Center</option>
                                    <option value="Right Inspector">Right</option>
                                  </select>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Dashboard Mockup grid */}
                      <div>
                        <div className="library-title" style={{ textAlign: 'center' }}>WORKSPACE SCHEMATIC</div>
                        <div className="layout-dashboard-mock">
                          {/* Zones */}
                          {['Top Status Bar', 'Left Sidebar', 'Main Workspace', 'Right Inspector'].map((zone) => {
                            const zoneClass =
                              zone === 'Top Status Bar' ? 'zone-top' :
                              zone === 'Left Sidebar' ? 'zone-left' :
                              zone === 'Main Workspace' ? 'zone-center' :
                              zone === 'Right Inspector' ? 'zone-right' : 'zone-bottom';

                            const zoneComponents = creatorDraft.components
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
                                  if (compType) {
                                    handleAddComponentToZone(compType, zone);
                                  }
                                }}
                                style={{
                                  borderColor: `${creatorDraft.color}22`,
                                  background: `${creatorDraft.color}03`
                                }}
                              >
                                <div className="zone-label">{zone}</div>
                                <div className="zone-components-list">
                                  {zoneComponents.map((c) => {
                                    const matchedLib = COMPONENT_LIBRARY.find(l => l.type === c.type);
                                    return (
                                      <div 
                                        key={c.type} 
                                        className="zone-component-card-visual" 
                                        style={{ border: `1px solid ${creatorDraft.color}22`, background: `rgba(0, 0, 0, 0.4)` }}
                                      >
                                        <div className="visual-card-header" style={{ borderBottom: `1px solid ${creatorDraft.color}11` }}>
                                          <span className="visual-card-title"><span style={{ marginRight: 4 }}>{matchedLib?.icon}</span>{c.type.toUpperCase()}</span>
                                          <button
                                            type="button"
                                            className="zone-component-remove"
                                            onClick={() => handleRemoveComponent(c.type)}
                                            title="Remove component"
                                            aria-label={`Remove ${c.type} component`}
                                          >
                                            ✕
                                          </button>
                                        </div>
                                          
                                        <div className="visual-card-preview-area">
                                          <MiniPreview type={c.type} color={creatorDraft.color} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </Section>

                  <div className="wizard-nav">
                    <button type="button" className="wiz-btn wiz-btn-back" onClick={() => setCreatorStep(2)}>BACK</button>
                    <button type="button" className="wiz-btn wiz-btn-next" onClick={() => setCreatorStep(4)}>NEXT: PERMISSIONS</button>
                  </div>
                </div>
              )}

              {/* STEP 4: PERMISSIONS */}
              {creatorStep === 4 && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                  <Section title="MODE PERMISSIONS POLICY">
                    <div style={{ fontSize: '12px', color: 'rgba(0, 212, 255, 0.4)', marginBottom: 15 }}>
                      Establish cryptographic permission boundaries and security policies for this specialist mode.
                    </div>

                    <SettingRow name="FILE SYSTEM READ/WRITE" desc="Allows the agent to write files and modify code directories">
                      <Toggle
                        checked={creatorDraft.permissions.fileSystem}
                        onChange={(val) => setCreatorDraft((prev) => ({
                          ...prev,
                          permissions: { ...prev.permissions, fileSystem: val }
                        }))}
                      />
                    </SettingRow>

                    <SettingRow name="SHELL / TERMINAL EXECUTION" desc="Allows executing host operating system shell commands">
                      <Toggle
                        checked={creatorDraft.permissions.shellExecution}
                        onChange={(val) => setCreatorDraft((prev) => ({
                          ...prev,
                          permissions: { ...prev.permissions, shellExecution: val }
                        }))}
                      />
                    </SettingRow>

                    <SettingRow name="UNRESTRICTED INTERNET ACCESS" desc="Allows outbound networking, API connections and Web Search">
                      <Toggle
                        checked={creatorDraft.permissions.internetAccess}
                        onChange={(val) => setCreatorDraft((prev) => ({
                          ...prev,
                          permissions: { ...prev.permissions, internetAccess: val }
                        }))}
                      />
                    </SettingRow>

                    <SettingRow name="TOKEN COST RUNTIME WARNINGS" desc="Prompt for confirmation before executing high-token reasoning calls">
                      <Toggle
                        checked={creatorDraft.permissions.costWarnings}
                        onChange={(val) => setCreatorDraft((prev) => ({
                          ...prev,
                          permissions: { ...prev.permissions, costWarnings: val }
                        }))}
                      />
                    </SettingRow>

                    <SettingRow name="SCREEN VISION CAPTURE" desc="Allows periodic desktop screen visual grabs and OCR analysis">
                      <Toggle
                        checked={creatorDraft.permissions.screenCapture}
                        onChange={(val) => setCreatorDraft((prev) => ({
                          ...prev,
                          permissions: { ...prev.permissions, screenCapture: val }
                        }))}
                      />
                    </SettingRow>

                    <SettingRow name="HARDWARE SENSORY ACCESS" desc="Allows direct access to user microphone and camera feeds">
                      <Toggle
                        checked={creatorDraft.permissions.hardwareMedia}
                        onChange={(val) => setCreatorDraft((prev) => ({
                          ...prev,
                          permissions: { ...prev.permissions, hardwareMedia: val }
                        }))}
                      />
                    </SettingRow>
                  </Section>

                  <div className="wizard-nav">
                    <button type="button" className="wiz-btn wiz-btn-back" onClick={() => setCreatorStep(3)}>BACK</button>
                    <button type="button" className="wiz-btn wiz-btn-create" onClick={manifestMode}>MANIFEST MODE</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activePage === 'mymodes' && (
            <div className="page active">
              <div className="page-title">MY CUSTOM MODES</div>
              <div className="page-sub">Your personally created specialist modes</div>
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
                        onClick={() => deleteCustomMode(mode.id)}
                        style={{ color: '#ff3366', borderColor: 'rgba(255,51,102,0.2)' }}
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" className="create-mode-link" onClick={() => setActivePage('creator')}>+ CREATE NEW MODE</button>
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

          {activePage === 'memory' && (
            <div className="page active">
              <div className="page-title">MEMORY</div>
              <div className="page-sub">Manage persistence, recall depth, and privacy boundaries</div>
              <Section title="RECALL CONFIGURATION">
                <SettingRow name="CONTEXT RETENTION" desc="How much session context ZAIRE keeps active">
                  <Slider min={10} max={100} step={5} value={memoryDepth} onChange={setMemoryDepth} />
                </SettingRow>
                <SettingRow name="PRIVATE SESSION MODE" desc="Temporarily disable persistent memory writes">
                  <Toggle checked={privateSession} onChange={setPrivateSession} />
                </SettingRow>
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
          <div className="footer-status">CORE_SYNC: ACTIVE // VER: 2.0.0</div>
          <div className="footer-btns">
            <button
              type="button"
              className="footer-btn footer-btn-reset"
              onClick={() => {
                if (window.confirm('WIPE ALL SYSTEM PREFERENCES?')) localStorage.clear();
              }}
            >
              FACTORY RESET
            </button>
            <button type="button" className="footer-btn footer-btn-dismiss" onClick={onClose}>DISMISS</button>
            <button
              type="button"
              className="footer-btn footer-btn-apply"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('ZAIRE_PERSIST_CONFIG', {
                  detail: {
                    aiVault: {
                      slots: aiSlots.slice(0, 3)
                    }
                  }
                }));
                onClose();
              }}
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
