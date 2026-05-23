import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import SettingsModal from './SettingsModal';
import GroqSpeechService from './groqSpeechService';
import { io } from 'socket.io-client';
import './App.css';
import ShadowAssistant from './components/ShadowAssistant';
import { SignedIn, SignedOut, SignIn, SignUp, UserButton, useUser, useAuth } from '@clerk/clerk-react';
import { ZaireComponentRegistry, getComponentBlueprintByType } from './engine/ComponentRegistry';
import * as EliteComponents from './engine/EliteComponents';
import EliteHUDWrapper from './engine/EliteHUDWrapper';
const DEFAULT_BLOB_COLOR = '#00b4ff';
const API_BASE_URL = process.env.REACT_APP_API_URL || `https://zaire-backend.onrender.com`;
const MODE_STORAGE_KEY = 'zaire_custom_modes_v1';
const BLOB_COLOR_STORAGE_KEY = 'blobColor:v1';
const BLOB_SIZE_STORAGE_KEY = 'blobSize:v1';
const BLOB_POSITION_STORAGE_KEY = 'blobPosition:v1';
const CORE_MODES = ['ZAIRE', 'TRADER', 'PROFESSOR', 'ENGINEER', 'SWARM'];
const CUSTOM_MODE_LOCKED_ZONES = ['Bottom Console'];

const fetchJsonOrThrow = async (url, options) => {
  const response = await fetch(url, options);
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

const sanitizeCustomModeComponents = (components = []) =>
  components.filter((component) => !CUSTOM_MODE_LOCKED_ZONES.includes(component.zone));

const sanitizeCustomModeRecord = (mode) => ({
  ...mode,
  components: sanitizeCustomModeComponents(mode.components || [])
});

const handleAccessibleActivate = (event, action) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
};

const mapWithStableKeys = (items, getBaseKey, renderItem) => {
  const seenKeys = new Map();
  return items.map((item, itemIndex) => {
    const baseKey = String(getBaseKey(item, itemIndex));
    const occurrence = seenKeys.get(baseKey) || 0;
    seenKeys.set(baseKey, occurrence + 1);
    const stableKey = occurrence === 0 ? baseKey : `${baseKey}-${occurrence}`;
    return renderItem(item, stableKey, itemIndex);
  });
};

function ClientLocalTime({ value, mode = 'time', options }) {
  const formatted = useMemo(() => {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    if (mode === 'datetime') {
      return date.toLocaleString(undefined, options);
    }

    return date.toLocaleTimeString([], options);
  }, [mode, options, value]);

  return <>{formatted || '--'}</>;
}

const INITIAL_BIOMETRIC_DATA = { detected: false, name: 'ABSENT', confidence: 0 };

const INITIAL_SECURITY_STATE = {
  biometricData: INITIAL_BIOMETRIC_DATA,
  isSecurityAlert: false,
  showSecurityOverlay: false,
  activeIntruder: null
};

const securityStateReducer = (state, action) => {
  switch (action.type) {
    case 'SYNC_STATUS': {
      const { data } = action;
      return {
        ...state,
        biometricData: {
          detected: data.master_present || data.running,
          name: data.master_present ? 'Master' : (data.running ? 'Scanning…' : 'Offline'),
          locked: data.pc_locked,
          enabled: data.face_lock_enabled,
          intruders: data.total_intruders,
          intruder_present: data.intruder_present,
          disabled: data.security_disabled
        },
        isSecurityAlert: data.master_present || data.security_disabled ? false : state.isSecurityAlert,
        showSecurityOverlay: data.master_present || data.security_disabled ? false : state.showSecurityOverlay
      };
    }
    case 'SET_DISABLED':
      return {
        ...state,
        biometricData: { ...state.biometricData, disabled: action.disabled }
      };
    case 'INTRUDER_DETECTED':
      return {
        ...state,
        isSecurityAlert: true,
        showSecurityOverlay: true,
        activeIntruder: action.intruder
      };
    case 'HIDE_SECURITY_OVERLAY':
      return {
        ...state,
        showSecurityOverlay: false
      };
    default:
      return state;
  }
};

const INITIAL_SPECIALIST_VISUAL_STATE = {
  engineerPhase: 'IDLE',
  forgeProgress: 0,
  professorPhase: 'IDLE',
  learningProgress: 0,
  traderPhase: 'IDLE',
  traderProgress: 0,
  liveTrades: [],
  swarmPhase: 'IDLE',
  swarmMessages: []
};

const buildLiveTrades = (livePulse = {}) =>
  Object.entries(livePulse).map(([pair, d]) => ({
    id: pair,
    pair: `${pair}/USDT`,
    type: d.percent > 0 ? 'LONG' : 'SHORT',
    price: d.price.toLocaleString(),
    amount: 'LIVE',
    status: 'MONITORING'
  }));

const specialistVisualReducer = (state, action) => {
  switch (action.type) {
    case 'SYNC_FROM_SPECIALIST_DATA': {
      const { activeMode, specialistData } = action;
      if (!specialistData) return state;

      if (activeMode === 'TRADER') {
        return {
          ...state,
          traderPhase: specialistData.phase || state.traderPhase,
          traderProgress: specialistData.progress !== undefined ? specialistData.progress : state.traderProgress,
          liveTrades: specialistData.live_pulse ? buildLiveTrades(specialistData.live_pulse) : state.liveTrades
        };
      }

      if (activeMode === 'PROFESSOR') {
        return {
          ...state,
          professorPhase: specialistData.phase || state.professorPhase,
          learningProgress: specialistData.progress !== undefined ? specialistData.progress : state.learningProgress
        };
      }

      if (activeMode === 'ENGINEER') {
        return {
          ...state,
          engineerPhase: specialistData.phase || state.engineerPhase,
          forgeProgress: specialistData.progress !== undefined ? specialistData.progress : state.forgeProgress
        };
      }

      if (activeMode === 'SWARM') {
        return {
          ...state,
          swarmPhase: specialistData.phase || state.swarmPhase,
          swarmMessages: specialistData.messages || state.swarmMessages
        };
      }

      return state;
    }
    default:
      return state;
  }
};

const appendSystemActionLogEntry = (logRef, entry) => {
  logRef.current = [entry, ...logRef.current].slice(0, 6);
};

const syncBlobPosition = (blobPositionRef, nextPosition, mainGroupRef) => {
  blobPositionRef.current = nextPosition;
  localStorage.setItem(BLOB_POSITION_STORAGE_KEY, JSON.stringify(nextPosition));
  if (mainGroupRef.current) {
    mainGroupRef.current.position.set(nextPosition.x, nextPosition.y, 0);
  }
};

const getNextSystemState = ({
  biometricData,
  isSecurityAlert,
  isMicrophoneActive,
  isTyping,
  isOmniBoxOpen,
  zaireStatus,
  zaireResponseStream
}) => {
  const masterPresent = biometricData && biometricData.name === 'Master';
  const activeIntruder = biometricData && biometricData.intruder_present;

  if (!masterPresent && (isSecurityAlert || activeIntruder)) return 'ALERT';
  if (isMicrophoneActive) return 'LISTENING';
  if (isTyping || isOmniBoxOpen || zaireStatus === 'processing' || zaireResponseStream) return 'THINKING';
  return 'IDLE';
};

