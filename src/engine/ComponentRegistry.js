/**
 * ZAIRE Interface OS v2
 * Elite Component Registry + Blueprint Standardization Layer
 */

export const ComponentCategories = [
  'Core', 'Intelligence', 'Financial', 'Education', 'Medical',
  'Design', 'Productivity', 'Security', 'Media'
];

export const EliteComponentStates = [
  'idle',
  'loading',
  'active',
  'warning',
  'error',
  'locked',
  'streaming',
  'syncing',
  'thinking',
  'offline'
];

export const EliteComponentRarities = [
  'COMMON',
  'ADVANCED',
  'ELITE',
  'BLACK OPS',
  'OMEGA'
];

const baseComponentDNA = {
  themeSupport: true,
  resizable: true,
  draggable: true,
  stackable: true,
  minSize: { w: 2, h: 2 },
  maxSize: { w: 12, h: 12 }
};

const rarityByCategory = {
  Core: 'COMMON',
  Intelligence: 'ADVANCED',
  Financial: 'ELITE',
  Education: 'ADVANCED',
  Medical: 'ELITE',
  Design: 'ADVANCED',
  Productivity: 'COMMON',
  Security: 'BLACK OPS',
  Media: 'ADVANCED'
};

const animationByCategory = {
  Core: 'neural_pulse',
  Intelligence: 'cognition_wave',
  Financial: 'live_market',
  Education: 'knowledge_sync',
  Medical: 'vital_breathing',
  Design: 'shader_sweep',
  Productivity: 'focus_pulse',
  Security: 'threat_scan',
  Media: 'signal_stream'
};

const borderByCategory = {
  Core: 'neural',
  Intelligence: 'cognitive',
  Financial: 'market',
  Education: 'academy',
  Medical: 'clinical',
  Design: 'atelier',
  Productivity: 'tactical',
  Security: 'fortress',
  Media: 'signal'
};

const realtimePermissionSet = new Set([
  'finance_data',
  'network',
  'camera',
  'microphone',
  'health_data'
]);

const pollingByCategory = {
  Core: 2400,
  Intelligence: 3200,
  Financial: 1000,
  Education: 4500,
  Medical: 1800,
  Design: 5000,
  Productivity: 6000,
  Security: 1400,
  Media: 2000
};

const createEliteBlueprint = (component) => {
  const {
    id,
    type,
    name,
    category,
    icon,
    desc,
    permissions,
    defaultSize,
    minSize = baseComponentDNA.minSize,
    maxSize = baseComponentDNA.maxSize,
    realtime = permissions.some((permission) => realtimePermissionSet.has(permission))
  } = component;

  return {
    id,
    meta: {
      name,
      category,
      creator: 'ZAIRE_CORE',
      version: '2.0.0',
      icon,
      description: desc,
      rarity: rarityByCategory[category] || 'COMMON'
    },
    permissions,
    layout: {
      minW: minSize.w,
      minH: minSize.h,
      maxW: maxSize.w,
      maxH: maxSize.h,
      defaultW: defaultSize.w,
      defaultH: defaultSize.h,
      resizable: true,
      draggable: true,
      stackable: true,
      collapsible: true,
      floatable: true,
      pinnable: true,
      fullscreenable: true,
      duplicable: true,
      tabGroupable: true
    },
    ui: {
      glass: true,
      blur: true,
      glow: true,
      animations: animationByCategory[category] || 'neural_pulse',
      borderStyle: borderByCategory[category] || 'neural',
      ambientParticles: category === 'Financial' || category === 'Intelligence' || category === 'Security',
      scanlines: true,
      breathingBorder: true
    },
    behavior: {
      realtime,
      polling: pollingByCategory[category] || 3000,
      persistence: true,
      stateful: true,
      reactive: true,
      interactionChannels: {
        emits: [`${id}:updated`, `${id}:focus`, `${id}:status`],
        listens: [`${category.toLowerCase()}:sync`, 'workspace:theme', 'workspace:focus']
      }
    },
    states: EliteComponentStates,
    renderKey: type.replace(/\s+/g, ''),
    rarity: rarityByCategory[category] || 'COMMON'
  };
};

