import React, { useEffect, useState } from 'react';
import './SettingsModal.css';

const API_URL = process.env.REACT_APP_API_URL;


const MODE_STORAGE_KEY = 'zaire_custom_modes_v1';

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
  capabilities: ['WEB SEARCH', 'FILE SYSTEM', 'SCREEN VISION', 'COMPUTER USE'],
  persona: '',
  goals: '',
  preferredOutput: 'Action Plan',
  components: ['TOPBAR', 'LEFT_PANEL', 'CENTER_STAGE'],
  routingPriority: 'Balanced',
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
      <div className="api-row">
        <select className="api-model-select" value={model || 'Auto'} onChange={(e) => onChange({ model: e.target.value })}>
          <option>Auto</option>
          <option>Fast</option>
          <option>Deep Reasoning</option>
          <option>Code Specialist</option>
        </select>
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

function SettingsModal({
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
  const [activePage, setActivePage] = useState('hud');
  const [scanlines, setScanlines] = useState(true);
  const [adaptiveColor, setAdaptiveColor] = useState(true);
  const [urgentFlash, setUrgentFlash] = useState(true);
  const [transitionSpeed, setTransitionSpeed] = useState('NORMAL');
  const [responseDepth, setResponseDepth] = useState('TURBO');
  const [voiceWake, setVoiceWake] = useState(85);
  const [faceConfidence, setFaceConfidence] = useState(92);
  const [intruderSnapshot, setIntruderSnapshot] = useState(true);
  const [memoryDepth, setMemoryDepth] = useState(60);
  const [alertLevel, setAlertLevel] = useState('TACTICAL');
  const [neuralDarwinism, setNeuralDarwinism] = useState(true);
  const [ambientNoise, setAmbientNoise] = useState(true);
  const [privateSession, setPrivateSession] = useState(false);
  const [missionDigest, setMissionDigest] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState(modeTemplates[0].id);
  const [creatorDraft, setCreatorDraft] = useState(blankCreatorDraft);
  const [localModes, setLocalModes] = useState(customModes && customModes.length ? customModes : defaultCustomModes);
  const [aiSlots, setAiSlots] = useState(() => ([
    { provider: 'Groq', apiKey: '', hasKey: false, model: 'Auto', purpose: 'Primary', baseUrl: '', enabled: true },
    { provider: 'OpenAI', apiKey: '', hasKey: false, model: 'Auto', purpose: 'Coding', baseUrl: '', enabled: true },
    { provider: 'Empty', apiKey: '', hasKey: false, model: 'Auto', purpose: 'Fallback', baseUrl: '', enabled: false }
  ]));

  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [licensingInfo, setLicensingInfo] = useState(null);
  const [licensingError, setLicensingError] = useState(null);
  const [licensingLoading, setLicensingLoading] = useState(false);

  const fetchLicensingInfo = async () => {
    setLicensingLoading(true);
    try {
      const storedLicense = localStorage.getItem('zaire_license_key') || '';
      if (storedLicense) {
        setLicenseKeyInput(storedLicense);
        const response = await fetch(`${API_BASE_URL}/api/license/validate`, {
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
      const response = await fetch(`${API_BASE_URL}/api/license/validate`, {
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
      const response = await fetch(`${API_BASE_URL}/api/license/deactivate`, {
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
      setLocalModes(customModes);
    }
  }, [customModes]);

  useEffect(() => {
    if (!isOpen) return;
    let isActive = true;
    fetch(`${API_BASE_URL}/llm/providers`)
      .then((r) => r.json())
      .then((data) => {
        if (!isActive) return;
        const slots = data?.slots;
        if (Array.isArray(slots) && slots.length > 0) {
          const normalized = [0, 1, 2].map((i) => ({
            provider: slots[i]?.provider || 'Empty',
            apiKey: slots[i]?.apiKey || '',
            hasKey: Boolean(slots[i]?.hasKey),
            model: slots[i]?.model || 'Auto',
            purpose: slots[i]?.purpose || (i === 0 ? 'Primary' : i === 1 ? 'Coding' : 'Fallback'),
            baseUrl: slots[i]?.baseUrl || '',
            enabled: Boolean(slots[i]?.enabled ?? true)
          }));
          setAiSlots(normalized);
        }
      })
      .catch(() => { });
    return () => { isActive = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const hudOpacityPercent = Math.round(hudOpacity * 100);
  const setHudOpacityPercent = (value) => setHudOpacity(value / 100);
  const selectedTemplate = modeTemplates.find((template) => template.id === selectedTemplateId) || modeTemplates[0];
  const modeCount = localModes.length;

  const persistCustomModes = (nextModes) => {
    setLocalModes(nextModes);
    localStorage.setItem(MODE_STORAGE_KEY, JSON.stringify(nextModes));
    if (onCustomModesChange) onCustomModesChange(nextModes);
  };

  const applyTemplateToDraft = (template) => {
    setCreatorDraft({
      name: template.name,
      desc: template.desc,
      color: template.color,
      capabilities: template.capabilities,
      persona: template.persona,
      goals: '',
      preferredOutput: 'Action Plan',
      components: ['TOPBAR', 'LEFT_PANEL', 'CENTER_STAGE'],
      routingPriority: 'Balanced',
    });
    setSelectedTemplateId(template.id);
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

  const manifestMode = () => {
    const name = creatorDraft.name.trim();
    const desc = creatorDraft.desc.trim();

    if (!name || !desc) return;

    const nextMode = {
      id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      name: name.toUpperCase(),
      desc,
      color: creatorDraft.color,
      capabilities: creatorDraft.capabilities,
      persona: creatorDraft.persona.trim() || 'Custom ZAIRE specialist',
      goals: creatorDraft.goals.trim(),
      preferredOutput: creatorDraft.preferredOutput,
      components: creatorDraft.components,
      routingPriority: creatorDraft.routingPriority,
      enabled: true,
      source: selectedTemplateId ? `template:${selectedTemplateId}` : 'custom',
      createdAt: new Date().toISOString(),
    };

    persistCustomModes([nextMode, ...localModes]);
    setCreatorDraft(blankCreatorDraft);
    setActivePage('mymodes');
  };

  const toggleModeEnabled = (modeId) => {
    persistCustomModes(localModes.map((mode) => (
      mode.id === modeId ? { ...mode, enabled: !mode.enabled } : mode
    )));
  };

  return (
    <>
      <div className="hud-settings-overlay" onClick={onClose} />
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
              <div className="page-sub">Connect up to 3 AI providers. ZAIRE routes tasks to the optimal model automatically.</div>
              <Section title="PRIMARY INTELLIGENCE SLOTS (MAX 3)">
                <ApiSlot
                  slot="1 - PRIMARY"
                  status={(aiSlots[0]?.apiKey || aiSlots[0]?.hasKey) ? 'CONNECTED' : 'PENDING'}
                  provider={aiSlots[0]?.provider || 'Empty'}
                  purpose={aiSlots[0]?.purpose || 'Primary'}
                  model={aiSlots[0]?.model || 'Auto'}
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
                  model={aiSlots[1]?.model || 'Auto'}
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
                  model={aiSlots[2]?.model || 'Auto'}
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
              <div className="page-title">CUSTOM MODE CREATOR</div>
              <div className="page-sub">Start from a template, customize the specialist, and launch fast</div>
              <Section title="MODE TEMPLATES LIBRARY">
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
              <div className="mode-wizard">
                <div className="wizard-step active">
                  <div className="wizard-step-header">
                    <span className="step-label">TEMPLATE: {selectedTemplate.name}</span>
                    <div className="step-indicator"><span className="step-dot done" /><span className="step-dot current" /><span className="step-dot" /></div>
                  </div>
                  <div className="wizard-field">
                    <label className="wf-label">MODE NAME</label>
                    <input
                      className="wf-input"
                      placeholder="e.g. BRAND MODE, HEALTH SENTINEL, LAWYER"
                      value={creatorDraft.name}
                      onChange={(event) => setCreatorDraft({ ...creatorDraft, name: event.target.value })}
                    />
                  </div>
                  <div className="wizard-field">
                    <label className="wf-label">ONE LINE DESCRIPTION</label>
                    <input
                      className="wf-input"
                      placeholder="What should this mode manage?"
                      value={creatorDraft.desc}
                      onChange={(event) => setCreatorDraft({ ...creatorDraft, desc: event.target.value })}
                    />
                  </div>
                  <div className="wizard-field">
                    <label className="wf-label">PERSONALITY DIRECTIVE</label>
                    <textarea
                      className="wf-textarea"
                      placeholder="How should this mode think, speak, and prioritize?"
                      value={creatorDraft.persona}
                      onChange={(event) => setCreatorDraft({ ...creatorDraft, persona: event.target.value })}
                    />
                  </div>
                  <div className="wizard-field">
                    <label className="wf-label">MISSION GOALS (ASK MORE)</label>
                    <textarea
                      className="wf-textarea"
                      placeholder="What outcomes should this mode optimize for every session?"
                      value={creatorDraft.goals}
                      onChange={(event) => setCreatorDraft({ ...creatorDraft, goals: event.target.value })}
                    />
                  </div>
                  <div className="wizard-field">
                    <label className="wf-label">PREFERRED OUTPUT STYLE</label>
                    <select
                      className="hud-select"
                      value={creatorDraft.preferredOutput}
                      onChange={(event) => setCreatorDraft({ ...creatorDraft, preferredOutput: event.target.value })}
                    >
                      <option>Action Plan</option>
                      <option>Deep Analysis</option>
                      <option>Checklist</option>
                      <option>Executive Summary</option>
                      <option>Teach Me</option>
                    </select>
                  </div>
                  <div className="wizard-field">
                    <label className="wf-label">ROUTING PRIORITY</label>
                    <Segment
                      value={creatorDraft.routingPriority}
                      options={['Speed', 'Balanced', 'Reasoning']}
                      onChange={(value) => setCreatorDraft({ ...creatorDraft, routingPriority: value })}
                    />
                  </div>
                  <div className="wizard-field">
                    <label className="wf-label">SIGNAL COLOR</label>
                    <div className="color-row">
                      {['#00d4ff', '#00ff88', '#a78bfa', '#fbbf24', '#f97316', '#ec4899', '#60a5fa', '#34d399'].map((color) => (
                        <button
                          type="button"
                          className={`color-opt ${creatorDraft.color === color ? 'selected' : ''}`}
                          style={{ background: color }}
                          key={color}
                          onClick={() => setCreatorDraft({ ...creatorDraft, color })}
                          aria-label={`Select ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="wizard-field">
                    <label className="wf-label">CAPABILITIES</label>
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
                  <div className="wizard-field">
                    <label className="wf-label">HUD COMPONENTS</label>
                    <div className="component-grid">
                      {['TOPBAR', 'LEFT_PANEL', 'CENTER_STAGE', 'RIGHT_PANEL', 'BOTTOM_COMMAND', 'ARCHIVE_ACCESS'].map((item) => (
                        <button
                          type="button"
                          className={`comp-opt ${creatorDraft.components.includes(item) ? 'selected' : ''}`}
                          key={item}
                          onClick={() => {
                            const has = creatorDraft.components.includes(item);
                            setCreatorDraft({
                              ...creatorDraft,
                              components: has
                                ? creatorDraft.components.filter((x) => x !== item)
                                : [...creatorDraft.components, item]
                            });
                          }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="wizard-nav">
                    <button type="button" className="wiz-btn wiz-btn-back" onClick={() => setCreatorDraft(blankCreatorDraft)}>CLEAR</button>
                    <button type="button" className="wiz-btn wiz-btn-create" onClick={manifestMode}>MANIFEST MODE</button>
                  </div>
                </div>
              </div>
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
                      <button type="button" className="mode-action-btn">EDIT</button>
                      <button type="button" className="mode-action-btn" onClick={() => toggleModeEnabled(mode.id)}>
                        {mode.enabled ? 'ENABLED' : 'ENABLE'}
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
                  <div style={{ color: '#ff3333', fontSize: 11, fontFamily: 'Courier New', marginBottom: 15 }}>
                    FAIL_ERROR: {licensingError === 'INVALID_KEY' ? 'INVALID OR ACTIVE SLOTS DEPLETED' : licensingError}
                  </div>
                )}
                {licensingLoading && (
                  <div style={{ color: '#00f2ff', fontSize: 11, fontFamily: 'Courier New', marginBottom: 15 }}>
                    ESTABLISHING SECURE PORTAL DEPLOYMENT...
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
                        {licensingInfo.expiry ? new Date(licensingInfo.expiry).toLocaleString() : 'PERPETUAL CORES'}
                      </span>
                    </SettingRow>
                  </Section>

                  <Section title="DEPLOYED HARDWARE CORES">
                    {licensingInfo.machines && licensingInfo.machines.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {licensingInfo.machines.map((m) => (
                          <div key={m.machine_id} style={{ background: '#001528', border: '1px solid rgba(0, 242, 255, 0.1)', padding: 10, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ color: '#00f2ff', fontFamily: 'Courier New', fontSize: 12, fontWeight: 'bold' }}>
                                {m.machine_name} {m.machine_id === 'BROWSER_HUD' ? '(Console)' : ''}
                              </div>
                              <div style={{ color: '#888', fontSize: 10, fontFamily: 'Courier New' }}>
                                OS: {m.os_version} | ID: {m.machine_id?.substring(0, 12)}...
                              </div>
                              <div style={{ color: '#666', fontSize: 9, fontFamily: 'Courier New' }}>
                                LAST ACTIVE: {m.last_seen ? new Date(m.last_seen).toLocaleString() : 'Never'}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => deactivateDevice(m.machine_id)}
                              style={{ background: '#ff3333', color: '#fff', border: 'none', padding: '4px 8px', fontFamily: 'Courier New', fontSize: 9, fontWeight: 'bold', cursor: 'pointer', borderRadius: 2 }}
                            >
                              DEACTIVATE
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#888', fontSize: 11, fontStyle: 'italic' }}>
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
}

export default SettingsModal;
