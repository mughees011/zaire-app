import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import SettingsModal from './SettingsModal';
import GroqSpeechService from './groqSpeechService';
import { io } from 'socket.io-client';
import './App.css';
import ShadowAssistant from './components/ShadowAssistant';

const DEFAULT_BLOB_COLOR = '#00b4ff';

function normalizeHexColor(value) {
  if (!value || typeof value !== 'string') return DEFAULT_BLOB_COLOR;
  const trimmed = value.trim();
  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed.toLowerCase() : DEFAULT_BLOB_COLOR;
}

function App() {
  const threeCanvasRef = useRef(null);
  const gridCanvasRef = useRef(null);
  const cameraRef = useRef(null);
  const dragStateRef = useRef({ isPointerDown: false, tempPosition: { x: 0, y: 0 } });

  const [activeMode, setActiveMode] = useState('M.M.S.');
  const [mmsStatus, setMmsStatus] = useState('online'); 
  const [isDeepThinking, setIsDeepThinking] = useState(false);
  const [timeStr, setTimeStr] = useState('00:00:00');
  const [navItem, setNavItem] = useState('HOME');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const isMicrophoneActiveRef = useRef(false);

  // Sync state to Ref for persistent event handlers
  useEffect(() => {
    isMicrophoneActiveRef.current = isMicrophoneActive;
  }, [isMicrophoneActive]);

  const [audioFrequency, setAudioFrequency] = useState(0);
  const frequencyBandsRef = useRef([0, 0, 0, 0, 0]);

  const [blobColor, setBlobColor] = useState(() => normalizeHexColor(localStorage.getItem('blobColor') || DEFAULT_BLOB_COLOR));
  const [blobSize, setBlobSize] = useState(() => parseFloat(localStorage.getItem('blobSize')) || 1.0);
  const [blobPosition, setBlobPosition] = useState(() => {
    const saved = localStorage.getItem('blobPosition');
    return saved ? JSON.parse(saved) : { x: 0, y: 0 };
  });

  const [activityFeed] = useState([
    { time: '15:47', message: 'System boot complete' },
    { time: '15:46', message: 'Neural core initialized' },
    { time: '15:45', message: 'Voice synthesis online' },
    { time: '15:44', message: 'Loading M.M.S. protocol' },
    { time: '15:43', message: 'Mounting file system' },
  ]);

  const mainGroupRef = useRef(null);
  const blobSizeRef = useRef(blobSize);
  const blobColorRef = useRef(blobColor);
  const blobPositionRef = useRef(blobPosition);
  const uniformsRef = useRef(null);
  const voiceWaveformRef = useRef(null);
  const neuralGaugeRef = useRef(null);
  const faceMeshCanvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const outputAnalyserRef = useRef(null);
  const outputDataArrayRef = useRef(null);
  const audioStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const [lastCommand, setLastCommand] = useState('');
  const [sessionUptime, setSessionUptime] = useState(0);
  const [recognizedText, setRecognizedText] = useState('');
  const [finalRecognizedText, setFinalRecognizedText] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [useGroqSpeech, setUseGroqSpeech] = useState(false);
  const [groqStatus, setGroqStatus] = useState('');
  const groqSpeechRef = useRef(null);

  // ── New: Vision, Memory, System Actions ──
  const [isVisionScanning, setIsVisionScanning] = useState(false);
  const [storedMemories, setStoredMemories] = useState([]);
  const [memoryFlash, setMemoryFlash] = useState(false);
  const [lastSystemAction, setLastSystemAction] = useState(null);
  const [systemActionLog, setSystemActionLog] = useState([]);
  const [isDiagnosticActive, setIsDiagnosticActive] = useState(false);

  // Real-time Socket states
  const socketRef = useRef(null);
  const [mmsResponseStream, setMmsResponseStream] = useState('');
  const [showResponsePanel, setShowResponsePanel] = useState(false);
  const [isNeuralInterruptActive, setIsNeuralInterruptActive] = useState(false);
  const responseTimeoutRef = useRef(null);

  // Biometric State
  const [biometricData, setBiometricData] = useState({ detected: false, name: 'ABSENT', confidence: 0 });
  const [isSecurityAlert, setIsSecurityAlert] = useState(false);
  const [intruderSnapshots, setIntruderSnapshots] = useState([]);
  const [showSecurityOverlay, setShowSecurityOverlay] = useState(false);
  const [activeIntruder, setActiveIntruder] = useState(null);
  const [specialistData, setSpecialistData] = useState(null);
  const [liveMetrics, setLiveMetrics] = useState({ cpu: 0, ram: 0, gpu: 0, latency: 4 });
  const [mmsActionFeed, setMmsActionFeed] = useState([]);
  const [liveCodeStream, setLiveCodeStream] = useState('');
  const [professorSlides] = useState([
    { title: 'Neural Architectures', content: 'Understanding multi-head attention mechanisms in Transformers.', image: null },
    { title: 'Latent Space', content: 'Visualizing high-dimensional embeddings in vector databases.', image: null },
    { title: 'Optimization', content: 'Stochastic Gradient Descent vs Adam: A comparative analysis.', image: null }
  ]);
  const [currentSlideIndex] = useState(0);
  const [modeLayouts, setModeLayouts] = useState(() => {
    const saved = localStorage.getItem('mms_mode_layouts_v1');
    if (saved) return JSON.parse(saved);
    return {
      'M.M.S.': { leftWidth: 200, rightWidth: 200, bottomHeight: 150, leftX: 0, leftY: 0, rightX: 0, rightY: 0, bottomX: 0, bottomY: 0 },
      'TRADER': { leftWidth: 200, rightWidth: 220, bottomHeight: 90, leftX: 0, leftY: 0, rightX: 0, rightY: 0, bottomX: 0, bottomY: 0 },
      'PROFESSOR': { leftWidth: 220, rightWidth: 200, bottomHeight: 80, leftX: 0, leftY: 0, rightX: 0, rightY: 0, bottomX: 0, bottomY: 0 },
      'ENGINEER': { leftWidth: 200, rightWidth: 260, bottomHeight: 90, leftX: 0, leftY: 0, rightX: 0, rightY: 0, bottomX: 0, bottomY: 0 }
    };
  });

  useEffect(() => {
    localStorage.setItem('mms_mode_layouts_v1', JSON.stringify(modeLayouts));
  }, [modeLayouts]);

  const layoutOffsets = modeLayouts[activeMode] || modeLayouts['M.M.S.'];

  const updateCurrentLayout = (updates) => {
    setModeLayouts(prev => ({
      ...prev,
      [activeMode]: { ...prev[activeMode], ...updates }
    }));
  };

  const [componentNudges, setComponentNudges] = useState(() => {
    const saved = localStorage.getItem('mms_component_nudges_v1');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('mms_component_nudges_v1', JSON.stringify(componentNudges));
  }, [componentNudges]);

  const [selectedComponent, setSelectedComponent] = useState('');
  const [isOmniBoxOpen, setIsOmniBoxOpen] = useState(false);
  const [omniInput, setOmniInput] = useState('');

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

  // --- RECURSIVE FILE TREE COMPONENT ---
  const FileTreeNode = ({ node, depth = 0 }) => {
    const [isOpen, setIsOpen] = useState(depth === 0); // Open root by default
    const isDir = node.type === 'directory';
    
    return (
      <div className="file-tree-node" style={{ marginLeft: `${depth * 10}px` }}>
        <div 
          className={`node-label ${isDir ? 'directory' : 'file'} clickable`}
          onClick={() => isDir ? setIsOpen(!isOpen) : socketRef.current.emit('SPECIALIST_ACTION', { mode: 'ENGINEER', action: 'OPEN_FILE', payload: { filename: node.name } })}
        >
          <span className="node-icon">{isDir ? (isOpen ? '📂' : '📁') : '📄'}</span>
          <span className="node-name">{node.name}</span>
          {node.size && <span className="node-size">({(node.size / 1024).toFixed(1)}kb)</span>}
        </div>
        {isDir && isOpen && node.children && (
          <div className="node-children">
            {node.children.map((child, i) => (
              <FileTreeNode key={`${child.name}-${i}`} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const [isGlitchActive, setIsGlitchActive] = useState(false);
  const [artifactTokens, setArtifactTokens] = useState([]);
  const [pendingArtifactTokens, setPendingArtifactTokens] = useState([]);
  const [isMinigameActive, setIsMinigameActive] = useState(false);
  const [minigameScore, setMinigameScore] = useState(0);
  const [gameNodes, setGameNodes] = useState([]);
  const [isSystemEngaged, setIsSystemEngaged] = useState(false);
  
  // Neural Video State
  const [neuralVideoData, setNeuralVideoData] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentVideoScene, setCurrentVideoScene] = useState(null);
  const [attentionTimer, setAttentionTimer] = useState(0);
  const [isNeuralPulseActive, setIsNeuralPulseActive] = useState(false);
  const [particles, setParticles] = useState([]);
  const fileInputRef = useRef(null);


  const audioQueueRef = useRef({}); // Using object keyed by index for O(1) lookups
  const isPlayingAudioRef = useRef(false);
  const hudVideoRef = useRef(null);
  const [cameraStatus, setCameraStatus] = useState('pending'); // 'pending', 'authorized', 'denied'
  const nextExpectedIndexRef = useRef(0);

  const playSpatialSound = (type, side = 'center') => {
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
  };

  const handleModeChange = React.useCallback((newMode) => {
    setActiveMode(newMode);
    if (socketRef.current) {
      socketRef.current.emit('MODE_CHANGE', { mode: newMode });
    }

    const modeThemes = {
      'M.M.S.': { primary: '#00d4ff', accent: '#00d4ff', bg: 'rgba(0, 212, 255, 0.03)' },
      'TRADER': { primary: '#00ff88', accent: '#ffaa00', bg: 'rgba(0, 255, 136, 0.03)' },
      'PROFESSOR': { primary: '#a78bfa', accent: '#60a5fa', bg: 'rgba(167, 139, 250, 0.03)' },
      'ENGINEER': { primary: '#f97316', accent: '#facc15', bg: 'rgba(249, 115, 22, 0.03)' }
    };

    const theme = modeThemes[newMode] || modeThemes['M.M.S.'];
    setBlobColor(theme.primary);

    document.documentElement.style.setProperty('--bg-glow', theme.bg);
    
    // Trigger Neural Transition
    if (uniformsRef.current) {
      uniformsRef.current.uTransition.value = 0.0;
    }
    
    // Spatial Audio Feedback
    playSpatialSound('switch', newMode === 'M.M.S.' ? 'center' : (newMode === 'TRADER' ? 'left' : 'right'));
  }, []);

  const handleModeSync = React.useCallback((newMode) => {
    setActiveMode(newMode);

    const modeColors = {
      'M.M.S.': { primary: '#00d4ff', accent: '#00d4ff' },
      'TRADER': { primary: '#00ff88', accent: '#ffaa00' },
      'PROFESSOR': { primary: '#a78bfa', accent: '#60a5fa' },
      'ENGINEER': { primary: '#f97316', accent: '#facc15' }
    };

    const colors = modeColors[newMode] || modeColors['M.M.S.'];
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
    setIsGlitchActive(true);
    setTimeout(() => setIsGlitchActive(false), 200);

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
    localStorage.setItem('blobColor', blobColor);
    localStorage.setItem('blobSize', blobSize);
    localStorage.setItem('blobPosition', JSON.stringify(blobPosition));
  }, [blobColor, blobSize, blobPosition]);

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
  const fetchTTSAudio = React.useCallback(async (text) => {
    try {
      const response = await fetch('http://127.0.0.1:3001/tts', {
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
  }, []);

  const playNextAudioChunk = React.useCallback(async () => {
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
  }, [fetchTTSAudio]);

  // Load memories and system config from backend on startup
  useEffect(() => {
    fetch('http://127.0.0.1:3001/memories')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setStoredMemories(data.slice(0, 5));
      })
      .catch(() => { });

    fetch('http://127.0.0.1:3001/config') 
      .then(r => r.json())
      .then(res => {
         if (res.success && res.data) {
            console.log('[SYSTEM] Restored HUD config from core.');
            if (res.data.blobColor) setBlobColor(res.data.blobColor);
            if (res.data.blobSize) setBlobSize(res.data.blobSize);
            if (res.data.blobPosition) setBlobPosition(res.data.blobPosition);
         }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    socketRef.current = io('http://127.0.0.1:3001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000
    });

    socketRef.current.on('connect', () => {
      console.log('[SOCKET] Connected to backend');
      // Request state sync just in case
      socketRef.current.emit('REQUEST_SYNC');
    });

    socketRef.current.on('MODE_SYNC', (data) => {
      console.log('[SOCKET] System Sync:', data.mode);
      if (data.mode) {
        handleModeSync(data.mode);
      }
    });

    socketRef.current.on('ai_error', (data) => {
      console.error('[SOCKET] AI Error:', data.message);
      setIsGlitchActive(true);
      setTimeout(() => setIsGlitchActive(false), 3000);
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('[SOCKET] Connection error:', err.message);
    });

    socketRef.current.on('ai_text_delta', (delta) => {
      setMmsResponseStream(prev => {
        const next = prev + delta;
        // Check for Neural Video Payload
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
              setLiveCodeStream(cleaned);
           } else if (next.includes('```')) {
              // Handle partial block (starting with ``` but not ending)
              const partial = next.split('```').pop().replace(/^[a-zA-Z]*\n?/, '');
              setLiveCodeStream(partial);
           }
        }

        return next;
      });
      setShowResponsePanel(true);

      // Reset fade timeout
      if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = setTimeout(() => {
        setShowResponsePanel(false);
        setMmsResponseStream('');
      }, 12000); // Fade after 12s of silence
    });

    socketRef.current.on('audio_chunk', (data) => {
      console.log('[SOCKET] Received audio_chunk:', data.index);

      // If we get index 0, it's a new interaction, reset the sequence!
      if (data.index === 0) {
        console.log('[TTS] Sequence Reset detected (index 0)');
        nextExpectedIndexRef.current = 0;
      }

      audioQueueRef.current[data.index] = data;
      playNextAudioChunk();
    });

    socketRef.current.on('ai_text_complete', () => {
      // Sequence will reset on next index 0
    });

    // Handle text chunks - fetch audio via HTTP for each chunk
    socketRef.current.on('text_chunks', async ({ chunks }) => {
      console.log('[SOCKET] Received text_chunks:', chunks.length);

      // New interaction, reset sequence
      nextExpectedIndexRef.current = 0;

      for (const chunk of chunks) {
        const audioData = await fetchTTSAudio(chunk.text);
        if (audioData) {
          audioQueueRef.current[chunk.index] = { index: chunk.index, audio: audioData, isBase64: false };
          playNextAudioChunk();
        }
      }
    });

    // Vision status
    socketRef.current.on('mms_status', (status) => setMmsStatus(status));
    socketRef.current.on('mms_status', (status) => {
      if (status === 'scanning') {
        setIsVisionScanning(true);
      } else {
        setIsVisionScanning(false);
      }
    });
    
    // Deep thinking status
    socketRef.current.on('deep_thinking', (isThinking) => {
      setIsDeepThinking(isThinking);
    });

    // Memory stored event
    socketRef.current.on('memory_stored', ({ text, count }) => {
      const now = new Date();
      const ts = now.toISOString();
      setStoredMemories(prev => [{ id: Date.now(), timestamp: ts, text }, ...prev].slice(0, 5));
      setMemoryFlash(true);
      setTimeout(() => setMemoryFlash(false), 2000);
    });

    // Neural Log events from Agent Daemon
    socketRef.current.on('neural_log', (data) => {
      if (data && data.content) {
        const now = new Date();
        const time = [now.getHours(), now.getMinutes()].map(n => String(n).padStart(2, '0')).join(':');
        setMmsActionFeed(prev => [{ time, message: data.content }, ...prev].slice(0, 5));
      }
    });

    // System action events (mouse/keyboard)
    socketRef.current.on('system_action', (action) => {
      setLastSystemAction(action);
      const now = new Date();
      const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2, '0')).join(':');
      let label = '';
      if (action.type === 'mouse') label = `[MOUSE] ${action.action.toUpperCase()} → (${action.x ?? '?'}, ${action.y ?? '?'})`;
      else if (action.type === 'keyboard') label = `[TYPE] "${action.text}"`;
      else if (action.type === 'hotkey') label = `[HOTKEY] ${action.keys.join('+').toUpperCase()}`;
      setSystemActionLog(prev => [{ time, label }, ...prev].slice(0, 6));
    });

    // Proactive Briefing & Diagnostic Pulse
    socketRef.current.on('diagnostic_alert', (active) => {
      setIsDiagnosticActive(active);
    });

    socketRef.current.on('neural_interrupt', (data) => {
      const { text, type } = data;
      console.log(`[PROACTIVE] ${type}: ${text}`);
      setMmsResponseStream(text);
      setShowResponsePanel(true);
      setIsNeuralInterruptActive(true);
      
      // Auto-hide after 10s
      if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = setTimeout(() => {
        setShowResponsePanel(false);
        setMmsResponseStream('');
        setIsNeuralInterruptActive(false);
      }, 10000);
    });

    // Tier 5: Intruder Detection
    socketRef.current.on('intruder_detected', (data) => {
      console.log('[SECURITY] 🚨 INTRUDER DETECTED!!', data);
      setIsSecurityAlert(true);
      setShowSecurityOverlay(true);
      setActiveIntruder(data);
      setMmsResponseStream('🚨 SECURITY ALERT: UNKNOWN USER DETECTED AT YOUR SYSTEM! SNAPSHOT CAPTURED.');
      setShowResponsePanel(true);

      // Flash threat for 10 seconds
      setTimeout(() => {
        setShowSecurityOverlay(false);
      }, 10000);
    });

    socketRef.current.on('intruder_snapshots', (data) => {
      if (data.snapshots) setIntruderSnapshots(data.snapshots);
    });

    // Tier 7: HUD Live Telemetry
    socketRef.current.on('system_metrics', (metrics) => {
      setLiveMetrics(prev => ({ ...prev, ...metrics }));
    });

    socketRef.current.on('SPECIALIST_DATA', ({ mode, data }) => {
      setSpecialistData(data);
    });

    socketRef.current.on('mms_action_feed', (actions) => {
      setMmsActionFeed(actions);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off();
      }
    };
  }, [playNextAudioChunk, handleModeSync, fetchTTSAudio]);

  // NOTE: Direct browser camera access is disabled to prevent hardware contention 
  // with the Tier 5 Face Security Daemon (Python). Only one process can hold the camera lock.
  useEffect(() => {
    setCameraStatus('authorized'); // Assume authorized since backend daemon is handling it
    return () => {};
  }, []);

  useEffect(() => {
    const pollBiometrics = async () => {
      try {
        // Updated to port 3001 proxy for the new Tier 5 daemon
        const res = await fetch('http://127.0.0.1:3001/security/status');
        const data = await res.json();
        if (data.success) {
           setBiometricData({
             detected:   data.master_present || data.running,
             name:       data.master_present ? 'Master' : (data.running ? 'Scanning...' : 'Offline'),
             locked:     data.pc_locked,
             enabled:    data.face_lock_enabled,
             intruders:  data.total_intruders
           });

           // If master present, clear alerts
           if (data.master_present) {
             setIsSecurityAlert(false);
             setShowSecurityOverlay(false);
           }
        }
      } catch (e) {
        // Security daemon offline?
      }
    };

    const biometricInterval = setInterval(pollBiometrics, 3000);

    // ── ATTENTION MONITORING ──
    const attentionInterval = setInterval(() => {
      if (activeMode === 'PROFESSOR' && !biometricData.detected) {
        setAttentionTimer(prev => {
          if (prev >= 30) { // 30 seconds of absence
            if (socketRef.current) socketRef.current.emit('user_message', 'ATTENTION_DRIFT');
            return 0; 
          }
          return prev + 5;
        });
      } else {
        setAttentionTimer(0);
      }
    }, 5000);


    const handlePersist = () => {
      if (socketRef.current) {
        socketRef.current.emit('SAVE_CONFIG', {
          blobColor: normalizeHexColor(localStorage.getItem('blobColor')),
          blobSize: parseFloat(localStorage.getItem('blobSize') || '1.0'),
          blobPosition: JSON.parse(localStorage.getItem('blobPosition') || '{"x":0,"y":0}')
        });
      }
    };
    window.addEventListener('MMS_PERSIST_CONFIG', handlePersist);

    return () => {
      clearInterval(biometricInterval);
      clearInterval(attentionInterval);
      window.removeEventListener('MMS_PERSIST_CONFIG', handlePersist);
    };
  }, [activeMode, biometricData.detected]);

  // Poll for specialist data
  useEffect(() => {
    if (activeMode === 'M.M.S.') {
      setSpecialistData(null);
      return;
    }

    const fetchSpecialistData = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:3002/agent/mode_data?mode=${activeMode}`);
        const data = await res.json();
        if (data.success) {
          setSpecialistData(data.data);
        }
      } catch (e) {
        console.error('Failed to fetch specialist data:', e);
      }
    };

    fetchSpecialistData();
    const interval = setInterval(fetchSpecialistData, 5000);
    return () => clearInterval(interval);
  }, [activeMode]);

  // Sync refs so the animation loop and blob-update effect always read latest values
  useEffect(() => {
    blobSizeRef.current = blobSize;
    blobColorRef.current = blobColor;
    blobPositionRef.current = blobPosition;

    localStorage.setItem('blobColor', blobColor);
    localStorage.setItem('blobSize', blobSize.toString());
    localStorage.setItem('blobPosition', JSON.stringify(blobPosition));

    // Push position update immediately (not dependent on animation loop)
    if (mainGroupRef.current) {
      mainGroupRef.current.position.set(blobPosition.x, blobPosition.y, 0);
    }

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
  }, [blobColor, blobSize, blobPosition]);

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
        setGroqStatus('Starting...');
        console.log('Starting Groq speech service...');
        groqSpeechRef.current = new GroqSpeechService(
          (text) => {
            console.log('Groq transcript received:', text);
            setGroqStatus('Transcribed!');
            setFinalRecognizedText(text);

            // Send to Real-time Backend - include pending artifacts
            console.log('[DEBUG] Voice (Groq) sending with artifacts:', pendingArtifactTokens.length, pendingArtifactTokens);
            setMmsResponseStream('');
            const allArtifacts = [...artifactTokens, ...pendingArtifactTokens];
            if (socketRef.current) {
              socketRef.current.emit('user_message', text, { artifactTokens: allArtifacts });
            }

            // Move pending artifacts to active
            if (pendingArtifactTokens.length > 0) {
              setArtifactTokens(prev => [...prev, ...pendingArtifactTokens]);
              setPendingArtifactTokens([]);
            }

            setLastCommand(text);
            setTimeout(() => setFinalRecognizedText(''), 2000);
          },
          (interim) => {
            console.log('Groq interim:', interim);
            setGroqStatus('Listening...');
            setRecognizedText(interim);
          },
          (error) => {
            console.error('Groq error:', error);
            setGroqStatus('Error: ' + error);
          }
        );

        setGroqStatus('Connecting...');
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
        console.log('[DEBUG] Voice (browser) sending with artifacts:', pendingArtifactTokens.length, pendingArtifactTokens);
        setMmsResponseStream('');
        const allArtifacts = [...artifactTokens, ...pendingArtifactTokens];
        if (socketRef.current) {
          socketRef.current.emit('user_message', text, { artifactTokens: allArtifacts });
        }

        // Move pending artifacts to active
        if (pendingArtifactTokens.length > 0) {
          setArtifactTokens(prev => [...prev, ...pendingArtifactTokens]);
          setPendingArtifactTokens([]);
        }

        setLastCommand(text);

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
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        // Store as pending - will be sent with next user message
        setPendingArtifactTokens(prev => [...prev, ...result.manifest]);
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
  const plasmaMesh = new THREE.Mesh(plasmaGeo, plasmaMat);
  mainGroup.add(plasmaMesh);

  // --- MODE-SPECIFIC HOLOGRAMS ---
  const hologramGroup = new THREE.Group();
  mainGroup.add(hologramGroup);

  // 1. TRADER: 3D Wave Chart
  const traderGroup = new THREE.Group();
  const wavePoints = [];
  for(let i=0; i<50; i++) wavePoints.push(new THREE.Vector3((i/25-1)*0.6, Math.sin(i*0.3)*0.1, Math.cos(i*0.2)*0.1));
  const waveCurve = new THREE.CatmullRomCurve3(wavePoints);
  const waveGeo = new THREE.TubeGeometry(waveCurve, 64, 0.005, 8, false);
  const waveMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.8 });
  traderGroup.add(new THREE.Mesh(waveGeo, waveMat));
  hologramGroup.add(traderGroup);

  // 2. PROFESSOR: Neural Node Graph
  const professorGroup = new THREE.Group();
  const nodeGeo = new THREE.SphereGeometry(0.02, 8, 8);
  const nodeMat = new THREE.MeshBasicMaterial({ color: 0xa78bfa });
  for(let i=0; i<12; i++) {
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    node.position.set((Math.random()-0.5)*0.8, (Math.random()-0.5)*0.8, (Math.random()-0.5)*0.8);
    professorGroup.add(node);
  }
  hologramGroup.add(professorGroup);

  // 3. ENGINEER: Manifestation Tree
  const engineerGroup = new THREE.Group();
  const branchMat = new THREE.LineBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.4 });
  for(let i=0; i<8; i++) {
    const pts = [new THREE.Vector3(0,0,0), new THREE.Vector3((Math.random()-0.5)*0.6, (Math.random()-0.5)*0.6, (Math.random()-0.5)*0.6)];
    const bGeo = new THREE.BufferGeometry().setFromPoints(pts);
    engineerGroup.add(new THREE.Line(bGeo, branchMat));
  }
  hologramGroup.add(engineerGroup);

  mainGroupRef.current = mainGroup;
  uniformsRef.current = plasmaMat.uniforms;

  mainGroup.scale.set(blobSize, blobSize, blobSize);
  mainGroup.position.set(blobPosition.x, blobPosition.y, 0);
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
    setIsGlitchActive(true);
    setTimeout(() => setIsGlitchActive(false), 120);
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
    if (mmsStatus === 'deep_thinking') {
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
    setSessionUptime(prev => prev + 1);
  }, 1000);
  return () => clearInterval(uptimeInterval);
}, []);

const formatUptime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
};

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
      
      for(let i=0; i<rows; i++) {
        ctx.beginPath();
        for(let j=0; j<cols; j++) {
          const x = centerX - size + (j / (cols-1)) * size * 2;
          const y = centerY - size + (i / (rows-1)) * size * 2;
          const dist = Math.sqrt(Math.pow(j - (cols-1)/2, 2) + Math.pow(i - (rows-1)/2, 2));
          const z = Math.sin(dist * 0.8 - t) * 8;
          if (j === 0) ctx.moveTo(x, y + z);
          else ctx.lineTo(x, y + z);
        }
        ctx.stroke();
      }
      for(let j=0; j<cols; j++) {
        ctx.beginPath();
        for(let i=0; i<rows; i++) {
          const x = centerX - size + (j / (cols-1)) * size * 2;
          const y = centerY - size + (i / (rows-1)) * size * 2;
          const dist = Math.sqrt(Math.pow(j - (cols-1)/2, 2) + Math.pow(i - (rows-1)/2, 2));
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

const modes = ['M.M.S.', 'TRADER', 'PROFESSOR', 'ENGINEER'];
const navItems = ['M.M.S.', 'TRADER', 'PROFESSOR', 'ENGINEER'];
const quickAccess = [
  { label: 'SCREEN CAPTURE', action: 'capture' },
  { label: 'OPEN BROWSER', action: 'browser' },
  { label: 'FILE MANAGER', action: 'files' }
];

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

return (
  <div 
    className={`
      mms-container 
      ${isDiagnosticActive ? 'diagnostic-active' : ''} 
      ${isSecurityAlert ? 'security-alert' : ''} 
      ${isGlitchActive ? 'glitch-active' : ''} 
      ${isNeuralPulseActive ? 'neural-pulse-active' : ''} 
      ${isNeuralInterruptActive ? 'neural-interrupt-flash' : ''}
    `.trim()}
    data-mode={activeMode}
    style={{
      '--left-width': `${layoutOffsets.leftWidth}px`,
      '--right-width': `${layoutOffsets.rightWidth}px`,
      '--bottom-height': `${layoutOffsets.bottomHeight}px`,
      '--left-x': `${layoutOffsets.leftX}px`,
      '--left-y': `${layoutOffsets.leftY}px`,
      '--right-x': `${layoutOffsets.rightX}px`,
      '--right-y': `${layoutOffsets.rightY}px`,
      '--bottom-x': `${layoutOffsets.bottomX}px`,
      '--bottom-y': `${layoutOffsets.bottomY}px`
    }}
  >
    <canvas id="three-canvas" ref={threeCanvasRef}></canvas>
    <canvas id="grid-canvas" ref={gridCanvasRef}></canvas>

    {/* Neural Pulse Arena Overlay */}
    {isMinigameActive && (
      <div className="neural-pulse-arena">
        <div className="arena-score">SYNC: {minigameScore}</div>
        {gameNodes.map(node => (
          <div 
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
          >
            <div className="node-core"></div>
            <div className="node-ring"></div>
          </div>
        ))}
      </div>
    )}

    <div className="grid-overlay"></div>
    <div className="vignette"></div>
    <div className="scanline"></div>
    <div className="hex-overlay"></div>

    <div className="main-grid" data-mode={activeMode}>
      {/* ROW 1: NAVBAR */}
      <div className="grid-navbar">
        <div className="nav-logo">
          <span className="logo-text">M·M·S</span>
          <span className="logo-sub">MUGHEES MANAGEMENT SYSTEM · v2.0</span>
        </div>

        <div className="nav-links">
          {navItems.map(item => (
            <div
              key={item}
              className={`nav-item ${activeMode === item ? 'active' : ''}`}
              onClick={() => handleModeChange(item)}
            >
              <span className="nav-arrow">›</span>
              {item}
            </div>
          ))}
        </div>

        <div className="nav-status">
          <div className="settings-icon" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 1.65 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </div>
          <div className="mode-indicator">
            <div className="mode-dot"></div>
            <span className="mode-text">MODE: {activeMode}</span>
          </div>
          <div className="status-indicator">
            <div className={`status-dot ${mmsStatus}`}></div>
            <span className="status-text">{mmsStatus.toUpperCase().replace('_', ' ')}</span>
          </div>
          <div className="clock-display">{timeStr}</div>
        </div>
      </div>

      {/* ROW 2: LEFT PANEL */}
      <div className="grid-left">
        {/* ── M.M.S. MODE PANEL ── */}
        {activeMode === 'M.M.S.' && (
          <>
            <div className="panel-section" style={getComponentStyle('ACTIVE_MODE')}>
              <div className="section-label">ACTIVE MODE</div>
              <div className="mode-buttons">
                {modes.map(mode => (
                  <div
                    key={mode}
                    className={`mode-btn ${activeMode === mode ? 'active' : ''}`}
                    onClick={() => handleModeChange(mode)}
                    style={activeMode === mode ? { borderColor: 'var(--primary)', color: 'var(--primary)' } : {}}
                  >
                    <span className="mode-text">{mode}</span>
                    {activeMode === mode && <div className="mode-dot" style={{ background: 'var(--primary)' }}></div>}
                  </div>
                ))}
              </div>
            </div>

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
          </>
        )}

        {/* ── TRADER MODE PANEL ── */}
        {activeMode === 'TRADER' && (
          <>
            <div className="panel-section" style={getComponentStyle('PORTFOLIO')}>
              <div className="section-label" style={{ color: '#00ff88' }}>PORTFOLIO</div>
              <div className="metrics-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div className="metric-card" style={{ padding: '8px' }}>
                  <span className="metric-value" style={{ color: '#00ff88', fontSize: '14px' }}>
                    ${specialistData?.portfolio?.reduce((acc, curr) => acc + (parseFloat(curr.free) * (curr.asset === 'BTC' ? 67000 : 3200)), 0).toLocaleString() || '2,847'}
                  </span>
                  <span className="metric-label">TOTAL VALUE</span>
                </div>
                <div className="metric-card" style={{ padding: '8px' }}>
                  <span className="metric-value" style={{ color: '#00ff88', fontSize: '14px' }}>+4.2%</span>
                  <span className="metric-label">24H CHANGE</span>
                </div>
              </div>
            </div>
            
            <div className="panel-section" style={getComponentStyle('WATCHLIST')}>
              <div className="section-label" style={{ color: '#00ff88' }}>HOLDINGS</div>
              <div className="holding-list" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                {specialistData?.portfolio?.map(h => (
                  <div key={h.asset} className="module-row" style={{ borderBottom: '1px solid rgba(0,255,136,0.05)' }}>
                    <span className="module-name">{h.asset}</span>
                    <span className="module-status online" style={{ color: '#00ff88' }}>{parseFloat(h.free).toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-section" style={getComponentStyle('HALAL_FILTER')}>
              <div className="section-label" style={{ color: '#00ff88' }}>HALAL FILTER</div>
              <div style={{ padding: '8px', background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '2px' }}>
                <div style={{ fontSize: '8px', color: '#00ff88', letterSpacing: '1px' }}>✓ {specialistData?.halal_filter || 'ACTIVE'} — {specialistData?.whitelisted_count || 14} APPROVED</div>
                <div style={{ fontSize: '7px', opacity: 0.4, marginTop: '4px' }}>LEVERAGE / MARGIN: BLOCKED</div>
                <button 
                  className="cmd-btn" 
                  style={{ width: '100%', marginTop: '10px', borderColor: '#00ff88', color: '#00ff88', fontSize: '9px' }}
                  onClick={() => socketRef.current.emit('SPECIALIST_ACTION', { mode: 'TRADER', action: 'EXECUTE_TRADE', payload: { symbol: 'BTCUSDT', side: 'BUY' } })}
                >
                  EXECUTE TEST TRADE
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── PROFESSOR MODE PANEL ── */}
        {activeMode === 'PROFESSOR' && (
          <>
            <div className="panel-section" style={getComponentStyle('CURRICULUM')}>
              <div className="section-label" style={{ color: '#a78bfa' }}>CURRICULUM</div>
              <div className="curriculum-list">
                {specialistData?.curriculum?.map(c => (
                  <div key={c.name} className="curriculum-item">
                    <div className={`cur-dot ${c.status}`} style={{ background: c.status === 'DONE' ? '#00ff88' : (c.status === 'ACTIVE' ? '#a78bfa' : 'rgba(255,255,255,0.1)') }}></div>
                    <span className="cur-name" style={{ color: c.status === 'ACTIVE' ? '#a78bfa' : 'inherit' }}>{c.name}</span>
                    <span className="cur-status" style={{ color: c.status === 'DONE' ? '#00ff88' : (c.status === 'ACTIVE' ? '#a78bfa' : 'inherit') }}>{c.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-section" style={getComponentStyle('STUDY_METRICS')}>
              <div className="section-label" style={{ color: '#a78bfa' }}>STUDY METRICS</div>
              <div className="module-list">
                <div className="module-row"><span className="module-name">MOOD</span><span className="module-status online" style={{ color: '#a78bfa' }}>{specialistData?.mood || 'ACADEMIC'}</span></div>
                <div className="module-row"><span className="module-name">STREAK</span><span className="module-status online" style={{ color: '#a78bfa' }}>{specialistData?.streak || 0} SESSIONS</span></div>
                <div className="module-row"><span className="module-name">LEVEL</span><span className="module-status online" style={{ color: '#00ff88' }}>{specialistData?.mastery_level || 'NOVICE'}</span></div>
              </div>
            </div>
          </>
        )}

        {/* ── ENGINEER MODE PANEL ── */}
        {activeMode === 'ENGINEER' && (
          <>
            <div className="panel-section" style={getComponentStyle('ACTIVE_PROJECT')}>
              <div className="section-label" style={{ color: '#f97316' }}>ACTIVE PROJECTS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(specialistData?.active_projects || ['M.M.S. CORE']).map(proj => (
                  <div key={proj} style={{ padding: '8px', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '2px' }}>
                    <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', color: '#f97316', letterSpacing: '1.5px' }}>{proj}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '6px', opacity: 0.5, marginTop: '4px' }}>
                      <span>TYPE: NEXT.JS 15</span>
                      <span>STATUS: {specialistData?.manifestation_sync?.status || 'STABLE'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-section" style={getComponentStyle('FILE_TREE')}>
              <div className="section-label" style={{ color: '#f97316' }}>LIVE FILE TREE</div>
              <div className="file-tree" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {specialistData?.live_file_tree ? (
                  <FileTreeNode node={specialistData.live_file_tree} />
                ) : (
                  <div style={{ fontSize: '9px', opacity: 0.3, textAlign: 'center', padding: '20px' }}>AWAITING MANIFESTATION...</div>
                )}
              </div>
            </div>
          </>
        )}

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
              <div className="memory-empty">— NO MEMORIES YET —</div>
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

        {/* Removed static transcript to use floating subtitles */}
      </div>

      {/* ROW 2: CENTER (ORB / TACTICAL CONTENT) */}
      <div className={`grid-center ${activeMode !== 'M.M.S.' ? 'has-content' : ''}`}>
        
        {/* ── TRADER CENTER: Market Signal ── */}
        {activeMode === 'TRADER' && (
          <div className="center-panel trader-center">
            <div className="market-pairs">
              <div className="pair-row">
                <span className="pair-name">BTC/USDT</span>
                <span className="pair-price">$67,432.12</span>
                <span className="pair-change positive">+2.42%</span>
              </div>
              <div className="pair-row">
                <span className="pair-name">ETH/USDT</span>
                <span className="pair-price">$3,241.53</span>
                <span className="pair-change negative">-0.85%</span>
              </div>
            </div>
            <div className="neural-verdict-box">
              <div className="verdict-label">NEURAL MARKET VERDICT</div>
              <div className="verdict-value">STRONG ACCUMULATE</div>
              <div className="verdict-confidence">SIGNAL CONFIDENCE: 94%</div>
            </div>
          </div>
        )}

        {/* ── PROFESSOR CENTER: Slide Viewer ── */}
        {activeMode === 'PROFESSOR' && (
          <div className="center-panel professor-center">
            <div className="slide-box">
              <div className="slide-box-header">
                <span className="slide-title">QUANTUM COMPUTING 101</span>
                <div className="slide-bullets-list">
                  <div>• Superposition &amp; Entanglement</div>
                  <div>• Qubit State Manifestation</div>
                  <div>• Neural Link Optimization</div>
                </div>
                <div className="slide-counter">SLIDE 4 / 32</div>
              </div>
              <div className="slide-quiz-block">
                <div className="quiz-question">What is the primary benefit of quantum parallelism in Shor's algorithm?</div>
                <div className="quiz-answer-list">
                  <div className="quiz-answer">A) Linear data processing</div>
                  <div className="quiz-answer selected">B) Exponential factorization speedup</div>
                  <div className="quiz-answer">C) Increased storage capacity</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ENGINEER CENTER: Forge Build Log ── */}
        {activeMode === 'ENGINEER' && (
          <div className="center-panel engineer-center">
            <div className="forge-build-panel">
              <div className="forge-build-header">FORGE_BUILD_LOG</div>
              <div className="forge-build-body">
                {(specialistData?.forge_build_log || [
                  { timestamp: '00:48:23', activity: 'Initiating architectural-sequencing core', status: 'OK' },
                  { timestamp: '00:48:22', activity: 'Executing Scaffold: npx --yes create-next-app@lts...', status: 'OK' },
                  { timestamp: '00:47:07', activity: 'Executing Scaffold: npm install frame-motion [ucf...', status: 'OK' },
                  { timestamp: '00:38:52', activity: 'Engaging parallel manifestation threadpool', status: 'OK' },
                ]).map((log, i) => (
                  <div key={i} className="build-entry">
                    <span className="build-ts">[{log.timestamp}]</span>
                    <span className={`build-status ${log.status === 'OK' ? 'ok' : 'err'}`}>[{log.status}]</span>
                    <span className="build-msg">{log.activity}</span>
                  </div>
                ))}
              </div>
              <div className="forge-build-footer">
                <span>THREADPOOL: ACTIVE [5 WORKERS]</span>
                <span>NEURAL_LINK: STABLE</span>
              </div>
            </div>
          </div>
        )}

        {/* M.M.S. CENTER: Orb fills via fixed canvas */}
      </div>

      {/* ROW 2: RIGHT PANEL */}
      <div className="grid-right">
        {/* ── M.M.S. MODE RIGHT PANEL ── */}
        {activeMode === 'M.M.S.' && (
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

            <div className="panel-section" style={getComponentStyle('SLEEP_AWAKE')}>
              <div className="section-label">SLEEP / AWAKE</div>
              <div className="sleep-hud">
                <div className="sleep-main">
                  <span className="sleep-val">8</span>
                  <span className="sleep-unit">H</span>
                  <span className="sleep-state">STANDBY</span>
                </div>
                <div className="sleep-progress">
                  <div className="sleep-fill" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>

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
            <div className="panel-section" style={getComponentStyle('TOP_OPPORTUNITY')}>
              <div className="section-label" style={{ color: '#00ff88' }}>TOP OPPORTUNITY</div>
              <div style={{ padding: '12px', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', color: '#00ff88' }}>SOL/USDT</span>
                  <span style={{ fontSize: '10px', color: '#00ff88' }}>LONG</span>
                </div>
                <div style={{ fontSize: '8px', opacity: 0.6, lineHeight: '1.4' }}>Breakout detected at $142.50. Target: $158.00. Neural confidence high.</div>
                <button className="cmd-btn" style={{ width: '100%', marginTop: '10px', borderColor: '#00ff88', color: '#00ff88' }}>EXECUTE TRADE</button>
              </div>
            </div>

            <div className="panel-section" style={getComponentStyle('MACRO_SIGNALS')}>
              <div className="section-label" style={{ color: '#00ff88' }}>MACRO SIGNALS</div>
              <div className="stat-row"><span className="sk">DXY INDEX</span><span className="sv">104.2 (↓)</span></div>
              <div className="stat-row"><span className="sk">SPX 500</span><span className="sv">5,124 (↑)</span></div>
              <div className="stat-row"><span className="sk">VOLATILITY</span><span className="sv">LOW</span></div>
              <div className="stat-row"><span className="sk">FUNDING</span><span className="sv">NEUTRAL</span></div>
            </div>
          </>
        )}

        {/* ── PROFESSOR MODE RIGHT PANEL ── */}
        {activeMode === 'PROFESSOR' && (
          <>
            <div className="panel-section" style={getComponentStyle('LEARNING_PROGRESS')}>
              <div className="section-label" style={{ color: '#a78bfa' }}>LEARNING PROGRESS</div>
              <div className="neural-gauge" style={{ margin: '10px auto' }}>
                <canvas ref={neuralGaugeRef} width="100" height="100"></canvas>
                <div className="neural-text">
                  <span className="neural-percent" style={{ color: '#a78bfa' }}>84%</span>
                  <span className="neural-label">SYNC</span>
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: '8px', opacity: 0.4 }}>MASTERY: LEVEL 4 (ADVANCED)</div>
            </div>

            <div className="panel-section" style={getComponentStyle('STUDY_GOALS')}>
              <div className="section-label" style={{ color: '#a78bfa' }}>STUDY GOALS</div>
              <div className="stat-row"><span className="sk">DAILY TARGET</span><span className="sv">2h 30m</span></div>
              <div className="stat-row"><span className="sk">REMAINING</span><span className="sv" style={{ color: '#a78bfa' }}>45m</span></div>
              <div className="stat-row"><span className="sk">NEXT EXAM</span><span className="sv">IN 2 DAYS</span></div>
            </div>
          </>
        )}

        {/* ── ENGINEER MODE RIGHT PANEL ── */}
        {activeMode === 'ENGINEER' && (
          <>
            <div className="panel-section" style={getComponentStyle('FORGE_TELEMETRY')}>
              <div className="section-label" style={{ color: '#f97316' }}>FORGE TELEMETRY</div>
              <div className="metrics-grid">
                <div className="metric-card">
                  <span className="metric-value" style={{ color: '#f97316' }}>{specialistData?.forge_telemetry?.hmr_latency || '0.4s'}</span>
                  <span className="metric-label">HMR LATENCY</span>
                </div>
                <div className="metric-card">
                  <span className="metric-value" style={{ color: specialistData?.forge_telemetry?.errors > 0 ? '#ff3366' : '#00ff88' }}>
                    {specialistData?.forge_telemetry?.errors || 0} ERR
                  </span>
                  <span className="metric-label">LINT STATUS</span>
                </div>
              </div>
            </div>

            <div className="panel-section" style={getComponentStyle('MANIFESTATION_SYNC')}>
              <div className="section-label" style={{ color: '#f97316' }}>MANIFESTATION SYNC</div>
              <div style={{ padding: '10px', background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', marginBottom: '5px' }}>
                  <span>NEURAL ALIGNMENT</span>
                  <span style={{ color: '#f97316' }}>{specialistData?.manifestation_sync?.alignment || '98%'}</span>
                </div>
                <div className="progress-bar" style={{ margin: 0 }}>
                  <div className="progress-fill" style={{ width: specialistData?.manifestation_sync?.alignment || '98%' }}></div>
                </div>
                <div style={{ fontSize: '7px', opacity: 0.4, marginTop: '5px', textAlign: 'right' }}>
                  CORE: {specialistData?.manifestation_sync?.status || 'SYNCHRONIZED'}
                </div>
              </div>
            </div>

            <div className="panel-section" style={getComponentStyle('SYSTEM_ACTIONS')}>
              <div className="section-label" style={{ color: '#f97316' }}>SYSTEM ACTIONS</div>
              <div className="action-log" style={{ maxHeight: '100px' }}>
                <div className="action-log-item"><span className="action-time">12:44</span> <span className="action-label">Pushed to main</span></div>
                <div className="action-log-item"><span className="action-time">12:42</span> <span className="action-label">Asset optimized</span></div>
              </div>
            </div>
          </>
        )}

        {/* ── PERSISTENT LAYOUT CALIBRATION ── */}
        <div className="panel-section" style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="section-label">{activeMode} LAYOUT CALIBRATION</div>
          <div className="calibration-controls" style={{ padding: '4px' }}>
            <div className="calibration-item" style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', marginBottom: '2px' }}>
                <label>LEFT WIDTH</label>
                <span>{layoutOffsets.leftWidth}px</span>
              </div>
              <input type="range" min="150" max="400" value={layoutOffsets.leftWidth || 200} 
                onChange={(e) => updateCurrentLayout({ leftWidth: parseInt(e.target.value) })} 
                style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}/>
            </div>
            <div className="calibration-item" style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', marginBottom: '2px' }}>
                <label>RIGHT WIDTH</label>
                <span>{layoutOffsets.rightWidth}px</span>
              </div>
              <input type="range" min="150" max="400" value={layoutOffsets.rightWidth || 200} 
                onChange={(e) => updateCurrentLayout({ rightWidth: parseInt(e.target.value) })} 
                style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}/>
            </div>
            <div className="calibration-item" style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', marginBottom: '2px' }}>
                <label>CMD HEIGHT</label>
                <span>{layoutOffsets.bottomHeight}px</span>
              </div>
              <input type="range" min="100" max="350" value={layoutOffsets.bottomHeight || 150} 
                onChange={(e) => updateCurrentLayout({ bottomHeight: parseInt(e.target.value) })} 
                style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}/>
            </div>
            
            <div style={{ margin: '10px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}></div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div className="cal-col">
                <div style={{ fontSize: '7px', opacity: 0.4, textAlign: 'center', marginBottom: '4px' }}>LEFT</div>
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ fontSize: '6px', opacity: 0.3 }}>X: {layoutOffsets.leftX}</div>
                  <input type="range" min="-100" max="100" value={layoutOffsets.leftX} 
                    onChange={(e) => updateCurrentLayout({ leftX: parseInt(e.target.value) })} 
                    style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }}/>
                </div>
                <div>
                  <div style={{ fontSize: '6px', opacity: 0.3 }}>Y: {layoutOffsets.leftY}</div>
                  <input type="range" min="-100" max="100" value={layoutOffsets.leftY} 
                    onChange={(e) => updateCurrentLayout({ leftY: parseInt(e.target.value) })} 
                    style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }}/>
                </div>
              </div>
              
              <div className="cal-col">
                <div style={{ fontSize: '7px', opacity: 0.4, textAlign: 'center', marginBottom: '4px' }}>RIGHT</div>
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ fontSize: '6px', opacity: 0.3 }}>X: {layoutOffsets.rightX}</div>
                  <input type="range" min="-100" max="100" value={layoutOffsets.rightX} 
                    onChange={(e) => updateCurrentLayout({ rightX: parseInt(e.target.value) })} 
                    style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }}/>
                </div>
                <div>
                  <div style={{ fontSize: '6px', opacity: 0.3 }}>Y: {layoutOffsets.rightY}</div>
                  <input type="range" min="-100" max="100" value={layoutOffsets.rightY} 
                    onChange={(e) => updateCurrentLayout({ rightY: parseInt(e.target.value) })} 
                    style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }}/>
                </div>
              </div>

              <div className="cal-col">
                <div style={{ fontSize: '7px', opacity: 0.4, textAlign: 'center', marginBottom: '4px' }}>CMD</div>
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ fontSize: '6px', opacity: 0.3 }}>X: {layoutOffsets.bottomX}</div>
                  <input type="range" min="-100" max="100" value={layoutOffsets.bottomX} 
                    onChange={(e) => updateCurrentLayout({ bottomX: parseInt(e.target.value) })} 
                    style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }}/>
                </div>
                <div>
                  <div style={{ fontSize: '6px', opacity: 0.3 }}>Y: {layoutOffsets.bottomY}</div>
                  <input type="range" min="-100" max="100" value={layoutOffsets.bottomY} 
                    onChange={(e) => updateCurrentLayout({ bottomY: parseInt(e.target.value) })} 
                    style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }}/>
                </div>
              </div>
            </div>

            <button 
              className="cmd-btn" 
              style={{ width: '100%', marginTop: '12px', fontSize: '7px', padding: '4px', opacity: 0.6 }}
              onClick={() => {
                const defaults = {
                  'M.M.S.': { leftWidth: 200, rightWidth: 200, bottomHeight: 150, leftX: 0, leftY: 0, rightX: 0, rightY: 0, bottomX: 0, bottomY: 0 },
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
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontSize: '8px', padding: '4px', marginBottom: '8px' }}
            >
              <option value="">SELECT COMPONENT...</option>
              {(({
                'M.M.S.': ['ACTIVE_MODE', 'SYSTEM_VITALS', 'BIOMETRIC_SCAN', 'SCREEN_VISION', 'SYSTEM_METRICS', 'MODULE_STATUS', 'VOICE_MONITOR', 'MEMORY_CORE'],
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '6px', opacity: 0.4 }}>
                    <label>X NUDGE</label>
                    <span>{(componentNudges[selectedComponent]?.x || 0)}px</span>
                  </div>
                  <input type="range" min="-100" max="100" value={componentNudges[selectedComponent]?.x || 0} 
                    onChange={(e) => updateComponentNudge(selectedComponent, { x: parseInt(e.target.value) })} 
                    style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '6px', opacity: 0.4 }}>
                    <label>Y NUDGE</label>
                    <span>{(componentNudges[selectedComponent]?.y || 0)}px</span>
                  </div>
                  <input type="range" min="-100" max="100" value={componentNudges[selectedComponent]?.y || 0} 
                    onChange={(e) => updateComponentNudge(selectedComponent, { y: parseInt(e.target.value) })} 
                    style={{ width: '100%', height: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)' }}/>
                </div>
              </div>
            )}
            
            <button 
              className="cmd-btn" 
              style={{ width: '100%', marginTop: '10px', fontSize: '7px', padding: '4px', opacity: 0.4 }}
              onClick={() => {
                if (window.confirm('RESET ALL COMPONENT NUDGES?')) setComponentNudges({});
              }}
            >
              RESET ALL COMPONENTS
            </button>
          </div>
        </div>
      </div>

      {/* ROW 3: BOTTOM BAR */}
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
                <div className="alert-msg">SCANNING YOUR SYSTEM! SNAPSHOT...</div>
                <div className="alert-meta">THREAT_LEVEL: CRITICAL</div>
              </div>
              <div className="alert-footer">
                <span className="blink">NEU-STREAM: ACTIVE</span>
              </div>
            </div>
          )}

          <div className="version-info">
            <span className="version-row">M.M.S. CORE: v2.0.0</span>
            <span className="version-row verified">AUTH: MUGHEES [VERIFIED]</span>
          </div>
        </div>

        <div className="bottom-center">
          <div className="single-command-box">
            <div className="command-header">
              <span>M.M.S. COMMAND INTERFACE</span>
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
                  placeholder={isMicrophoneActive ? 'M.M.S. LISTENING...' : 'TYPE OR SPEAK COMMAND...'}
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
                      setInputValue('');
                      setIsTyping(false);
                      setMmsResponseStream('');
                      setLiveCodeStream('');
                      if (socketRef.current) socketRef.current.emit('user_message', userText, { artifactTokens: [...artifactTokens, ...pendingArtifactTokens] });
                      if (pendingArtifactTokens.length > 0) { setArtifactTokens(prev => [...prev, ...pendingArtifactTokens]); setPendingArtifactTokens([]); }
                    }
                  }}
                  disabled={isMicrophoneActive}
                />
              </div>
              <button className={`mic-btn ${isMicrophoneActive ? 'active' : ''}`} onClick={toggleMicrophone} title="Toggle Mic">
                <svg className="mic-icon" viewBox="0 0 24 24"><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>
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
                      src="http://127.0.0.1:3001/security/video_feed" 
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
                        <div className="bio-stat">ID: {biometricData.name || 'SCANNING'}</div>
                        <div className="bio-stat">CONF: {biometricData.confidence || 0}%</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="camera-auth-overlay">
                    <div className="auth-glitch-text">
                      {cameraStatus === 'denied' ? 'SIGNAL_BLOCKED' : 'AWAITING_AUTH'}
                    </div>
                    <div className="auth-subtext">
                      {cameraStatus === 'denied' ? 'AUTHORIZATION DENIED BY MASTER' : 'TACTICAL UPLINK PENDING...'}
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
                   <span className="telemetry-item blink">SYNC_[88%]</span>
                </div>
                <div className="hud-telemetry-bottom">
                   <span className="telemetry-item">60 FPS</span>
                   <span className="telemetry-item">4.2 Mbps</span>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* ── FLOATING RESPONSE STREAM (FUTURISTIC SUBTITLES) ── */}
      <div className={`floating-subtitles ${showResponsePanel && mmsResponseStream ? 'visible' : ''}`}>
        <div className="subtitles-content">
           <span className="subtitles-prefix">M.M.S // </span>
           {mmsResponseStream}
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
          <button className="threat-dismiss" onClick={() => setShowSecurityOverlay(false)}>ACKNOWLEDGE RISK</button>
        </div>
      </div>
    )}

    <ShadowAssistant socket={socketRef.current} />

    <SettingsModal
      isOpen={isSettingsOpen}
      onClose={() => setIsSettingsOpen(false)}
      blobColor={blobColor}
      setBlobColor={setBlobColor}
      blobSize={blobSize}
      setBlobSize={setBlobSize}
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
              setBlobPosition(dragStateRef.current.tempPosition);
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
        </div>
        <div className="video-stage">
          <div className="three-manifest-layer">
            {/* Real 3D content would be rendered into a Three.js sub-canvas here */}
            <div className="manifestation-label">3D_MANIFEST: ACTIVE</div>
          </div>
          <div className="subtitles-layer">
            {mmsResponseStream}
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
      <div className="omni-box-overlay" onClick={() => setIsOmniBoxOpen(false)}>
        <div className="omni-box-container" onClick={e => e.stopPropagation()}>
          <div className="omni-header">OMNI_SEARCH_V2 // SYSTEM_QUERY</div>
          <input 
            autoFocus
            className="omni-input" 
            placeholder="ASK JARVIS... (Prefix 'Deep think' for 70B cores)" 
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
      <div className="engagement-overlay" onClick={() => setIsSystemEngaged(true)}>
        <div className="engagement-content">
          <div className="power-icon">⚡</div>
          <h2>INITIALIZE MMS NEURAL LINK</h2>
          <p>Click to synchronize sensory arrays and audio core.</p>
          <div className="scan-line"></div>
        </div>
      </div>
    )}
  </div>
);
}

export default App;