const registrySeed = [
  { id: 'neural_console', type: 'Neural Console', name: 'Neural Console', category: 'Core', icon: '🧠', desc: 'Core brain log and matrix output', permissions: ['base'], defaultSize: { w: 6, h: 3 } },
  { id: 'terminal', type: 'Terminal', name: 'Neural Terminal', category: 'Core', icon: '💻', desc: 'Interactive command shell prompt', permissions: ['terminal'], defaultSize: { w: 6, h: 4 } },
  { id: 'code_editor', type: 'Code Editor', name: 'Code Editor', category: 'Core', icon: '📝', desc: 'Source file code editor interface', permissions: ['file_system'], defaultSize: { w: 8, h: 6 } },
  { id: 'live_preview', type: 'Live Preview', name: 'Live Preview', category: 'Core', icon: '🌐', desc: 'Interactive iframe viewport', permissions: ['network'], defaultSize: { w: 8, h: 6 } },
  { id: 'agent_feed', type: 'Agent Feed', name: 'Agent Feed', category: 'Core', icon: '🤖', desc: 'Sub-agent swarm activities', permissions: ['base'], defaultSize: { w: 4, h: 4 } },
  { id: 'memory_graph', type: 'Memory Graph', name: 'Memory Graph', category: 'Core', icon: '🧠', desc: 'Stored semantic vector memories', permissions: ['memory'], defaultSize: { w: 6, h: 5 } },
  { id: 'research_board', type: 'Research Panel', name: 'Research Board', category: 'Core', icon: '🔍', desc: 'Global research & news feeds', permissions: ['network'], defaultSize: { w: 8, h: 5 } },
  { id: 'voice_panel', type: 'Voice Panel', name: 'Voice Panel', category: 'Core', icon: '🎙️', desc: 'Wake-speech vocal visualizer', permissions: ['microphone'], defaultSize: { w: 3, h: 2 } },
  { id: 'task_queue', type: 'Task Queue', name: 'Task Queue', category: 'Core', icon: '⚡', desc: 'Sub-agent objectives & tracking', permissions: ['base'], defaultSize: { w: 4, h: 5 } },
  { id: 'execution_timeline', type: 'Timeline', name: 'Execution Timeline', category: 'Core', icon: '⏳', desc: 'Operational steps flow chart', permissions: ['base'], defaultSize: { w: 8, h: 3 } },
  { id: 'status_grid', type: 'Status Grid', name: 'Status Grid', category: 'Core', icon: '🟢', desc: 'Hardware & ping status grid', permissions: ['base'], defaultSize: { w: 4, h: 3 } },
  { id: 'ai_chat_core', type: 'Chat Panel', name: 'AI Chat Core', category: 'Core', icon: '💬', desc: 'Secure uplink & prompt streams', permissions: ['base'], defaultSize: { w: 6, h: 8 } },
  { id: 'context_window', type: 'Context Window', name: 'Context Window', category: 'Core', icon: '🪟', desc: 'Active token tracking & memory', permissions: ['base'], defaultSize: { w: 4, h: 4 } },
  { id: 'file_tree', type: 'File Browser', name: 'File Tree', category: 'Core', icon: '📂', desc: 'Workspace file directory explorer', permissions: ['file_system'], defaultSize: { w: 3, h: 6 } },
  { id: 'diff_viewer', type: 'Diff Viewer', name: 'Diff Viewer', category: 'Core', icon: '±', desc: 'Git-style diffing for code & text', permissions: ['file_system'], defaultSize: { w: 8, h: 6 } },

  { id: 'reasoning_map', type: 'Reasoning Map', name: 'Reasoning Map', category: 'Intelligence', icon: '🗺️', desc: 'Tree-of-thoughts visualizer', permissions: ['cognitive'], defaultSize: { w: 6, h: 6 } },
  { id: 'knowledge_graph', type: 'Knowledge Graph', name: 'Knowledge Graph', category: 'Intelligence', icon: '🕸️', desc: 'Entity-relationship network view', permissions: ['memory'], defaultSize: { w: 8, h: 6 } },
  { id: 'citation_viewer', type: 'Citation Viewer', name: 'Citation Viewer', category: 'Intelligence', icon: '📑', desc: 'Sourced fact-checks & citations', permissions: ['network'], defaultSize: { w: 4, h: 4 } },
  { id: 'semantic_memory', type: 'Semantic Memory', name: 'Semantic Memory', category: 'Intelligence', icon: '💾', desc: 'Vector embeddings explorer', permissions: ['memory'], defaultSize: { w: 4, h: 5 } },
  { id: 'decision_matrix', type: 'Decision Matrix', name: 'Decision Matrix', category: 'Intelligence', icon: '🧮', desc: 'Weighted choice evaluation table', permissions: ['cognitive'], defaultSize: { w: 6, h: 4 } },
  { id: 'roadmap_generator', type: 'Roadmap Generator', name: 'Roadmap Generator', category: 'Intelligence', icon: '🛤️', desc: 'Automated step-by-step planning', permissions: ['base'], defaultSize: { w: 6, h: 4 } },
  { id: 'model_router', type: 'Model Router', name: 'Model Router', category: 'Intelligence', icon: '🔀', desc: 'LLM cascade routing config', permissions: ['admin'], defaultSize: { w: 4, h: 3 } },
  { id: 'thinking_stream', type: 'Thinking Stream', name: 'Thinking Stream', category: 'Intelligence', icon: '💭', desc: 'Raw unedited agent thought-stream', permissions: ['base'], defaultSize: { w: 4, h: 4 } },

  { id: 'candlestick_chart', type: 'Candlestick Chart', name: 'Candlestick Chart', category: 'Financial', icon: '📉', desc: 'Advanced technical market charting', permissions: ['finance_data'], defaultSize: { w: 8, h: 5 } },
  { id: 'whale_scanner', type: 'Whale Scanner', name: 'Whale Scanner', category: 'Financial', icon: '🐋', desc: 'Large block trade tracker', permissions: ['finance_data'], defaultSize: { w: 4, h: 4 } },
  { id: 'portfolio_grid', type: 'Portfolio Grid', name: 'Portfolio Grid', category: 'Financial', icon: '💼', desc: 'Multi-asset wallet balance grid', permissions: ['vault'], defaultSize: { w: 6, h: 4 } },
  { id: 'signal_feed', type: 'Signal Feed', name: 'Signal Feed', category: 'Financial', icon: '📡', desc: 'AI-generated trade signals feed', permissions: ['finance_data'], defaultSize: { w: 4, h: 5 } },
  { id: 'risk_meter', type: 'Risk Meter', name: 'Risk Meter', category: 'Financial', icon: '⚠️', desc: 'Real-time liquidation & volatility risk', permissions: ['finance_data'], defaultSize: { w: 3, h: 3 } },
  { id: 'macro_heatmap', type: 'Macro Heatmap', name: 'Macro Heatmap', category: 'Financial', icon: '🌡️', desc: 'Global sector performance matrix', permissions: ['finance_data'], defaultSize: { w: 6, h: 5 } },

  { id: 'lecture_view', type: 'Lecture View', name: 'Lecture View', category: 'Education', icon: '👨‍🏫', desc: 'Synchronized lecture content & video', permissions: ['base'], defaultSize: { w: 8, h: 6 } },
  { id: 'quiz_generator', type: 'Quiz Generator', name: 'Quiz Generator', category: 'Education', icon: '✅', desc: 'Automated test & assessment maker', permissions: ['base'], defaultSize: { w: 5, h: 5 } },
  { id: 'curriculum_graph', type: 'Curriculum Graph', name: 'Curriculum Graph', category: 'Education', icon: '📚', desc: 'Dependency-based learning path', permissions: ['base'], defaultSize: { w: 6, h: 5 } },
  { id: 'atomic_notes', type: 'Atomic Notes', name: 'Atomic Notes', category: 'Education', icon: '📝', desc: 'Zettelkasten style note-taking', permissions: ['base'], defaultSize: { w: 4, h: 6 } },
  { id: 'flashcard_grid', type: 'Flashcard Grid', name: 'Flashcard Grid', category: 'Education', icon: '🎴', desc: 'Spaced-repetition flashcards', permissions: ['base'], defaultSize: { w: 5, h: 4 } },
  { id: 'learning_timeline', type: 'Learning Timeline', name: 'Learning Timeline', category: 'Education', icon: '📈', desc: 'Daily knowledge acquisition chart', permissions: ['base'], defaultSize: { w: 8, h: 3 } },

  { id: 'vitals_dashboard', type: 'Health Tracker', name: 'Vitals Dashboard', category: 'Medical', icon: '❤️', desc: 'Live biometric sensor readouts', permissions: ['health_data'], defaultSize: { w: 6, h: 4 } },
  { id: 'medication_timeline', type: 'Medication Timeline', name: 'Medication Timeline', category: 'Medical', icon: '💊', desc: 'Drug interaction & schedule graph', permissions: ['health_data'], defaultSize: { w: 8, h: 3 } },
  { id: 'symptom_matrix', type: 'Symptom Matrix', name: 'Symptom Matrix', category: 'Medical', icon: '🏥', desc: 'Multi-variate symptom tracking', permissions: ['health_data'], defaultSize: { w: 5, h: 4 } },
  { id: 'patient_notes', type: 'Patient Notes', name: 'Patient Notes', category: 'Medical', icon: '📋', desc: 'Encrypted clinical case notes', permissions: ['health_data'], defaultSize: { w: 4, h: 6 } },
  { id: 'recovery_tracker', type: 'Recovery Tracker', name: 'Recovery Tracker', category: 'Medical', icon: '🔋', desc: 'Physical therapy progress meter', permissions: ['health_data'], defaultSize: { w: 5, h: 4 } },

  { id: 'moodboard', type: 'Moodboard', name: 'Moodboard', category: 'Design', icon: '🎨', desc: 'Visual inspiration & asset drag-drop', permissions: ['base'], defaultSize: { w: 8, h: 6 } },
  { id: 'palette_studio', type: 'Palette Studio', name: 'Palette Studio', category: 'Design', icon: '🌈', desc: 'Chroma generation & contrast analyzer', permissions: ['base'], defaultSize: { w: 4, h: 3 } },
  { id: 'typography_analyzer', type: 'Typography Analyzer', name: 'Typography Analyzer', category: 'Design', icon: 'Aa', desc: 'Font pairing & kerning lab', permissions: ['base'], defaultSize: { w: 5, h: 4 } },
  { id: 'layout_forge', type: 'Layout Forge', name: 'Layout Forge', category: 'Design', icon: '📐', desc: 'Wireframe generator & grid builder', permissions: ['base'], defaultSize: { w: 8, h: 6 } },
  { id: 'brand_scanner', type: 'Brand Scanner', name: 'Brand Scanner', category: 'Design', icon: '🎯', desc: 'Competitor brand identity scraper', permissions: ['network'], defaultSize: { w: 6, h: 4 } },

  { id: 'calendar', type: 'Calendar Panel', name: 'Calendar', category: 'Productivity', icon: '📅', desc: 'System timeline calendar grid', permissions: ['base'], defaultSize: { w: 6, h: 5 } },
  { id: 'kanban', type: 'Kanban Board', name: 'Kanban', category: 'Productivity', icon: '📋', desc: 'Sprint task lanes tracker', permissions: ['base'], defaultSize: { w: 8, h: 5 } },
  { id: 'focus_timer', type: 'Focus Timer', name: 'Focus Timer', category: 'Productivity', icon: '⏱️', desc: 'Pomodoro-style deep work timer', permissions: ['base'], defaultSize: { w: 3, h: 2 } },
  { id: 'meeting_notes', type: 'Meeting Notes', name: 'Meeting Notes', category: 'Productivity', icon: '🎙️', desc: 'Automated transcription & summaries', permissions: ['base'], defaultSize: { w: 5, h: 6 } },
  { id: 'habit_tracker', type: 'Habit Tracker', name: 'Habit Tracker', category: 'Productivity', icon: '✔️', desc: 'Daily streak & discipline grid', permissions: ['base'], defaultSize: { w: 4, h: 4 } },
  { id: 'goal_tree', type: 'Goal Tree', name: 'Goal Tree', category: 'Productivity', icon: '🌳', desc: 'Long-term objective mindmap', permissions: ['base'], defaultSize: { w: 6, h: 5 } },

  { id: 'threat_feed', type: 'Threat Feed', name: 'Threat Feed', category: 'Security', icon: '🛡️', desc: 'Live cybersecurity attack map', permissions: ['admin'], defaultSize: { w: 6, h: 4 } },
  { id: 'permission_matrix', type: 'Permission Matrix', name: 'Permission Matrix', category: 'Security', icon: '🔐', desc: 'Access control & scope visualizer', permissions: ['admin'], defaultSize: { w: 6, h: 5 } },
  { id: 'face_verification', type: 'Camera Feed', name: 'Face Verification', category: 'Security', icon: '📷', desc: 'Biometric scan camera stream', permissions: ['camera'], defaultSize: { w: 4, h: 4 } },
  { id: 'vault_access', type: 'Vault Access', name: 'Vault Access', category: 'Security', icon: '🏦', desc: 'Encrypted secure storage gateway', permissions: ['vault'], defaultSize: { w: 4, h: 3 } },
  { id: 'machine_status', type: 'Agent Status', name: 'Machine Status', category: 'Security', icon: '⚙️', desc: 'Hardware integrity & daemon health', permissions: ['admin'], defaultSize: { w: 5, h: 3 } },

  { id: 'video_timeline', type: 'Video Timeline', name: 'Video Timeline', category: 'Media', icon: '🎞️', desc: 'NLE style scrubbing & editing', permissions: ['base'], defaultSize: { w: 8, h: 4 } },
  { id: 'audio_analyzer', type: 'Audio Analyzer', name: 'Audio Analyzer', category: 'Media', icon: '🎛️', desc: 'Frequency spectrum & EQ', permissions: ['microphone'], defaultSize: { w: 6, h: 3 } },
  { id: 'waveform_viewer', type: 'Waveform Viewer', name: 'Waveform Viewer', category: 'Media', icon: '〰️', desc: 'Vocal timeline processing view', permissions: ['base'], defaultSize: { w: 8, h: 3 } },
  { id: 'transcript_panel', type: 'Transcript Panel', name: 'Transcript Panel', category: 'Media', icon: '📜', desc: 'Real-time speech-to-text scroll', permissions: ['base'], defaultSize: { w: 4, h: 6 } }
];

export const ZaireComponentRegistry = registrySeed.map((component) => {
  const blueprint = createEliteBlueprint(component);
  return {
    ...baseComponentDNA,
    ...component,
    rarity: blueprint.rarity,
    blueprint
  };
});

export const getComponentById = (id) => ZaireComponentRegistry.find((component) => component.id === id);

export const getComponentBlueprintById = (id) => getComponentById(id)?.blueprint || null;

export const getComponentBlueprintByType = (type) =>
  ZaireComponentRegistry.find((component) => component.type === type)?.blueprint || null;
