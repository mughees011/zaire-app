import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import SettingsModal from './SettingsModal';
import GroqSpeechService from './groqSpeechService';
import { io } from 'socket.io-client';
import './App.css';

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

  const [bootText, setBootText] = useState('INITIALIZING SYSTEM...');
  const [activeMode, setActiveMode] = useState('VOICE');
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

  const [activityFeed, setActivityFeed] = useState([
    { time: '15:47', message: 'System boot complete' },
    { time: '15:46', message: 'Neural core initialized' },
    { time: '15:45', message: 'Voice synthesis online' },
    { time: '15:44', message: 'Loading JARVIS protocol' },
    { time: '15:43', message: 'Mounting file system' },
  ]);

  const mainGroupRef = useRef(null);
  const uniformsRef = useRef(null);
  const voiceWaveformRef = useRef(null);
  const neuralGaugeRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const audioStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const [lastCommand, setLastCommand] = useState('');
  const [lastCommandTime, setLastCommandTime] = useState('');
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
  const [jarvisResponseStream, setJarvisResponseStream] = useState('');
  const [showResponsePanel, setShowResponsePanel] = useState(false);
  const responseTimeoutRef = useRef(null);

  // Biometric State
  const [biometricData, setBiometricData] = useState({ detected: false, name: 'ABSENT', confidence: 0 });
  const [isSecurityAlert, setIsSecurityAlert] = useState(false);
  
  const [terminalLog, setTerminalLog] = useState([
    { time: '19:00', type: 'system', content: 'SYSTEM BOOT SEQUENCE INITIATED' },
    { time: '19:00', type: 'system', content: 'NEURAL CORE LOADED' },
    { time: '19:00', type: 'system', content: 'VOICE INTERFACE ONLINE' },
  ]);

  const audioQueueRef = useRef({}); // Using object keyed by index for O(1) lookups
  const isPlayingAudioRef = useRef(false);
  const nextExpectedIndexRef = useRef(0);

  const playNextAudioChunk = async () => {
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
      isPlayingAudioRef.current = false;
      nextExpectedIndexRef.current++;
      playNextAudioChunk();
    }
  };

  // Function to fetch TTS audio via HTTP
  const fetchTTSAudio = async (text) => {
    try {
      const response = await fetch('http://localhost:3001/tts', {
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
  };

  // Load memories from backend on startup
  useEffect(() => {
    fetch('http://localhost:3001/memories')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setStoredMemories(data.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    socketRef.current = io('http://localhost:3001', {
      transports: ['polling', 'websocket'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current.on('connect', () => {
      console.log('[SOCKET] Connected to backend');
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('[SOCKET] Connection error:', err.message);
    });

    socketRef.current.on('ai_text_delta', (delta) => {
      setJarvisResponseStream(prev => prev + delta);
      setShowResponsePanel(true);
      
      // Reset fade timeout
      if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = setTimeout(() => {
        setShowResponsePanel(false);
        setJarvisResponseStream('');
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
    socketRef.current.on('jarvis_status', (status) => {
      if (status === 'scanning') {
        setIsVisionScanning(true);
      } else {
        setIsVisionScanning(false);
      }
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
    socketRef.current.on('neural_log', ({ content }) => {
      const now = new Date();
      const time = [now.getHours(), now.getMinutes()].map(n => String(n).padStart(2, '0')).join(':');
      setTerminalLog(prev => [...prev, { time, type: 'system', content: content.toUpperCase() }].slice(-50));
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

    // Biometric Polling (Observer Daemon on Port 3003)
    const pollBiometrics = async () => {
      try {
        const res = await fetch('http://localhost:3003/status');
        const data = await res.json();
        setBiometricData(data);
        
        // Security Alert if Unknown detected
        if (data.detected && (data.name === 'Unknown' || data.name === 'Security Alert')) {
          setIsSecurityAlert(true);
        } else {
          setIsSecurityAlert(false);
        }
      } catch (e) {
        // Observer not running?
      }
    };

    const biometricInterval = setInterval(pollBiometrics, 3000);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      clearInterval(biometricInterval);
    }
  }, []);
  useEffect(() => {
    localStorage.setItem('blobColor', blobColor);
    localStorage.setItem('blobSize', blobSize.toString());
    localStorage.setItem('blobPosition', JSON.stringify(blobPosition));

    if (mainGroupRef.current) {
      mainGroupRef.current.scale.set(blobSize, blobSize, blobSize);
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
            const now = new Date();
            const time = [now.getHours(), now.getMinutes()].map(n => String(n).padStart(2, '0')).join(':');
            setFinalRecognizedText(text);

            // Send to Real-time Backend
            setJarvisResponseStream('');
            if (socketRef.current) {
              socketRef.current.emit('user_message', text);
            }

            setTerminalLog(prev => [...prev, { time, type: 'input', content: text.toUpperCase() }]);
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
      let bestConfidence = 0;
      let bestTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 0;

        // Get the best alternative
        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestTranscript = transcript;
        }

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

        // Send to Real-time Backend
        setJarvisResponseStream('');
        if (socketRef.current) {
          socketRef.current.emit('user_message', text);
        }

        const now = new Date();
        const time = [now.getHours(), now.getMinutes()].map(n => String(n).padStart(2, '0')).join(':');
        setTerminalLog(prev => [...prev, { time, type: 'input', content: text.toUpperCase() }]);

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

    try {
      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
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
      vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
      vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
      vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
      vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
      float snoise(vec3 v){
        const vec2 C=vec2(1./6.,1./3.);
        const vec4 D=vec4(0.,.5,1.,2.);
        vec3 i=floor(v+dot(v,C.yyy));
        vec3 x0=v-i+dot(i,C.xxx);
        vec3 g=step(x0.yzx,x0.xyz);
        vec3 l=1.-g;
        vec3 i1=min(g.xyz,l.zxy);
        vec3 i2=max(g.xyz,l.zxy);
        vec3 x1=x0-i1+C.xxx;
        vec3 x2=x0-i2+C.yyy;
        vec3 x3=x0-D.yyy;
        i=mod289(i);
        vec4 p=permute(permute(permute(
          i.z+vec4(0.,i1.z,i2.z,1.))
          +i.y+vec4(0.,i1.y,i2.y,1.))
          +i.x+vec4(0.,i1.x,i2.x,1.)));
        float n_=0.142857142857;
        vec3 ns=n_*D.wyz-D.xzx;
        vec4 j=p-49.*floor(p*ns.z*ns.z);
        vec4 x_=floor(j*ns.z);
        vec4 y_=floor(j-7.*x_);
        vec4 x=x_*ns.x+ns.yyyy;
        vec4 y=y_*ns.x+ns.yyyy;
        vec4 h=1.-abs(x)-abs(y);
        vec4 b0=vec4(x.xy,y.xy);
        vec4 b1=vec4(x.zw,y.zw);
        vec4 s0=floor(b0)*2.+1.;
        vec4 s1=floor(b1)*2.+1.;
        vec4 sh=-step(h,vec4(0.));
        vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
        vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
        vec3 p0=vec3(a0.xy,h.x);
        vec3 p1=vec3(a0.zw,h.y);
        vec3 p2=vec3(a1.xy,h.z);
        vec3 p3=vec3(a1.zw,h.w);
        vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
        p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
        vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
        m=m*m;
        return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
      }
      float fbm(vec3 p){
        float total=0.;float amplitude=.5;float frequency=1.;
        for(int i=0;i<3;i++){total+=snoise(p*frequency)*amplitude;amplitude*=.5;frequency*=2.;}
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
        vec4 mvPosition=modelViewMatrix*vec4(position,1.);
        vViewPosition=-mvPosition.xyz;
        gl_Position=projectionMatrix*mvPosition;
      }`;
    const shellFrag = `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      uniform vec3 uColor;
      uniform float uOpacity;
      void main(){
        float fresnel=pow(1.-dot(normalize(vNormal),normalize(vViewPosition)),2.5);
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
          float audioInfluence=sin(angle*8.+uTime)*uAudioBass*0.15+sin(angle*12.+uTime*0.5)*uAudioMid*0.12+sin(angle*16.)*uAudioTreble*0.1;
          pos=normalize(pos)*(1.+audioInfluence*uAudioIntensity);
          vPosition=pos;
          vNormal=normalize(normalMatrix*pos);
          vec4 mvPosition=modelViewMatrix*vec4(pos,1.);
          vViewPosition=-mvPosition.xyz;
          gl_Position=projectionMatrix*mvPosition;
        }`,
      fragmentShader: `
        uniform float uTime;
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
          vec3 p=vPosition*uScale;
          vec3 q=vec3(
            fbm(p+vec3(0.,uTime*.05,0.)),
            fbm(p+vec3(5.2,1.3,2.8)+uTime*.05),
            fbm(p+vec3(2.2,8.4,.5)-uTime*.02)
          );
          float density=fbm(p+2.*q);
          float audioWave=sin(atan(vPosition.y,vPosition.x)*8.)*uAudioBass+sin(atan(vPosition.y,vPosition.x)*12.)*uAudioMid;
          float t=(density+.4+audioWave*0.3)*.8;
          float alpha=smoothstep(uThreshold,.7,t);
          float audioBoost=uAudioBass*0.4+uAudioMid*0.3+uAudioTreble*0.2;
          vec3 cWhite=vec3(1.);
          vec3 color=mix(uColorDeep,uColorMid,smoothstep(uThreshold,.5,t));
          color=mix(color,uColorBright,smoothstep(.5,.8,t));
          color=mix(color,cWhite,smoothstep(.8,1.,t)*audioBoost);
          float facing=dot(normalize(vNormal),normalize(vViewPosition));
          float depthFactor=(facing+1.)*.5;
          float finalAlpha=alpha*(.02+.98*depthFactor)*(1.+audioBoost*0.5);
          gl_FragColor=vec4(color*uBrightness*(1.+audioBoost*0.3),finalAlpha);
        }`,
      transparent: true, blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide, depthWrite: false
    });
    const plasmaMesh = new THREE.Mesh(plasmaGeo, plasmaMat);
    mainGroup.add(plasmaMesh);

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
          pos.y+=sin(uTime*.2+pos.x)*.02;
          pos.x+=cos(uTime*.15+pos.z)*.02;
          vec4 mvPosition=modelViewMatrix*vec4(pos,1.);
          gl_Position=projectionMatrix*mvPosition;
          float baseSize=8.*aSize+4.;
          gl_PointSize=baseSize*(1./-mvPosition.z);
          vAlpha=.8+.2*sin(uTime+aSize*10.);
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main(){
          vec2 uv=gl_PointCoord-vec2(.5);
          if(length(uv)>.5)discard;
          float glow=pow(1.-length(uv)*2.,1.8);
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
      const vx = W / 2, vy = H * 0.72, horizonY = H * 0.42;

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
    window.addEventListener('resize', handleResize);

    initGrid();
    const clock = new THREE.Clock();
    let animationId;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Get audio frequency data if microphone is active
      let audioIntensity = 0;
      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const total = dataArrayRef.current.length;

        // Split into frequency bands: bass, low-mid, mid, high-mid, treble
        const bassBins = dataArrayRef.current.slice(0, Math.floor(total * 0.2));
        const lowMidBins = dataArrayRef.current.slice(Math.floor(total * 0.2), Math.floor(total * 0.4));
        const midBins = dataArrayRef.current.slice(Math.floor(total * 0.4), Math.floor(total * 0.6));
        const highMidBins = dataArrayRef.current.slice(Math.floor(total * 0.6), Math.floor(total * 0.8));
        const trebleBins = dataArrayRef.current.slice(Math.floor(total * 0.8));

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

      // Apply audio-based scaling with smoother animation
      const targetScale = 1 + audioIntensity * 0.08;
      mainGroup.scale.x += (targetScale - mainGroup.scale.x) * 0.1;
      mainGroup.scale.y += (targetScale - mainGroup.scale.y) * 0.1;
      mainGroup.scale.z += (targetScale - mainGroup.scale.z) * 0.1;

      drawGrid(t);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      cameraRef.current = null;
    };
  }, [blobColor, blobSize, blobPosition]);

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
      ctx.strokeStyle = 'rgba(0,212,255,0.08)';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.strokeStyle = 'rgba(0,212,255,0.8)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.stroke();

      animationId = requestAnimationFrame(drawGauge);
    };

    drawGauge();
    return () => cancelAnimationFrame(animationId);
  }, []);

  const modes = ['VOICE', 'AGENT', 'FOCUS', 'STEALTH'];
  const navItems = ['HOME', 'DASHBOARD', 'COMMAND', 'MEMORY', 'NEURAL'];
  const modules = [
    { name: 'VISION', status: 'READY' },
    { name: 'VOICE', status: 'ACTIVE' },
    { name: 'WEB', status: 'LIVE' },
    { name: 'FILES', status: 'MOUNTED' },
    { name: 'CAMERA', status: 'OFFLINE' },
  ];
  const quickAccess = ['SCREEN CAPTURE', 'OPEN BROWSER', 'FILE MANAGER'];

  return (
    <div className={`jarvis-container ${isDiagnosticActive ? 'diagnostic-active' : ''} ${isSecurityAlert ? 'security-alert' : ''}`}>
      <canvas id="three-canvas" ref={threeCanvasRef}></canvas>
      <canvas id="grid-canvas" ref={gridCanvasRef}></canvas>

      <div className="grid-overlay"></div>
      <div className="vignette"></div>
      <div className="scanline"></div>
      <div className="hex-overlay"></div>

      <div className="main-grid">
        {/* ROW 1: NAVBAR */}
        <div className="grid-navbar">
          <div className="nav-logo">
            <span className="logo-text">J·A·R·V·I·S</span>
            <span className="logo-sub">PERSONAL AI · v0.1</span>
          </div>

          <div className="nav-links">
            {navItems.map(item => (
              <div
                key={item}
                className={`nav-item ${navItem === item ? 'active' : ''}`}
                onClick={() => setNavItem(item)}
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
              <div className="status-dot"></div>
              <span className="status-text">ONLINE</span>
            </div>
            <div className="clock-display">{timeStr}</div>
          </div>
        </div>

        {/* ROW 2: LEFT PANEL */}
        <div className="grid-left">
          <div className="panel-section">
            <div className="section-label">ACTIVE MODE</div>
            <div className="mode-buttons">
              {modes.map(mode => (
                <div
                  key={mode}
                  className={`mode-btn ${activeMode === mode ? 'active' : ''}`}
                  onClick={() => setActiveMode(mode)}
                >
                  <span className="mode-text">{mode}</span>
                  {activeMode === mode && <div className="mode-dot"></div>}
                </div>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <div className="section-label">SYSTEM VITALS</div>
            <div className="vitals-bars">
              <div className="vital-row">
                <span className="vital-label">CPU</span>
                <div className="vital-bar"><div className="vital-fill" style={{ width: '62%' }}></div></div>
              </div>
              <div className="vital-row">
                <span className="vital-label">MEM</span>
                <div className="vital-bar"><div className="vital-fill" style={{ width: '78%' }}></div></div>
              </div>
              <div className="vital-row">
                <span className="vital-label gpu">GPU</span>
                <div className="vital-bar gpu"><div className="vital-fill" style={{ width: '45%' }}></div></div>
              </div>
              <div className="vital-row">
                <span className="vital-label net">NET</span>
                <div className="vital-bar net"><div className="vital-fill" style={{ width: '33%' }}></div></div>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <div className="section-label">MODULE STATUS</div>
            <div className="module-list">
              {modules.map(mod => (
                <div key={mod.name} className="module-row">
                  <span className="module-name">{mod.name}</span>
                  <span className={`module-status ${mod.status === 'OFFLINE' ? 'offline' : ''}`}>{mod.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <div className="section-label">VOICE MONITOR</div>
            <canvas ref={voiceWaveformRef} className="voice-waveform"></canvas>
          </div>

          {/* ── MEMORY CORE ── */}
          <div className={`panel-section memory-panel ${memoryFlash ? 'memory-flash' : ''}`}>
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

          {/* ── PREMIUM RESPONSE TRANSCRIPT ── */}
          <div className={`jarvis-transcript-container ${showResponsePanel ? 'visible' : ''}`}>
            <div className="transcript-header">
              <span className="transcript-dot"></span>
              <span className="transcript-label">JARVIS VOCAL OUTPUT</span>
            </div>
            <div className="transcript-content">
              {jarvisResponseStream || '...'}
            </div>
            <div className="transcript-footer">
              <div className="audio-bars">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="audio-bar" style={{ height: `${2 + Math.random() * 8}px` }}></div>
                ))}
              </div>
              <span className="encoding-tag">PCM-STREAM: ACTIVE</span>
            </div>
          </div>
        </div>

        {/* ROW 2: CENTER (ORB) */}
        {/* <div className="grid-center">
          <div className="orb-container">
            <div className="target-ring ring-1"></div>
            <div className="target-ring ring-2"></div>

            <div className="hud-label top-left">
              <span className="hud-line"></span>
              <span>PLASMA DENSITY</span>
              <span className="hud-value">4.2 TW</span>
            </div>
            <div className="hud-label top-right">
              <span className="hud-line"></span>
              <span>ENERGY OUTPUT</span>
              <span className="hud-value">∞ MJ</span>
            </div>
            <div className="hud-label bottom-left">
              <span className="hud-line"></span>
              <span>CORE TEMP</span>
              <span className="hud-value">15,000 K</span>
            </div>
            <div className="hud-label bottom-right">
              <span className="hud-line"></span>
              <span>FIELD STRENGTH</span>
              <span className="hud-value">9.4 T</span>
            </div>
          </div>
        </div> */}

        {/* ROW 2: RIGHT PANEL */}
        <div className="grid-right">

          {/* ── BIOMETRIC HUD PANEL ── */}
          <div className={`panel-section biometric-panel ${biometricData.detected ? 'detected' : ''}`}>
            <div className="section-label">BIOMETRIC SCAN</div>
            <div className="biometric-hud">
              <div className="bio-status-row">
                <span className="bio-label">IDENTITY:</span>
                <span className={`bio-value ${biometricData.name === 'Master' ? 'master' : (biometricData.detected ? 'alert' : '')}`}>
                  {biometricData.detected ? biometricData.name.toUpperCase() : 'ABSENT'}
                </span>
              </div>
              <div className="bio-status-row">
                <span className="bio-label">SCAN LOCK:</span>
                <div className="bio-lock-bar">
                  <div className={`bio-lock-fill ${biometricData.detected ? 'active' : ''}`} style={{ width: biometricData.detected ? '100%' : '0%' }}></div>
                </div>
              </div>
              <div className="bio-meta">
                <span className="meta-tag">SECURE LINK</span>
                <span className="meta-tag pulse">ENCRYPTED</span>
              </div>
            </div>
          </div>

          {/* ── VISION INDICATOR ── */}
          <div className={`panel-section vision-panel ${isVisionScanning ? 'vision-active' : ''}`}>
            <div className="section-label vision-label">
              <span>SCREEN VISION</span>
              <span className={`vision-status ${isVisionScanning ? 'scanning' : 'standby'}`}>
                {isVisionScanning ? '● SCANNING' : '○ STANDBY'}
              </span>
            </div>
            <div className="vision-hint">
              Say: <em>"What's on my screen?"</em>
            </div>
          </div>

          {/* ── SYSTEM ACTIONS LOG ── */}
          {systemActionLog.length > 0 && (
            <div className="panel-section">
              <div className="section-label">SYSTEM ACTIONS</div>
              <div className="action-log">
                {systemActionLog.map((a, i) => (
                  <div key={i} className="action-log-item">
                    <span className="action-time">{a.time}</span>
                    <span className="action-label">{a.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="panel-section">
            <div className="section-label">SYSTEM METRICS</div>
            <div className="metrics-grid">
              <div className="metric-card">
                <span className="metric-value">4ms</span>
                <span className="metric-label">LATENCY</span>
              </div>
              <div className="metric-card">
                <span className="metric-value good">99%</span>
                <span className="metric-label">UPTIME</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">12</span>
                <span className="metric-label">NODES</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">8.2GB</span>
                <span className="metric-label">MEM</span>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <div className="section-label">RECENT ACTIVITY</div>
            <div className="activity-feed">
              {activityFeed.map((item, idx) => (
                <div key={idx} className="activity-item">
                  <span className="activity-time">{item.time}</span>
                  <span className="activity-message">{item.message}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <div className="section-label">QUICK ACCESS</div>
            <div className="quick-list">
              {quickAccess.map(item => (
                <div key={item} className="quick-item">
                  <span>{item}</span>
                  <span className="quick-arrow">›</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <div className="section-label">NEURAL LOAD</div>
            <div className="neural-gauge">
              <canvas ref={neuralGaugeRef} width="80" height="80"></canvas>
              <div className="neural-text">
                <span className="neural-percent">74%</span>
                <span className="neural-label">NEURAL</span>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <div className="section-label">SESSION UPTIME</div>
            <div className="uptime-display">
              <span className="uptime-value">{formatUptime(sessionUptime)}</span>
              <span className="uptime-label">ACTIVE SINCE BOOT</span>
            </div>
          </div>
        </div>

        {/* ROW 3: BOTTOM BAR */}
        <div className="grid-bottom">
          <div className="bottom-left">
            <div className="location-info">
              <span className="location-row">CITY: KARACHI</span>
              <span className="location-row">TZ: PKT +5</span>
            </div>
          </div>

          <div className="bottom-center">
            <div className="single-command-box">
              <div className="command-header">
                <span>COMMAND INTERFACE</span>
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

              <div className="command-row">
                <div className={`command-input-wrapper ${isMicrophoneActive ? 'voice-mode' : (isTyping ? 'typing-mode' : '')}`}>
                  <input
                    type="text"
                    className={`command-input ${isMicrophoneActive ? 'voice-active' : (isTyping ? 'typing-active' : '')}`}
                    placeholder={isMicrophoneActive ? 'LISTENING...' : 'TYPE OR SPEAK COMMAND...'}
                    value={isMicrophoneActive ? (recognizedText || '') : inputValue}
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
                        const now = new Date();
                        const time = [now.getHours(), now.getMinutes()].map(n => String(n).padStart(2, '0')).join(':');
                        setTerminalLog(prev => [...prev, { time, type: 'input', content: e.target.value.toUpperCase() }]);
                        setInputValue('');
                        setIsTyping(false);

                        setJarvisResponseStream('');
                        if (socketRef.current) {
                          socketRef.current.emit('user_message', e.target.value);
                        }
                      }
                    }}
                    disabled={isMicrophoneActive}
                  />
                </div>
                <button
                  className={`mic-btn ${isMicrophoneActive ? 'active' : ''}`}
                  onClick={toggleMicrophone}
                  title={isMicrophoneActive ? 'Stop Listening' : 'Start Listening'}
                >
                  <svg className="mic-icon" viewBox="0 0 24 24">
                    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="bottom-right">
            <div className="version-info">
              <span className="version-row">VERSION: 0.1.0</span>
              <span className="version-row verified">AUTH: VERIFIED</span>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}

export default App;