function FileTreeNode({ node, depth = 0, onOpenFile }) {
  const [isOpen, setIsOpen] = React.useState(depth === 0);
  const isDir = node.type === 'directory';
  const nodePath = node.path || node.name;

  const handleNodeClick = () => {
    if (isDir) {
      setIsOpen((prev) => !prev);
      return;
    }
    if (onOpenFile) onOpenFile(node);
  };

  return (
    <div className="file-tree-node" style={{ marginLeft: `${depth * 10}px` }}>
      <button
        type="button"
        className={`node-label ${isDir ? 'directory' : 'file'} clickable`}
        onClick={handleNodeClick}
      >
        <span className="node-icon">{isDir ? (isOpen ? '📂' : '📁') : '📄'}</span>
        <span className="node-name">{node.name}</span>
        {node.size && <span className="node-size">({(node.size / 1024).toFixed(1)}kb)</span>}
      </button>
      {isDir && isOpen && node.children && (
        <div className="node-children">
          {node.children.map((child) => {
            const childPath = child.path || `${nodePath}/${child.name}`;
            return (
              <FileTreeNode
                key={childPath}
                node={{ ...child, path: childPath }}
                depth={depth + 1}
                onOpenFile={onOpenFile}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

const buildCustomModeActivationLine = (modeDef) => {
  if (!modeDef) return 'Custom workspace loaded. Specialist parameters synchronized.';

  const cleanName = String(modeDef.name || 'CUSTOM MODE').trim();
  const desc = String(modeDef.desc || '').trim();
  const persona = String(modeDef.persona || '').trim();
  const focusSource = persona || desc;
  const focusLine = focusSource
    ? focusSource.replace(/\s+/g, ' ').replace(/[.!?]+$/, '')
    : 'Custom specialist directives synchronized';

  return `${cleanName} engaged. ${focusLine}. Ready for execution, sir.`;
};

const buildCustomModeRuntimeConfig = (modeDef) => {
  if (!modeDef) return null;

  const cleanText = (value, fallback = '') => {
    const text = String(value || '').trim();
    return text || fallback;
  };

  return {
    name: cleanText(modeDef.name, 'CUSTOM MODE'),
    desc: cleanText(modeDef.desc, 'Deliver focused specialist help in this user-defined workspace.'),
    persona: cleanText(modeDef.persona, 'A disciplined senior specialist.'),
    goals: cleanText(modeDef.goals, 'Help the user with expert-level precision in this domain.'),
    neverDo: cleanText(modeDef.neverDo, 'Do not fabricate facts, hidden access, or completed work.'),
    preferredOutput: cleanText(modeDef.preferredOutput, 'Action Plan'),
    routingPriority: cleanText(modeDef.routingPriority, 'Balanced'),
    capabilities: Array.isArray(modeDef.capabilities) ? modeDef.capabilities : [],
    permissions: modeDef.permissions || {},
    expertBlueprint: modeDef.expertBlueprint || null
  };
};

const getArchiveSessionTitle = (session) => {
  if (!session) return 'UNTITLED CHAT';

  const explicitTitle = String(session.title || '').trim();
  if (explicitTitle && explicitTitle !== 'Untitled Chat') {
    return explicitTitle.length > 40 ? `${explicitTitle.slice(0, 40).trimEnd()}...` : explicitTitle;
  }

  const messages = Array.isArray(session.messages) ? session.messages : [];
  const firstUserMessage = messages.find((message) => message.role === 'user' && String(message.content || '').trim());
  if (!firstUserMessage) {
    return 'UNTITLED CHAT';
  }

  const collapsed = String(firstUserMessage.content || '').replace(/\s+/g, ' ').trim();
  return collapsed.length > 40 ? `${collapsed.slice(0, 40).trimEnd()}...` : collapsed;
};

const buildArchiveMessageItems = (session) => {
  const messages = Array.isArray(session?.messages) ? session.messages : [];
  const signatureCounts = new Map();

  return messages.map((message) => {
    const signature = [
      message?.id || '',
      message?.timestamp || message?.createdAt || '',
      message?.role || 'assistant',
      String(message?.content || '').trim()
    ].join('::');
    const duplicateCount = (signatureCounts.get(signature) || 0) + 1;
    signatureCounts.set(signature, duplicateCount);

    return {
      message,
      messageKey: `${signature}::${duplicateCount}`
    };
  });
};

const ArchiveConversation = ({ session }) => {
  const archiveItems = buildArchiveMessageItems(session);

  if (!archiveItems.length) {
    return <div className="archives-empty-state">Select and load a session to preview full transcript.</div>;
  }

  return archiveItems.map(({ message, messageKey }, index) => {
    const isUser = message.role === 'user';
    return (
      <div
        key={messageKey}
        className={`archive-message ${isUser ? 'user' : 'zaire'}`}
      >
        <div className="archive-message-head">
          <span className="archive-message-role">{isUser ? 'USER' : 'ZAIRE'}</span>
          <span className="archive-message-index">#{index + 1}</span>
        </div>
        <div className="archive-message-body">{message.content}</div>
      </div>
    );
  });
};

const ArchiveActionIcon = ({ type }) => {
  switch (type) {
    case 'rename':
      return (
        <svg viewBox="0 0 16 16" className="archive-action-icon">
          <path d="M3 11.5 11.9 2.6l1.5 1.5L4.5 13H3z" />
          <path d="M10.9 3.6 12.4 2.1 13.9 3.6 12.4 5.1z" />
        </svg>
      );
    case 'copy':
      return (
        <svg viewBox="0 0 16 16" className="archive-action-icon">
          <rect x="5" y="3" width="7" height="9" rx="1" />
          <path d="M3.5 5.5V13h7.5" />
        </svg>
      );
    case 'share':
      return (
        <svg viewBox="0 0 16 16" className="archive-action-icon">
          <path d="M6 10 11.5 4.5" />
          <path d="M8.5 4.5h3v3" />
          <path d="M4 6.5v5h5" />
        </svg>
      );
    case 'like':
      return (
        <svg viewBox="0 0 16 16" className="archive-action-icon">
          <path d="M6.5 6V3.8c0-.8.5-1.5 1.2-1.8l.8 2.2-.7 2.3H12l-.8 5H5V6z" />
          <rect x="3" y="6" width="2" height="6" rx=".5" />
        </svg>
      );
    case 'dislike':
      return (
        <svg viewBox="0 0 16 16" className="archive-action-icon">
          <path d="M6.5 10V12.2c0 .8.5 1.5 1.2 1.8l.8-2.2-.7-2.3H12l-.8-5H5v5z" />
          <rect x="3" y="4" width="2" height="6" rx=".5" />
        </svg>
      );
    case 'open':
      return (
        <svg viewBox="0 0 16 16" className="archive-action-icon">
          <path d="M3 12.5h10" />
          <path d="M8 11V3.5" />
          <path d="M5.5 6 8 3.5 10.5 6" />
        </svg>
      );
    case 'delete':
      return (
        <svg viewBox="0 0 16 16" className="archive-action-icon">
          <path d="M3.5 4.5h9" />
          <path d="M6 4.5V3h4v1.5" />
          <path d="M5 6.5v5.5" />
          <path d="M8 6.5v5.5" />
          <path d="M11 6.5v5.5" />
        </svg>
      );
    default:
      return null;
  }
};

function normalizeHexColor(value) {
  if (!value || typeof value !== 'string') return DEFAULT_BLOB_COLOR;
  const trimmed = value.trim();
  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed.toLowerCase() : DEFAULT_BLOB_COLOR;
}

const DEFAULT_ZAIRE_ACTION_FEED = [
  { time: '15:47', message: 'System boot complete' },
  { time: '15:46', message: 'Neural core initialized' },
  { time: '15:45', message: 'Voice synthesis online' },
  { time: '15:44', message: 'Loading ZAIRE protocol' },
  { time: '15:43', message: 'Mounting file system' },
];

const DEFAULT_CUSTOM_TASKS = [
  { id: 1, title: 'Diagnostic System Sync', status: 'completed', progress: 100 },
  { id: 2, title: 'Neural Pathway Calibration', status: 'in_progress', progress: 45 },
  { id: 3, title: 'Security Protocol Audit', status: 'pending', progress: 0 }
];

const DEFAULT_CUSTOM_NOTES = [
  { id: 1, time: '14:20', text: 'ZAIRE Mode Studio fully initialized with 4-layer schema.' }
];

const DEFAULT_CUSTOM_TERMINAL_LINES = [
  'ZAIRE Terminal Core [Version 1.0]',
  '(c) 2026 ZAIRE Sovereign Intelligence. All rights reserved.',
  '',
  'Type "help" for a list of available commands.',
  'Ready.'
];

const DEFAULT_CUSTOM_KANBAN_CARDS = [
  { id: 1, title: 'Draft Spec Sheet', status: 'todo' },
  { id: 2, title: 'Model Gating Logic', status: 'doing' },
  { id: 3, title: 'Database Migration', status: 'done' }
];

const DEFAULT_ACTIVITY_FEED = [
  { time: '15:47', message: 'System boot complete' },
  { time: '15:46', message: 'Neural core initialized' },
  { time: '15:45', message: 'Voice synthesis online' },
  { time: '15:44', message: 'Loading ZAIRE protocol' },
  { time: '15:43', message: 'Mounting file system' },
];

const PROFESSOR_SLIDES = [
  { title: 'Neural Architectures', content: 'Understanding multi-head attention mechanisms in Transformers.', image: null },
  { title: 'Latent Space', content: 'Visualizing high-dimensional embeddings in vector databases.', image: null },
  { title: 'Optimization', content: 'Stochastic Gradient Descent vs Adam: A comparative analysis.', image: null }
];

const DEFAULT_MODE_LAYOUTS = {
  'ZAIRE': { leftWidth: 200, rightWidth: 200, bottomHeight: 150, leftX: 0, leftY: 0, rightX: 0, rightY: 0, bottomX: 0, bottomY: 0 },
  'TRADER': { leftWidth: 200, rightWidth: 220, bottomHeight: 90, leftX: 0, leftY: 0, rightX: 0, rightY: 0, bottomX: 0, bottomY: 0 },
  'PROFESSOR': { leftWidth: 220, rightWidth: 200, bottomHeight: 80, leftX: 0, leftY: 0, rightX: 0, rightY: 0, bottomX: 0, bottomY: 0 },
  'ENGINEER': { leftWidth: 200, rightWidth: 260, bottomHeight: 90, leftX: 0, leftY: 0, rightX: 0, rightY: 0, bottomX: 0, bottomY: 0 }
};

const DEFAULT_SPECIALIST_DATA = {
  active_persona: 'STARK_GRADE',
  forge_telemetry: { neural_alignment: 0, thermal_hud: false },
  active_projects: [],
  forge_build_log: [],
  portfolio_value: '0.00',
  risk_level: 'LOW',
  alpha_feed: []
};

const appStateReducer = (state, action) => {
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

const readJsonFromStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const buildInitialAppState = () => {
  const storedModes = readJsonFromStorage(MODE_STORAGE_KEY, []);
  return {
    hudOpacity: parseFloat(localStorage.getItem('zaire_hud_opacity')) || 0.85,
    neuralGlowEnabled: localStorage.getItem('zaire_neural_glow') !== 'false',
    holographicTiltEnabled: localStorage.getItem('zaire_holographic_tilt') !== 'false',
    halalFilterEnabled: true,
    autoLintEnabled: true,
    authView: window.location.hash.includes('sign-up') ? 'signup' : 'signin',
    zaireResponseStream: '',
    showResponsePanel: false,
    isNeuralInterruptActive: false,
    zaireActionFeed: DEFAULT_ZAIRE_ACTION_FEED,
    isUpgradeLoading: false,
    liveMetrics: { cpu: 0, ram: 0, gpu: 0, latency: 4 },
    isOmniBoxOpen: false,
    omniInput: '',
    isSystemEngaged: false,
    activeMode: 'ZAIRE',
    customModes: Array.isArray(storedModes) ? storedModes.map(sanitizeCustomModeRecord) : [],
    activeCustomMode: null,
    customTasks: DEFAULT_CUSTOM_TASKS,
    customNotes: DEFAULT_CUSTOM_NOTES,
    customChatInput: '',
    customTerminalInput: '',
    customTerminalLines: DEFAULT_CUSTOM_TERMINAL_LINES,
    customEditorText: '// ZAIRE Code Engine v1.0\nfunction initWorkspace() {\n  console.log("Workspace initialized successfully.");\n}',
    customKanbanCards: DEFAULT_CUSTOM_KANBAN_CARDS,
    zaireStatus: 'online',
    timeStr: '00:00:00',
    navItem: 'HOME',
    isSettingsOpen: false,
    isDragging: false,
    isMicrophoneActive: false,
    audioFrequency: 0,
    blobColor: normalizeHexColor(localStorage.getItem(BLOB_COLOR_STORAGE_KEY) || DEFAULT_BLOB_COLOR),
    blobSize: parseFloat(localStorage.getItem(BLOB_SIZE_STORAGE_KEY)) || 1.0,
    lastCommand: '',
    recognizedText: '',
    finalRecognizedText: '',
    inputValue: '',
    isTyping: false,
    useGroqSpeech: false,
    groqStatus: '',
    isVisionScanning: false,
    storedMemories: [],
    memoryFlash: false,
    isDiagnosticActive: false,
    chatSessions: [],
    currentSessionId: null,
    isChatHistoryLoading: false,
    chatSearch: '',
    editingSessionId: null,
    editingTitle: '',
    isArchivesPageOpen: false,
    selectedArchiveId: null,
    archiveSessionCache: {},
    archiveReactions: readJsonFromStorage('zaire_archive_reactions_v1', {}),
    isTransitioning: false,
    forgeCode: '',
    professorSubMode: 'LECTURE',
    professorTopic: 'Neural Networks',
    professorNoteInput: '',
    traderSubMode: 'CHART',
    specialistData: DEFAULT_SPECIALIST_DATA,
    previewUrl: 'http://localhost:3005',
    showDiff: false,
    diffData: null,
    showMatrix: false,
    activeTab: 0,
    manifestedFiles: [],
    darwinResults: null,
    thermalActive: false,
    modeLayouts: readJsonFromStorage('zaire_mode_layouts_v1', DEFAULT_MODE_LAYOUTS),
    componentNudges: readJsonFromStorage('zaire_component_nudges_v1', {}),
    selectedComponent: '',
    isMinigameActive: false,
    minigameScore: 0,
    gameNodes: [],
    neuralVideoData: null,
    isVideoPlaying: false,
    currentVideoScene: null,
    isNeuralPulseActive: false,
    particles: [],
    cameraStatus: 'pending'
  };
};

const createAppFieldSetter = (dispatch, field) => (value) => {
  dispatch({ type: 'SET_FIELD', field, value });
};

function useAppController() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const threeCanvasRef = useRef(null);
  const gridCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const cameraRef = useRef(null);
  const dragStateRef = useRef({ isPointerDown: false, tempPosition: { x: 0, y: 0 } });
  const [appState, dispatchAppState] = useReducer(appStateReducer, undefined, buildInitialAppState);
  const {
    hudOpacity,
    neuralGlowEnabled,
    holographicTiltEnabled,
    halalFilterEnabled,
    autoLintEnabled,
    authView,
    zaireResponseStream,
    showResponsePanel,
    isNeuralInterruptActive,
    zaireActionFeed,
    isUpgradeLoading,
    liveMetrics,
    isOmniBoxOpen,
    omniInput,
    isSystemEngaged,
    activeMode,
    customModes,
    activeCustomMode,
    customTasks,
    customNotes,
    customChatInput,
    customTerminalInput,
    customTerminalLines,
    customEditorText,
    customKanbanCards,
    zaireStatus,
    timeStr,
    navItem,
    isSettingsOpen,
    isDragging,
    isMicrophoneActive,
    audioFrequency,
    blobColor,
    blobSize,
    lastCommand,
    recognizedText,
    finalRecognizedText,
    inputValue,
    isTyping,
    useGroqSpeech,
    groqStatus,
    isVisionScanning,
    storedMemories,
    memoryFlash,
    isDiagnosticActive,
    chatSessions,
    currentSessionId,
    isChatHistoryLoading,
    chatSearch,
    editingSessionId,
    editingTitle,
    isArchivesPageOpen,
    selectedArchiveId,
    archiveSessionCache,
    archiveReactions,
    isTransitioning,
    forgeCode,
    professorSubMode,
    professorTopic,
    professorNoteInput,
    traderSubMode,
    specialistData,
    previewUrl,
    showDiff,
    diffData,
    showMatrix,
    activeTab,
    manifestedFiles,
    darwinResults,
    thermalActive,
    modeLayouts,
    componentNudges,
    selectedComponent,
    isMinigameActive,
    minigameScore,
    gameNodes,
    neuralVideoData,
    isVideoPlaying,
    currentVideoScene,
    isNeuralPulseActive,
    particles,
    cameraStatus
  } = appState;
  const setHudOpacity = createAppFieldSetter(dispatchAppState, 'hudOpacity');
  const setNeuralGlowEnabled = createAppFieldSetter(dispatchAppState, 'neuralGlowEnabled');
  const setHolographicTiltEnabled = createAppFieldSetter(dispatchAppState, 'holographicTiltEnabled');
  const setHalalFilterEnabled = createAppFieldSetter(dispatchAppState, 'halalFilterEnabled');
  const setAutoLintEnabled = createAppFieldSetter(dispatchAppState, 'autoLintEnabled');
  const setAuthView = createAppFieldSetter(dispatchAppState, 'authView');
  const setZaireResponseStream = createAppFieldSetter(dispatchAppState, 'zaireResponseStream');
  const setShowResponsePanel = createAppFieldSetter(dispatchAppState, 'showResponsePanel');
  const setIsNeuralInterruptActive = createAppFieldSetter(dispatchAppState, 'isNeuralInterruptActive');
  const setZaireActionFeed = createAppFieldSetter(dispatchAppState, 'zaireActionFeed');
  const setIsUpgradeLoading = createAppFieldSetter(dispatchAppState, 'isUpgradeLoading');
  const setLiveMetrics = createAppFieldSetter(dispatchAppState, 'liveMetrics');
  const setIsOmniBoxOpen = createAppFieldSetter(dispatchAppState, 'isOmniBoxOpen');
  const setOmniInput = createAppFieldSetter(dispatchAppState, 'omniInput');
  const setIsSystemEngaged = createAppFieldSetter(dispatchAppState, 'isSystemEngaged');
  const setActiveMode = createAppFieldSetter(dispatchAppState, 'activeMode');
  const setCustomModes = createAppFieldSetter(dispatchAppState, 'customModes');
  const setActiveCustomMode = createAppFieldSetter(dispatchAppState, 'activeCustomMode');
  const setCustomTasks = createAppFieldSetter(dispatchAppState, 'customTasks');
  const setCustomNotes = createAppFieldSetter(dispatchAppState, 'customNotes');
  const setCustomChatInput = createAppFieldSetter(dispatchAppState, 'customChatInput');
  const setCustomTerminalInput = createAppFieldSetter(dispatchAppState, 'customTerminalInput');
  const setCustomTerminalLines = createAppFieldSetter(dispatchAppState, 'customTerminalLines');
  const setCustomEditorText = createAppFieldSetter(dispatchAppState, 'customEditorText');
  const setCustomKanbanCards = createAppFieldSetter(dispatchAppState, 'customKanbanCards');
  const setZaireStatus = createAppFieldSetter(dispatchAppState, 'zaireStatus');
  const setTimeStr = createAppFieldSetter(dispatchAppState, 'timeStr');
  const setNavItem = createAppFieldSetter(dispatchAppState, 'navItem');
  const setIsSettingsOpen = createAppFieldSetter(dispatchAppState, 'isSettingsOpen');
  const setIsDragging = createAppFieldSetter(dispatchAppState, 'isDragging');
  const setIsMicrophoneActive = createAppFieldSetter(dispatchAppState, 'isMicrophoneActive');
  const setAudioFrequency = createAppFieldSetter(dispatchAppState, 'audioFrequency');
  const setBlobColor = createAppFieldSetter(dispatchAppState, 'blobColor');
  const setBlobSize = createAppFieldSetter(dispatchAppState, 'blobSize');
  const setLastCommand = createAppFieldSetter(dispatchAppState, 'lastCommand');
  const setRecognizedText = createAppFieldSetter(dispatchAppState, 'recognizedText');
  const setFinalRecognizedText = createAppFieldSetter(dispatchAppState, 'finalRecognizedText');
  const setInputValue = createAppFieldSetter(dispatchAppState, 'inputValue');
  const setIsTyping = createAppFieldSetter(dispatchAppState, 'isTyping');
  const setUseGroqSpeech = createAppFieldSetter(dispatchAppState, 'useGroqSpeech');
  const setGroqStatus = createAppFieldSetter(dispatchAppState, 'groqStatus');
  const setIsVisionScanning = createAppFieldSetter(dispatchAppState, 'isVisionScanning');
  const setStoredMemories = createAppFieldSetter(dispatchAppState, 'storedMemories');
  const setMemoryFlash = createAppFieldSetter(dispatchAppState, 'memoryFlash');
  const setIsDiagnosticActive = createAppFieldSetter(dispatchAppState, 'isDiagnosticActive');
  const setChatSessions = createAppFieldSetter(dispatchAppState, 'chatSessions');
  const setCurrentSessionId = createAppFieldSetter(dispatchAppState, 'currentSessionId');
  const setIsChatHistoryLoading = createAppFieldSetter(dispatchAppState, 'isChatHistoryLoading');
  const setChatSearch = createAppFieldSetter(dispatchAppState, 'chatSearch');
  const setEditingSessionId = createAppFieldSetter(dispatchAppState, 'editingSessionId');
  const setEditingTitle = createAppFieldSetter(dispatchAppState, 'editingTitle');
  const setIsArchivesPageOpen = createAppFieldSetter(dispatchAppState, 'isArchivesPageOpen');
  const setSelectedArchiveId = createAppFieldSetter(dispatchAppState, 'selectedArchiveId');
  const setArchiveSessionCache = createAppFieldSetter(dispatchAppState, 'archiveSessionCache');
  const setArchiveReactions = createAppFieldSetter(dispatchAppState, 'archiveReactions');
  const setIsTransitioning = createAppFieldSetter(dispatchAppState, 'isTransitioning');
  const setForgeCode = createAppFieldSetter(dispatchAppState, 'forgeCode');
  const setProfessorSubMode = createAppFieldSetter(dispatchAppState, 'professorSubMode');
  const setProfessorTopic = createAppFieldSetter(dispatchAppState, 'professorTopic');
  const setProfessorNoteInput = createAppFieldSetter(dispatchAppState, 'professorNoteInput');
  const setTraderSubMode = createAppFieldSetter(dispatchAppState, 'traderSubMode');
  const setSpecialistData = createAppFieldSetter(dispatchAppState, 'specialistData');
  const setPreviewUrl = createAppFieldSetter(dispatchAppState, 'previewUrl');
  const setShowDiff = createAppFieldSetter(dispatchAppState, 'showDiff');
  const setDiffData = createAppFieldSetter(dispatchAppState, 'diffData');
  const setShowMatrix = createAppFieldSetter(dispatchAppState, 'showMatrix');
  const setActiveTab = createAppFieldSetter(dispatchAppState, 'activeTab');
  const setManifestedFiles = createAppFieldSetter(dispatchAppState, 'manifestedFiles');
  const setDarwinResults = createAppFieldSetter(dispatchAppState, 'darwinResults');
  const setThermalActive = createAppFieldSetter(dispatchAppState, 'thermalActive');
  const setModeLayouts = createAppFieldSetter(dispatchAppState, 'modeLayouts');
  const setComponentNudges = createAppFieldSetter(dispatchAppState, 'componentNudges');
  const setSelectedComponent = createAppFieldSetter(dispatchAppState, 'selectedComponent');
  const setIsMinigameActive = createAppFieldSetter(dispatchAppState, 'isMinigameActive');
  const setMinigameScore = createAppFieldSetter(dispatchAppState, 'minigameScore');
  const setGameNodes = createAppFieldSetter(dispatchAppState, 'gameNodes');
  const setNeuralVideoData = createAppFieldSetter(dispatchAppState, 'neuralVideoData');
  const setIsVideoPlaying = createAppFieldSetter(dispatchAppState, 'isVideoPlaying');
  const setCurrentVideoScene = createAppFieldSetter(dispatchAppState, 'currentVideoScene');
  const setIsNeuralPulseActive = createAppFieldSetter(dispatchAppState, 'isNeuralPulseActive');
  const setParticles = createAppFieldSetter(dispatchAppState, 'particles');
  const setCameraStatus = createAppFieldSetter(dispatchAppState, 'cameraStatus');

  // ── HUD Customization States ──

  // ── Mode-Specific Advanced Toggles ──

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash.includes('sign-up')) setAuthView('signup');
      else setAuthView('signin');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Real-time Socket states
  const socketRef = useRef(null);
  const responseTimeoutRef = useRef(null);
  const pendingActivationLineRef = useRef(null);


  // Biometric State
  const [securityState, dispatchSecurityState] = useReducer(securityStateReducer, INITIAL_SECURITY_STATE);
  const { biometricData, isSecurityAlert, showSecurityOverlay, activeIntruder } = securityState;
  const intruderSnapshotsRef = useRef([]);




  const isDeepThinkingRef = useRef(false);
  const isMicrophoneActiveRef = useRef(false);

  // Sync state to Ref for persistent event handlers
  useEffect(() => {
    isMicrophoneActiveRef.current = isMicrophoneActive;
  }, [isMicrophoneActive]);

  // Fetch custom modes from PostgreSQL backend on user login
  const fetchCustomModes = React.useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/api/custom_modes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.modes)) {
        const sanitizedModes = data.modes.map(sanitizeCustomModeRecord);
        setCustomModes(sanitizedModes);
        localStorage.setItem(MODE_STORAGE_KEY, JSON.stringify(sanitizedModes));
      }
    } catch (err) {
      console.warn('Failed to fetch custom modes from backend:', err.message);
    }
  }, [getToken]);

  useEffect(() => {
    if (user) {
      fetchCustomModes();
    }
  }, [user, fetchCustomModes]);

  const plasmaMatRef = useRef(null);
  const pMatRef = useRef(null);
  const frequencyBandsRef = useRef([0, 0, 0, 0, 0]);

  const blobPositionRef = useRef(null);
  if (!blobPositionRef.current) {
    const savedBlobPosition = localStorage.getItem(BLOB_POSITION_STORAGE_KEY);
    blobPositionRef.current = savedBlobPosition ? JSON.parse(savedBlobPosition) : { x: 0, y: 0 };
  }

  const activityFeed = DEFAULT_ACTIVITY_FEED;

  const mainGroupRef = useRef(null);
  const blobSizeRef = useRef(blobSize);
  const blobColorRef = useRef(blobColor);
  const uniformsRef = useRef(null);
  const voiceWaveformRef = useRef(null);
  const neuralGaugeRef = useRef(null);
  const traderChartRef = useRef(null);
  const faceMeshCanvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const outputAnalyserRef = useRef(null);
  const outputDataArrayRef = useRef(null);
  const audioStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const sessionUptimeRef = useRef(0);
  const groqSpeechRef = useRef(null);

  // ── New: Vision, Memory, System Actions ──
  const lastSystemActionRef = useRef(null);
  const systemActionLogRef = useRef([]);

  // ── System State Engine ──
  const [specialistVisualState, dispatchSpecialistVisualState] = useReducer(specialistVisualReducer, INITIAL_SPECIALIST_VISUAL_STATE);
  const { engineerPhase, forgeProgress, professorPhase, learningProgress, traderPhase, traderProgress, liveTrades, swarmPhase, swarmMessages } = specialistVisualState;




  const syncSpecialistVisualState = React.useEffectEvent(() => {
    if (!specialistData) return;
    dispatchSpecialistVisualState({ type: 'SYNC_FROM_SPECIALIST_DATA', activeMode, specialistData });
  });

  const lastUserPromptRef = useRef('');

  const handleSpecialistAction = async (mode, action, payload = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}/agent/specialist_action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, action, payload })
      });
      const data = await response.json();
      if (data.success) {
        appendSystemActionLogEntry(systemActionLogRef, {
          time: new Date().toLocaleTimeString(),
          message: data.result.message
        });
      }
    } catch (err) {
      console.error("Specialist action failed:", err);
    }
  };

  // -- Specialist Data Synchronization --
  useEffect(() => {
    if (activeMode === 'ZAIRE') return;

    const fetchStatus = () => {
      if (socketRef.current) {
        socketRef.current.emit('REQUEST_SPECIALIST_SYNC', { mode: activeMode });
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [activeMode]);

  const handleSocketConnectError = React.useEffectEvent((err) => {
    console.error('[SOCKET] Connection error:', err.message);
  });

  const handleAudioChunk = React.useEffectEvent((data) => {
    console.log('[SOCKET] Received audio_chunk:', data.index);
    if (data.index === 0) {
      console.log('[TTS] Sequence Reset detected (index 0)');
      nextExpectedIndexRef.current = 0;
    }
    audioQueueRef.current[data.index] = data;
    playNextAudioChunk();
  });

  const handleAiTextComplete = React.useEffectEvent(() => {
    fetchChatSessions();
  });

  const handleTextChunks = React.useEffectEvent(async ({ chunks }) => {
    console.log('[SOCKET] Received text_chunks:', chunks.length);
    nextExpectedIndexRef.current = 0;
    await Promise.all(chunks.map(async (chunk) => {
      const audioData = await fetchTTSAudio(chunk.text);
      if (audioData) {
        audioQueueRef.current[chunk.index] = { index: chunk.index, audio: audioData, isBase64: false };
        playNextAudioChunk();
      }
    }));
  });

  const handleDeepThinking = React.useEffectEvent((isThinking) => {
    isDeepThinkingRef.current = isThinking;
  });

  const handleSpecialistTelemetry = React.useEffectEvent((data) => {
    console.log('[SOCKET] Specialist Telemetry:', data);
    setSpecialistData(data);
  });

  const handleSystemActionEvent = React.useEffectEvent((action) => {
    lastSystemActionRef.current = action;
    const now = new Date();
    const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2, '0')).join(':');
    let label = '';
    if (action.type === 'mouse') label = `[MOUSE] ${action.action.toUpperCase()} â†’ (${action.x ?? '?'}, ${action.y ?? '?'})`;
    else if (action.type === 'keyboard') label = `[TYPE] "${action.text}"`;
    else if (action.type === 'hotkey') label = `[HOTKEY] ${action.keys.join('+').toUpperCase()}`;
    appendSystemActionLogEntry(systemActionLogRef, { time, label });
  });

  const handleDiagnosticAlert = React.useEffectEvent((active) => {
    setIsDiagnosticActive(active);
  });

  const handleIntruderSnapshots = React.useEffectEvent((data) => {
    if (data.snapshots) intruderSnapshotsRef.current = data.snapshots;
  });

  const handleSystemMetrics = React.useEffectEvent((metrics) => {
    setLiveMetrics(prev => ({ ...prev, ...metrics }));
  });

  const handleSpecialistDataPayload = React.useEffectEvent(({ data }) => {
    setSpecialistData(data);
  });

  const handleZaireActionFeed = React.useEffectEvent((actions) => {
    setZaireActionFeed(actions);
  });

  const socketHandlerRefs = useRef({});

  useEffect(() => {
    syncSpecialistVisualState();
  }, [specialistData, activeMode]);






  const showHallOfFameRef = useRef(false);
  const darwinResetTimeoutRef = useRef(null);
  const customIdRef = useRef(1);

  const fetchDiff = async (filename) => {
    try {
      const res = await fetch(`http://localhost:3002/agent/specialist_action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'ENGINEER', action: 'GIT_DIFF', payload: { filename } })
      });
      const data = await res.json();
      if (data.success) setDiffData(data.result.diff);
    } catch (e) {
      console.error("Diff fetch failed:", e);
    }
  };

  const syncForgeTelemetryState = React.useEffectEvent(() => {
    if (specialistData?.forge_telemetry?.darwin_results) {
      setDarwinResults(specialistData.forge_telemetry.darwin_results);
      if (specialistData.status === 'OK') {
        if (darwinResetTimeoutRef.current) clearTimeout(darwinResetTimeoutRef.current);
        darwinResetTimeoutRef.current = setTimeout(() => setDarwinResults(null), 5000);
      }
    }

    if (specialistData?.recent_files && activeMode === 'ENGINEER') {
      const newFiles = specialistData.recent_files.map(f => ({
        name: f.split(/[\\/]/).pop(),
        code: forgeCode
      }));
      if (newFiles.length > 0 && manifestedFiles.length === 0) {
        setManifestedFiles(newFiles);
      }
    }
  });

  useEffect(() => {
    syncForgeTelemetryState();

    return () => {
      if (darwinResetTimeoutRef.current) clearTimeout(darwinResetTimeoutRef.current);
    };
  }, [specialistData, activeMode, forgeCode]);

  const liveCodeStreamRef = useRef('');
  const professorSlides = PROFESSOR_SLIDES;

  useEffect(() => {
    localStorage.setItem('zaire_mode_layouts_v1', JSON.stringify(modeLayouts));
  }, [modeLayouts]);

  const layoutOffsets = modeLayouts[activeMode] || modeLayouts['ZAIRE'];

  const updateCurrentLayout = (updates) => {
    setModeLayouts(prev => ({
      ...prev,
      [activeMode]: { ...prev[activeMode], ...updates }
    }));
  };


  useEffect(() => {
    localStorage.setItem('zaire_component_nudges_v1', JSON.stringify(componentNudges));
  }, [componentNudges]);

  const systemState = useMemo(() => getNextSystemState({
    biometricData,
    isSecurityAlert,
    isMicrophoneActive,
    isTyping,
    isOmniBoxOpen,
    zaireStatus,
    zaireResponseStream
  }), [biometricData, isSecurityAlert, isMicrophoneActive, isTyping, isOmniBoxOpen, zaireStatus, zaireResponseStream]);

  useEffect(() => {
    localStorage.setItem('zaire_hud_opacity', hudOpacity);
    localStorage.setItem('zaire_neural_glow', neuralGlowEnabled);
    localStorage.setItem('zaire_holographic_tilt', holographicTiltEnabled);
    // Dynamic Color Mapping based on System State
    let stateColor = '#00d4ff'; // Default IDLE (Cyan)
    let stateGlow = 'rgba(0, 212, 255, 0.03)';

    if (systemState === 'LISTENING') {
      stateColor = '#ffffff'; // LISTENING (White)
      stateGlow = 'rgba(255, 255, 255, 0.08)';
    } else if (systemState === 'THINKING') {
      stateColor = '#a78bfa'; // THINKING (Violet)
      stateGlow = 'rgba(167, 139, 250, 0.08)';
    } else if (systemState === 'ALERT') {
      stateColor = '#ff4040'; // ALERT (Red)
      stateGlow = 'rgba(255, 64, 64, 0.1)';
    }

    // Update Three.js Orb Colors if materials are ready
    if (plasmaMatRef.current) {
      plasmaMatRef.current.uniforms.uColorBright.value = new THREE.Color(stateColor);
    }
    if (pMatRef.current) {
      pMatRef.current.uniforms.uColor.value = new THREE.Color(stateColor);
    }

    // Update CSS variables for live preview
    document.documentElement.style.setProperty('--primary', stateColor);
    document.documentElement.style.setProperty('--accent', stateColor);
    document.documentElement.style.setProperty('--bg-glow', stateGlow);
    document.documentElement.style.setProperty('--panel-bg', `rgba(0, 10, 20, ${hudOpacity})`);
    document.documentElement.style.setProperty('--hud-dim-opacity', neuralGlowEnabled ? '1' : '0.6');
    document.documentElement.style.setProperty('--tilt-multiplier', holographicTiltEnabled ? '1' : '0');
  }, [hudOpacity, neuralGlowEnabled, holographicTiltEnabled, systemState]);

  const updateComponentNudge = (id, updates) => {
    setComponentNudges(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { x: 0, y: 0 }), ...updates }
    }));
  };

  const getComponentStyle = (id) => {
    const nudge = componentNudges[id] || { x: 0, y: 0 };
    return {
      transform: `translate(${nudge.x}px, ${nudge.y}px)`,
      transition: 'transform 0.3s ease'
    };
  };

  const artifactTokensRef = useRef([]);
  const pendingArtifactTokensRef = useRef([]);


  // Neural Video State
  const fileInputRef = useRef(null);


  const audioQueueRef = useRef({}); // Using object keyed by index for O(1) lookups
  const isPlayingAudioRef = useRef(false);
  const nextExpectedIndexRef = useRef(0);

  const getNextCustomId = React.useCallback(() => {
    const nextId = customIdRef.current;
    customIdRef.current += 1;
    return nextId;
  }, []);

  const handleOpenEngineerFile = React.useCallback((node) => {
    if (!socketRef.current) return;
    socketRef.current.emit('SPECIALIST_ACTION', {
      mode: 'ENGINEER',
      action: 'OPEN_FILE',
      payload: { filename: node.name }
    });
  }, []);

  const addCustomTask = React.useCallback(() => {
    const title = prompt("Enter task objective:");
    if (!title) return;

    setCustomTasks((prev) => [...prev, {
      id: `task-${getNextCustomId()}`,
      title,
      status: 'pending',
      progress: 0
    }]);
  }, [getNextCustomId]);

  const addCustomNote = React.useCallback((text) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    setCustomNotes((prev) => [
      {
        id: `note-${getNextCustomId()}`,
        time: new Date().toLocaleTimeString().slice(0, 5),
        text: cleanText
      },
      ...prev
    ]);
  }, [getNextCustomId]);

  const playSpatialSound = React.useCallback((type, side = 'center') => {
    // Spatial mapping: -1.0 (left), 0.0 (center), 1.0 (right)
    const panMap = { 'left': -0.8, 'center': 0.0, 'right': 0.8 };
    const pan = panMap[side] || 0.0;

    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      const osc = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();
      const panner = audioContextRef.current.createStereoPanner();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'alert' ? 880 : 440, audioContextRef.current.currentTime);
      gain.gain.setValueAtTime(0.05, audioContextRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.15);
      panner.pan.setValueAtTime(pan, audioContextRef.current.currentTime);

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(audioContextRef.current.destination);

      osc.start();
      osc.stop(audioContextRef.current.currentTime + 0.15);
    }
  }, []);

  const handleModeChange = React.useCallback((newMode, options = {}) => {
    const { emitSocket = true } = options;
    if (newMode === activeMode) return;

    // Digital Dissolve Trigger
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 800);

    setActiveMode(newMode);
    if (emitSocket && socketRef.current) {
      socketRef.current.emit('MODE_CHANGE', { mode: newMode });
    }

    const modeThemes = {
      'ZAIRE': { primary: '#00d4ff', accent: '#00d4ff', bg: 'rgba(0, 212, 255, 0.03)' },
      'TRADER': { primary: '#00ff88', accent: '#ffaa00', bg: 'rgba(0, 255, 136, 0.03)' },
      'PROFESSOR': { primary: '#a78bfa', accent: '#60a5fa', bg: 'rgba(167, 139, 250, 0.03)' },
      'ENGINEER': { primary: '#f97316', accent: '#facc15', bg: 'rgba(249, 115, 22, 0.03)' }
    };

    const theme = modeThemes[newMode] || modeThemes['ZAIRE'];
    setBlobColor(theme.primary);

    document.documentElement.style.setProperty('--bg-glow', theme.bg);

    // Trigger Neural Transition
    if (uniformsRef.current) {
      uniformsRef.current.uTransition.value = 0.0;
    }

    // Spatial Audio Feedback
    playSpatialSound('switch', newMode === 'ZAIRE' ? 'center' : (newMode === 'TRADER' ? 'left' : 'right'));
  }, [activeMode, playSpatialSound]);

  const activateNavbarMode = React.useCallback((modeName) => {
    if (CORE_MODES.includes(modeName)) {
      setActiveCustomMode(null);
      handleModeChange(modeName);
      return;
    }
    const modeDef = customModes.find((m) => m.name === modeName && m.enabled);
    if (!modeDef) return;
    setActiveCustomMode(modeDef.name);
    const activationLine = buildCustomModeActivationLine(modeDef);
    pendingActivationLineRef.current = activationLine;
    setZaireResponseStream(activationLine);
    setShowResponsePanel(true);
    if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
    responseTimeoutRef.current = setTimeout(() => {
      setShowResponsePanel(false);
      setZaireResponseStream('');
    }, 12000);
    // Custom modes run on ZAIRE base layout for full HUD compatibility.
    if (activeMode !== 'ZAIRE') {
      handleModeChange('ZAIRE', { emitSocket: false });
    }
    // Also emit custom mode details to backend with permissions!
    if (socketRef.current) {
      const customModeConfig = buildCustomModeRuntimeConfig(modeDef);
      socketRef.current.emit('MODE_CHANGE', {
        mode: modeDef.name,
        isCustom: true,
        permissions: modeDef.permissions,
        activationLine,
        customModeConfig
      });
    }
  }, [activeMode, customModes, handleModeChange]);

  const handleModeSync = React.useCallback((newMode) => {
    setActiveMode(newMode);

    const modeColors = {
      'ZAIRE': { primary: '#00d4ff', accent: '#00d4ff' },
      'TRADER': { primary: '#00ff88', accent: '#ffaa00' },
      'PROFESSOR': { primary: '#a78bfa', accent: '#60a5fa' },
      'ENGINEER': { primary: '#f97316', accent: '#facc15' }
    };

    const colors = modeColors[newMode] || modeColors['ZAIRE'];
    document.documentElement.style.setProperty('--accent', colors.accent);

    // Trigger Neural Transition
    if (uniformsRef.current) {
      uniformsRef.current.uTransition.value = 0.0;
    }

    playSpatialSound('sync', 'center');

    // Auto-trigger minigame if in Engineer mode and a build is likely starting
    if (newMode === 'ENGINEER') {
      setIsMinigameActive(true);
      spawnGameNodes();
    } else {
      setIsMinigameActive(false);
      setGameNodes([]);
    }
  }, []);

  const spawnKnowledgeParticles = React.useCallback(() => {
    const newParticles = [];
    for (let i = 0; i < 15; i++) {
      const startX = Math.random() * window.innerWidth;
      const startY = Math.random() * window.innerHeight;
      const targetX = window.innerWidth / 2 - startX;
      const targetY = window.innerHeight / 2 - startY;

      newParticles.push({
        id: Math.random(),
        x: startX,
        y: startY,
        tx: targetX,
        ty: targetY
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 2000);
  }, []);

  const spawnGameNodes = () => {
    const nodes = [];
    for (let i = 0; i < 5; i++) {
      nodes.push({
        id: Math.random(),
        top: Math.random() * 80 + 10 + '%',
        left: Math.random() * 80 + 10 + '%',
        size: Math.random() * 20 + 20 + 'px',
        delay: Math.random() * 5 + 's'
      });
    }
    setGameNodes(nodes);
  };

  const handleNodeClick = (id) => {
    setMinigameScore(prev => prev + 100);
    setGameNodes(prev => prev.filter(n => n.id !== id));

    // Ripple effect
    // Removed glitch effect

    // Spawn new node after a delay
    setTimeout(() => {
      setGameNodes(prev => [...prev, {
        id: Math.random(),
        top: Math.random() * 80 + 10 + '%',
        left: Math.random() * 80 + 10 + '%',
        size: Math.random() * 20 + 20 + 'px',
        delay: '0s'
      }]);
    }, 1000);
  };

  // Sync to LOCALSTORAGE for persistence on change
  useEffect(() => {
    localStorage.setItem(BLOB_COLOR_STORAGE_KEY, blobColor);
    localStorage.setItem(BLOB_SIZE_STORAGE_KEY, blobSize);
  }, [blobColor, blobSize]);

  // ── PHASE 3: NEURAL THEME SYNC ─────────────────────
  useEffect(() => {
    const updateNeuralAesthetics = () => {
      const hour = new Date().getHours();
      const isNight = hour >= 19 || hour <= 6;

      // 1. Temporal Shift: Deepen colors at night
      if (isNight) {
        document.documentElement.style.setProperty('--bg-gradient', 'radial-gradient(circle at 50% 50%, #050505 0%, #000000 100%)');
      } else {
        document.documentElement.style.setProperty('--bg-gradient', 'radial-gradient(circle at 50% 50%, #0a0a0a 0%, #020202 100%)');
      }

      // 2. System Telemetry Sync: Glow intensity based on CPU load
      const cpuLoad = liveMetrics.cpu || 0;
      const glowIntensity = 0.3 + (cpuLoad / 100) * 0.7; // Scale 0.3 to 1.0
      document.documentElement.style.setProperty('--glow-opacity', glowIntensity.toFixed(2));

      // 3. Critical Alert: Red shift if CPU > 90%
      if (cpuLoad > 90) {
        document.documentElement.style.setProperty('--primary-glow', 'rgba(255, 0, 51, 0.6)');
      } else {
        document.documentElement.style.setProperty('--primary-glow', 'var(--bg-glow)');
      }
    };

    updateNeuralAesthetics();
    const interval = setInterval(updateNeuralAesthetics, 5000);
    return () => clearInterval(interval);
  }, [liveMetrics, timeStr]);

  // Function to fetch TTS audio via HTTP
  const fetchTTSAudio = React.useEffectEvent(async (text) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, pitch: '+0Hz', rate: '+5%' })
      });

      if (!response.ok) {
        throw new Error(`TTS HTTP error: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (err) {
      console.error('[TTS HTTP] Failed:', err);
      return null;
    }
  });

  const playNextAudioChunk = React.useEffectEvent(async () => {
    if (isPlayingAudioRef.current) return;

    const nextIndex = nextExpectedIndexRef.current;
    const chunk = audioQueueRef.current[nextIndex];

    if (!chunk) {
      console.log(`[TTS] Sequence break - waiting for chunk ${nextIndex}`);
      return;
    }

    // Safety check for valid audio data
    if (!chunk.audio) {
      console.error('[TTS] Null audio in chunk, skipping:', nextIndex);
      delete audioQueueRef.current[nextIndex];
      nextExpectedIndexRef.current++;
      playNextAudioChunk();
      return;
    }

    isPlayingAudioRef.current = true;
    console.log(`[TTS] Beginning playback of chunk ${nextIndex}`);

    let audioData;
    if (chunk.isBase64) {
      const binaryString = atob(chunk.audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      audioData = bytes;
    } else {
      audioData = new Uint8Array(chunk.audio);
    }

    let url = null;
    try {
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (!outputAnalyserRef.current) {
        outputAnalyserRef.current = audioContextRef.current.createAnalyser();
        outputAnalyserRef.current.fftSize = 256;
        outputDataArrayRef.current = new Uint8Array(outputAnalyserRef.current.frequencyBinCount);
      }

      try {
        const source = audioContextRef.current.createMediaElementSource(audio);
        source.connect(outputAnalyserRef.current);
        outputAnalyserRef.current.connect(audioContextRef.current.destination);
      } catch (e) {
        // MediaElementSource might already be created if using same audio element, but we create new Audio() above.
      }

      const onFinished = () => {
        if (url) URL.revokeObjectURL(url);
        delete audioQueueRef.current[nextIndex];
        isPlayingAudioRef.current = false;
        nextExpectedIndexRef.current++;
        console.log(`[TTS] Finished chunk ${nextIndex}, next expected is ${nextExpectedIndexRef.current}`);
        playNextAudioChunk();
      };

      audio.onended = onFinished;
      audio.onerror = (e) => {
        console.error(`[TTS] Playback error on chunk ${nextIndex}:`, e);
        onFinished();
      };

      await audio.play();
    } catch (err) {
      console.error(`[TTS] Critical error playing chunk ${nextIndex}:`, err);
      // If error is related to user-gesture, we can flag the system as disengaged
      if (err.name === 'NotAllowedError') {
        setIsSystemEngaged(false);
      }
      isPlayingAudioRef.current = false;
      nextExpectedIndexRef.current++;
      playNextAudioChunk();
    }
  });

  useEffect(() => {
    fetchChatSessions();
  }, []);

  useEffect(() => {
    localStorage.setItem(MODE_STORAGE_KEY, JSON.stringify(customModes));
  }, [customModes]);

  useEffect(() => {
    localStorage.setItem('zaire_archive_reactions_v1', JSON.stringify(archiveReactions));
  }, [archiveReactions]);

  const fetchChatSessions = useCallback(async () => {
    try {
      const data = await fetchJsonOrThrow(`${API_BASE_URL}/chats`);
      if (data.success) {
        setChatSessions(data.sessions);
      }
    } catch (e) {
      console.warn('Failed to fetch chat sessions:', e.message);
    }
  }, []);

  const handleNewChat = () => {
    if (socketRef.current) {
      socketRef.current.emit('new_chat');
      setZaireResponseStream('');
    }
  };

  const handleLoadSession = (sessionId) => {
    if (socketRef.current) {
      socketRef.current.emit('load_session', { sessionId });
      setIsArchivesPageOpen(false);
    }
  };

  const loadArchiveSessionDetail = React.useCallback(async (sessionId) => {
    if (!sessionId || archiveSessionCache[sessionId]) return archiveSessionCache[sessionId];
    try {
      const data = await fetchJsonOrThrow(`${API_BASE_URL}/chats/${sessionId}`);
      if (data.success && data.session) {
        setArchiveSessionCache(prev => ({ ...prev, [sessionId]: data.session }));
        return data.session;
      }
    } catch (e) {
      console.warn('Failed to load archive session detail:', e.message);
    }
    return null;
  }, [archiveSessionCache]);

  useEffect(() => {
    if (!isArchivesPageOpen) return;
    if (!selectedArchiveId && chatSessions.length > 0) {
      setSelectedArchiveId(chatSessions[0].id);
      loadArchiveSessionDetail(chatSessions[0].id);
    }
  }, [isArchivesPageOpen, chatSessions, selectedArchiveId, loadArchiveSessionDetail]);

  const transcriptFromSession = (session) => {
    if (!session?.messages) return '';
    return session.messages
      .map(m => `${m.role === 'user' ? 'USER' : 'ZAIRE'}: ${m.content}`)
      .join('\n\n');
  };

  const handleArchiveCopy = async (sessionId) => {
    const detail = await loadArchiveSessionDetail(sessionId);
    if (!detail) return;
    const transcript = transcriptFromSession(detail);
    if (!transcript) return;
    try {
      await navigator.clipboard.writeText(transcript);
      appendSystemActionLogEntry(systemActionLogRef, {
        time: new Date().toLocaleTimeString(),
        message: `ARCHIVE COPIED: ${detail.title || sessionId}`
      });
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const handleArchiveShare = async (sessionId) => {
    const detail = await loadArchiveSessionDetail(sessionId);
    if (!detail) return;
    const transcript = transcriptFromSession(detail);
    const payload = {
      title: `ZAIRE Archive: ${detail.title || 'Untitled Chat'}`,
      text: transcript.slice(0, 4000)
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
      } else {
        await navigator.clipboard.writeText(payload.text);
      }
      appendSystemActionLogEntry(systemActionLogRef, {
        time: new Date().toLocaleTimeString(),
        message: `ARCHIVE SHARED: ${detail.title || sessionId}`
      });
    } catch (e) {
      console.error('Share failed:', e);
    }
  };

  const handleArchiveReaction = (sessionId, reaction) => {
    setArchiveReactions(prev => ({ ...prev, [sessionId]: reaction }));
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (window.confirm('Erase this neural thread from memory?')) {
      try {
        await fetch(`${API_BASE_URL}/chats/${sessionId}`, { method: 'DELETE' });
        fetchChatSessions();
        if (currentSessionId === sessionId) {
          handleNewChat();
        }
      } catch (e) {
        console.error('Failed to delete session:', e);
      }
    }
  };

  const handleRenameSession = (sessionId, newTitle) => {
    if (socketRef.current) {
      socketRef.current.emit('rename_session', { sessionId, title: newTitle });
    }
  };

  const loadInitialSystemData = React.useCallback(() => {
    fetchJsonOrThrow(`${API_BASE_URL}/memories`)
      .then(data => {
        if (Array.isArray(data)) setStoredMemories(data.slice(0, 5));
      })
      .catch(() => { });

    fetchJsonOrThrow(`${API_BASE_URL}/config`)
      .then(res => {
        if (res.success && res.data) {
          console.log('[SYSTEM] Restored HUD config from core.');
          if (res.data.blobColor) setBlobColor(res.data.blobColor);
          if (res.data.blobSize) setBlobSize(res.data.blobSize);
          if (res.data.blobPosition) syncBlobPosition(blobPositionRef, res.data.blobPosition, mainGroupRef);
        }
      })
      .catch(() => { });
  }, []);

  // Load memories and system config from backend on startup
  useEffect(() => {
    loadInitialSystemData();
  }, [loadInitialSystemData]);

  const handleSocketConnect = React.useEffectEvent(() => {
    console.log('[SOCKET] Connected to backend');
    socketRef.current.emit('REQUEST_SYNC');
  });

  const handleModeSyncEvent = React.useEffectEvent((data) => {
    console.log('[SOCKET] System Sync:', data.mode);
    if (data.mode) handleModeSync(data.mode);
  });

  const handleSessionStarted = React.useEffectEvent((data) => {
    setCurrentSessionId(data.sessionId);
    fetchChatSessions();
  });

  const handleSessionRenamed = React.useEffectEvent(({ sessionId }) => {
    fetchChatSessions();
    if (currentSessionId === sessionId) {
      // Optional: update anything else related to current session
    }
  });

  const handleSessionLoaded = React.useEffectEvent((session) => {
    setCurrentSessionId(session.id);
    const historyText = session.messages
      .map(m => `${m.role === 'user' ? 'USER' : 'ZAIRE'}: ${m.content}`)
      .join('\n\n');
    setZaireResponseStream(historyText);
    setShowResponsePanel(true);
  });

  const handleSocketAiError = React.useEffectEvent((err) => {
    const msg = typeof err === 'string' ? err : (err.message || "Unknown neural link error");
    console.error('[SOCKET] AI Error:', msg);
    appendSystemActionLogEntry(systemActionLogRef, {
      time: new Date().toLocaleTimeString(),
      message: `ERR: ${msg}`
    });
  });

  const handleTextDelta = React.useEffectEvent((delta) => {
    setZaireResponseStream(prev => {
      if (pendingActivationLineRef.current && delta === pendingActivationLineRef.current) {
        const currentActivationLine = pendingActivationLineRef.current;
        pendingActivationLineRef.current = null;
        return prev === currentActivationLine ? prev : (prev || delta);
      }
      const next = prev + delta;
      if (next.includes('[NEURAL_VIDEO_PAYLOAD]')) {
        const parts = next.split('[NEURAL_VIDEO_PAYLOAD]');
        try {
          const jsonStr = parts[1].trim().split('\n')[0];
          const data = JSON.parse(jsonStr);
          setNeuralVideoData(data);
          setIsVideoPlaying(true);
          console.log('[PROFESSOR] Neural Video Payload Received:', data);
        } catch (e) {
          console.error('Failed to parse video payload:', e);
        }
        return parts[0];
      }

      if (next.includes('[NEURAL_PULSE_TRIGGER]')) {
        setIsNeuralPulseActive(true);
        setTimeout(() => setIsNeuralPulseActive(false), 2000);
        return next.replace('[NEURAL_PULSE_TRIGGER]', '');
      }

      if (next.includes('breakthrough') || next.includes('correct') || next.includes('excellent')) {
        spawnKnowledgeParticles();
      }

      if (next.includes('```')) {
        const codeBlocks = next.match(/```[\s\S]*?```/g);
        if (codeBlocks && codeBlocks.length > 0) {
          const lastBlock = codeBlocks[codeBlocks.length - 1];
          const cleaned = lastBlock.replace(/```[a-zA-Z]*\n?/, '').replace(/```$/, '');
          liveCodeStreamRef.current = cleaned;
        } else if (next.includes('```')) {
          const partial = next.split('```').pop().replace(/^[a-zA-Z]*\n?/, '');
          liveCodeStreamRef.current = partial;
        }
      }

      return next;
    });
    setShowResponsePanel(true);
    if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
    responseTimeoutRef.current = setTimeout(() => {
      setShowResponsePanel(false);
      setZaireResponseStream('');
    }, 12000);
  });

  const handleZaireStatus = React.useEffectEvent((status) => {
    setZaireStatus(status);
    setIsVisionScanning(status === 'scanning');
  });

  const handleMemoryStored = React.useEffectEvent(({ text }) => {
    const ts = new Date().toISOString();
    setStoredMemories(prev => [{ id: Date.now(), timestamp: ts, text }, ...prev].slice(0, 5));
    setMemoryFlash(true);
    setTimeout(() => setMemoryFlash(false), 2000);
  });

  const handleNeuralLog = React.useEffectEvent((data) => {
    if (data && data.content) {
      const now = new Date();
      const time = [now.getHours(), now.getMinutes()].map(n => String(n).padStart(2, '0')).join(':');
      setZaireActionFeed(prev => [{ time, message: data.content }, ...prev].slice(0, 5));
    }
  });

  const handleSystemAction = React.useEffectEvent((action) => {
    lastSystemActionRef.current = action;
    const now = new Date();
    const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2, '0')).join(':');
    let label = '';
    if (action.type === 'mouse') label = `[MOUSE] ${action.action.toUpperCase()} → (${action.x ?? '?'}, ${action.y ?? '?'})`;
    else if (action.type === 'keyboard') label = `[TYPE] "${action.text}"`;
    else if (action.type === 'hotkey') label = `[HOTKEY] ${action.keys.join('+').toUpperCase()}`;
    appendSystemActionLogEntry(systemActionLogRef, { time, label });
  });

  const handleNeuralInterrupt = React.useEffectEvent((data) => {
    const { text, type } = data;
    console.log(`[PROACTIVE] ${type}: ${text}`);
    setZaireResponseStream(text);
    setShowResponsePanel(true);
    setIsNeuralInterruptActive(true);
    if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
    responseTimeoutRef.current = setTimeout(() => {
      setShowResponsePanel(false);
      setZaireResponseStream('');
      setIsNeuralInterruptActive(false);
    }, 10000);
  });

  const handleIntruderDetected = React.useEffectEvent((data) => {
    console.log('[SECURITY] 🚨 INTRUDER DETECTED!!', data);
    dispatchSecurityState({ type: 'INTRUDER_DETECTED', intruder: data });
    setZaireResponseStream('🚨 SECURITY ALERT: UNKNOWN USER DETECTED AT YOUR SYSTEM! SNAPSHOT CAPTURED.');
    setShowResponsePanel(true);
    setTimeout(() => {
      dispatchSecurityState({ type: 'HIDE_SECURITY_OVERLAY' });
    }, 10000);
  });

  socketHandlerRefs.current = {
    handleSocketConnect,
    handleModeSyncEvent,
    handleSessionStarted,
    handleSessionRenamed,
    handleSessionLoaded,
    handleSocketAiError,
    handleSocketConnectError,
    handleTextDelta,
    handleAudioChunk,
    handleAiTextComplete,
    handleTextChunks,
    handleZaireStatus,
    handleDeepThinking,
    handleMemoryStored,
    handleNeuralLog,
    handleSpecialistTelemetry,
    handleDiagnosticAlert,
    handleNeuralInterrupt,
    handleIntruderDetected,
    handleIntruderSnapshots,
    handleSystemMetrics,
    handleSpecialistDataPayload,
    handleZaireActionFeed
  };

  useEffect(() => {
    socketRef.current = io(`${API_BASE_URL}`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000
    });

    socketRef.current.on('connect', (...args) => socketHandlerRefs.current.handleSocketConnect(...args));

    socketRef.current.on('MODE_SYNC', (...args) => socketHandlerRefs.current.handleModeSyncEvent(...args));

    socketRef.current.on('session_started', (...args) => socketHandlerRefs.current.handleSessionStarted(...args));

    socketRef.current.on('session_renamed', (...args) => socketHandlerRefs.current.handleSessionRenamed(...args));

    socketRef.current.on('session_loaded', (...args) => socketHandlerRefs.current.handleSessionLoaded(...args));

    socketRef.current.on('ai_error', (...args) => socketHandlerRefs.current.handleSocketAiError(...args));

    socketRef.current.on('connect_error', (...args) => socketHandlerRefs.current.handleSocketConnectError(...args));

    socketRef.current.on('ai_text_delta', (...args) => socketHandlerRefs.current.handleTextDelta(...args));

    socketRef.current.on('audio_chunk', (...args) => socketHandlerRefs.current.handleAudioChunk(...args));

    socketRef.current.on('ai_text_complete', (...args) => socketHandlerRefs.current.handleAiTextComplete(...args));

    // Handle text chunks - fetch audio via HTTP for each chunk
    socketRef.current.on('text_chunks', (...args) => socketHandlerRefs.current.handleTextChunks(...args));

    // Vision status
    socketRef.current.on('zaire_status', (...args) => socketHandlerRefs.current.handleZaireStatus(...args));

    // Deep thinking status
    socketRef.current.on('deep_thinking', (...args) => socketHandlerRefs.current.handleDeepThinking(...args));

    // Memory stored event
    socketRef.current.on('memory_stored', (...args) => socketHandlerRefs.current.handleMemoryStored(...args));

    // Neural Log events from Agent Daemon
    socketRef.current.on('neural_log', (...args) => socketHandlerRefs.current.handleNeuralLog(...args));

    socketRef.current.on('SPECIALIST_DATA', (...args) => socketHandlerRefs.current.handleSpecialistTelemetry(...args));


    // System action events (mouse/keyboard)
    socketRef.current.on('system_action', (action) => {
      lastSystemActionRef.current = action;
      const now = new Date();
      const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2, '0')).join(':');
      let label = '';
      if (action.type === 'mouse') label = `[MOUSE] ${action.action.toUpperCase()} → (${action.x ?? '?'}, ${action.y ?? '?'})`;
      else if (action.type === 'keyboard') label = `[TYPE] "${action.text}"`;
      else if (action.type === 'hotkey') label = `[HOTKEY] ${action.keys.join('+').toUpperCase()}`;
      appendSystemActionLogEntry(systemActionLogRef, { time, label });
    });

    // Proactive Briefing & Diagnostic Pulse
    socketRef.current.on('diagnostic_alert', (...args) => socketHandlerRefs.current.handleDiagnosticAlert(...args));

    socketRef.current.on('neural_interrupt', (...args) => socketHandlerRefs.current.handleNeuralInterrupt(...args));

    // Tier 5: Intruder Detection
    socketRef.current.on('intruder_detected', (...args) => socketHandlerRefs.current.handleIntruderDetected(...args));

    socketRef.current.on('intruder_snapshots', (...args) => socketHandlerRefs.current.handleIntruderSnapshots(...args));

    // Tier 7: HUD Live Telemetry
    socketRef.current.on('system_metrics', (...args) => socketHandlerRefs.current.handleSystemMetrics(...args));

    socketRef.current.on('SPECIALIST_DATA', (...args) => socketHandlerRefs.current.handleSpecialistDataPayload(...args));

    socketRef.current.on('zaire_action_feed', (...args) => socketHandlerRefs.current.handleZaireActionFeed(...args));

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off();
      }
    };
  }, []);

  // NOTE: Direct browser camera access is disabled to prevent hardware contention 
  // with the Tier 5 Face Security Daemon (Python). Only one process can hold the camera lock.
  useEffect(() => {
    setCameraStatus('authorized'); // Assume authorized since backend daemon is handling it
    return () => { };
  }, []);

  const pollBiometrics = React.useEffectEvent(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/security/status`);
      const data = await res.json();
      if (data.success) {
        dispatchSecurityState({ type: 'SYNC_STATUS', data });
      }
    } catch (e) {
      // Security daemon offline?
    }
  });

  const toggleSecuritySystem = useCallback(async (disabled) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/security/status/toggle_system`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabled })
      });
      const data = await res.json();
      if (data.success) {
        dispatchSecurityState({ type: 'SET_DISABLED', disabled });
      }
    } catch (e) {
      console.error("Failed to toggle security:", e);
    }
  }, []);

  const fetchSpecialistData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/agent/specialist_data?mode=${activeMode}`);
      const data = await res.json();
      if (data.success) {
        setSpecialistData(data.data || { active_persona: 'STARK_GRADE', forge_telemetry: {}, active_projects: [] });
      }
    } catch (e) {
      console.error('Failed to fetch specialist data:', e);
    }
  }, [activeMode]);

  useEffect(() => {
    window.toggleSecuritySystem = toggleSecuritySystem; // Expose for SettingsModal if needed

    const biometricInterval = setInterval(pollBiometrics, 3000);



    const handlePersist = (event) => {
      const incoming = event?.detail || {};
      const storedBlobColor = localStorage.getItem(BLOB_COLOR_STORAGE_KEY);
      const storedBlobSize = localStorage.getItem(BLOB_SIZE_STORAGE_KEY);
      const storedBlobPosition = localStorage.getItem(BLOB_POSITION_STORAGE_KEY);
      if (socketRef.current) {
        socketRef.current.emit('SAVE_CONFIG', {
          blobColor: normalizeHexColor(storedBlobColor),
          blobSize: parseFloat(storedBlobSize || '1.0'),
          blobPosition: JSON.parse(storedBlobPosition || '{"x":0,"y":0}'),
          ...incoming
        });
      }
    };
    window.addEventListener('ZAIRE_PERSIST_CONFIG', handlePersist);

    return () => {
      clearInterval(biometricInterval);
      window.removeEventListener('ZAIRE_PERSIST_CONFIG', handlePersist);
      delete window.toggleSecuritySystem;
    };
  }, [toggleSecuritySystem]);

  // Poll for specialist data
  useEffect(() => {
    if (activeMode === 'ZAIRE') {
      setSpecialistData({ active_persona: 'STARK_GRADE', forge_telemetry: {}, active_projects: [] });
      return;
    }

    fetchSpecialistData();
    const interval = setInterval(fetchSpecialistData, 5000);
    return () => clearInterval(interval);
  }, [activeMode, fetchSpecialistData]);

  // Sync refs so the animation loop and blob-update effect always read latest values
  useEffect(() => {
    blobSizeRef.current = blobSize;
    blobColorRef.current = blobColor;
    localStorage.setItem(BLOB_COLOR_STORAGE_KEY, blobColor);
    localStorage.setItem(BLOB_SIZE_STORAGE_KEY, blobSize.toString());

    if (uniformsRef.current && blobColor) {
      const baseColor = new THREE.Color(blobColor);
      const hsl = {};
      baseColor.getHSL(hsl);
      const bright = baseColor.clone();
      const mid = new THREE.Color().setHSL(hsl.h, hsl.s, Math.max(0, hsl.l - 0.2));
      const deep = new THREE.Color().setHSL(hsl.h, hsl.s, Math.max(0, hsl.l - 0.4));

      uniformsRef.current.uColorBright.value = bright;
      uniformsRef.current.uColorMid.value = mid;
      uniformsRef.current.uColorDeep.value = deep;
    }
  }, [blobColor, blobSize]);

  const updateBlobPositionFromPointer = (clientX, clientY) => {
    const camera = cameraRef.current;
    if (!camera) return;

    const ndc = new THREE.Vector3(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1,
      0.5
    );

    ndc.unproject(camera);
    const direction = ndc.sub(camera.position).normalize();
    if (Math.abs(direction.z) < 1e-6) return;

    const distance = -camera.position.z / direction.z;
    const worldPoint = camera.position.clone().add(direction.multiplyScalar(distance));
    dragStateRef.current.tempPosition = { x: worldPoint.x, y: worldPoint.y };

    if (mainGroupRef.current) {
      mainGroupRef.current.position.set(worldPoint.x, worldPoint.y, 0);
    }
  };

  const handleDragPointerDown = (e) => {
    if (!isDragging) return;
    dragStateRef.current.isPointerDown = true;
    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    updateBlobPositionFromPointer(e.clientX, e.clientY);
  };

  const handleDragPointerMove = (e) => {
    if (!isDragging || !dragStateRef.current.isPointerDown) return;
    updateBlobPositionFromPointer(e.clientX, e.clientY);
  };

  const handleDragPointerUp = (e) => {
    dragStateRef.current.isPointerDown = false;
    if (e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const initializeMicrophone = async () => {
    try {
      if (useGroqSpeech) {
        // Use Groq Whisper API for better multilingual support
        setGroqStatus('Starting…');
        console.log('Starting Groq speech service...');
        groqSpeechRef.current = new GroqSpeechService(
          (text) => {
            console.log('Groq transcript received:', text);
            setGroqStatus('Transcribed!');
            setFinalRecognizedText(text);

            // Send to Real-time Backend - include pending artifacts
            console.log('[DEBUG] Voice (Groq) sending with artifacts:', pendingArtifactTokensRef.current.length, pendingArtifactTokensRef.current);
            setZaireResponseStream('');
            const allArtifacts = [...artifactTokensRef.current, ...pendingArtifactTokensRef.current];
            if (socketRef.current) {
              socketRef.current.emit('user_message', text, { artifactTokens: allArtifacts });
            }

            // Move pending artifacts to active
            if (pendingArtifactTokensRef.current.length > 0) {
              artifactTokensRef.current = [...artifactTokensRef.current, ...pendingArtifactTokensRef.current];
              pendingArtifactTokensRef.current = [];
            }

            setLastCommand(text);
            lastUserPromptRef.current = text;
            setTimeout(() => setFinalRecognizedText(''), 2000);
          },
          (interim) => {
            console.log('Groq interim:', interim);
            setGroqStatus('Listening…');
            setRecognizedText(interim);
          },
          (error) => {
            console.error('Groq error:', error);
            setGroqStatus('Error: ' + error);
          }
        );

        setGroqStatus('Connecting…');
        const started = await groqSpeechRef.current.start();
        console.log('Groq started:', started);
        if (started) {
          setIsMicrophoneActive(true);
          setGroqStatus('GROQ Active');
        } else {
          setGroqStatus('Failed - using browser');
          // Fallback to browser speech
          setUseGroqSpeech(false);
          alert('Groq failed. Using browser speech instead.');
          // Try browser mode
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          }
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStreamRef.current = stream;
          startSpeechRecognition();
          setIsMicrophoneActive(true);
        }
      } else {
        // Use browser Web Speech API (free, real-time)
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;

        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyser);

        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;

        startSpeechRecognition();
        setIsMicrophoneActive(true);
      }
    } catch (error) {
      console.error('Microphone access denied:', error);
      setIsMicrophoneActive(false);
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) { }
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;

    // Try to detect language automatically, fallback to multi-language model
    // Using local match for broader language support
    const getBestLanguage = () => {
      try {
        const lang = navigator.language || 'en-US';
        // Try browser language first
        if (lang.startsWith('ur')) return 'ur-PK';
        if (lang.startsWith('en')) return 'en-US';
        if (lang.startsWith('es')) return 'es-ES';
        if (lang.startsWith('fr')) return 'fr-FR';
        if (lang.startsWith('de')) return 'de-DE';
        if (lang.startsWith('zh')) return 'zh-CN';
        if (lang.startsWith('ja')) return 'ja-JP';
        if (lang.startsWith('ko')) return 'ko-KR';
        if (lang.startsWith('ar')) return 'ar-SA';
        if (lang.startsWith('hi')) return 'hi-IN';
        if (lang.startsWith('pt')) return 'pt-BR';
        if (lang.startsWith('ru')) return 'ru-RU';
        // Fallback to universal language code
        return 'en-US';
      } catch (e) {
        return 'en-US';
      }
    };

    recognition.lang = getBestLanguage();

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        setRecognizedText(interimTranscript);
      } else if (finalTranscript.trim()) {
        const text = finalTranscript.trim();
        setFinalRecognizedText(text);

        // Send to Real-time Backend - include pending artifacts
        console.log('[DEBUG] Voice (browser) sending with artifacts:', pendingArtifactTokensRef.current.length, pendingArtifactTokensRef.current);
        setZaireResponseStream('');
        const allArtifacts = [...artifactTokensRef.current, ...pendingArtifactTokensRef.current];
        if (socketRef.current) {
          socketRef.current.emit('user_message', text, { artifactTokens: allArtifacts });
        }

        // Move pending artifacts to active
        if (pendingArtifactTokensRef.current.length > 0) {
          artifactTokensRef.current = [...artifactTokensRef.current, ...pendingArtifactTokensRef.current];
          pendingArtifactTokensRef.current = [];
        }

        setLastCommand(text);
        lastUserPromptRef.current = text;

        setTimeout(() => {
          setFinalRecognizedText('');
        }, 1500);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        console.log('[SPEECH] Silence detected, re-syncing...');
      } else {
        console.error('Speech recognition error:', event.error);
      }
      // We no longer restart here to avoid race conditions with onend
    };

    recognition.onend = () => {
      console.log('[SPEECH] Recognition service disconnected');

      // If the microphone should be active, try to restart with a safe delay
      if (isMicrophoneActiveRef.current) {
        console.log('[SPEECH] Waiting for stable audio channel before restart...');

        // Use a longer delay to prevent the 'aborted' infinite loop
        setTimeout(() => {
          if (isMicrophoneActiveRef.current) {
            try {
              recognition.start();
              console.log('[SPEECH] Voice link re-established.');
            } catch (e) {
              // If the object is in a bad state, do a full reset
              console.warn('[SPEECH] Soft restart failed, attempting full reset...');
              startSpeechRecognition();
            }
          }
        }, 400); // 400ms is safer for most browser/OS drivers
      }
    };

    recognition.start();
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const formData = new FormData();
    files.forEach(file => formData.append('artifacts', file));

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        // Store as pending - will be sent with next user message
        pendingArtifactTokensRef.current = [...pendingArtifactTokensRef.current, ...result.manifest];
        // Switch mode to ARTIFACT if it's the first upload
        if (activeMode !== 'ARTIFACT') {
          handleModeChange('ARTIFACT');
        }
      }
    } catch (err) {
      console.error('[UPLINK] Upload failed:', err);
    }
  };


  const stopMicrophone = () => {
    setGroqStatus('');
    if (groqSpeechRef.current) {
      groqSpeechRef.current.stop();
      groqSpeechRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) { }
      recognitionRef.current = null;
    }
    setIsMicrophoneActive(false);
    setRecognizedText('');
  };

  const toggleMicrophone = () => {
    if (isMicrophoneActive) {
      stopMicrophone();
    } else {
      initializeMicrophone();
    }
  };

  useEffect(() => {
    const params = {
      timeScale: 0.78,
      rotationSpeedX: 0.0012,
      rotationSpeedY: 0.004,
      plasmaScale: 0.1504,
      plasmaBrightness: 1.5,
      voidThreshold: 0.05,
      colorDeep: 0x000833,
      colorMid: 0x0044ff,
      colorBright: 0x00ccff,
      shellColor: 0x0088ff,
      shellOpacity: 0.35
    };

    // Use the state blobColor, not localStorage - this is reactively updated when color picker changes
    const blobColorToUse = blobColor || DEFAULT_BLOB_COLOR;

    const noiseFunctions = `
      vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
      vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
      vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
      vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
      float snoise(vec3 v){
        vec2 C=vec2(1.0/6.0,1.0/3.0);
        vec4 D=vec4(0.0,0.5,1.0,2.0);
        vec3 i=mod289(floor(v+dot(v,C.yyy)));
        vec3 x0=v-i+dot(i,C.xxx);
        vec3 g=step(x0.yzx,x0.xyz);
        vec3 l=1.0-g;
        vec3 i1=min(g.xyz,l.zxy);
        vec3 i2=max(g.xyz,l.zxy);
        vec3 x1=x0-i1+C.xxx;
        vec3 x2=x0-i2+C.yyy;
        vec3 x3=x0-D.yyy;
        vec4 p=permute(permute(permute(
          i.z+vec4(0.0,i1.z,i2.z,1.0)
          +i.y+vec4(0.0,i1.y,i2.y,1.0)
          +i.x+vec4(0.0,i1.x,i2.x,1.0))
        ));
        float n_=0.142857142857;
        vec4 ns=vec4(n_*D.w,n_*D.y,n_*D.z,n_*D.x)-vec4(0.0,0.0,D.x,D.x);
        vec4 j=p-ns.z*ns.z*floor(p*ns.z*ns.z);
        vec4 x_=floor(j*ns.z);
        vec4 y_=floor(j-ns.w*7.0*x_);
        vec4 x=x_+0.5*floor(y_*ns.x+vec4(0.0,ns.x,0.0,0.0));
        vec4 y=y_+0.5*floor(x_*ns.x+vec4(0.0,ns.x,0.0,0.0));
        vec4 h=1.0-abs(x)-abs(y);
        vec4 b0=vec4(x.xy,y.xy);
        vec4 b1=vec4(x.zw,y.zw);
        vec4 s0=floor(b0)*2.0+1.0;
        vec4 s1=floor(b1)*2.0+1.0;
        vec4 sh=-step(h,vec4(0.0));
        vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
        vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
        vec3 p0=vec3(a0.xy,h.x);
        vec3 p1=vec3(a0.zw,h.y);
        vec3 p2=vec3(a1.xy,h.z);
        vec3 p3=vec3(a1.zw,h.w);
        vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
        p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
        vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
        m=m*m;
        return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
      }
      float fbm(vec3 p){
        float total=0.0;float amplitude=0.5;float frequency=1.0;
        for(int i=0;i<3;i++){total+=snoise(p*frequency)*amplitude;amplitude*=0.5;frequency*=2.0;}
        return total;
      }
    `;

    const canvas = threeCanvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 4.2;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.setClearColor(0x000000, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 1.5;
    controls.maxDistance = 6;

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);
    mainGroupRef.current = mainGroup;

    const pointLight = new THREE.PointLight(0x0088ff, 2.0, 10);
    mainGroup.add(pointLight);

    const shellGeo = new THREE.SphereGeometry(1.0, 64, 64);
    const shellVert = `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main(){
        vNormal=normalize(normalMatrix*normal);
        vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
        vViewPosition=-mvPosition.xyz;
        gl_Position=projectionMatrix*mvPosition;
      }`;
    const shellFrag = `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      uniform vec3 uColor;
      uniform float uOpacity;
      void main(){
        float fresnel=pow(1.0-dot(normalize(vNormal),normalize(vViewPosition)),2.5);
        gl_FragColor=vec4(uColor,fresnel*uOpacity);
      }`;

    const shellBackMat = new THREE.ShaderMaterial({
      vertexShader: shellVert, fragmentShader: shellFrag,
      uniforms: { uColor: { value: new THREE.Color(0x000055) }, uOpacity: { value: 0.3 } },
      transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false
    });
    const shellFrontMat = new THREE.ShaderMaterial({
      vertexShader: shellVert, fragmentShader: shellFrag,
      uniforms: { uColor: { value: new THREE.Color(params.shellColor) }, uOpacity: { value: params.shellOpacity } },
      transparent: true, blending: THREE.AdditiveBlending, side: THREE.FrontSide, depthWrite: false
    });
    mainGroup.add(new THREE.Mesh(shellGeo, shellBackMat));
    mainGroup.add(new THREE.Mesh(shellGeo, shellFrontMat));

    const plasmaGeo = new THREE.SphereGeometry(0.998, 128, 128);
    const plasmaMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTransition: { value: 1.0 },
        uScale: { value: params.plasmaScale },
        uBrightness: { value: params.plasmaBrightness },
        uThreshold: { value: params.voidThreshold },
        uColorDeep: { value: new THREE.Color(params.colorDeep) },
        uColorMid: { value: new THREE.Color(params.colorMid) },
        uColorBright: { value: new THREE.Color(params.colorBright) },
        uAudioBass: { value: 0 },
        uAudioMid: { value: 0 },
        uAudioTreble: { value: 0 },
        uAudioIntensity: { value: 0 }
      },
      vertexShader: `
        uniform float uAudioBass;
        uniform float uAudioMid;
        uniform float uAudioTreble;
        uniform float uAudioIntensity;
        uniform float uTime;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main(){
          vec3 pos=position;
          float angle=atan(pos.y,pos.x);
          float audioInfluence=sin(angle*8.0+uTime)*uAudioBass*0.15+sin(angle*12.0+uTime*0.5)*uAudioMid*0.12+sin(angle*16.0)*uAudioTreble*0.1;
          pos=normalize(pos)*(1.0+audioInfluence*uAudioIntensity);
          vPosition=pos;
          vNormal=normalize(normalMatrix*pos);
          vec4 mvPosition=modelViewMatrix*vec4(pos,1.0);
          vViewPosition=-mvPosition.xyz;
          gl_Position=projectionMatrix*mvPosition;
        }`,
      fragmentShader: `
        uniform float uTime;
        uniform float uTransition;
        uniform float uScale;
        uniform float uBrightness;
        uniform float uThreshold;
        uniform vec3 uColorDeep;
        uniform vec3 uColorMid;
        uniform vec3 uColorBright;
        uniform float uAudioBass;
        uniform float uAudioMid;
        uniform float uAudioTreble;
        uniform float uAudioIntensity;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        ${noiseFunctions}
        void main(){
          // Transition glitch effect
          float g = fract(sin(dot(vPosition.xy, vec2(12.9898,78.233))) * 43758.5453);
          if (g > uTransition) discard;

          vec3 p=vPosition*uScale;
          vec3 q=vec3(
            fbm(p+vec3(0.0,uTime*0.05,0.0)),
            fbm(p+vec3(5.2,1.3,2.8)+uTime*0.05),
            fbm(p+vec3(2.2,8.4,0.5)-uTime*0.02)
          );
          float density=fbm(p+2.0*q);
          float audioWave=sin(atan(vPosition.y,vPosition.x)*8.0)*uAudioBass+sin(atan(vPosition.y,vPosition.x)*12.0)*uAudioMid;
          float t=(density+0.4+audioWave*0.3)*0.8;
          float alpha=smoothstep(uThreshold,0.7,t);
          float audioBoost=uAudioBass*0.4+uAudioMid*0.3+uAudioTreble*0.2;
          vec3 cWhite=vec3(1.0,1.0,1.0);
          vec3 color=mix(uColorDeep,uColorMid,smoothstep(uThreshold,0.5,t));
          color=mix(color,uColorBright,smoothstep(0.5,0.8,t));
          color=mix(color,cWhite,smoothstep(0.8,1.0,t)*audioBoost);
          float facing=dot(normalize(vNormal),normalize(vViewPosition));
          
          // Hex grid overlay
          vec2 hexCoord = vPosition.xy * 8.0;
          vec2 hexPos = abs(mod(hexCoord, 1.0) - 0.5);
          float hexGrid = 1.0 - smoothstep(0.02, 0.05, max(hexPos.x, hexPos.y));
          color = mix(color, uColorBright * 1.5, hexGrid * 0.1);

          float depthFactor=(facing+1.0)*0.5;
          float finalAlpha=alpha*(0.02+0.98*depthFactor)*(1.0+audioBoost*0.5);

          // Recursive High-Freq Ripples (Voice Sync)
          float voiceRipple = sin(vPosition.y * 45.0 + uTime * 12.0) * uAudioIntensity * 0.25;
          color += uColorBright * voiceRipple;

          gl_FragColor=vec4(color*uBrightness*(1.0+audioBoost*0.3),finalAlpha * uTransition);
        }`,
      transparent: true, blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide, depthWrite: false
    });
    plasmaMatRef.current = plasmaMat;
    const plasmaMesh = new THREE.Mesh(plasmaGeo, plasmaMat);
    mainGroup.add(plasmaMesh);

    // --- MODE-SPECIFIC HOLOGRAMS ---
    const hologramGroup = new THREE.Group();
    mainGroup.add(hologramGroup);

    // 1. TRADER: 3D Wave Chart
    const traderGroup = new THREE.Group();
    const wavePoints = [];
    for (let i = 0; i < 50; i++) wavePoints.push(new THREE.Vector3((i / 25 - 1) * 0.6, Math.sin(i * 0.3) * 0.1, Math.cos(i * 0.2) * 0.1));
    const waveCurve = new THREE.CatmullRomCurve3(wavePoints);
    const waveGeo = new THREE.TubeGeometry(waveCurve, 64, 0.005, 8, false);
    const waveMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.8 });
    traderGroup.add(new THREE.Mesh(waveGeo, waveMat));
    hologramGroup.add(traderGroup);

    // 2. PROFESSOR: Neural Node Graph
    const professorGroup = new THREE.Group();
    const nodeGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xa78bfa });
    for (let i = 0; i < 12; i++) {
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8);
      professorGroup.add(node);
    }
    hologramGroup.add(professorGroup);

    // 3. ENGINEER: Manifestation Tree
    const engineerGroup = new THREE.Group();
    const branchMat = new THREE.LineBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.4 });
    for (let i = 0; i < 8; i++) {
      const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6)];
      const bGeo = new THREE.BufferGeometry().setFromPoints(pts);
      engineerGroup.add(new THREE.Line(bGeo, branchMat));
    }
    hologramGroup.add(engineerGroup);

    mainGroupRef.current = mainGroup;
    uniformsRef.current = plasmaMat.uniforms;

    mainGroup.scale.set(blobSize, blobSize, blobSize);
    mainGroup.position.set(blobPositionRef.current.x, blobPositionRef.current.y, 0);
    const initialBase = new THREE.Color(blobColorToUse);
    const idxHsl = {};
    initialBase.getHSL(idxHsl);
    plasmaMat.uniforms.uColorBright.value = initialBase.clone();
    plasmaMat.uniforms.uColorMid.value = new THREE.Color(0x0044ff);
    plasmaMat.uniforms.uColorDeep.value = new THREE.Color(0x000833);

    const pCount = 600;
    const pPos = new Float32Array(pCount * 3);
    const pSizes = new Float32Array(pCount);
    const sR = 0.95;
    for (let i = 0; i < pCount; i++) {
      const r = sR * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPos[i * 3 + 2] = r * Math.cos(phi);
      pSizes[i] = Math.random();
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('aSize', new THREE.BufferAttribute(pSizes, 1));
    const pMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0xffffff) } },
      vertexShader: `
        uniform float uTime;
        attribute float aSize;
        varying float vAlpha;
        void main(){
          vec3 pos=position;
          pos.y+=sin(uTime*0.2+pos.x)*0.02;
          pos.x+=cos(uTime*0.15+pos.z)*0.02;
          vec4 mvPosition=modelViewMatrix*vec4(pos,1.0);
          gl_Position=projectionMatrix*mvPosition;
          float baseSize=8.0*aSize+4.0;
          gl_PointSize=baseSize*(1.0/-mvPosition.z);
          vAlpha=0.8+0.2*sin(uTime+aSize*10.0);
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main(){
          vec2 uv=gl_PointCoord-vec2(0.5);
          if(length(uv)>0.5)discard;
          float glow=pow(1.0-length(uv)*2.0,1.8);
          gl_FragColor=vec4(uColor,glow*vAlpha);
        }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    pMatRef.current = pMat;
    mainGroup.add(new THREE.Points(pGeo, pMat));

    const gridCanvas = gridCanvasRef.current;
    if (!gridCanvas) return;
    const gCtx = gridCanvas.getContext('2d');

    const initGrid = () => {
      gridCanvas.width = window.innerWidth;
      gridCanvas.height = window.innerHeight;
    };

    const drawGrid = (t) => {
      const W = gridCanvas.width, H = gridCanvas.height;
      gCtx.clearRect(0, 0, W, H);
      const vx = W / 2, horizonY = H * 0.42;

      const lCount = 24;
      for (let i = 0; i <= lCount; i++) {
        const frac = i / lCount;
        const x = -W * 0.35 + frac * W * 1.7;
        const op = 0.025 + Math.pow(frac > 0.5 ? 1 - frac : frac, 1.5) * 0.055;
        gCtx.strokeStyle = `rgba(0,180,255,${op})`;
        gCtx.lineWidth = 0.5;
        gCtx.beginPath();
        gCtx.moveTo(x, H);
        gCtx.lineTo(vx + (x - vx) * 0.015, horizonY);
        gCtx.stroke();
      }

      const hCount = 16;
      for (let i = 0; i <= hCount; i++) {
        const frac = i / hCount;
        const scrollFrac = (frac + t * 0.04) % 1;
        const y = horizonY + Math.pow(scrollFrac, 2.0) * (H - horizonY);
        const xSpread = ((y - horizonY) / (H - horizonY)) * W * 0.68;
        const op = Math.pow(scrollFrac, 0.9) * 0.07;
        gCtx.strokeStyle = `rgba(0,180,255,${op})`;
        gCtx.lineWidth = 0.5;
        gCtx.beginPath();
        gCtx.moveTo(vx - xSpread, y);
        gCtx.lineTo(vx + xSpread, y);
        gCtx.stroke();
      }
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      initGrid();
    };


    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      document.documentElement.style.setProperty('--mouse-x', x.toFixed(3));
      document.documentElement.style.setProperty('--mouse-y', y.toFixed(3));

      // Gaze-aware simulation: dim side panels when mouse is in center zone
      const centerStart = window.innerWidth * 0.25;
      const centerEnd = window.innerWidth * 0.75;
      const isInCenter = e.clientX > centerStart && e.clientX < centerEnd;
      document.documentElement.style.setProperty('--hud-dim-opacity', isInCenter ? '0.35' : '1');
    };

    const handleGlobalClick = () => {
      // Removed glitch effect
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleGlobalClick);

    initGrid();
    const startTime = performance.now();
    let animationId;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = (performance.now() - startTime) * 0.001;

      // Get audio frequency data if microphone is active
      let audioIntensity = 0;
      let activeAnalyser = null;
      let activeDataArray = null;

      if (isPlayingAudioRef.current && outputAnalyserRef.current && outputDataArrayRef.current) {
        activeAnalyser = outputAnalyserRef.current;
        activeDataArray = outputDataArrayRef.current;
      } else if (analyserRef.current && dataArrayRef.current) {
        activeAnalyser = analyserRef.current;
        activeDataArray = dataArrayRef.current;
      }

      if (activeAnalyser && activeDataArray) {
        activeAnalyser.getByteFrequencyData(activeDataArray);
        const total = activeDataArray.length;

        // Split into frequency bands: bass, low-mid, mid, high-mid, treble
        const bassBins = activeDataArray.slice(0, Math.floor(total * 0.2));
        const lowMidBins = activeDataArray.slice(Math.floor(total * 0.2), Math.floor(total * 0.4));
        const midBins = activeDataArray.slice(Math.floor(total * 0.4), Math.floor(total * 0.6));
        const highMidBins = activeDataArray.slice(Math.floor(total * 0.6), Math.floor(total * 0.8));
        const trebleBins = activeDataArray.slice(Math.floor(total * 0.8));

        // Average each band
        const bassAvg = (bassBins.reduce((a, b) => a + b, 0) / bassBins.length) / 255;
        const lowMidAvg = (lowMidBins.reduce((a, b) => a + b, 0) / lowMidBins.length) / 255;
        const midAvg = (midBins.reduce((a, b) => a + b, 0) / midBins.length) / 255;
        const highMidAvg = (highMidBins.reduce((a, b) => a + b, 0) / highMidBins.length) / 255;
        const trebleAvg = (trebleBins.reduce((a, b) => a + b, 0) / trebleBins.length) / 255;

        // Store in ref for shader
        frequencyBandsRef.current = [bassAvg, lowMidAvg, midAvg, highMidAvg, trebleAvg];
        audioIntensity = (bassAvg + lowMidAvg + midAvg) / 3;
        setAudioFrequency(audioIntensity);
      }

      plasmaMat.uniforms.uTime.value = t * params.timeScale;
      plasmaMat.uniforms.uAudioBass.value = frequencyBandsRef.current[0];
      plasmaMat.uniforms.uAudioMid.value = frequencyBandsRef.current[2];
      plasmaMat.uniforms.uAudioTreble.value = frequencyBandsRef.current[4];
      plasmaMat.uniforms.uAudioIntensity.value = audioIntensity;

      pMat.uniforms.uTime.value = t;

      plasmaMesh.rotation.y = t * 0.08;
      mainGroup.rotation.x += params.rotationSpeedX;
      mainGroup.rotation.y += params.rotationSpeedY;

      // Apply audio-based scaling on top of user's chosen blob size
      const userScale = blobSizeRef.current || 1.0;
      const targetScale = userScale + audioIntensity * 0.08 * userScale;
      mainGroup.scale.x += (targetScale - mainGroup.scale.x) * 0.1;
      mainGroup.scale.y += (targetScale - mainGroup.scale.y) * 0.1;
      mainGroup.scale.z += (targetScale - mainGroup.scale.z) * 0.1;

      drawGrid(t);

      // Animate Mode Holograms
      traderGroup.visible = activeMode === 'TRADER';
      professorGroup.visible = activeMode === 'PROFESSOR';
      engineerGroup.visible = activeMode === 'ENGINEER';

      if (activeMode === 'TRADER') traderGroup.rotation.y += 0.02;
      if (activeMode === 'PROFESSOR') professorGroup.rotation.y -= 0.01;
      if (activeMode === 'ENGINEER') engineerGroup.rotation.z += 0.015;

      // Transition Logic
      if (plasmaMat.uniforms.uTransition.value < 1.0) {
        plasmaMat.uniforms.uTransition.value += 0.02;
      }

      // Deep Thinking Visuals
      if (zaireStatus === 'deep_thinking') {
        plasmaMat.uniforms.uAudioIntensity.value = 1.5;
        plasmaMat.uniforms.uBrightness.value = 1.2 + Math.sin(t * 5.0) * 0.2;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleGlobalClick);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      cameraRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Boot sequence handled elsewhere

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hms = [now.getHours(), now.getMinutes(), now.getSeconds()]
        .map(n => String(n).padStart(2, '0'))
        .join(':');
      setTimeStr(hms);
    };

    const interval = setInterval(tick, 1000);
    tick();

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const uptimeInterval = setInterval(() => {
      sessionUptimeRef.current += 1;
    }, 1000);
    return () => clearInterval(uptimeInterval);
  }, []);


  useEffect(() => {
    const canvas = voiceWaveformRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let phase = 0;

    const drawWaveform = () => {
      const width = canvas.width = canvas.offsetWidth;
      const height = canvas.height = canvas.offsetHeight;

      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(0,212,255,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const isVoiceActive = activeMode === 'VOICE';

      for (let x = 0; x < width; x++) {
        let y;
        if (isVoiceActive) {
          const amplitude = 15 + Math.random() * 10;
          y = height / 2 + Math.sin(x * 0.05 + phase) * amplitude + Math.sin(x * 0.02 + phase * 1.5) * (amplitude * 0.5);
        } else {
          y = height / 2 + Math.sin(x * 0.02 + phase) * 2;
        }

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      phase += isVoiceActive ? 0.15 : 0.05;
      animationId = requestAnimationFrame(drawWaveform);
    };

    drawWaveform();
    return () => cancelAnimationFrame(animationId);
  }, [activeMode]);

  useEffect(() => {
    const canvas = neuralGaugeRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let currentLoad = 0;
    const targetLoad = 74;

    const drawGauge = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = 30;

      ctx.clearRect(0, 0, width, height);

      // Animate to target, then fluctuate
      if (currentLoad < targetLoad) {
        currentLoad += 0.5;
      } else {
        // Subtle fluctuation: +/- 2%
        const drift = (Math.random() - 0.5) * 0.4;
        currentLoad = Math.max(targetLoad - 2, Math.min(targetLoad + 2, currentLoad + drift));
      }

      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (currentLoad / 100) * Math.PI * 2;

      // Update text if possible (optional, but currentLoad is internal)
      // Since the text is in JSX, we'll just keep it 74% fixed there or assume it's just visual for now.

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = activeMode === 'PROFESSOR' ? 'rgba(167, 139, 250, 0.08)' : 'rgba(0,212,255,0.08)';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.strokeStyle = activeMode === 'PROFESSOR' ? 'rgba(167, 139, 250, 0.8)' : 'rgba(0,212,255,0.8)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.stroke();

      animationId = requestAnimationFrame(drawGauge);
    };

    drawGauge();
    return () => cancelAnimationFrame(animationId);
  }, [activeMode]);

  useEffect(() => {
    const canvas = faceMeshCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let t = 0;

    const drawMesh = () => {
      const w = canvas.width = canvas.offsetWidth;
      const h = canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      if (biometricData?.detected) {
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
        ctx.lineWidth = 0.5;

        const centerX = w / 2;
        const centerY = h / 2;
        const rows = 12, cols = 12;
        const size = 50;

        t += 0.04;

        for (let i = 0; i < rows; i++) {
          ctx.beginPath();
          for (let j = 0; j < cols; j++) {
            const x = centerX - size + (j / (cols - 1)) * size * 2;
            const y = centerY - size + (i / (rows - 1)) * size * 2;
            const dist = Math.sqrt(Math.pow(j - (cols - 1) / 2, 2) + Math.pow(i - (rows - 1) / 2, 2));
            const z = Math.sin(dist * 0.8 - t) * 8;
            if (j === 0) ctx.moveTo(x, y + z);
            else ctx.lineTo(x, y + z);
          }
          ctx.stroke();
        }
        for (let j = 0; j < cols; j++) {
          ctx.beginPath();
          for (let i = 0; i < rows; i++) {
            const x = centerX - size + (j / (cols - 1)) * size * 2;
            const y = centerY - size + (i / (rows - 1)) * size * 2;
            const dist = Math.sqrt(Math.pow(j - (cols - 1) / 2, 2) + Math.pow(i - (rows - 1) / 2, 2));
            const z = Math.sin(dist * 0.8 - t) * 8;
            if (i === 0) ctx.moveTo(x, y + z);
            else ctx.lineTo(x, y + z);
          }
          ctx.stroke();
        }
      }

      animationId = requestAnimationFrame(drawMesh);
    };
    drawMesh();
    return () => cancelAnimationFrame(animationId);
  }, [biometricData?.detected]);

  const enabledCustomNavModes = customModes.reduce((modes, mode) => {
    if (mode.enabled && mode.name) {
      modes.push(mode.name.toUpperCase());
    }
    return modes;
  }, []);
  const navItems = [...CORE_MODES, ...enabledCustomNavModes.filter((m) => !CORE_MODES.includes(m))];
  const displayedMode = activeCustomMode || activeMode;
  const customModeMap = customModes.reduce((map, mode) => {
    if (mode?.enabled && mode?.name) {
      map[mode.name.toUpperCase()] = mode;
    }
    return map;
  }, {});

  const handleUpgradePro = async () => {
    if (!user || isUpgradeLoading) return;
    const checkoutWindow = window.open('', '_blank');

    try {
      setIsUpgradeLoading(true);
      setZaireResponseStream('Initializing PRO checkout...');
      setShowResponsePanel(true);

      const res = await fetch(`${API_BASE_URL}/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.primaryEmailAddress?.emailAddress
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Unable to initialize checkout.');
      }

      if (!data.checkoutUrl) {
        throw new Error('Checkout URL was not returned by the billing service.');
      }

      if (checkoutWindow) {
        checkoutWindow.location.href = data.checkoutUrl;
      } else {
        window.open(data.checkoutUrl, '_blank');
      }

      setZaireResponseStream('PRO checkout ready. Redirecting now...');
    } catch (e) {
      if (checkoutWindow) checkoutWindow.close();
      console.error("Upgrade checkout failed:", e);
      setZaireResponseStream(`PRO checkout failed: ${e.message}`);
      setZaireActionFeed(prev => [{
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        message: `Billing checkout failed: ${e.message}`
      }, ...prev].slice(0, 5));
    } finally {
      setIsUpgradeLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setIsOmniBoxOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOmniBoxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeModeObj = customModes.find((m) => m.name === activeCustomMode && m.enabled);

  const getZoneComponents = (zoneName) => {
    if (!activeModeObj || !activeModeObj.components) return [];
    return sanitizeCustomModeComponents(activeModeObj.components)
      .filter(c => c.zone === zoneName)
      .sort((a, b) => (a.index || 0) - (b.index || 0));
  };

  const getEliteComponentRuntimeState = (compType, blueprint) => {
    const normalized = String(compType || '').toLowerCase();

    if (normalized.includes('chat')) {
      if (['thinking', 'deep_thinking', 'agent_thinking'].includes(zaireStatus)) return 'thinking';
      if (zaireStatus === 'speaking') return 'streaming';
      return 'active';
    }

    if (normalized.includes('task') || normalized.includes('timeline')) {
      return customTasks.length > 0 ? 'syncing' : 'idle';
    }

    if (normalized.includes('candlestick') || normalized.includes('signal') || normalized.includes('scanner') || normalized.includes('risk')) {
      return activeMode === 'TRADER' ? 'streaming' : 'idle';
    }

    if (normalized.includes('lecture') || normalized.includes('quiz') || normalized.includes('notes') || normalized.includes('flashcard')) {
      return activeMode === 'PROFESSOR' ? 'syncing' : 'idle';
    }

    if (normalized.includes('terminal') || normalized.includes('code') || normalized.includes('diff') || normalized.includes('preview')) {
      return activeMode === 'ENGINEER' ? 'active' : 'idle';
    }

    if (normalized.includes('camera') || normalized.includes('face')) {
      if (cameraStatus === 'authorized') return 'active';
      if (cameraStatus === 'denied') return 'locked';
      return 'loading';
    }

    if (blueprint?.behavior?.realtime) {
      return 'syncing';
    }

    return 'idle';
  };

  const wrapPremiumWorkspaceCard = (compType, key, content, statusText = "SECURE LINK", icon = "⚡", blueprint = null, componentState = 'idle') => {
    const cardColor = activeModeObj?.color || 'var(--primary)';
    return (
      <EliteHUDWrapper
        key={key}
        componentKey={key}
        blueprint={blueprint}
        accentColor={cardColor}
        componentState={componentState}
        statusText={statusText}
        icon={icon}
        title={compType}
      >
        {content}
      </EliteHUDWrapper>
    );
  };

  const renderCustomComponent = (comp) => {
    const key = `${comp.type}-${comp.index}`;
    let innerJSX = null;
    let icon = '⚡';
    let statusText = 'SECURE LINK';
    const blueprint = getComponentBlueprintByType(comp.type);

    switch (comp.type) {
      case 'Chat Panel': {
        const activeSession = chatSessions.find(s => s.id === currentSessionId);
        const currentMessages = activeSession ? activeSession.messages : [];
        const isAIActive = ['thinking', 'speaking', 'deep_thinking', 'agent_thinking'].includes(zaireStatus);
        icon = '💬';
        statusText = 'UPLINK: ACTIVE';

        innerJSX = (
          <div className="chat-panel-custom" style={{ height: '100%' }}>
            <div className="custom-chat-messages">
              {currentMessages.length === 0 && !zaireResponseStream && (
                <div className="chat-empty-state">
                  <span className="empty-pulse">⚡</span>
                  AWAITING UPLINK
                </div>
              )}
              {mapWithStableKeys(
                currentMessages,
                (msg) => msg.id || `${msg.role}-${msg.content}`,
                (msg, stableKey) => (
                <div key={stableKey} className={`custom-chat-bubble ${msg.role}`}>
                  <span className="bubble-role">{msg.role === 'user' ? 'USER' : 'ZAIRE'}</span>
                  <div>{msg.content}</div>
                </div>
                )
              )}
              {isAIActive && zaireResponseStream && (
                <div className="custom-chat-bubble assistant">
                  <span className="bubble-role">ZAIRE [STREAMING]</span>
                  <div>{zaireResponseStream}</div>
                </div>
              )}
            </div>
            <div className="custom-chat-input-wrap">
              <input
                type="text"
                className="custom-chat-input"
                placeholder="Message ZAIRE..."
                value={customChatInput}
                onChange={(e) => setCustomChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customChatInput.trim()) {
                    const txt = customChatInput.trim();
                    lastUserPromptRef.current = txt;
                    setCustomChatInput('');
                    setZaireResponseStream('');
                    liveCodeStreamRef.current = '';
                    if (socketRef.current) {
                      socketRef.current.emit('user_message', txt, { artifactTokens: [...artifactTokensRef.current, ...pendingArtifactTokensRef.current] });
                    }
                  }
                }}
              />
              <button
                className="custom-chat-send-btn"
                onClick={() => {
                  if (customChatInput.trim()) {
                    const txt = customChatInput.trim();
                    lastUserPromptRef.current = txt;
                    setCustomChatInput('');
                    setZaireResponseStream('');
                    liveCodeStreamRef.current = '';
                    if (socketRef.current) {
                      socketRef.current.emit('user_message', txt, { artifactTokens: [...artifactTokensRef.current, ...pendingArtifactTokensRef.current] });
                    }
                  }
                }}
              >
                SEND
              </button>
            </div>
          </div>
        );
        break;
      }
      case 'Task Queue': {
        icon = "📊";
        const doneCount = customTasks.filter(t => t.status === 'completed').length;
        statusText = `${doneCount}/${customTasks.length} DONE`;

        innerJSX = (
          <div className="task-queue-custom">
            <div className="custom-task-list">
              {customTasks.map(t => (
                <div key={t.id} className={`custom-task-card ${t.status}`}>
                  <div className="task-header">
                    <span className="task-title">{t.title.toUpperCase()}</span>
                    <span className="task-status">{t.status.toUpperCase()}</span>
                  </div>
                  <div className="task-bar-bg">
                    <div className="task-bar-fill" style={{ width: `${t.progress}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="custom-task-add-btn"
              onClick={addCustomTask}
            >
              + ADD SYSTEM OBJECTIVE
            </button>
          </div>
        );
        break;
      }
      case 'Notes Panel': {
        icon = "📝";
        statusText = "MEMO BUFFER";

        innerJSX = (
          <div className="notes-panel-custom">
            <textarea
              className="custom-notes-area"
              placeholder="Capture intelligence thoughts..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (e.target.value.trim()) {
                    addCustomNote(e.target.value);
                    e.target.value = '';
                  }
                }
              }}
            />
            <div className="custom-notes-list">
              {customNotes.map(n => (
                <div key={n.id} className="custom-note-item">
                  <span className="note-time">[{n.time}]</span>
                  <div className="note-text">{n.text}</div>
                </div>
              ))}
            </div>
          </div>
        );
        break;
      }
      case 'Memory Panel': {
        icon = "🧠";
        statusText = `${storedMemories.length} VECTORS`;

        innerJSX = (
          <div>
            <div style={{ fontSize: '12px', marginBottom: '8px', color: 'var(--primary)', fontFamily: 'var(--font-orbitron)', letterSpacing: '0.5px' }}>
              STORED VECTORS: {storedMemories.length}
            </div>
            <div className="custom-task-list">
              {storedMemories.length === 0 ? (
                <div style={{ fontSize: '12px', opacity: 0.5, textAlign: 'center', padding: '10px' }}>NO MEMORY VECTOR RECORDED</div>
              ) : (
                storedMemories.map(m => (
                  <div key={m.id} className="custom-task-card" style={{ fontSize: '12px', padding: '8px' }}>
                    <div style={{ opacity: 0.4, fontSize: '12px', marginBottom: '4px' }}>{m.timestamp}</div>
                    <div style={{ color: 'rgba(255,255,255,0.9)' }}>{m.text}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
        break;
      }
      case 'Terminal': {
        icon = "💻";
        statusText = "SHELL: READY";

        innerJSX = (
          <div className="terminal-custom">
            <div className="custom-terminal-body" style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {mapWithStableKeys(
                customTerminalLines,
                (line) => `terminal-line-${line}`,
                (line, stableKey) => <div key={stableKey} className="terminal-line">{line}</div>
              )}
            </div>
            <div className="custom-terminal-prompt">
              <span className="prompt-arrow">&gt;</span>
              <input
                type="text"
                className="terminal-input"
                value={customTerminalInput}
                onChange={(e) => setCustomTerminalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = customTerminalInput.trim();
                    if (val) {
                      setCustomTerminalLines(prev => [...prev, `> ${val}`, `Executing command '${val}'...`, 'Command succeeded.']);
                      setCustomTerminalInput('');
                    }
                  }
                }}
              />
            </div>
          </div>
        );
        break;
      }
      case 'Code Editor': {
        icon = "✍️";
        statusText = "NEURAL FORGE";

        innerJSX = (
          <div className="editor-container-inner" style={{ flex: 1, minHeight: '140px' }}>
            <div className="editor-gutter">
              {[1, 2, 3, 4, 5].map(n => <span key={n} className="gutter-num">{n}</span>)}
            </div>
            <textarea
              className="editor-text-area"
              value={customEditorText}
              onChange={(e) => setCustomEditorText(e.target.value)}
            />
          </div>
        );
        break;
      }
      case 'Kanban Board': {
        const lanes = ['todo', 'doing', 'done'];
        const cardsByLane = customKanbanCards.reduce((acc, card) => {
          if (!acc[card.status]) acc[card.status] = [];
          acc[card.status].push(card);
          return acc;
        }, {});
        icon = "📋";
        statusText = "SPRINT TARGET";

        innerJSX = (
          <div className="kanban-grid-cols">
            {lanes.map(lane => (
              <div key={lane} className="kanban-col">
                <div className="col-label">{lane.toUpperCase()}</div>
                <div className="col-cards">
                  {(cardsByLane[lane] || []).map(card => (
                    <button
                      type="button"
                      key={card.id}
                      className="kanban-card"
                      onClick={() => {
                        const nextStatus = lane === 'todo' ? 'doing' : (lane === 'doing' ? 'done' : 'todo');
                        setCustomKanbanCards(prev => prev.map(c => c.id === card.id ? { ...c, status: nextStatus } : c));
                      }}
                    >
                      {card.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
        break;
      }
      case 'System Logs': {
        icon = "📃";
        statusText = "SYS_EVENT";

        innerJSX = (
          <div className="system-logs-body" style={{ maxHeight: '180px', overflowY: 'auto' }}>
            {mapWithStableKeys(
              zaireActionFeed,
              (log) => `${log.time}-${log.message}`,
              (log, stableKey) => (
              <div key={stableKey} className="log-row">
                <span className="log-time">[{log.time}]</span>
                <span className="log-msg">{log.message}</span>
              </div>
              )
            )}
          </div>
        );
        break;
      }
      default: {
        const componentName = blueprint?.renderKey || comp.type.replace(/\s+/g, '');
        const EliteComp = EliteComponents[componentName];
        const matchedRegistry = ZaireComponentRegistry.find(c => c.type === comp.type);
        if (matchedRegistry) {
          icon = matchedRegistry.icon;
          statusText = matchedRegistry.blueprint?.behavior?.realtime
            ? `SYNC ${matchedRegistry.blueprint.behavior.polling}MS`
            : matchedRegistry.desc.toUpperCase();
        }
        
        if (EliteComp) {
          innerJSX = <EliteComp color={activeModeObj?.color || 'var(--primary)'} />;
        } else {
          innerJSX = (
            <div className="custom-module-placeholder">
              <span className="pulse" style={{ marginRight: '6px' }}>⚡</span>
              AWAITING MODULE: {comp.type.toUpperCase()}
            </div>
          );
        }
        break;
      }
    }

    return wrapPremiumWorkspaceCard(
      comp.type,
      key,
      innerJSX,
      statusText,
      icon,
      blueprint,
      getEliteComponentRuntimeState(comp.type, blueprint)
    );
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const vars = {
      '--left-width': `${layoutOffsets.leftWidth}px`,
      '--right-width': `${layoutOffsets.rightWidth}px`,
      '--bottom-height': `${layoutOffsets.bottomHeight}px`,
      '--left-x': `${layoutOffsets.leftX}px`,
      '--left-y': `${layoutOffsets.leftY}px`,
      '--right-x': `${layoutOffsets.rightX}px`,
      '--right-y': `${layoutOffsets.rightY}px`,
      '--bottom-x': `${layoutOffsets.bottomX}px`,
      '--bottom-y': `${layoutOffsets.bottomY}px`
    };

    Object.entries(vars).forEach(([name, value]) => {
      container.style.setProperty(name, value);
    });
  }, [layoutOffsets]);

  const renderView = () => (
    <div
      ref={containerRef}
      className={`

      zaire-container 
      ${isDiagnosticActive ? 'diagnostic-active' : ''} 
      ${isSecurityAlert ? 'security-alert' : ''} 
      

      ${isNeuralPulseActive ? 'neural-pulse-active' : ''} 
      ${isNeuralInterruptActive ? 'neural-interrupt-flash' : ''}
    `.trim()}
      data-mode={activeMode}
    >
      <canvas id="three-canvas" ref={threeCanvasRef}></canvas>
      <canvas id="grid-canvas" ref={gridCanvasRef}></canvas>

      {/* <SignedIn> - Auth Disabled for Dev */}
      <>
        {/* Neural Pulse Arena Overlay */}
        {isMinigameActive && (
          <div className="neural-pulse-arena">
            <div className="arena-score">SYNC: {minigameScore}</div>
              {gameNodes.map(node => (
              <button
                type="button"
                key={node.id}
                className="neural-node"
                style={{
                  top: node.top,
                  left: node.left,
                  width: node.size,
                  height: node.size,
                  animationDelay: node.delay
                }}
                onClick={() => handleNodeClick(node.id)}
                aria-label={`Sync node ${node.id}`}
              >
                <div className="node-core"></div>
                <div className="node-ring"></div>
              </button>
            ))}
          </div>
        )}

        <div className="grid-overlay"></div>
        <div className="vignette"></div>
        <div className="hex-overlay"></div>

        <div
          className={`main-grid ${isTransitioning ? 'is-transitioning' : ''}`}
          data-mode={activeMode}
          data-state={systemState}
          style={{
            '--left-width': activeCustomMode 
              ? (getZoneComponents('Left Sidebar').length > 0 ? `${layoutOffsets.leftWidth || 250}px` : '0px')
              : `${layoutOffsets.leftWidth}px`,
            '--right-width': activeCustomMode
              ? (getZoneComponents('Right Inspector').length > 0 ? `${layoutOffsets.rightWidth || 250}px` : '0px')
              : `${layoutOffsets.rightWidth}px`,
            '--bottom-height': `${layoutOffsets.bottomHeight}px`,
            '--primary': activeModeObj?.color || undefined
          }}
        >
          {/* ROW 1: NAVBAR */}
          <div className="grid-navbar">
            <div className="nav-logo">
              <span className="logo-text">Z.A.I.R.E</span>
              <span className="logo-sub">ARTIFICIAL INTELLIGENCE · v1.0</span>
            </div>

            <div className="nav-links">
              {navItems.map(item => {
                const customMode = customModeMap[item];
                return (
                  <div
                    key={item}
                    className={`nav-item ${displayedMode === item ? 'active' : ''} ${customMode ? 'custom-nav-item' : ''}`}
                    onClick={() => activateNavbarMode(item)}
                    onKeyDown={(event) => handleAccessibleActivate(event, () => activateNavbarMode(item))}
                    role="button"
                    tabIndex={0}
                    title={customMode ? 'Custom Mode · Click to manage' : undefined}
                    style={customMode ? { '--nav-accent': customMode.color } : undefined}
                  >
                    <span className="nav-arrow">›</span>
                    {customMode && <span className="custom-nav-glyph">◈</span>}
                    {item}
                  </div>
                );
              })}
            </div>

            {activeCustomMode && (
              <div className="custom-top-status-bar">
                {getZoneComponents('Top Status Bar').map(comp => (
                  <div key={`${comp.type}-${comp.index}`} className="custom-top-status-item">
                    <span className="hud-tag-btn active custom-top-status-chip">
                      {comp.type.toUpperCase()}: ACTIVE
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="nav-status">
              <div
                className="settings-icon"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                onKeyDown={(event) => handleAccessibleActivate(event, () => setIsSettingsOpen(!isSettingsOpen))}
                role="button"
                tabIndex={0}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 1.65 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </div>
              <div className="mode-indicator">
                <div className="mode-dot"></div>
                <span className="mode-text">MODE: {displayedMode}</span>
              </div>
              <div className="status-indicator">
                <div className={`status-dot ${zaireStatus}`}></div>
                <span className="status-text">{zaireStatus.toUpperCase().replace('_', ' ')}</span>
              </div>
              <div
                className="archive-toggle"
                onClick={() => { fetchChatSessions(); setIsArchivesPageOpen(true); }}
                onKeyDown={(event) => handleAccessibleActivate(event, () => { fetchChatSessions(); setIsArchivesPageOpen(true); })}
                title="Neural Archives"
                role="button"
                tabIndex={0}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <button
                type="button"
                className="upgrade-btn"
                onClick={handleUpgradePro}
                disabled={isUpgradeLoading}
              >
                {isUpgradeLoading ? 'OPENING...' : 'UPGRADE PRO'}
              </button>
              <div className="clerk-user-profile">
                <UserButton appearance={{
                  elements: {
                    avatarBox: "zaire-clerk-avatar"
                  }
                }} />
              </div>
              <div className="clock-display">{timeStr}</div>
            </div>
          </div>

          {/* ROW 2: LEFT PANEL */}
          <div className="grid-left">
            {activeCustomMode ? (
              getZoneComponents('Left Sidebar').map(renderCustomComponent)
            ) : (
              <>
                {/* ── ZAIRE MODE PANEL ── */}
                {activeMode === 'ZAIRE' && (
                  <>
                    <div className="panel-section" style={getComponentStyle('SYSTEM_VITALS')}>
                  <div className="section-label">SYSTEM VITALS</div>
                  <div className="vitals-bars">
                    <div className="vital-row">
                      <span className="vital-label">CPU</span>
                      <div className="vital-bar"><div className="vital-fill" style={{ width: `${liveMetrics.cpu}%` }}></div></div>
                    </div>
                    <div className="vital-row">
                      <span className="vital-label">MEM</span>
                      <div className="vital-bar"><div className="vital-fill" style={{ width: `${liveMetrics.ram}%` }}></div></div>
                    </div>
                    <div className="vital-row">
                      <span className="vital-label gpu">GPU</span>
                      <div className="vital-bar gpu"><div className="vital-fill" style={{ width: `${liveMetrics.gpu}%` }}></div></div>
                    </div>
                    <div className="vital-row">
                      <span className="vital-label net">NET</span>
                      <div className="vital-bar net"><div className="vital-fill" style={{ width: `${liveMetrics.net}%` }}></div></div>
                    </div>
                  </div>
                </div>

                <div className="panel-section" style={getComponentStyle('MODULE_STATUS')}>
                  <div className="section-label">MODULE STATUS</div>
                  <div className="module-list">
                    {[
                      { name: 'VISION', status: 'READY' },
                      { name: 'VOICE', status: 'ACTIVE' },
                      { name: 'WEB', status: 'LIVE' },
                      { name: 'FILES', status: 'MOUNTED' },
                    ].map(mod => (
                      <div key={mod.name} className="module-row">
                        <span className="module-name">{mod.name}</span>
                        <span className={`module-status ${mod.status === 'OFFLINE' ? 'offline' : 'online'}`}>{mod.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel-section" style={getComponentStyle('VOICE_MONITOR')}>
                  <div className="section-label">VOICE MONITOR</div>
                  <canvas ref={voiceWaveformRef} className="voice-waveform"></canvas>
                </div>

                {/* ── MEMORY CORE ── */}
                <div className={`panel-section memory-panel ${memoryFlash ? 'memory-flash' : ''}`} style={getComponentStyle('MEMORY_CORE')}>
                  <div className="section-label memory-label">
                    <span>MEMORY CORE</span>
                    <span className="memory-count">{storedMemories.length} STORED</span>
                  </div>
                  <div className="memory-list">
                    {storedMemories.length === 0 && (
                      <div className="memory-empty">NO MEMORIES YET</div>
                    )}
                    {storedMemories.map((m, i) => (
                      <div key={m.id || i} className="memory-item">
                        <span className="memory-dot">◆</span>
                        <span className="memory-text">{m.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel-section">
                  <div className="section-label">LAST COMMAND</div>
                  <div className="last-command" style={{ minHeight: '60px' }}>
                    <div className="command-content">{finalRecognizedText || recognizedText || lastCommand || '— AWAITING INPUT —'}</div>
                  </div>
                </div>
              </>
            )}

            {/* ── TRADER MODE PANEL ── */}
            {activeMode === 'TRADER' && (
              <>
                <div className="panel-section">
                  <div className="section-label" >PORTFOLIO</div>
                  <div className="metrics-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div className="metric-card" style={{ padding: '8px' }}>
                      <span className="metric-value" style={{ color: '#00ff88', fontSize: '14px' }}>
                        ${specialistData?.portfolio_value || '2,847'}
                      </span>
                      <span className="metric-label">TOTAL VALUE</span>
                    </div>
                    <div className="metric-card" style={{ padding: '8px' }}>
                      <span className="metric-value" style={{ color: '#00ff88', fontSize: '14px' }}>+4.2%</span>
                      <span className="metric-label">24H CHANGE</span>
                    </div>
                  </div>
                </div>

                <div className="panel-section">
                  <div className="section-label" >HOLDINGS</div>
                  <div className="holding-list" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                    {['BTC', 'ETH', 'SOL', 'LINK'].map(asset => (
                      <div key={asset} className="mini-bar-row">
                        <span className="mbl">{asset}</span>
                        <div className="mbt"><div className="mbf" style={{ width: '70%', background: '#00ff88' }}></div></div>
                        <span className="mbv">82%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel-section">
                  <div className="section-label" >HALAL FILTER</div>
                  <div style={{ padding: '8px', background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '2px' }}>
                    <div style={{ fontSize: '12px', color: '#00ff88', letterSpacing: '0.04em' }}>✓ {specialistData?.halal_filter || 'ACTIVE'}</div>
                    <div style={{ fontSize: '12px', opacity: 0.4, marginTop: '4px' }}>LEVERAGE: BLOCKED</div>
                    <div style={{ fontSize: '12px', opacity: 0.4 }}>MEME COINS: BLOCKED</div>
                  </div>
                </div>

                <div className="panel-section">
                  <div className="section-label">TRADING TIMELINE</div>
                  <div className="manifestation-timeline">
                    {[
                      { phase: 'ANALYSIS', label: 'MARKET ANALYSIS', icon: '🔍' },
                      { phase: 'SIGNAL', label: 'SIGNAL DETECTION', icon: '⚡' },
                      { phase: 'EXECUTION', label: 'EXECUTION FORGE', icon: '⚔' },
                      { phase: 'AUDIT', label: 'RISK AUDIT', icon: '🛡' },
                      { phase: 'HARVEST', label: 'PROFIT HARVEST', icon: '💰' },
                    ].map((p, i) => (
                      <div
                        key={p.phase}
                        className={`timeline-step ${traderPhase === p.phase ? 'active' : ''} ${i < ['ANALYSIS', 'SIGNAL', 'EXECUTION', 'AUDIT', 'HARVEST'].indexOf(traderPhase) ? 'completed' : ''}`}
                      >
                        <div className="step-icon" style={{ borderColor: traderPhase === p.phase ? '#00ff88' : '', color: traderPhase === p.phase ? '#00ff88' : '' }}>{p.icon}</div>
                        <div className="step-info">
                          <span className="step-name">{p.label}</span>
                          <span className="step-status">{traderPhase === p.phase ? 'SCANNING' : (i < ['ANALYSIS', 'SIGNAL', 'EXECUTION', 'AUDIT', 'HARVEST'].indexOf(traderPhase) ? 'SUCCESS' : 'AWAITING')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel-section">
                  <div className="section-label" >ALGO SYNC</div>
                  <div className="mini-bar-row">
                    <span className="mbl" style={{ width: '40px' }}>PRECISION</span>
                    <div className="mbt"><div className="mbf" style={{ width: `${traderProgress}%`, background: '#00ff88' }}></div></div>
                    <span className="mbv">{Math.round(traderProgress)}%</span>
                  </div>
                </div>
              </>
            )}

            {/* ── PROFESSOR MODE PANEL ── */}
            {activeMode === 'PROFESSOR' && (
              <>
                <div className="panel-section">
                  <div className="section-label" >CURRICULUM</div>
                  <div className="curriculum-list">
                    {['Quantum Physics', 'Neural Networks', 'Linear Algebra'].map(c => (
                      <div key={c} className="curriculum-item">
                        <div className="cur-dot" ></div>
                        <span className="cur-name">{c.toUpperCase()}</span>
                        <span className="cur-status">ACTIVE</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel-section">
                  <div className="section-label">LEARNING TIMELINE</div>
                  <div className="manifestation-timeline">
                    {[
                      { phase: 'ARCHITECTING', label: 'CURRICULUM DESIGN', icon: '✎' },
                      { phase: 'SYNCING', label: 'KNOWLEDGE SYNC', icon: '❈' },
                      { phase: 'LECTURE', label: 'LECTURE MANIFEST', icon: '🕮' },
                      { phase: 'QUIZ', label: 'EVALUATION (QUIZ)', icon: '❓' },
                      { phase: 'GRADUATION', label: 'CERTIFICATION', icon: '🎓' },
                    ].map((p, i) => (
                      <div
                        key={p.phase}
                        className={`timeline-step ${professorPhase === p.phase ? 'active' : ''} ${i < ['ARCHITECTING', 'SYNCING', 'LECTURE', 'QUIZ', 'GRADUATION'].indexOf(professorPhase) ? 'completed' : ''}`}
                      >
                        <div className="step-icon" style={{ borderColor: professorPhase === p.phase ? '#a78bfa' : '', color: professorPhase === p.phase ? '#a78bfa' : '' }}>{p.icon}</div>
                        <div className="step-info">
                          <span className="step-name">{p.label}</span>
                          <span className="step-status">{professorPhase === p.phase ? 'IN PROGRESS' : (i < ['ARCHITECTING', 'SYNCING', 'LECTURE', 'QUIZ', 'GRADUATION'].indexOf(professorPhase) ? 'COMPLETE' : 'PENDING')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel-section">
                  <div className="section-label" >CURRICULUM SYNC</div>
                  <div className="mini-bar-row">
                    <span className="mbl" style={{ width: '40px' }}>OVERALL</span>
                    <div className="mbt"><div className="mbf" style={{ width: `${learningProgress}%`, background: '#a78bfa' }}></div></div>
                    <span className="mbv">{Math.round(learningProgress)}%</span>
                  </div>
                </div>
              </>
            )}

            {/* ── ENGINEER MODE PANEL ── */}
            {activeMode === 'ENGINEER' && (
              <>
                <div className="panel-section">
                  <div className="section-label" >ACTIVE PROJECT</div>
                  <div style={{ padding: '8px', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '2px' }}>
                    <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', color: '#f97316', letterSpacing: '0.04em' }}>ZAIRE CORE</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.5, marginTop: '4px' }}>
                      <span>TYPE: NEXT.JS 15</span>
                      <span>BUILD: STABLE</span>
                    </div>
                    <div className="mbt" style={{ marginTop: '6px' }}><div className="mbf" style={{ width: '65%', background: '#f97316' }}></div></div>
                  </div>
                </div>

                <div className="panel-section">
                  <div className="section-label" >MANIFESTATION PROGRESS</div>
                  <div className="build-stats-sidebar">
                    <div className="stat-row">
                      <span>SYSTEM_LOAD</span>
                      <span>{Math.round(forgeProgress)}%</span>
                    </div>
                    <div className="mbt"><div className="mbf" style={{ width: `${forgeProgress}%`, background: '#f97316' }}></div></div>
                  </div>
                </div>

                <div className="panel-section">
                  <div className="section-label">MANIFESTATION TIMELINE</div>
                  <div className="manifestation-timeline">
                    {[
                      { phase: 'BLUEPRINT', label: 'NEURAL ARCHITECT', icon: '◈' },
                      { phase: 'RESEARCH', label: 'INTELLIGENCE SYNC', icon: '❈' },
                      { phase: 'FORGE', label: 'ACTIVE MANIFEST', icon: '⚔' },
                      { phase: 'AUDIT', label: 'VANGUARD AUDIT', icon: '🛡' },
                      { phase: 'DEPLOY', label: 'CORE DEPLOY', icon: '🚀' },
                    ].map((p, i) => (
                      <div
                        key={p.phase}
                        className={`timeline-step ${engineerPhase === p.phase ? 'active' : ''} ${i < ['BLUEPRINT', 'RESEARCH', 'FORGE', 'AUDIT', 'DEPLOY'].indexOf(engineerPhase) ? 'completed' : ''}`}
                      >
                        <div className="step-icon">{p.icon}</div>
                        <div className="step-info">
                          <span className="step-name">{p.label}</span>
                          <span className="step-status">{engineerPhase === p.phase ? 'PROCESSING' : (i < ['BLUEPRINT', 'RESEARCH', 'FORGE', 'AUDIT', 'DEPLOY'].indexOf(engineerPhase) ? 'COMPLETE' : 'AWAITING')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel-section">
                  <div className="section-label" >FILE TREE</div>
                  <div className="file-tree" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {['src/App.js', 'src/App.css', 'src/index.js', 'api/core.py'].map(f => (
                      <div key={f} className="file-tree-item">
                        <span className="file-icon">📄</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

          {/* ROW 2: CENTER (ORB / TACTICAL CONTENT) */}
          <div className={`grid-center ${activeMode !== 'ZAIRE' || activeCustomMode ? 'has-content' : ''}`}>
            {activeCustomMode && (
              <div className="custom-main-workspace-wrapper" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '15px', height: '100%', padding: '15px', overflowY: 'auto', pointerEvents: 'auto' }}>
                {getZoneComponents('Main Workspace').map(renderCustomComponent)}
              </div>
            )}

            {/* ── TRADER CENTER: Sovereign Trading Floor ── */}
            {activeMode === 'TRADER' && (
              <div className="trader-floor">
                <div className="hall-nav">
                  {['CHART', 'STRATEGY', 'ALPHA'].map(m => (
                    <button key={m} className={`h-nav-btn ${traderSubMode === m ? 'active' : ''}`} onClick={() => setTraderSubMode(m)}>{m}</button>
                  ))}
                </div>

                {traderSubMode === 'CHART' && (
                  <div className="floor-top">
                    <div className="neural-chart-wrap">
                      <div className="chart-header">
                        <div className="pair-info">BTC/USDT <span className="live-dot pulse"></span></div>
                        <div className="chart-controls">
                          <span>15M</span>
                          <span
                            onClick={() => handleSpecialistAction('TRADER', 'WHALE_FORENSICS', { asset: 'BTC' })}
                            onKeyDown={(event) => handleAccessibleActivate(event, () => handleSpecialistAction('TRADER', 'WHALE_FORENSICS', { asset: 'BTC' }))}
                            role="button"
                            tabIndex={0}
                          >
                            WHALE_SCAN
                          </span>
                        </div>
                      </div>
                      <div className="chart-canvas-area">
                        <canvas ref={traderChartRef} style={{ width: '100%', height: '100%' }}></canvas>
                        <div className="neural-overlay-text">NEURAL_SENTIMENT: {specialistData?.sentiment || 'BULLISH (84%)'}</div>
                      </div>
                    </div>

                    <div className="execution-side">
                      <div className="side-label">LIVE EXECUTION</div>
                      <div className="execution-log">
                        {specialistData?.live_trades?.length === 0 && <div className="log-empty">SCANNING FOR SIGNALS…</div>}
                        {(specialistData?.live_trades || liveTrades).map(trade => (
                          <div key={trade.id} className="trade-entry">
                            <div className="t-row">
                              <span className={`t-type ${trade.type.toLowerCase()}`}>{trade.type}</span>
                              <span className="t-pair">{trade.pair}</span>
                            </div>
                            <div className="t-row sub">
                              <span>{trade.price}</span>
                              <span className="t-status">{trade.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {traderSubMode === 'STRATEGY' && (
                  <div className="strategy-manifest">
                    <div className="strategy-header">NEURAL STRATEGY FORGE // {specialistData?.active_strategy?.risk_score || '0'} RISK SCORE</div>
                    <div className="strategy-grid">
                      {mapWithStableKeys(
                        specialistData?.active_strategy?.steps || [],
                        (step) => step.id || `${step.name}-${step.desc}`,
                        (step, stableKey, stepIndex) => (
                        <div key={stableKey} className="strategy-node">
                          <div className="node-id">STEP 0{stepIndex + 1}</div>
                          <div className="node-content">
                            <div className="node-title">{step.name}</div>
                            <div className="node-desc">{step.desc}</div>
                          </div>
                        </div>
                        )
                      ).length > 0 ? mapWithStableKeys(
                        specialistData?.active_strategy?.steps || [],
                        (step) => step.id || `${step.name}-${step.desc}`,
                        (step, stableKey, stepIndex) => (
                          <div key={stableKey} className="strategy-node">
                            <div className="node-id">STEP 0{stepIndex + 1}</div>
                            <div className="node-content">
                              <div className="node-title">{step.name}</div>
                              <div className="node-desc">{step.desc}</div>
                            </div>
                          </div>
                        )
                      ) : <div className="strategy-empty">FORGE A STRATEGY TO MANIFEST TACTICAL BLUEPRINTS.</div>}
                    </div>
                  </div>
                )}

                {traderSubMode === 'ALPHA' && (
                  <div className="alpha-manifest">
                    <div className="alpha-header">WHALE FORENSICS // LIVE ALPHA FEED</div>
                    <div className="alpha-list">
                      {(() => {
                        const alphaFeedItems = mapWithStableKeys(
                          specialistData?.alpha_feed || [],
                          (a) => a.id || `${a.time}-${a.event}`,
                          (a, stableKey) => (
                            <div key={stableKey} className={`alpha-item ${a.sentiment}`}>
                              <span className="alpha-time">
                                <ClientLocalTime value={a.time} options={{ hour: '2-digit', minute: '2-digit' }} />
                              </span>
                              <span className="alpha-event">{a.event}</span>
                              <span className="alpha-sentiment-tag">{a.sentiment}</span>
                            </div>
                          )
                        );
                        return alphaFeedItems.length > 0 ? alphaFeedItems : <div className="alpha-empty">SCANNING ON-CHAIN PROTOCOLS…</div>;
                      })()}
                    </div>
                  </div>
                )}

                <div className="floor-bottom">
                  <div className="floor-stats">
                    <div className="f-stat">
                      <span className="fs-label">PORTFOLIO</span>
                      <span className="fs-val positive">${specialistData?.portfolio_value || '2,847.00'}</span>
                    </div>
                    <div className="f-stat">
                      <span className="fs-label">ACTIVE RISK</span>
                      <span className="fs-val">{specialistData?.risk_level || 'LOW'}</span>
                    </div>
                    <div className="f-stat">
                      <div className="trader-actions">
                        <button className="t-btn buy" onClick={() => handleSpecialistAction('TRADER', 'EXECUTE_TRADE', { symbol: 'BTCUSDT', side: 'BUY', qty: 0.01 })}>BUY BTC</button>
                        <button className="t-btn buy" onClick={() => handleSpecialistAction('TRADER', 'STRATEGY_FORGE', { asset: 'BTC' })}>FORGE STRATEGY</button>
                        <button className="t-btn report" onClick={() => handleSpecialistAction('TRADER', 'WHALE_FORENSICS', { asset: 'BTC' })}>WHALE SCAN</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── PROFESSOR CENTER: Sovereign Learning Hall ── */}
            {activeMode === 'PROFESSOR' && (
              <div className="professor-learning-hall">
                <div className="hall-nav">
                  {['LECTURE', 'ROADMAP', 'LAB'].map(m => (
                    <button key={m} className={`h-nav-btn ${professorSubMode === m ? 'active' : ''}`} onClick={() => setProfessorSubMode(m)}>{m}</button>
                  ))}
                </div>

                {professorSubMode === 'LECTURE' && (
                  <>
                    {!specialistData?.active_quiz ? (
                      <div className="lecture-manifest">
                        <div className="lecture-header">
                          <div className="topic-badge">{professorTopic} {'//'} MODULE {specialistData?.module || '04'}</div>
                          <div className="persona-dna-tag" title="Adaptive Teaching Style">DNA: {specialistData?.persona?.replace('_', ' ') || 'SERIOUS ACADEMIC'}</div>
                          <div className="slide-counter">{specialistData?.slide_index || '04'} / {specialistData?.total_slides || '12'}</div>
                        </div>
                        <div className="manifest-content">
                          <div className="concept-title">{specialistData?.current_concept?.title || 'Neural Entanglement & Superposition'}</div>
                          <div className="concept-body">
                            <p>{specialistData?.current_concept?.body || 'In the quantum realm, information is not binary. It exists in a state of probability, defined by the wave function Ψ. ZAIRE is currently synchronizing this knowledge core with your neural baseline.'}</p>
                            <ul className="learning-points">
                              {(() => {
                                const pointItems = mapWithStableKeys(
                                  specialistData?.current_concept?.points || [],
                                  (p) => (typeof p === 'string' ? p : JSON.stringify(p)),
                                  (p, stableKey) => <li key={stableKey}>✦ {p}</li>
                                );
                                return pointItems.length > 0 ? pointItems : (
                                  <>
                                    <li>✦ Superposition: N-dimensional state vectors.</li>
                                    <li>✦ Interference: Constructive reinforcement of data.</li>
                                    <li>✦ Decoherence: The primary bottleneck in neural sync.</li>
                                  </>
                                );
                              })()}
                            </ul>
                          </div>
                        </div>
                        <div className="lecture-footer">
                          <div className="professor-note">
                            <span className="note-label">PROFESSOR_INSIGHT:</span>
                            {specialistData?.current_concept?.insight || 'Focus on the relationship between entropy and information density.'}
                          </div>
                          <div className="professor-controls">
                            <button className="p-btn" onClick={() => handleSpecialistAction('PROFESSOR', 'GENERATE_QUIZ', { topic: lastUserPromptRef.current || professorTopic })}>GENERATE QUIZ</button>
                            <button className="p-btn" onClick={() => handleSpecialistAction('PROFESSOR', 'ARCHITECT_ROADMAP', { topic: lastUserPromptRef.current || professorTopic })}>ARCHITECT ROADMAP</button>
                            <button className="p-btn" onClick={() => handleSpecialistAction('PROFESSOR', 'MANIFEST_VISUAL_LAB', { concept: lastUserPromptRef.current || professorTopic })}>INITIALIZE LAB</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="quiz-manifest">
                        <div className="quiz-header">
                          <div className="quiz-title">NEURAL EVALUATION // STAGE 01</div>
                          <div className="timer">04:52 REMAINING</div>
                        </div>
                        <div className="quiz-question">
                          <div className="q-label">QUESTION 01</div>
                          <div className="q-text">{specialistData?.active_quiz?.question || 'What is the primary cause of decoherence in a neural-sync environment?'}</div>
                          <div className="q-options">
                            {(() => {
                              const quizOptionItems = mapWithStableKeys(
                                specialistData?.active_quiz?.options || [],
                                (opt) => opt.id || opt.text,
                                (opt, stableKey, optionIndex) => (
                                  <button key={stableKey} className={`q-opt ${opt.correct ? 'correct' : ''}`} onClick={() => handleSpecialistAction('PROFESSOR', 'SUBMIT_QUIZ', { answer: opt.text, is_correct: opt.correct })}>
                                    {String.fromCharCode(65 + optionIndex)}) {opt.text}
                                  </button>
                                )
                              );
                              return quizOptionItems.length > 0 ? quizOptionItems : (
                                <>
                                  <button className="q-opt">A) Atmospheric Pressure</button>
                                  <button className="q-opt correct">B) Quantum Interference</button>
                                  <button className="q-opt">C) Clock Speed Mismatch</button>
                                  <button className="q-opt">D) Thermal Exhaustion</button>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {professorSubMode === 'ROADMAP' && (
                  <div className="roadmap-manifest">
                    <div className="roadmap-header">SOVEREIGN STUDY ROADMAP // {professorTopic}</div>
                    <div className="roadmap-grid">
                      {(() => {
                        const roadmapItems = mapWithStableKeys(
                          specialistData?.roadmap?.modules || [],
                          (m) => m.id || `${m.title}-${m.status}`,
                          (m, stableKey, moduleIndex) => (
                            <div key={stableKey} className={`roadmap-node ${m.status}`}>
                              <div className="node-id">0{moduleIndex + 1}</div>
                              <div className="node-content">
                                <div className="node-title">{m.title}</div>
                                <div className="node-desc">{m.desc}</div>
                              </div>
                              <div className="node-status-tag">{m.status || 'LOCKED'}</div>
                            </div>
                          )
                        );
                        return roadmapItems.length > 0 ? roadmapItems : <div className="roadmap-empty">AWAITING ARCHITECTURAL COMMAND…</div>;
                      })()}
                    </div>
                  </div>
                )}

                {professorSubMode === 'LAB' && (
                  <div className="lab-manifest">
                    <div className="lab-header">VISUALIZATION LAB // {specialistData?.lab?.title || 'AWAITING NEURAL SYNC'}</div>
                    <div className="lab-viewport">
                      {specialistData?.lab ? (
                        <div className="lab-sim-placeholder">
                          <div className="sim-pulse"></div>
                          <span>{specialistData.lab.status}…</span>
                          <p>Synchronizing with Engineer Forge for {specialistData.lab.engine} manifestation.</p>
                        </div>
                      ) : (
                        <div className="lab-empty">INITIALIZE THE LAB TO MANIFEST INTERACTIVE SIMULATIONS.</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="research-summary">
                  <div className="summary-label">NEURAL SUMMARY FEED</div>
                  <div className="summary-items">
                    {(() => {
                      const researchItems = mapWithStableKeys(
                        specialistData?.research_feed || [],
                        (f) => f.id || `${f.source}-${f.title}-${f.time || ''}`,
                        (f, stableKey) => <div key={stableKey} className="s-item">✦ Source: {f.source} {'//'} {f.title}</div>
                      );
                      return researchItems.length > 0 ? researchItems : <div className="s-item opacity-30">PARSING GLOBAL KNOWLEDGE CORES…</div>;
                    })()}
                  </div>
                </div>

                <div className="learning-hall-sidebar">
                  <div className="sidebar-section">
                    <div className="sidebar-label">TEACHING PERSONA</div>
                    <div className="persona-grid">
                      {['SERIOUS_ACADEMIC', 'STARK_ENTHUSIAST', 'ZEN_SOCRATIC', 'NEURAL_COACH'].map(p => (
                        <button
                          key={p}
                          className={`persona-btn ${specialistData?.persona === p ? 'active' : ''}`}
                          onClick={() => handleSpecialistAction('PROFESSOR', 'SET_PERSONA', { persona: p })}
                          title={p.replace('_', ' ')}
                        >
                          {p.split('_')[1][0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="sidebar-section">
                    <div className="sidebar-label">NEURAL NOTEBOOK</div>
                    <div className="notebook-entries">
                      {(() => {
                        const notebookItems = mapWithStableKeys(
                          specialistData?.notebook || [],
                          (n) => n.id || `${n.time}-${n.note}`,
                          (n, stableKey) => (
                            <div key={stableKey} className="note-entry">
                              <span className="note-time">
                                <ClientLocalTime value={n.time} options={{ hour: '2-digit', minute: '2-digit' }} />
                              </span>
                              <span className="note-text">{n.note}</span>
                            </div>
                          )
                        );
                        return notebookItems.length > 0 ? notebookItems : <div className="note-empty">NO ATOMIC NOTES ARCHIVED.</div>;
                      })()}
                    </div>
                    <div className="note-input-wrap">
                      <input
                        type="text"
                        placeholder="Capture atomic note..."
                        value={professorNoteInput}
                        onChange={(e) => setProfessorNoteInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && professorNoteInput) {
                            handleSpecialistAction('PROFESSOR', 'TAKE_NOTE', { note: professorNoteInput });
                            setProfessorNoteInput('');
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── ENGINEER CENTER: Forge Build Log ── */}
            {activeMode === 'ENGINEER' && (
              <div className="engineer-studio">
                <div className="studio-top">
                  <div className="editor-panel">
                    <div className="editor-header">
                      <div className="tabs-container">
                        {manifestedFiles.length > 0 ? manifestedFiles.map((file, i) => (
                          <div
                            key={file.id || file.name}
                            className={`file-tab ${activeTab === i ? 'active' : ''}`}
                            onClick={() => {
                              setActiveTab(i);
                            }}
                            onKeyDown={(event) => handleAccessibleActivate(event, () => {
                              setActiveTab(i);
                            })}
                            role="button"
                            tabIndex={0}
                          >
                            {file.name} <span className="tab-status-dot pulse"></span>
                          </div>
                        )) : (
                          <div className="file-tab active">MANIFEST.js <span className="tab-status-dot pulse"></span></div>
                        )}
                      </div>
                      <div className="editor-metrics">
                        <span>LINES: {forgeCode.split('\n').length}</span>
                        <span
                          className="diff-toggle"
                          onClick={() => setShowDiff(!showDiff)}
                          onKeyDown={(event) => handleAccessibleActivate(event, () => setShowDiff(!showDiff))}
                          role="button"
                          tabIndex={0}
                        >
                          DIFF: <span style={{ color: showDiff ? '#f97316' : '#446677' }}>{showDiff ? 'ON' : 'OFF'}</span>
                        </span>
                        <span>ALIGN: <span style={{ color: '#00ff88' }}>{specialistData?.manifestation_sync?.alignment || '99%'}</span></span>
                      </div>
                    </div>
                    <div className="editor-content-wrapper">
                      <div className="line-numbers">
                        {Array.from({ length: forgeCode.split('\n').length }, (_, index) => index + 1).map((lineNumber) => <div key={`line-${lineNumber}`}>{lineNumber}</div>)}
                      </div>
                      <div className="editor-main">
                        <pre className="code-block">
                          <code>
                            {showDiff && diffData ? (
                              <div className="diff-viewer">
                                {mapWithStableKeys(
                                  diffData,
                                  (line) => line.id || `${line.type}-${line.number || ''}-${line.content}`,
                                  (line, stableKey) => (
                                  <div key={stableKey} className={`diff-line ${line.type}`}>
                                    <span className="line-marker">{line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}</span>
                                    {line.content}
                                  </div>
                                  )
                                )}
                              </div>
                            ) : (
                              (manifestedFiles[activeTab]?.code || forgeCode) || '// AWAITING NEURAL FORGE MANIFESTATION…'
                            )}
                          </code>
                        </pre>
                        <div className="editor-cursor pulse"></div>
                      </div>
                      <div className="code-minimap">
                        <div className="minimap-content" style={{ transform: `scale(0.1)`, transformOrigin: 'top right' }}>
                          <pre><code>{forgeCode}</code></pre>
                        </div>
                        <div className="minimap-viewport"></div>
                      </div>
                    </div>

                    {darwinResults && (
                      <div className="darwin-overlay">
                        <div className="darwin-header">NEURAL DARWINISM: VARIANT COMPETITION</div>
                        <div className="darwin-grid">
                          {Object.entries(darwinResults).map(([variant, score]) => (
                            <div key={variant} className="darwin-variant">
                              <div className="variant-label">{variant}</div>
                              <div className="variant-preview-small"></div>
                              <div className="variant-score-bar">
                                <div className="score-fill" style={{ width: `${score}%` }}></div>
                              </div>
                              <div className="variant-score-val">{score}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="research-panel">
                    <div className="panel-label">
                      LIVE PREVIEW
                      <span
                        className="preview-refresh"
                        style={{ marginLeft: '10px' }}
                        onClick={() => setShowMatrix(!showMatrix)}
                        onKeyDown={(event) => handleAccessibleActivate(event, () => setShowMatrix(!showMatrix))}
                        role="button"
                        tabIndex={0}
                      >
                        {showMatrix ? 'HIDE MATRIX' : 'SHOW MATRIX'}
                      </span>
                      <span
                        className="preview-refresh"
                        onClick={() => {
                          const current = previewUrl;
                          setPreviewUrl('');
                          setTimeout(() => setPreviewUrl(current), 10);
                        }}
                        onKeyDown={(event) => handleAccessibleActivate(event, () => {
                          const current = previewUrl;
                          setPreviewUrl('');
                          setTimeout(() => setPreviewUrl(current), 10);
                        })}
                        role="button"
                        tabIndex={0}
                      >{'\u21bb'}</span>
                    </div>
                    <div className="preview-container">
                      {thermalActive && (
                        <div className="thermal-overlay pulse">
                          <div className="fracture-marker" style={{ top: '20%', left: '30%', width: '100px', height: '40px' }}>
                            <span className="fracture-label">ALIGNMENT_FRACTURE: 4px</span>
                          </div>
                          <div className="fracture-marker danger" style={{ top: '60%', left: '50%', width: '150px', height: '60px' }}>
                            <span className="fracture-label">LOW_CONTRAST_DETECTED</span>
                          </div>
                        </div>
                      )}
                      {showMatrix ? (
                        <div className="responsive-matrix-grid">
                          {['mobile', 'tablet', 'laptop', 'desktop'].map(v => (
                            <div key={v} className="matrix-item">
                              <span className="matrix-label">{v.toUpperCase()}</span>
                              <div className="matrix-frame">
                                {/* Since these are local files in backend/memory/components, we might need a proxy or serve them */}
                                {/* For now, we simulate with the iframe at different widths */}
                                <iframe title={`Engineer Live Preview ${v}`} src={previewUrl} style={{ width: v === 'mobile' ? '375px' : v === 'tablet' ? '768px' : '100%', height: '100%', border: 'none', transform: 'scale(0.5)', transformOrigin: 'top left' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <iframe
                            src={previewUrl}
                            className="live-preview-iframe"
                            title="Engineer Live Preview"
                            onError={() => console.log("Preview not available yet")}
                          />
                          {specialistData?.project_status?.server !== 'RUNNING' && (
                            <div className="preview-placeholder">
                              <div className="pulse-ring"></div>
                              <span>AWAITING SERVER…</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {specialistData?.tech_stack_reasoning && (
                      <div className="reasoning-box">
                        <div className="panel-label" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>ARCHITECTURAL REASONING</div>
                        <div className="reasoning-text">{specialistData.tech_stack_reasoning}</div>
                      </div>
                    )}

                    <div className="surveillance-brief">
                      <div className="panel-label">COMPETITOR SURVEILLANCE</div>
                      <div className="brief-feed">
                        <div className="brief-item">✦ ROLEX: NEW TYPOGRAPHY DETECTED (MUSEO → INTER)</div>
                        <div className="brief-item">✦ AP: ADDED CINEMATIC HERO PARALLAX</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="studio-bottom">
                  <div className="studio-console">
                    <div className="console-header">
                      <span>
                        SYSTEM_CONSOLE {'//'} {specialistData?.forge_telemetry?.dna_locked ? `DNA_LOCKED: ${specialistData.forge_telemetry.dna_locked}` : (specialistData?.status || 'STABLE')}
                        {specialistData?.forge_telemetry?.is_healing && <span className="healing-tag pulse">SELF-HEALING ACTIVE</span>}
                        <span className="dna-indicator" title="User Design DNA Alignment">DNA: <span style={{ color: '#00ff88' }}>OPTIMIZED</span></span>
                      </span>
                      <div className="console-actions">
                        <button className="c-btn" onClick={() => handleSpecialistAction('ENGINEER', 'MANIFEST_PROJECT', { prompt: lastUserPromptRef.current, project_name: 'zaire-engineered-site' })}>MANIFEST</button>
                        <button className={`c-btn ${specialistData?.forge_telemetry?.is_healing ? 'healing-active' : ''}`} onClick={() => handleSpecialistAction('ENGINEER', 'VISION_AUDIT')}>
                          {specialistData?.forge_telemetry?.is_healing ? 'HEALING…' : 'AUDIT'}
                        </button>
                      </div>
                    </div>
                    <div className="console-output">
                      {specialistData?.forge_build_log?.length > 0 ? (
                        mapWithStableKeys(
                          specialistData.forge_build_log,
                          (log) => log.id || `${log.timestamp}-${log.status}-${log.activity}`,
                          (log, stableKey) => (
                          <div key={stableKey} className="log-line">
                            <span className="log-ts">[{log.timestamp}]</span>
                            <span className={`log-tag ${log.status.toLowerCase()}`}>{log.status}</span>
                            <span className="log-msg">{log.activity}</span>
                          </div>
                          )
                        )
                      ) : (
                        <>
                          <div className="log-line"><span className="log-ts">[17:28:01]</span> <span className="log-tag init">INIT</span> <span className="log-msg">Autonomous Web Studio Manifested.</span></div>
                          <div className="log-line"><span className="log-ts">[17:28:05]</span> <span className="log-tag ok">OK</span> <span className="log-msg">Neural Link Synchronized.</span></div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SWARM CENTER: Master Protocol ── */}
            {activeMode === 'SWARM' && (
              <div className="swarm-chamber">
                <div className="chamber-header">
                  <div className="chamber-title">NEURAL SWARM {'//'} MASTER PROTOCOL</div>
                  <div className={`swarm-status-badge ${swarmPhase.toLowerCase()}`}>{swarmPhase}</div>
                </div>

                <div className="swarm-visualizer">
                  <div className="central-node pulse">MASTER</div>
                  <div className={`agent-node trader ${swarmPhase !== 'IDLE' ? 'active' : ''}`}>TRADER</div>
                  <div className={`agent-node professor ${swarmPhase !== 'IDLE' ? 'active' : ''}`}>PROFESSOR</div>
                  <div className={`agent-node engineer ${swarmPhase !== 'IDLE' ? 'active' : ''}`}>ENGINEER</div>
                  <div className="swarm-stream">
                    {mapWithStableKeys(
                      swarmMessages,
                      (m) => m.id || `${m.from}-${m.text}-${m.timestamp || ''}`,
                      (m, stableKey) => (
                      <div key={stableKey} className={`s-msg ${m.from.toLowerCase()}`}>
                        <span className="s-from">[{m.from}]</span> {m.text}
                      </div>
                      )
                    )}
                  </div>
                </div>

                <div className="swarm-controls">
                  <button className="swarm-btn" onClick={() => handleSpecialistAction('SWARM', 'INITIATE_TASK', { task: lastUserPromptRef.current })}>INITIATE GLOBAL SYNC</button>
                </div>
              </div>
            )}

            {/* ZAIRE CENTER: Orb fills via fixed canvas */}
          </div>

          {/* ROW 2: RIGHT PANEL */}
          <div className="grid-right">
            {activeCustomMode ? (
              getZoneComponents('Right Inspector').map(renderCustomComponent)
            ) : (
              <>
                {/* ── ZAIRE MODE RIGHT PANEL ── */}
                {activeMode === 'ZAIRE' && (
              <>
                <div className={`panel-section biometric-panel ${biometricData.detected ? 'detected' : ''} ${isSecurityAlert ? 'threat' : ''}`} style={getComponentStyle('BIOMETRIC_SCAN')}>
                  <div className="section-label">BIOMETRIC SCAN</div>
                  <div className="biometric-hud">
                    <div className="bio-status-row">
                      <span className="bio-label">IDENTITY:</span>
                      <span className={`bio-value ${biometricData.name === 'Master' ? 'master' : (isSecurityAlert ? 'alert' : '')}`}>
                        {isSecurityAlert ? 'UNKNOWN_THREAT' : (biometricData.detected ? biometricData.name.toUpperCase() : 'ABSENT')}
                      </span>
                    </div>
                    <div className="bio-status-row">
                      <span className="bio-label">SCAN LOCK:</span>
                      <div className="bio-lock-bar">
                        <div className={`bio-lock-fill ${biometricData.detected ? 'active' : ''} ${isSecurityAlert ? 'threat' : ''}`} style={{ width: biometricData.detected || isSecurityAlert ? '100%' : '0%' }}></div>
                      </div>
                    </div>
                    <div className="bio-status-row">
                      <span className="bio-label">FACE-LOCK:</span>
                      <span className={`bio-value ${biometricData.enabled ? 'online' : 'offline'}`}>{biometricData.enabled ? 'ACTIVE' : 'DISABLED'}</span>
                    </div>
                    <div className="bio-meta">
                      <div className="bio-btn-group">
                        <span className="bio-tag-btn active">SYSTEM READY</span>
                        <span className="bio-tag-btn">LOCKED</span>
                        <span className="bio-tag-btn">UNLOCKED</span>
                      </div>
                      <div className="bio-timer">30.01</div>
                    </div>
                  </div>
                </div>

                <div className={`panel-section vision-panel ${isVisionScanning ? 'vision-active' : ''}`} style={getComponentStyle('SCREEN_VISION')}>
                  <div className="section-label vision-label">
                    <span>SCREEN VISION</span>
                  </div>
                  <div className="vision-feed">
                    {isVisionScanning ? (
                      <div className="vision-scan-box">
                        <div className="scan-line-vision"></div>
                        <div className="vision-meta">OCR: ENABLED | NEURAL: SYNCING</div>
                      </div>
                    ) : (
                      <div className="vision-placeholder">
                        <div className="vision-off-text">VISION CORE OFFLINE</div>
                        <div className="vision-hint-text">Say: "What's on my screen?"</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* <div className="panel-section" style={getComponentStyle('SLEEP_AWAKE')}>
                  <div className="section-label">SLEEP / AWAKE</div>
                  <div className="sleep-hud">
                    <div className="sleep-main">
                      <span className="sleep-val">8</span>
                      <span className="sleep-unit">H</span>
                      <span className="sleep-state">STANDBY</span>
                    </div>
                    <div className="panel-section" style={getComponentStyle('ZAIRE_FEED')}>
                      <div className="section-label">SYSTEM_LOGS</div>
                      <div className="log-feed">
                        {mapWithStableKeys(
                          zaireActionFeed,
                          (log) => log.id || `${log.time}-${log.message}`,
                          (log, stableKey) => (
                          <div key={stableKey} className="log-entry">
                            <span className="log-time">[{log.time}]</span>
                            <span className="log-msg">{log.message}</span>
                          </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div> */}

                <div className="panel-section" style={getComponentStyle('SYSTEM_METRICS')}>
                  <div className="section-label">SYSTEM METRICS</div>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <span className="metric-value">{liveMetrics.latency}ms</span>
                      <span className="metric-label">LATENCY</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-value good">{liveMetrics.cpu}%</span>
                      <span className="metric-label">CPU LOAD</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-value">{liveMetrics.ram}%</span>
                      <span className="metric-label">RAM USAGE</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-value">{(audioFrequency * 100).toFixed(0)}%</span>
                      <span className="metric-label">VOICE PULSE</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── TRADER MODE RIGHT PANEL ── */}
            {activeMode === 'TRADER' && (
              <>
                <div className="panel-section">
                  <div className="section-label" >NEURAL VERDICT</div>
                  <div className="verdict-box" style={{ margin: 0 }}>
                    <div className="v-label">MARKET SIGNAL</div>
                    <div className="v-val" >STRONG BUY</div>
                    <div className="v-conf">CONFIDENCE: 94%</div>
                  </div>
                </div>

                <div className="panel-section">
                  <div className="section-label" >TOP OPPORTUNITY</div>
                  <div className="trade-card">
                    <div className="tc-head">
                      <span className="tc-asset" >SOL/USDT</span>
                      <span className="tc-badge">HALAL</span>
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.6, lineHeight: '1.4' }}>Breakout detected at $142.50. Target: $158.00.</div>
                    <div className="tc-btns">
                      <div className="tc-btn" style={{ borderColor: '#00ff88', color: '#00ff88' }}>CONFIRM</div>
                      <div className="tc-btn" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>CANCEL</div>
                    </div>
                  </div>
                </div>

                <div className="panel-section">
                  <div className="section-label" >RECENT TRADES</div>
                  <div className="macro-row"><span className="macro-key">BTC/USDT</span><span className="macro-val" >+$142.50</span></div>
                  <div className="macro-row"><span className="macro-key">ETH/USDT</span><span className="macro-val" style={{ color: '#ff3366' }}>-$24.12</span></div>
                </div>
              </>
            )}

            {/* ── PROFESSOR MODE RIGHT PANEL ── */}
            {activeMode === 'PROFESSOR' && (
              <>
                <div className="panel-section">
                  <div className="section-label" >NEURAL LOAD</div>
                  <div className="neural-gauge" style={{ margin: '10px auto', position: 'relative', width: '80px', height: '80px' }}>
                    <canvas ref={neuralGaugeRef} width="80" height="80"></canvas>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', color: '#a78bfa', fontWeight: 'bold' }}>84%</div>
                      <div style={{ fontSize: '12px', opacity: 0.4 }}>SYNC</div>
                    </div>
                  </div>
                </div>

                <div className="panel-section">
                  <div className="section-label" >QUICK ACTIONS</div>
                  <div className="macro-row"><span className="macro-key">SUMMARIZE</span><span className="macro-val">READY</span></div>
                  <div className="macro-row"><span className="macro-key">EXPLAIN</span><span className="macro-val">READY</span></div>
                </div>

                <div className="panel-section">
                  <div className="section-label" >SESSION UPTIME</div>
                  <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '18px', color: '#a78bfa', textAlign: 'center' }}>02:45:12</div>
                </div>

                <div className="panel-section">
                  <div className="section-label" >SPACED REVIEW</div>
                  <div style={{ padding: '10px', background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.2)' }}>
                    <div style={{ fontSize: '12px', color: '#a78bfa' }}>Next Review in 4h</div>
                    <div style={{ fontSize: '12px', opacity: 0.4, marginTop: '4px' }}>Topic: Backpropagation</div>
                  </div>
                </div>
              </>
            )}

            {/* ── ENGINEER MODE RIGHT PANEL ── */}
            {activeMode === 'ENGINEER' && (
              <>
                <div className="panel-section">
                  <div className="section-label" >BLUEPRINT</div>
                  <div className="macro-row"><span className="macro-key">NODES</span><span className="macro-val">24</span></div>
                  <div className="macro-row"><span className="macro-key">EDGES</span><span className="macro-val">56</span></div>
                  <div className="macro-row"><span className="macro-key">DEPTH</span><span className="macro-val">4</span></div>
                </div>

                <div className="panel-section">
                  <div className="section-label" >VANGUARD AUDIT</div>
                  <div className="macro-row"><span className="macro-key">SECURITY</span><span className="macro-val" >PASS</span></div>
                  <div className="macro-row"><span className="macro-key">PERF</span><span className="macro-val" >OPTIMAL</span></div>
                  <div className="macro-row"><span className="macro-key">LINT</span><span className="macro-val" style={{ color: '#ff3366' }}>2 ERR</span></div>
                </div>

                <div className="panel-section">
                  <div className="section-label">DESIGNER PERSONALITY</div>
                  <div className="persona-grid-engineer">
                    {[
                      'STARK_GRADE', 'STEVE_JOBS', 'JONY_IVE', 'MASSIMO_VIGNELLI',
                      'PAULA_SCHER', 'DAVID_CARSON', 'NERI_OXMAN', 'VIRGIL_ABLOH',
                      'DIETER_RAMS', 'ZAHA_HADID'
                    ].map(p => (
                      <button
                        key={p}
                        className={`e-persona-btn ${specialistData?.active_persona === p ? 'active' : ''}`}
                        onClick={() => handleSpecialistAction('ENGINEER', 'SET_DESIGNER_PERSONA', { persona: p })}
                        title={p.replace('_', ' ')}
                      >
                        {p.split('_')[0][0]}{p.split('_')[1] ? p.split('_')[1][0] : ''}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="panel-section">
                  <div className="section-label" >DNA PROFILE</div>
                  <div className="dna-viz-container">
                    <div className="dna-strand"></div>
                    <div className="dna-stats">
                      <span>TYPO: 98%</span>
                      <span>COLOR: 94%</span>
                    </div>
                  </div>
                </div>

                <div className="panel-section">
                  <div className="section-label">TACTICAL OPS</div>
                  <div className="ops-grid">
                    <button className="ops-btn" onClick={() => setThermalActive(!thermalActive)}>
                      {thermalActive ? 'THERMAL: ON' : 'THERMAL: OFF'}
                    </button>
                    <button className="ops-btn" onClick={() => handleSpecialistAction('ENGINEER', 'MIRROR_SANDBOX_SYNC')}>
                      SYNC MIRROR
                    </button>
                    <button className="ops-btn" onClick={() => { showHallOfFameRef.current = !showHallOfFameRef.current; }}>
                      HALL OF FAME
                    </button>
                  </div>
                </div>

                <div className="panel-section">
                  <div className="section-label" >DESIGN BRIEF</div>
                  <div style={{ fontSize: '12px', opacity: 0.5, lineHeight: '1.4' }}>
                    "Ensure high-fidelity glassmorphism across all modules."
                  </div>
                </div>
              </>
            )}

            {activeMode === 'ZAIRE' && (
              <>
                {/* ── PERSISTENT LAYOUT CALIBRATION ── */}
                <div className="panel-section" style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="section-label">{activeMode} LAYOUT CALIBRATION</div>
                  <div className="calibration-controls" style={{ padding: '4px' }}>
                    <div className="calibration-item" style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                        <label htmlFor="zaire-left-width">LEFT WIDTH</label>
                        <span>{layoutOffsets.leftWidth}px</span>
                      </div>
                      <input id="zaire-left-width" type="range" min="150" max="400" value={layoutOffsets.leftWidth || 200}
                        onChange={(e) => updateCurrentLayout({ leftWidth: parseInt(e.target.value) })}
                        style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                    </div>
                    <div className="calibration-item" style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                        <label htmlFor="zaire-right-width">RIGHT WIDTH</label>
                        <span>{layoutOffsets.rightWidth}px</span>
                      </div>
                      <input id="zaire-right-width" type="range" min="150" max="400" value={layoutOffsets.rightWidth || 200}
                        onChange={(e) => updateCurrentLayout({ rightWidth: parseInt(e.target.value) })}
                        style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                    </div>
                    <div className="calibration-item" style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                        <label htmlFor="zaire-cmd-height">CMD HEIGHT</label>
                        <span>{layoutOffsets.bottomHeight}px</span>
                      </div>
                      <input id="zaire-cmd-height" type="range" min="100" max="350" value={layoutOffsets.bottomHeight || 150}
                        onChange={(e) => updateCurrentLayout({ bottomHeight: parseInt(e.target.value) })}
                        style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                    </div>

                    <div style={{ margin: '10px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}></div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <div className="cal-col">
                        <div style={{ fontSize: '12px', opacity: 0.4, textAlign: 'center', marginBottom: '4px' }}>LEFT</div>
                        <div style={{ marginBottom: '6px' }}>
                          <div style={{ fontSize: '12px', opacity: 0.3 }}>X: {layoutOffsets.leftX}</div>
                          <input type="range" min="-100" max="100" value={layoutOffsets.leftX}
                            onChange={(e) => updateCurrentLayout({ leftX: parseInt(e.target.value) })}
                            style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.3 }}>Y: {layoutOffsets.leftY}</div>
                          <input type="range" min="-100" max="100" value={layoutOffsets.leftY}
                            onChange={(e) => updateCurrentLayout({ leftY: parseInt(e.target.value) })}
                            style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }} />
                        </div>
                      </div>

                      <div className="cal-col">
                        <div style={{ fontSize: '12px', opacity: 0.4, textAlign: 'center', marginBottom: '4px' }}>RIGHT</div>
                        <div style={{ marginBottom: '6px' }}>
                          <div style={{ fontSize: '12px', opacity: 0.3 }}>X: {layoutOffsets.rightX}</div>
                          <input type="range" min="-100" max="100" value={layoutOffsets.rightX}
                            onChange={(e) => updateCurrentLayout({ rightX: parseInt(e.target.value) })}
                            style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.3 }}>Y: {layoutOffsets.rightY}</div>
                          <input type="range" min="-100" max="100" value={layoutOffsets.rightY}
                            onChange={(e) => updateCurrentLayout({ rightY: parseInt(e.target.value) })}
                            style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }} />
                        </div>
                      </div>

                      <div className="cal-col">
                        <div style={{ fontSize: '12px', opacity: 0.4, textAlign: 'center', marginBottom: '4px' }}>CMD</div>
                        <div style={{ marginBottom: '6px' }}>
                          <div style={{ fontSize: '12px', opacity: 0.3 }}>X: {layoutOffsets.bottomX}</div>
                          <input type="range" min="-100" max="100" value={layoutOffsets.bottomX}
                            onChange={(e) => updateCurrentLayout({ bottomX: parseInt(e.target.value) })}
                            style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.3 }}>Y: {layoutOffsets.bottomY}</div>
                          <input type="range" min="-100" max="100" value={layoutOffsets.bottomY}
                            onChange={(e) => updateCurrentLayout({ bottomY: parseInt(e.target.value) })}
                            style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }} />
                        </div>
                      </div>
                    </div>

                    <button
                      className="cmd-btn"
                      style={{ width: '100%', marginTop: '12px', fontSize: '12px', padding: '4px', opacity: 0.6 }}
                      onClick={() => {
                        const defaults = {
                          'ZAIRE': { leftWidth: 200, rightWidth: 200, bottomHeight: 150, leftX: 0, leftY: 0, rightX: 0, rightY: 0, bottomX: 0, bottomY: 0 },
                          'TRADER': { leftWidth: 200, rightWidth: 220, bottomHeight: 90, leftX: 0, leftY: 0, rightX: 0, rightY: 0, bottomX: 0, bottomY: 0 },
                          'PROFESSOR': { leftWidth: 220, rightWidth: 200, bottomHeight: 80, leftX: 0, leftY: 0, rightX: 0, rightY: 0, bottomX: 0, bottomY: 0 },
                          'ENGINEER': { leftWidth: 200, rightWidth: 260, bottomHeight: 90, leftX: 0, leftY: 0, rightX: 0, rightY: 0, bottomX: 0, bottomY: 0 }
                        };
                        updateCurrentLayout(defaults[activeMode]);
                      }}
                    >
                      RESET {activeMode} LAYOUT
                    </button>
                  </div>
                </div>

                {/* ── COMPONENT CALIBRATION ── */}
                <div className="panel-section" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                  <div className="section-label">COMPONENT CALIBRATION</div>
                  <div className="calibration-controls" style={{ padding: '4px' }}>
                    <select
                      value={selectedComponent}
                      onChange={(e) => setSelectedComponent(e.target.value)}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', padding: '4px', marginBottom: '8px' }}
                    >
                      <option value="">SELECT COMPONENT…</option>
                      {(({
                        'ZAIRE': ['ACTIVE_MODE', 'SYSTEM_VITALS', 'BIOMETRIC_SCAN', 'SCREEN_VISION', 'SYSTEM_METRICS', 'MODULE_STATUS', 'VOICE_MONITOR', 'MEMORY_CORE'],
                        'TRADER': ['PORTFOLIO', 'WATCHLIST', 'HALAL_FILTER', 'TOP_OPPORTUNITY', 'MACRO_SIGNALS'],
                        'PROFESSOR': ['CURRICULUM', 'STUDY_METRICS', 'LEARNING_PROGRESS', 'STUDY_GOALS'],
                        'ENGINEER': ['ACTIVE_PROJECT', 'FILE_TREE', 'FORGE_TELEMETRY', 'MANIFESTATION_SYNC', 'SYSTEM_ACTIONS']
                      })[activeMode] || []).map(id => (
                        <option key={id} value={id}>{id.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* ── PERSISTENT LAYOUT CALIBRATION ── */}
            <div className="panel-section" style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="section-label">{activeMode} LAYOUT CALIBRATION</div>
              <div className="calibration-controls" style={{ padding: '4px' }}>
                <div className="calibration-item" style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                    <label htmlFor="layout-left-width">LEFT WIDTH</label>
                    <span>{layoutOffsets.leftWidth}px</span>
                  </div>
                  <input id="layout-left-width" type="range" min="150" max="400" value={layoutOffsets.leftWidth || 200}
                    onChange={(e) => updateCurrentLayout({ leftWidth: parseInt(e.target.value) })}
                    style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                </div>
                <div className="calibration-item" style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                    <label htmlFor="layout-right-width">RIGHT WIDTH</label>
                    <span>{layoutOffsets.rightWidth}px</span>
                  </div>
                  <input id="layout-right-width" type="range" min="150" max="400" value={layoutOffsets.rightWidth || 200}
                    onChange={(e) => updateCurrentLayout({ rightWidth: parseInt(e.target.value) })}
                    style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                </div>
                <div className="calibration-item" style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                    <label htmlFor="layout-cmd-height">CMD HEIGHT</label>
                    <span>{layoutOffsets.bottomHeight}px</span>
                  </div>
                  <input id="layout-cmd-height" type="range" min="100" max="350" value={layoutOffsets.bottomHeight || 150}
                    onChange={(e) => updateCurrentLayout({ bottomHeight: parseInt(e.target.value) })}
                    style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                </div>

                <div style={{ margin: '10px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}></div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div className="cal-col">
                    <div style={{ fontSize: '12px', opacity: 0.4, textAlign: 'center', marginBottom: '4px' }}>LEFT</div>
                    <div style={{ marginBottom: '6px' }}>
                      <div style={{ fontSize: '12px', opacity: 0.3 }}>X: {layoutOffsets.leftX}</div>
                      <input type="range" min="-100" max="100" value={layoutOffsets.leftX}
                        onChange={(e) => updateCurrentLayout({ leftX: parseInt(e.target.value) })}
                        style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', opacity: 0.3 }}>Y: {layoutOffsets.leftY}</div>
                      <input type="range" min="-100" max="100" value={layoutOffsets.leftY}
                        onChange={(e) => updateCurrentLayout({ leftY: parseInt(e.target.value) })}
                        style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }} />
                    </div>
                  </div>

                  <div className="cal-col">
                    <div style={{ fontSize: '12px', opacity: 0.4, textAlign: 'center', marginBottom: '4px' }}>RIGHT</div>
                    <div style={{ marginBottom: '6px' }}>
                      <div style={{ fontSize: '12px', opacity: 0.3 }}>X: {layoutOffsets.rightX}</div>
                      <input type="range" min="-100" max="100" value={layoutOffsets.rightX}
                        onChange={(e) => updateCurrentLayout({ rightX: parseInt(e.target.value) })}
                        style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', opacity: 0.3 }}>Y: {layoutOffsets.rightY}</div>
                      <input type="range" min="-100" max="100" value={layoutOffsets.rightY}
                        onChange={(e) => updateCurrentLayout({ rightY: parseInt(e.target.value) })}
                        style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }} />
                    </div>
                  </div>

                  <div className="cal-col">
                    <div style={{ fontSize: '12px', opacity: 0.4, textAlign: 'center', marginBottom: '4px' }}>CMD</div>
                    <div style={{ marginBottom: '6px' }}>
                      <div style={{ fontSize: '12px', opacity: 0.3 }}>X: {layoutOffsets.bottomX}</div>
                      <input type="range" min="-100" max="100" value={layoutOffsets.bottomX}
                        onChange={(e) => updateCurrentLayout({ bottomX: parseInt(e.target.value) })}
                        style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', opacity: 0.3 }}>Y: {layoutOffsets.bottomY}</div>
                      <input type="range" min="-100" max="100" value={layoutOffsets.bottomY}
                        onChange={(e) => updateCurrentLayout({ bottomY: parseInt(e.target.value) })}
                        style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }} />
                    </div>
                  </div>
                </div>

                <button
                  className="cmd-btn"
                  style={{ width: '100%', marginTop: '12px', fontSize: '12px', padding: '4px', opacity: 0.6 }}
                  onClick={() => {
                    const defaults = {
                      'ZAIRE': { leftWidth: 200, rightWidth: 200, bottomHeight: 150, leftX: 0, leftY: 0, rightX: 0, rightY: 0, bottomX: 0, bottomY: 0 },
                      'TRADER': { leftWidth: 200, rightWidth: 220, bottomHeight: 90, leftX: 0, leftY: 0, rightX: 0, rightY: 0, bottomX: 0, bottomY: 0 },
                      'PROFESSOR': { leftWidth: 220, rightWidth: 200, bottomHeight: 80, leftX: 0, leftY: 0, rightX: 0, rightY: 0, bottomX: 0, bottomY: 0 },
                      'ENGINEER': { leftWidth: 200, rightWidth: 260, bottomHeight: 90, leftX: 0, leftY: 0, rightX: 0, rightY: 0, bottomX: 0, bottomY: 0 }
                    };
                    updateCurrentLayout(defaults[activeMode]);
                  }}
                >
                  RESET {activeMode} LAYOUT
                </button>
              </div>
            </div>

            {/* ── COMPONENT CALIBRATION ── */}
            <div className="panel-section" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
              <div className="section-label">COMPONENT CALIBRATION</div>
              <div className="calibration-controls" style={{ padding: '4px' }}>
                <select
                  value={selectedComponent}
                  onChange={(e) => setSelectedComponent(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', padding: '4px', marginBottom: '8px' }}
                >
                  <option value="">SELECT COMPONENT…</option>
                  {(({
                    'ZAIRE': ['ACTIVE_MODE', 'SYSTEM_VITALS', 'BIOMETRIC_SCAN', 'SCREEN_VISION', 'SYSTEM_METRICS', 'MODULE_STATUS', 'VOICE_MONITOR', 'MEMORY_CORE'],
                    'TRADER': ['PORTFOLIO', 'WATCHLIST', 'HALAL_FILTER', 'TOP_OPPORTUNITY', 'MACRO_SIGNALS', 'MODULE_STATUS', 'VOICE_MONITOR', 'MEMORY_CORE'],
                    'PROFESSOR': ['CURRICULUM', 'STUDY_METRICS', 'LEARNING_PROGRESS', 'STUDY_GOALS', 'MODULE_STATUS', 'VOICE_MONITOR', 'MEMORY_CORE'],
                    'ENGINEER': ['ACTIVE_PROJECT', 'FILE_TREE', 'FORGE_TELEMETRY', 'MANIFESTATION_SYNC', 'SYSTEM_ACTIONS', 'MODULE_STATUS', 'VOICE_MONITOR', 'MEMORY_CORE']
                  })[activeMode] || []).map(id => (
                    <option key={id} value={id}>{id.replace(/_/g, ' ')}</option>
                  ))}
                </select>

                {selectedComponent && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.4 }}>
                        <label htmlFor="component-nudge-x">X NUDGE</label>
                        <span>{(componentNudges[selectedComponent]?.x || 0)}px</span>
                      </div>
                      <input id="component-nudge-x" type="range" min="-100" max="100" value={componentNudges[selectedComponent]?.x || 0}
                        onChange={(e) => updateComponentNudge(selectedComponent, { x: parseInt(e.target.value) })}
                        style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.4 }}>
                        <label htmlFor="component-nudge-y">Y NUDGE</label>
                        <span>{(componentNudges[selectedComponent]?.y || 0)}px</span>
                      </div>
                      <input id="component-nudge-y" type="range" min="-100" max="100" value={componentNudges[selectedComponent]?.y || 0}
                        onChange={(e) => updateComponentNudge(selectedComponent, { y: parseInt(e.target.value) })}
                        style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }} />
                    </div>
                  </div>
                )}

                <button
                  className="cmd-btn"
                  style={{ width: '100%', marginTop: '10px', fontSize: '12px', padding: '4px', opacity: 0.4 }}
                  onClick={() => {
                    if (window.confirm('RESET ALL COMPONENT NUDGES?')) setComponentNudges({});
                  }}
                >
                  RESET ALL COMPONENTS
                </button>
              </div>
            </div>
          </>
        )}
      </div>

          {isArchivesPageOpen && (
            <div className="neural-archives-page">
              <div className="neural-archives-shell">
                <div className="archives-page-header">
                  <div>
                    <div className="archives-kicker">ZAIRE MEMORY CORE</div>
                    <div className="archives-title">NEURAL ARCHIVES</div>
                    <div className="archives-subtitle">All saved sessions with export-grade controls.</div>
                  </div>
                  <div className="archives-header-actions">
                    <button className="archive-head-btn" onClick={() => { handleNewChat(); setIsArchivesPageOpen(false); }}>NEW THREAD</button>
                    <button className="archive-head-btn" onClick={fetchChatSessions}>REFRESH</button>
                    <button className="archive-head-btn close" onClick={() => setIsArchivesPageOpen(false)}>CLOSE</button>
                  </div>
                </div>

                <div className="archives-page-body">
                  <div className="archives-list-pane">
                    <div className="panel-label archives-panel-label">SESSION INDEX</div>
                    <div className="chat-search-box archives-search">
                      <input
                        type="text"
                        placeholder="SEARCH ARCHIVES..."
                        value={chatSearch}
                        onChange={(e) => setChatSearch(e.target.value)}
                        className="chat-search-input"
                      />
                    </div>

                    <div className="archives-list-grid">
                      {chatSessions.length === 0 && <div className="session-empty">NO THREADS ARCHIVED</div>}
                      {chatSessions.reduce((matches, session) => {
                        const archiveTitle = getArchiveSessionTitle(session);
                        if (!archiveTitle.toLowerCase().includes(chatSearch.toLowerCase())) {
                          return matches;
                        }
                        matches.push(
                          <div
                            key={session.id}
                            className={`archive-card ${selectedArchiveId === session.id ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedArchiveId(session.id);
                              loadArchiveSessionDetail(session.id);
                            }}
                            onKeyDown={(event) => handleAccessibleActivate(event, () => {
                              setSelectedArchiveId(session.id);
                              loadArchiveSessionDetail(session.id);
                            })}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="archive-card-corner archive-card-corner-tl" />
                            <div className="archive-card-corner archive-card-corner-br" />
                            <div className="archive-card-main">
                              <div className="archive-card-title">{archiveTitle}</div>
                              <div className="archive-card-meta">
                                <span className="archive-card-timestamp">
                                  <ClientLocalTime value={session.timestamp} mode="datetime" />
                                </span>
                                <span className="archive-card-count">{session.messageCount} MSGS</span>
                              </div>
                            </div>
                            <div className="archive-card-actions">
                              <button className="session-action-btn rename" title="Rename chat" aria-label="Rename chat" onClick={(e) => { e.stopPropagation(); setEditingSessionId(session.id); setEditingTitle(archiveTitle); }}>
                                <ArchiveActionIcon type="rename" />
                              </button>
                              <button className={`session-action-btn ${archiveReactions[session.id] === 'like' ? 'active-like' : ''}`} title="Like chat" aria-label="Like chat" onClick={(e) => { e.stopPropagation(); handleArchiveReaction(session.id, 'like'); }}>
                                <ArchiveActionIcon type="like" />
                              </button>
                              <button className={`session-action-btn ${archiveReactions[session.id] === 'dislike' ? 'active-dislike' : ''}`} title="Dislike chat" aria-label="Dislike chat" onClick={(e) => { e.stopPropagation(); handleArchiveReaction(session.id, 'dislike'); }}>
                                <ArchiveActionIcon type="dislike" />
                              </button>
                              <button className="session-action-btn delete" title="Delete chat" aria-label="Delete chat" onClick={(e) => handleDeleteSession(e, session.id)}>
                                <ArchiveActionIcon type="delete" />
                              </button>
                            </div>
                          </div>
                        );
                        return matches;
                      }, [])}
                    </div>
                  </div>

                  <div className="archives-detail-pane">
                    {selectedArchiveId ? (
                      <>
                        <div className="archives-detail-head">
                          <div className="panel-label archives-panel-label">CONVERSATION STREAM</div>
                          {editingSessionId === selectedArchiveId ? (
                            <input
                              className="session-rename-input"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onBlur={() => { handleRenameSession(selectedArchiveId, editingTitle); setEditingSessionId(null); fetchChatSessions(); }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { handleRenameSession(selectedArchiveId, editingTitle); setEditingSessionId(null); fetchChatSessions(); }
                                if (e.key === 'Escape') setEditingSessionId(null);
                              }}
                            />
                          ) : (
                            <div className="archives-detail-title">{getArchiveSessionTitle(chatSessions.find(s => s.id === selectedArchiveId) || archiveSessionCache[selectedArchiveId])}</div>
                          )}
                        </div>
                        <div className="archives-transcript">
                          <ArchiveConversation session={archiveSessionCache[selectedArchiveId]} />
                        </div>
                      </>
                    ) : (
                      <div className="archives-empty-state">Select a chat from the left to inspect, export, and open it.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* ROW 3: BOTTOM PANEL */}
          <div className="grid-bottom">
            <div className="bottom-left">
              {/* ── SECURITY ALERT HUD (IMAGE OVERLAY) ── */}
              {(isSecurityAlert || biometricData.intruders > 0) && (
                <div className="security-alert-hud-box">
                  <div className="alert-header">
                    <span className="alert-icon">⚠️</span>
                    <span className="alert-title">ALERT: UNKNOWN USER</span>
                  </div>
                  <div className="alert-content">
                    <div className="alert-msg">SCANNING YOUR SYSTEM! SNAPSHOT…</div>
                    <div className="alert-meta">THREAT_LEVEL: CRITICAL</div>
                  </div>
                  <div className="alert-footer">
                    <span className="blink">NEU-STREAM: ACTIVE</span>
                  </div>
                </div>
              )}

              <div className="version-info">
                <span className="version-row">ZAIRE CORE: v1.0</span>
                <span className="version-row verified">AUTH: MUGHEES [VERIFIED]</span>
              </div>
            </div>

            <div className="bottom-center">
              <div className="single-command-box">
                <div className="command-header">
                  <span>ZAIRE COMMAND INTERFACE</span>
                  <div className="header-controls">
                    <button
                      className={`engine-toggle ${useGroqSpeech ? 'groq' : 'browser'}`}
                      onClick={() => setUseGroqSpeech(!useGroqSpeech)}
                      title={useGroqSpeech ? 'Using Groq AI (Whisper)' : 'Using Browser Speech'}
                    >
                      {useGroqSpeech ? 'GROQ' : 'BROWSER'}
                    </button>
                    <span className="groq-status">{groqStatus}</span>
                    <div className={`mic-indicator ${isMicrophoneActive ? 'active' : ''}`}>
                      <span className="mic-dot"></span>
                      <span>{isMicrophoneActive ? 'LISTENING' : 'VOICE READY'}</span>
                    </div>
                  </div>
                </div>

                {/* ... (Existing Command Box Logic) ... */}
                <div className="command-row">
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple onChange={handleFileUpload} />
                  <button className="uplink-btn" onClick={() => fileInputRef.current.click()} title="Tactical Uplink">
                    <svg className="uplink-icon" viewBox="0 0 24 24"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.66 1.34 3 3 3s3-1.34 3-3V5c0-2.48-2.02-4.5-4.5-4.5S7 2.52 7 5v12.5c0 3.59 2.91 6.5 6.5 6.5s6.5-2.91 6.5-6.5V6h-1.5z" /></svg>
                  </button>
                  <div className={`command-input-wrapper ${isMicrophoneActive ? 'voice-mode' : (isTyping ? 'typing-mode' : '')}`}>
                    <input
                      type="text"
                      className={`command-input ${isMicrophoneActive ? 'voice-active' : (isTyping ? 'typing-active' : '')}`}
                      placeholder={isMicrophoneActive ? 'ZAIRE LISTENING...' : 'TYPE OR SPEAK COMMAND...'}
                      value={isMicrophoneActive ? (recognizedText || '') : (inputValue || '')}
                      onChange={(e) => {
                        if (!isMicrophoneActive) {
                          setInputValue(e.target.value);
                          setIsTyping(e.target.value.length > 0);
                        }
                      }}
                      onFocus={() => setIsTyping(true)}
                      onBlur={() => setIsTyping(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          const userText = e.target.value;
                          lastUserPromptRef.current = userText;
                          setInputValue('');
                          setIsTyping(false);
                          setZaireResponseStream('');
                          liveCodeStreamRef.current = '';
                          if (socketRef.current) socketRef.current.emit('user_message', userText, { artifactTokens: [...artifactTokensRef.current, ...pendingArtifactTokensRef.current] });
                          if (pendingArtifactTokensRef.current.length > 0) {
                            artifactTokensRef.current = [...artifactTokensRef.current, ...pendingArtifactTokensRef.current];
                            pendingArtifactTokensRef.current = [];
                          }
                        }
                      }}
                      disabled={isMicrophoneActive}
                    />
                  </div>
                  <button
                    className={`mic-btn morphing-mic-btn ${isMicrophoneActive ? 'active' : ''}`}
                    onClick={toggleMicrophone}
                    title={isMicrophoneActive ? 'Stop listening' : 'Start listening'}
                    aria-pressed={isMicrophoneActive}
                  >
                    <span className="mic-btn-shimmer" aria-hidden="true"></span>
                    <span className="mic-btn-label" aria-hidden="true">
                      <span className={`mic-waveform mic-waveform-left ${isMicrophoneActive ? 'active' : ''}`} aria-hidden="true">
                        <span className="mic-wave-bar"></span>
                        <span className="mic-wave-bar"></span>
                        <span className="mic-wave-bar"></span>
                      </span>
                      <span className="mic-btn-icon-wrap" aria-hidden="true">
                        <svg className="mic-icon" viewBox="0 0 24 24">
                          <path d="M12 15.5a3.5 3.5 0 0 0 3.5-3.5V7a3.5 3.5 0 1 0-7 0v5a3.5 3.5 0 0 0 3.5 3.5Z" />
                          <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0" />
                          <path d="M12 15.5v4" />
                          <path d="M9 19.5h6" />
                        </svg>
                      </span>
                      <span className={`mic-waveform mic-waveform-right ${isMicrophoneActive ? 'active' : ''}`} aria-hidden="true">
                        <span className="mic-wave-bar"></span>
                        <span className="mic-wave-bar"></span>
                        <span className="mic-wave-bar"></span>
                      </span>
                      <span className={`mic-listening-ring ${isMicrophoneActive ? 'active' : ''}`}></span>
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bottom-right">
              <div className="camera-scan-container">
                <div className="hud-corner-brackets"></div>
                <div className="scanline-overlay"></div>
                <div className="hud-video-container">
                  {cameraStatus === 'authorized' ? (
                    <div className="hud-video-wrapper">
                      <img
                        src={API_BASE_URL + '/api/security/status/video_feed'}
                        alt="Camera Feed"
                        className="hud-video-feed"
                      />
                      <canvas className="face-mesh-canvas" ref={faceMeshCanvasRef}></canvas>
                      <div className="biometric-tactical-overlay">
                        <div className="targeting-bracket tl"></div>
                        <div className="targeting-bracket tr"></div>
                        <div className="targeting-bracket bl"></div>
                        <div className="targeting-bracket br"></div>
                        <div className="bio-readout-hud">
                          {/* <div className="bio-stat">ID: {biometricData.name || 'SCANNING'}</div> */}
                          {/* <div className="bio-stat">CONF: {biometricData.confidence || 0}%</div> */}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="camera-auth-overlay">
                      <div className="auth-glitch-text">
                        {cameraStatus === 'denied' ? 'SIGNAL_BLOCKED' : 'AWAITING_AUTH'}
                      </div>
                      <div className="auth-subtext">
                        {cameraStatus === 'denied' ? 'AUTHORIZATION DENIED BY MASTER' : 'TACTICAL UPLINK PENDING…'}
                      </div>
                    </div>
                  )}
                  <div className="face-target-box">
                    <div className="reticle reticle-tl"></div>
                    <div className="reticle reticle-tr"></div>
                    <div className="reticle reticle-bl"></div>
                    <div className="reticle reticle-br"></div>
                    <div className="scanning-bar"></div>
                  </div>
                  <div className={`biometric-status-flash ${biometricData.detected ? 'confirmed' : (isSecurityAlert ? 'threat' : '')}`}></div>
                  <div className="hud-telemetry-top">
                    <span className="telemetry-item">REC ●</span>
                    {/* <span className="telemetry-item blink">SYNC_[88%]</span> */}
                  </div>
                  <div className="hud-telemetry-bottom">
                    {/* <span className="telemetry-item">60 FPS</span>
                    <span className="telemetry-item">4.2 Mbps</span> */}
                  </div>
                </div>
              </div>
            </div>
      </div>

          {/* ── FLOATING RESPONSE STREAM (FUTURISTIC SUBTITLES) ── */}
          <div className={`floating-subtitles ${showResponsePanel && zaireResponseStream ? 'visible' : ''}`}>
            <div className="subtitles-content">
              <span className="subtitles-prefix">ZAIRE // </span>
              {zaireResponseStream}
            </div>
          </div>
        </div>

        {/* ── SECURITY ALERT OVERLAY ── */}
        {showSecurityOverlay && activeIntruder && (
          <div className="security-alert-overlay">
            <div className="glitch-background"></div>
            <div className="threat-container">
              <div className="threat-header">🚨 SECURITY BREACH DETECTED 🚨</div>
              <div className="intruder-card">
                {activeIntruder.snapshot_b64 ? (
                  <img
                    src={`data:image/jpeg;base64,${activeIntruder.snapshot_b64}`}
                    alt="Intruder"
                    className="intruder-face"
                  />
                ) : (
                  <div className="intruder-placeholder">IMAGE_LOST</div>
                )}
                <div className="intruder-meta">
                  <div className="meta-row"><span className="L">TIMESTAMP:</span> <span className="V">{activeIntruder.timestamp}</span></div>
                  <div className="meta-row"><span className="L">THREAT_LVL:</span> <span className="V red">CRITICAL</span></div>
                  <div className="meta-row"><span className="L">ACTION:</span> <span className="V">PUSH_SENT</span></div>
                </div>
              </div>
              <button className="threat-dismiss" onClick={() => dispatchSecurityState({ type: 'HIDE_SECURITY_OVERLAY' })}>ACKNOWLEDGE RISK</button>
            </div>
          </div>
        )}

        <ShadowAssistant socket={socketRef.current} />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          activeMode={activeMode}
          customModes={customModes}
          onCustomModesChange={(nextModes) => {
            const sanitizedModes = nextModes.map(sanitizeCustomModeRecord);
            setCustomModes(sanitizedModes);
            if (activeCustomMode && !nextModes.some((m) => m.enabled && m.name === activeCustomMode)) {
              setActiveCustomMode(null);
            }
          }}
          biometricData={biometricData}
          blobColor={blobColor}
          setBlobColor={setBlobColor}
          blobSize={blobSize}
          setBlobSize={setBlobSize}
          hudOpacity={hudOpacity}
          setHudOpacity={setHudOpacity}
          neuralGlowEnabled={neuralGlowEnabled}
          setNeuralGlowEnabled={setNeuralGlowEnabled}
          holographicTiltEnabled={holographicTiltEnabled}
          setHolographicTiltEnabled={setHolographicTiltEnabled}
          halalFilterEnabled={halalFilterEnabled}
          setHalalFilterEnabled={setHalalFilterEnabled}
          autoLintEnabled={autoLintEnabled}
          setAutoLintEnabled={setAutoLintEnabled}
          onEnterDragMode={() => {
            setIsSettingsOpen(false);
            setIsDragging(true);
            dragStateRef.current.isPointerDown = false;
          }}
        />

        {isDragging && (
          <div
            className="drag-overlay"
            onPointerDown={handleDragPointerDown}
            onPointerMove={handleDragPointerMove}
            onPointerUp={handleDragPointerUp}
            onPointerCancel={handleDragPointerUp}
            onPointerLeave={handleDragPointerUp}
          >
            <div className="drag-helper-text">
              <span>DRAG ANYWHERE TO REPOSITION</span>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  syncBlobPosition(blobPositionRef, dragStateRef.current.tempPosition, mainGroupRef);
                  dragStateRef.current.isPointerDown = false;
                  setIsDragging(false);
                }}
              >
                SAVE POSITION
              </button>
            </div>
          </div>
        )}
        {/* Engagement Overlay (Audio Context Fix) */}
        {/* ── NEURAL VIDEO OVERLAY ── */}
        {isVideoPlaying && neuralVideoData && (
          <div className="neural-video-overlay">
            <div className="video-header">
              <span className="video-title">{neuralVideoData.title}</span>
              <button className="video-close" onClick={() => setIsVideoPlaying(false)}>✕</button>
              <div className="zaire-response-text">
                {zaireResponseStream || 'AWAITING NEURAL UPLINK…'}
              </div>
            </div>
            <div className="video-stage">
              <div className="three-manifest-layer">
                {/* Real 3D content would be rendered into a Three.js sub-canvas here */}
                <div className="manifestation-label">3D_MANIFEST: ACTIVE</div>
              </div>
              <div className="subtitles-layer">
                {zaireResponseStream}
              </div>
            </div>
            <div className="video-timeline">
              <div className="timeline-progress" style={{ width: '45%' }}></div>
            </div>
          </div>
        )}

        {/* ── KNOWLEDGE PARTICLES ── */}
        {particles.map(p => (
          <div
            key={p.id}
            className="knowledge-particle"
            style={{
              left: p.x,
              top: p.y,
              '--target-x': `${p.tx}px`,
              '--target-y': `${p.ty}px`
            }}
          />
        ))}

        {/* ── OMNI-BOX SEARCH ── */}
        {isOmniBoxOpen && (
          <div
            className="omni-box-overlay"
            onClick={() => setIsOmniBoxOpen(false)}
            onKeyDown={(event) => handleAccessibleActivate(event, () => setIsOmniBoxOpen(false))}
            role="button"
            tabIndex={0}
          >
            <div className="omni-box-container" onClick={e => e.stopPropagation()} role="presentation">
              <div className="omni-header">OMNI_SEARCH_V2 // SYSTEM_QUERY</div>
              <input
                className="omni-input"
                placeholder="ASK ZAIRE... (Prefix 'Deep think' for 70B cores)"
                value={omniInput || ''}
                onChange={e => setOmniInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && omniInput.trim()) {
                    if (socketRef.current) socketRef.current.emit('user_message', omniInput);
                    setOmniInput('');
                    setIsOmniBoxOpen(false);
                  }
                }}
              />
              <div className="omni-footer">PRESS ESC TO DISMISS</div>
            </div>
          </div>
        )}

        {!isSystemEngaged && (
          <div
            className="engagement-overlay"
            onClick={() => setIsSystemEngaged(true)}
            onKeyDown={(event) => handleAccessibleActivate(event, () => setIsSystemEngaged(true))}
            role="button"
            tabIndex={0}
          >
            <div className="engagement-content">
              <div className="power-icon">⚡</div>
              <h2>INITIALIZE ZAIRE NEURAL LINK</h2>
              <p>Click to synchronize sensory arrays and audio core.</p>
              <div className="scan-line"></div>
            </div>
          </div>
        )}
      </>

      {false && (
        <SignedOut>
          <div className="zaire-auth-container-glass">
            <div className="auth-box-wrapper">
              <h1 className="auth-brand-title">ZAIRE OS</h1>
              {authView === 'signin' ? (
                <SignIn routing="hash" signUpUrl="#sign-up" forceRedirectUrl="/" />
              ) : (
                <SignUp routing="hash" signInUrl="#sign-in" forceRedirectUrl="/" />
              )}
            </div>
          </div>
        </SignedOut>
      )}
    </div>
  );

  return renderView;
}

function App() {
  const renderView = useAppController();
  return renderView();
}

export default App;



