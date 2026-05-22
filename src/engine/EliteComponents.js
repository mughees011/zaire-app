import React, { useState, useEffect } from 'react';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import './EliteComponents.css';

const deterministicUnit = (seed) => {
  let hash = 0;
  const source = String(seed);
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000;
};

const deterministicRange = (seed, min, max) => min + deterministicUnit(seed) * (max - min);
const buildStableSequence = (prefix, length) => Array.from({ length }, (_, index) => `${prefix}-${index + 1}`);

/**
 * ZAIRE Elite Components Library
 * High-fidelity, premium interfaces for the Layout Engine.
 * Each component is wrapped by the HUD card dynamically in App.js.
 */

// ==========================================
// CORE COMPONENTS
// ==========================================

const SYSTEM_LOG_ENTRIES = [
  { id: '8F9B12', tone: '#ff3366', text: 'WARN: Memory allocation high' },
  { id: '8F9B13', tone: '#ffffff', text: 'INFO: Thread executed successfully' },
  { id: '8F9B14', tone: '#ffffff', text: 'INFO: Cache synchronization complete' },
  { id: '8F9B15', tone: '#ff3366', text: 'WARN: Queue depth nearing threshold' },
  { id: '8F9B16', tone: '#ffffff', text: 'INFO: Neural shard validated' },
  { id: '8F9B17', tone: '#ffffff', text: 'INFO: Agent heartbeat confirmed' },
  { id: '8F9B18', tone: '#ff3366', text: 'WARN: Background task retry queued' },
  { id: '8F9B19', tone: '#ffffff', text: 'INFO: Stream pipeline stable' }
];

const AGENT_STATUS_DATA = [
  { agent: 'Core Logic', ping: '18ms', cpu: '42%', ram: '312MB' },
  { agent: 'Vision Parser', ping: '27ms', cpu: '36%', ram: '284MB' },
  { agent: 'Network Fetch', ping: '31ms', cpu: '48%', ram: '337MB' }
];

const CITATION_REFERENCES = [
  { id: 'REF_1', label: '[REF_1] ACADEMIC_SOURCE' },
  { id: 'REF_2', label: '[REF_2] ACADEMIC_SOURCE' },
  { id: 'REF_3', label: '[REF_3] ACADEMIC_SOURCE' }
];

const MACRO_HEATMAP_DATA = [
  { sector: 'TECH', val: '1.8' },
  { sector: 'FINANCE', val: '-0.7' },
  { sector: 'HEALTH', val: '0.9' },
  { sector: 'ENERGY', val: '-1.4' },
  { sector: 'CONSUMER', val: '0.6' },
  { sector: 'INDUST', val: '1.1' }
];

const CANDLESTICK_DATA = [
  { id: 'candle-01', isUp: true, height: 54, wickHeight: 68 },
  { id: 'candle-02', isUp: false, height: 33, wickHeight: 48 },
  { id: 'candle-03', isUp: true, height: 47, wickHeight: 62 },
  { id: 'candle-04', isUp: true, height: 39, wickHeight: 51 },
  { id: 'candle-05', isUp: false, height: 28, wickHeight: 43 },
  { id: 'candle-06', isUp: true, height: 58, wickHeight: 74 },
  { id: 'candle-07', isUp: false, height: 31, wickHeight: 46 },
  { id: 'candle-08', isUp: true, height: 42, wickHeight: 59 },
  { id: 'candle-09', isUp: true, height: 49, wickHeight: 67 },
  { id: 'candle-10', isUp: false, height: 26, wickHeight: 40 },
  { id: 'candle-11', isUp: true, height: 61, wickHeight: 79 },
  { id: 'candle-12', isUp: false, height: 34, wickHeight: 49 },
  { id: 'candle-13', isUp: true, height: 44, wickHeight: 58 },
  { id: 'candle-14', isUp: true, height: 37, wickHeight: 52 },
  { id: 'candle-15', isUp: false, height: 29, wickHeight: 44 },
  { id: 'candle-16', isUp: true, height: 53, wickHeight: 70 },
  { id: 'candle-17', isUp: false, height: 32, wickHeight: 47 },
  { id: 'candle-18', isUp: true, height: 46, wickHeight: 63 },
  { id: 'candle-19', isUp: true, height: 57, wickHeight: 73 },
  { id: 'candle-20', isUp: false, height: 30, wickHeight: 45 }
];

const DIFF_VIEWER_SHELL_STYLE = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'monospace',
  fontSize: '12px',
  background: '#0d0d0d',
  borderRadius: '4px',
  overflow: 'hidden'
};

const getRiskMeterGaugeStyle = (color) => ({
  width: '80px',
  height: '40px',
  borderTopLeftRadius: '40px',
  borderTopRightRadius: '40px',
  border: `4px solid ${color}44`,
  borderBottom: 'none',
  position: 'relative',
  overflow: 'hidden'
});

const RISK_METER_NEEDLE_STYLE = {
  width: '4px',
  height: '35px',
  background: '#fff',
  position: 'absolute',
  bottom: 0,
  left: '50%',
  transformOrigin: 'bottom center',
  transform: 'translateX(-50%) rotate(30deg)',
  borderRadius: '2px'
};

const getFlashcardCardStyle = (color) => ({
  width: '80%',
  height: '80%',
  background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(0,0,0,0.5))',
  border: `1px solid ${color}55`,
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  textAlign: 'center',
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
});

const getMedicationStatusDotStyle = (color, status) => ({
  position: 'absolute',
  left: '-15px',
  top: '4px',
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: status === 'TAKEN' ? color : 'transparent',
  border: `2px solid ${color}`
});

const getSecurityStatusCardStyle = (accentColor) => ({
  background: 'rgba(255,255,255,0.02)',
  border: `1px solid ${accentColor}33`,
  padding: '8px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '4px'
});

const getVaultOuterRingStyle = (color) => ({
  width: '45px',
  height: '45px',
  borderRadius: '50%',
  border: `1px dashed ${color}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

const getVaultInnerRingStyle = (color) => ({
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  border: `2px dotted ${color}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

const getCalendarDayStyle = (isActive, color) => ({
  background: isActive ? color : 'rgba(255,255,255,0.05)',
  borderRadius: '2px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: isActive ? '#000' : '#fff',
  fontSize: '12px',
  fontWeight: 'bold'
});

const getCameraFeedShellStyle = (color) => ({
  position: 'relative',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: `1px solid ${color}44`,
  background: 'rgba(0,0,0,0.5)',
  overflow: 'hidden'
});

const getBrandScannerBadgeStyle = (color) => ({
  width: '40px',
  height: '40px',
  background: 'rgba(255,255,255,0.1)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: `1px solid ${color}`
});

const getRoadmapTrackStyle = (color) => ({
  flex: 1,
  position: 'relative',
  borderLeft: `2px solid ${color}44`,
  marginLeft: '8px',
  paddingLeft: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  overflowY: 'auto'
});

const getRoadmapNodeDotStyle = (status, color) => ({
  position: 'absolute',
  left: '-17px',
  top: '2px',
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: status === 'done' ? color : status === 'active' ? '#fff' : '#222',
  border: `2px solid ${status === 'pending' ? '#444' : color}`
});

export const NeuralConsole = ({ color }) => (
  <div style={{ padding: '10px', height: '100%', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'hidden' }}>
    <div style={{ color, fontSize: '12px', fontFamily: 'monospace', opacity: 0.8 }}>NEURAL_MATRIX_SYNC :: 100%</div>
    <div style={{ flex: 1, border: `1px solid ${color}33`, background: 'rgba(0,0,0,0.4)', borderRadius: '2px', padding: '8px' }}>
      <div style={{ color: '#fff', fontSize: '12px', opacity: 0.6 }}>[0x8F9B] Initializing latent space topology…</div>
      <div style={{ color: '#fff', fontSize: '12px', opacity: 0.6 }}>[0x8F9C] Aligning parameter weights…</div>
      <div style={{ color: color, fontSize: '12px', marginTop: '4px' }}>[0x8F9D] NEURAL CONVERGENCE ACHIEVED.</div>
    </div>
  </div>
);

export const Terminal = ({ color }) => (
  <div className="elite-terminal-shell" style={{ '--elite-accent': color, '--elite-accent-soft': `${color}44` }}>
    <div className="elite-terminal-scanline"></div>
    <div className="elite-terminal-output">
      <div style={{ color: '#aaa' }}>Welcome to ZAIRE Sovereign Interface</div>
      <div style={{ color: '#aaa' }}>Establishing secure connection… <span style={{ color: '#0f0' }}>OK</span></div>
      <div style={{ color: '#aaa' }}>Loading neural weights… <span style={{ color: '#0f0' }}>OK</span></div>
      <div style={{ color: color, marginTop: '4px' }}>root@zaire-os:~# <span style={{ color: '#fff' }}>tail -f /var/log/syslog</span></div>
      <div style={{ color: '#ccc', opacity: 0.8 }}>[SYS] Daemon running on port 8080</div>
      <div style={{ color: '#ccc', opacity: 0.8 }}>[SYS] Received heartbeat from swarm</div>
    </div>
    <div className="elite-terminal-footer" style={{ '--elite-accent-border': `${color}33` }}>
      <span className="elite-terminal-prompt" style={{ color }}>&gt;</span>
      <div style={{ width: '8px', height: '12px', background: color, animation: 'blink 1s step-end infinite' }}></div>
    </div>
  </div>
);

export const LivePreview = ({ color }) => (
  <div className="elite-live-preview-shell" style={{ '--elite-accent': color, '--elite-accent-dashed': `${color}66` }}>
    <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }}></div>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }}></div>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }}></div>
    </div>
    <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '12px', color: color, letterSpacing: '0.03em' }}>RENDER_ENGINE_ACTIVE</div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '40px', height: '40px', border: `2px solid ${color}`, borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
      <span style={{ color: '#fff', fontSize: '12px', letterSpacing: '0.04em', opacity: 0.7 }}>COMPILING UI…</span>
    </div>
  </div>
);

export const SystemLogs = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '4px', overflowY: 'hidden', fontFamily: 'monospace', fontSize: '12px' }}>
    {SYSTEM_LOG_ENTRIES.map((entry, i) => (
      <div key={entry.id} style={{ display: 'flex', gap: '8px', opacity: 1 - (i * 0.1) }}>
        <span style={{ color: color }}>[{entry.id}]</span>
        <span style={{ color: entry.tone }}>{entry.text}</span>
      </div>
    ))}
  </div>
);

export const AgentStatus = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
    {AGENT_STATUS_DATA.map((agent) => (
      <div key={agent.agent} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', borderLeft: `2px solid ${color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#fff' }}>
          <span>{agent.agent}</span>
          <span style={{ color }}>{agent.ping}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#aaa' }}>
          <span>CPU: {agent.cpu}</span>
          <span>RAM: {agent.ram}</span>
        </div>
      </div>
    ))}
  </div>
);

export const DiffViewer = ({ color }) => (
  <div style={DIFF_VIEWER_SHELL_STYLE}>
    <div style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', borderBottom: `1px solid ${color}33` }}>index.js (Working Tree)</div>
    <div style={{ flex: 1, padding: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <div style={{ color: '#888' }}>  function init() {'{'}</div>
      <div style={{ background: 'rgba(255, 51, 51, 0.15)', color: '#ff3333', paddingLeft: '4px' }}>-   console.log("Starting…");</div>
      <div style={{ background: 'rgba(0, 255, 102, 0.15)', color: '#00ff66', paddingLeft: '4px' }}>+   Logger.info("Boot sequence initiated");</div>
      <div style={{ color: '#888' }}>  {'}'}</div>
    </div>
  </div>
);

// ==========================================
// INTELLIGENCE COMPONENTS
// ==========================================

export const ReasoningMap = ({ color }) => (
  <div className="elite-reasoning-map" style={{ '--elite-accent': color, '--elite-accent-soft': `${color}44`, '--elite-accent-faint': `${color}11`, '--elite-accent-muted': `${color}66` }}>
    <div className="elite-reasoning-backdrop" />
    <div className="elite-reasoning-tree">
      <div className="elite-reasoning-root">ROOT: USER INTENT</div>
      <div style={{ width: '1px', height: '20px', background: color, opacity: 0.5 }}></div>
      <div className="elite-reasoning-branches">
        <div className="elite-reasoning-branch">BRANCH: SEMANTIC</div>
        <div className="elite-reasoning-branch">BRANCH: LOGICAL</div>
      </div>
    </div>
  </div>
);

export const KnowledgeGraph = ({ color }) => (
  <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
    <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
      <line x1="20%" y1="30%" x2="50%" y2="50%" stroke={color} strokeWidth="1" opacity="0.3" />
      <line x1="80%" y1="20%" x2="50%" y2="50%" stroke={color} strokeWidth="1" opacity="0.3" />
      <line x1="50%" y1="50%" x2="70%" y2="80%" stroke={color} strokeWidth="1" opacity="0.3" />
      <line x1="50%" y1="50%" x2="30%" y2="70%" stroke={color} strokeWidth="1" opacity="0.3" />
      
      <circle cx="20%" cy="30%" r="4" fill={color} />
      <circle cx="80%" cy="20%" r="6" fill={color} opacity="0.6"/>
      <circle cx="50%" cy="50%" r="8" fill={color} filter={`drop-shadow(0 0 4px ${color})`} />
      <circle cx="70%" cy="80%" r="5" fill={color} opacity="0.8"/>
      <circle cx="30%" cy="70%" r="4" fill={color} />
    </svg>
    <div style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '12px', color: color, letterSpacing: '0.03em' }}>ENTITIES: 14,029</div>
  </div>
);

export const CitationViewer = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', overflowY: 'auto' }}>
    {CITATION_REFERENCES.map((reference) => (
      <div key={reference.id} style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', borderLeft: `2px solid ${color}` }}>
        <div style={{ fontSize: '12px', color: color, marginBottom: '4px' }}>{reference.label}</div>
        <div style={{ fontSize: '12px', color: '#ccc', lineHeight: '1.4' }}>"The latent space representation inherently captures semantic topology…"</div>
      </div>
    ))}
  </div>
);

// ==========================================
// FINANCIAL COMPONENTS
// ==========================================

export const WhaleScanner = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: '100%', overflowY: 'auto' }}>
    {[
      { pair: 'BTC/USDT', type: 'BUY', amt: '450.5 BTC', time: 'Just now' },
      { pair: 'ETH/USDT', type: 'SELL', amt: '2,400 ETH', time: '2m ago' },
      { pair: 'SOL/USDT', type: 'BUY', amt: '15,000 SOL', time: '5m ago' },
      { pair: 'BTC/USDT', type: 'BUY', amt: '120.0 BTC', time: '12m ago' }
    ].map((tx) => (
      <div key={`${tx.pair}-${tx.time}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderLeft: `2px solid ${tx.type === 'BUY' ? '#00ff66' : '#ff3333'}` }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>{tx.pair}</span>
          <span style={{ fontSize: '12px', opacity: 0.5 }}>{tx.time}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '12px', color: tx.type === 'BUY' ? '#00ff66' : '#ff3333' }}>{tx.amt}</span>
          <span style={{ fontSize: '12px', color: tx.type === 'BUY' ? '#00ff66' : '#ff3333' }}>{tx.type}</span>
        </div>
      </div>
    ))}
  </div>
);

export const MacroHeatmap = ({ color }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', height: '100%' }}>
    {MACRO_HEATMAP_DATA.map(({ sector, val }) => {
      const isPos = val > 0;
      const bg = isPos ? 'rgba(0, 255, 102, 0.15)' : 'rgba(255, 51, 51, 0.15)';
      const fg = isPos ? '#00ff66' : '#ff3333';
      return (
        <div key={sector} style={{ background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '2px', border: `1px solid ${fg}33` }}>
          <span style={{ fontSize: '12px', color: '#fff', letterSpacing: '0.02em' }}>{sector}</span>
          <span style={{ fontSize: '12px', color: fg, fontWeight: 'bold', marginTop: '2px' }}>{isPos ? '+' : ''}{val}%</span>
        </div>
      )
    })}
  </div>
);

export const CandlestickChart = ({ color }) => (
  <div className="elite-candlestick-chart">
    <div className="elite-candlestick-header">BTC/USDT <span style={{ color: '#00ff66' }}>+2.45%</span></div>
    {CANDLESTICK_DATA.map(({ id, isUp, height, wickHeight }) => {
      const candleColor = isUp ? '#00ff66' : '#ff3333';
      return (
        <div key={id} className="elite-candlestick-column" style={{ '--elite-wick-height': `${wickHeight}%` }}>
          <div style={{ width: '1px', height: '100%', background: candleColor, opacity: 0.5, position: 'absolute' }}></div>
          <div style={{ width: '80%', height: `${(height/wickHeight)*100}%`, background: candleColor, zIndex: 1, borderRadius: '1px' }}></div>
        </div>
      );
    })}
  </div>
);

export const RiskMeter = ({ color }) => (
  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
    <div style={getRiskMeterGaugeStyle(color)}>
      <div style={{ width: '100%', height: '100%', background: `linear-gradient(90deg, #00ff66, #ffaa00, #ff3333)`, opacity: 0.3 }}></div>
      <div style={RISK_METER_NEEDLE_STYLE}></div>
    </div>
    <div style={{ position: 'absolute', bottom: 5, fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>RISK: HIGH</div>
  </div>
);

export const SignalFeed = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: '100%', overflowY: 'auto' }}>
    {[
      { asset: 'ETH', signal: 'STRONG BUY', confidence: '94%' },
      { asset: 'SOL', signal: 'HOLD', confidence: '72%' },
      { asset: 'DOGE', signal: 'SELL', confidence: '88%' },
    ].map((s) => (
      <div key={s.asset} style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: `1px solid ${color}33`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>{s.asset}</span>
          <span style={{ fontSize: '12px', color: color }}>CONF: {s.confidence}</span>
        </div>
        <div style={{ fontSize: '12px', fontWeight: 'bold', padding: '2px 6px', background: s.signal.includes('BUY') ? 'rgba(0,255,102,0.2)' : s.signal.includes('SELL') ? 'rgba(255,51,51,0.2)' : 'rgba(255,255,255,0.1)', color: s.signal.includes('BUY') ? '#00ff66' : s.signal.includes('SELL') ? '#ff3333' : '#fff', borderRadius: '2px' }}>
          {s.signal}
        </div>
      </div>
    ))}
  </div>
);

export const PortfolioGrid = ({ color }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', height: '100%', overflowY: 'auto' }}>
    {[
      { token: 'USDT', balance: '$14,200.00', pct: '45%' },
      { token: 'BTC', balance: '$8,540.21', pct: '27%' },
      { token: 'ETH', balance: '$5,120.00', pct: '16%' },
      { token: 'SOL', balance: '$3,890.11', pct: '12%' }
    ].map((t) => (
      <div key={t.token} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}33`, padding: '8px', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '12px', color: '#aaa' }}>{t.token}</span>
        <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold', margin: '4px 0' }}>{t.balance}</span>
        <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.1)', marginTop: 'auto' }}>
          <div style={{ width: t.pct, height: '100%', background: color }}></div>
        </div>
      </div>
    ))}
  </div>
);

// ==========================================
// EDUCATION COMPONENTS
// ==========================================

export const CurriculumGraph = ({ color }) => (
  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
    <svg width="100%" height="100%" style={{ position: 'absolute' }}>
      <path d="M 20% 50% Q 50% 20% 80% 50%" fill="none" stroke={color} strokeWidth="2" strokeDasharray="4,4" opacity="0.5" />
      <path d="M 20% 50% Q 50% 80% 80% 50%" fill="none" stroke={color} strokeWidth="2" strokeDasharray="4,4" opacity="0.5" />
      <circle cx="20%" cy="50%" r="8" fill="#fff" />
      <circle cx="50%" cy="20%" r="6" fill={color} />
      <circle cx="50%" cy="80%" r="6" fill={color} />
      <circle cx="80%" cy="50%" r="8" fill="#fff" />
    </svg>
    <div style={{ position: 'absolute', bottom: '10px', fontSize: '12px', color: '#fff' }}>LEARNING PATH <span style={{ color }}>40%</span></div>
  </div>
);

export const LectureView = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' }}>
    <div className="elite-lecture-viewport" style={{ '--elite-accent-border': `${color}55` }}>
      <div className="elite-lecture-play" style={{ '--elite-accent-bg': `${color}33` }}>▶</div>
      <div style={{ position: 'absolute', bottom: 5, right: 10, fontSize: '12px', color: '#aaa' }}>12:45 / 45:00</div>
    </div>
    <div style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
      <div style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>Advanced Neural Architectures</div>
      <div style={{ fontSize: '12px', color: '#ccc', marginTop: '4px' }}>Professor AI is explaining backpropagation through time…</div>
    </div>
  </div>
);

export const AtomicNotes = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', overflowY: 'auto' }}>
    {[
      { title: 'Zettel 104', excerpt: 'Transformers use self-attention.' },
      { title: 'Zettel 105', excerpt: 'Embeddings map meaning to vector space.' },
      { title: 'Zettel 106', excerpt: 'Loss functions guide gradient descent.' }
    ].map((n) => (
      <div key={n.title} style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${color}`, borderRadius: '2px' }}>
        <div style={{ fontSize: '12px', color: color, fontWeight: 'bold', marginBottom: '4px' }}>{n.title}</div>
        <div style={{ fontSize: '12px', color: '#ccc' }}>{n.excerpt}</div>
      </div>
    ))}
  </div>
);

export const FlashcardGrid = ({ color }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
    <div style={getFlashcardCardStyle(color)}>
      <div style={{ fontSize: '14px', color: '#fff', fontWeight: 'bold', marginBottom: '15px' }}>What is Backpropagation?</div>
      <div style={{ padding: '6px 12px', background: color, color: '#000', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>REVEAL ANSWER</div>
    </div>
  </div>
);

export const QuizGenerator = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
    <div style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>Q: Which activation function outputs values between 0 and 1?</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {['ReLU', 'Sigmoid', 'Tanh', 'Softmax'].map((opt, i) => (
        <div key={opt} style={{ padding: '8px', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '4px', fontSize: '12px', color: '#ccc', cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s, background-color 0.2s' }}>
          <span style={{ color: color, marginRight: '8px', fontWeight: 'bold' }}>{String.fromCharCode(65 + i)}</span> {opt}
        </div>
      ))}
    </div>
  </div>
);

// ==========================================
// MEDICAL COMPONENTS
// ==========================================

export const HealthTracker = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px', border: `1px solid ${color}33` }}>
      <div>
        <div style={{ fontSize: '12px', color: '#aaa' }}>HEART RATE</div>
        <div style={{ fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>72 <span style={{ fontSize: '12px', color: '#aaa', fontWeight: 'normal' }}>BPM</span></div>
      </div>
      <div style={{ width: '60px', height: '30px', position: 'relative' }}>
        <svg viewBox="0 0 100 40" style={{ width: '100%', height: '100%' }}>
          <polyline points="0,20 20,20 30,5 40,35 50,20 100,20" fill="none" stroke={color} strokeWidth="2" />
        </svg>
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', flex: 1 }}>
      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px' }}>
        <div style={{ fontSize: '12px', color: '#aaa' }}>SPO2</div>
        <div style={{ fontSize: '14px', color: color, fontWeight: 'bold' }}>98%</div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px' }}>
        <div style={{ fontSize: '12px', color: '#aaa' }}>TEMP</div>
        <div style={{ fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>98.6°</div>
      </div>
    </div>
  </div>
);

export const MedicationTimeline = ({ color }) => (
  <div className="elite-medication-timeline" style={{ '--elite-accent-border': `${color}55` }}>
    {[
      { time: '08:00', med: 'Vitamin D3', status: 'TAKEN' },
      { time: '13:00', med: 'Omega 3', status: 'PENDING' },
      { time: '20:00', med: 'Magnesium', status: 'PENDING' }
    ].map((m) => (
      <div key={`${m.time}-${m.med}`} style={{ position: 'relative' }}>
        <div style={getMedicationStatusDotStyle(color, m.status)}></div>
        <div style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>{m.time} - {m.med}</div>
        <div style={{ fontSize: '12px', color: m.status === 'TAKEN' ? color : '#aaa', marginTop: '2px' }}>{m.status}</div>
      </div>
    ))}
  </div>
);

export const PatientNotes = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ padding: '8px', borderBottom: `1px solid ${color}33`, fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>Patient ID: #88392-A</div>
    <div style={{ flex: 1, padding: '8px', fontSize: '12px', color: '#ccc', lineHeight: '1.5', overflowY: 'auto' }}>
      Patient presents with standard baseline metrics. No anomalies detected in recent scans. 
      <br/><br/>
      <span style={{ color: color }}>Recommendation:</span> Continue current protocol. Re-evaluate in 30 cycles.
    </div>
  </div>
);

export const SymptomMatrix = ({ color }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', height: '100%' }}>
    {buildStableSequence('symptom', 16).map((cellId, i) => {
      const active = deterministicUnit(cellId) > 0.8;
      return (
        <div key={cellId} style={{ background: active ? `${color}44` : 'rgba(255,255,255,0.02)', border: `1px solid ${active ? color : 'transparent'}`, borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {active && <span style={{ color: '#fff', fontSize: '12px' }}>!</span>}
        </div>
      );
    })}
  </div>
);

export const RecoveryTracker = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '0 10px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#fff', marginBottom: '8px' }}>
      <span>RECOVERY PROTOCOL</span>
      <span style={{ color }}>65%</span>
    </div>
    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ width: '65%', height: '100%', background: `linear-gradient(90deg, ${color}55, ${color})`, borderRadius: '4px' }}></div>
    </div>
  </div>
);

// ==========================================
// DESIGN COMPONENTS
// ==========================================

export const PaletteStudio = ({ color }) => (
  <div className="elite-palette-studio">
    <div style={{ fontSize: '12px', letterSpacing: '0.04em', opacity: 0.7 }}>CHROMA HARMONY EXTRACTOR</div>
    <div style={{ display: 'flex', height: '40px', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ flex: 2, background: color }}></div>
      <div style={{ flex: 1, background: `${color}cc` }}></div>
      <div style={{ flex: 1, background: `${color}99` }}></div>
      <div style={{ flex: 1, background: `${color}66` }}></div>
      <div style={{ flex: 1, background: `${color}33` }}></div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: 'monospace', color: color }}>
      <span>PRIMARY</span>
      <span>ACCENT 1</span>
      <span>MUTED</span>
    </div>
  </div>
);

export const TypographyAnalyzer = ({ color }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <div style={{ fontSize: '18px', fontFamily: 'var(--font-orbitron)', color: '#fff' }}>Aa Bb Cc Dd</div>
    <div style={{ borderBottom: `1px solid ${color}33`, paddingBottom: '4px' }}>
      <span style={{ fontSize: '12px', color: color }}>FONT FAMILY: </span>
      <span style={{ fontSize: '12px', color: '#ccc' }}>ORBITRON (SANS-SERIF)</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div style={{ fontSize: '12px' }}><span style={{ color: color }}>WEIGHT:</span> 900</div>
      <div style={{ fontSize: '12px' }}><span style={{ color: color }}>KERNING:</span> 1.5px</div>
      <div style={{ fontSize: '12px' }}><span style={{ color: color }}>LEGIBILITY:</span> 98%</div>
    </div>
  </div>
);

// ==========================================
// SECURITY COMPONENTS
// ==========================================

export const ThreatFeed = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', height: '100%', overflowY: 'auto' }}>
    {[
      { ip: '192.168.1.105', threat: 'Port Scan', status: 'BLOCKED' },
      { ip: '45.33.21.90', threat: 'Brute Force', status: 'BLOCKED' },
      { ip: '10.0.0.4', threat: 'DDoS Ping', status: 'MITIGATED' }
    ].map((t) => (
      <div key={`${t.ip}-${t.threat}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px', background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.2)' }}>
        <span style={{ fontSize: '12px', color: '#ff4d4d', fontFamily: 'monospace' }}>[{t.ip}] {t.threat}</span>
        <span style={{ fontSize: '12px', background: '#ff4d4d', color: '#000', padding: '1px 4px', borderRadius: '2px', fontWeight: 'bold' }}>{t.status}</span>
      </div>
    ))}
  </div>
);

export const PermissionMatrix = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div className="elite-permission-matrix-header" style={{ '--elite-accent': color, '--elite-accent-border': `${color}33` }}>
      <span>ROLE</span>
      <span>READ</span>
      <span>WRITE</span>
      <span>EXEC</span>
    </div>
    {[
      { role: 'SYSTEM_ADMIN', r: true, w: true, e: true },
      { role: 'NEURAL_DAEMON', r: true, w: true, e: false },
      { role: 'GUEST_AGENT', r: true, w: false, e: false }
    ].map((r) => (
      <div key={r.role} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', fontSize: '12px', color: '#ccc', padding: '4px 0' }}>
        <span>{r.role}</span>
        <span style={{ color: r.r ? '#00ff66' : '#ff3333' }}>{r.r ? '●' : '○'}</span>
        <span style={{ color: r.w ? '#00ff66' : '#ff3333' }}>{r.w ? '●' : '○'}</span>
        <span style={{ color: r.e ? '#00ff66' : '#ff3333' }}>{r.e ? '●' : '○'}</span>
      </div>
    ))}
  </div>
);

// ==========================================
// ADDITIONAL ELITE COMPONENTS
// ==========================================

export const ExecutionTimeline = ({ color }) => (
  <LazyMotion features={domAnimation}>
    <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '0 10px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '50%', left: '10px', right: '10px', height: '2px', background: 'rgba(255,255,255,0.1)', transform: 'translateY(-50%)' }}></div>
      {['INIT', 'FETCH', 'PARSE', 'RENDER'].map((step, i) => (
        <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, position: 'relative' }}>
          <m.div
            animate={i === 1 ? { boxShadow: [`0 0 0px ${color}`, `0 0 20px ${color}`, `0 0 0px ${color}`] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{ width: '12px', height: '12px', borderRadius: '50%', background: i < 2 ? color : '#333', border: `2px solid ${i < 2 ? color : '#555'}`, position: 'relative' }}
          >
            {i === 1 && (
              <m.div
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                style={{ position: 'absolute', top: '-2px', left: '-2px', right: '-2px', bottom: '-2px', borderRadius: '50%', border: `2px solid ${color}` }}
              />
            )}
          </m.div>
          <m.div
            animate={i === 1 ? { opacity: [0.5, 1, 0.5] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{ position: 'absolute', top: '20px', fontSize: '12px', color: i < 2 ? '#fff' : '#888', fontWeight: 'bold' }}
          >
            {step}
          </m.div>
        </div>
      ))}
    </div>
  </LazyMotion>
);

export const StatusGrid = ({ color }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', height: '100%' }}>
    {[
      { label: 'DB CONNECTION', status: 'ONLINE', color: '#00ff66' },
      { label: 'NEURAL SYNC', status: 'SYNCED', color: '#00d4ff' },
      { label: 'SWARM AGENTS', status: 'IDLE', color: '#ffaa00' },
      { label: 'VAULT LOCK', status: 'SECURE', color: '#b200ff' }
    ].map((s) => (
      <div key={s.label} style={getSecurityStatusCardStyle(s.color)}>
        <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>{s.label}</div>
        <div style={{ fontSize: '12px', color: s.color, fontWeight: 'bold' }}>{s.status}</div>
      </div>
    ))}
  </div>
);

export const ContextWindow = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '6px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#aaa' }}>
      <span>TOKEN BUFFER</span>
      <span style={{ color }}>84.2%</span>
    </div>
    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ width: '84.2%', height: '100%', background: `linear-gradient(90deg, ${color}55, ${color})` }}></div>
    </div>
    <div style={{ fontSize: '12px', color: '#888', marginTop: 'auto' }}>
      LIMIT: 128,000 TOKENS <br />
      ACTIVE: 107,824 TOKENS
    </div>
  </div>
);

export const SemanticMemory = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '4px', overflowY: 'auto' }}>
    {[
      { dim: 'v_user_prefs', val: 0.94 },
      { dim: 'v_project_scope', val: 0.81 },
      { dim: 'v_coding_style', val: 0.99 },
      { dim: 'v_market_bias', val: 0.42 }
    ].map((v) => (
      <div key={v.dim} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
        <div style={{ width: '80px', fontSize: '12px', color: '#aaa' }}>{v.dim}</div>
        <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
          <div style={{ width: `${v.val * 100}%`, height: '100%', background: color, borderRadius: '2px', opacity: 0.5 + (v.val * 0.5) }}></div>
        </div>
      </div>
    ))}
  </div>
);

export const ModelRouter = ({ color }) => (
  <LazyMotion features={domAnimation}>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-around', position: 'relative' }}>
      {/* Animated Data Packets Flowing in the background */}
      <div style={{ position: 'absolute', left: '10px', top: '0', bottom: '0', width: '2px', background: 'rgba(255,255,255,0.05)', zIndex: 0 }}>
        <m.div
          animate={{ top: ['0%', '100%'] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          style={{ position: 'absolute', left: '-1px', width: '4px', height: '15px', background: color, borderRadius: '2px', boxShadow: `0 0 10px ${color}` }}
        />
      </div>
      {['FAST_CLAUDE', 'DEEP_THINK', 'VISION_PARSER'].map((modelName, i) => (
        <div
          key={modelName}
          className={`elite-model-switch-row ${i === 1 ? 'active' : ''}`}
          style={{ '--elite-accent': color, '--elite-accent-bg': `${color}22` }}
        >
          <div style={{ fontSize: '12px', color: i === 1 ? '#fff' : '#888', fontWeight: i === 1 ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {i === 1 && <m.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}` }} />}
            {modelName}
          </div>
          <div style={{ fontSize: '12px', color: i === 1 ? color : '#555', fontFamily: 'monospace' }}>
            {i === 1 ? 'ACTIVE (14ms)' : 'STANDBY'}
          </div>
        </div>
      ))}
    </div>
  </LazyMotion>
);

export const HabitTracker = ({ color }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', height: '100%' }}>
    {buildStableSequence('habit', 28).map((cellId) => {
      const active = deterministicUnit(cellId) > 0.3;
      return (
        <div key={cellId} style={{ background: active ? color : 'rgba(255,255,255,0.05)', borderRadius: '2px', opacity: active ? 0.8 : 0.5 }}></div>
      );
    })}
  </div>
);

export const VideoTimeline = ({ color }) => (
  <div className="elite-video-timeline">
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#fff', padding: '0 10px' }}>
      <span>00:00:00:00</span>
      <span style={{ color }}>00:14:23:12</span>
    </div>
    <div className="elite-video-track">
      {/* Frames */}
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        {buildStableSequence('frame', 10).map((frameId, i) => (
          <div key={frameId} style={{ flex: 1, borderRight: '1px solid rgba(255,255,255,0.1)', background: `rgba(0,0,0,${0.2 + (i%2)*0.1})` }}></div>
        ))}
      </div>
      {/* Playhead */}
      <div className="elite-video-playhead" style={{ '--elite-accent': color }}>
        <div className="elite-video-playhead-cap" style={{ background: color }}></div>
      </div>
    </div>
  </div>
);

export const VaultAccess = ({ color }) => {
  const [hex, setHex] = useState("0x000000");
  useEffect(() => {
    const int = setInterval(() => {
      setHex("0x" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase());
    }, 100);
    return () => clearInterval(int);
  }, []);
  return (
    <LazyMotion features={domAnimation}>
      <div className="elite-vault-core-shell">
        <m.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          style={getVaultOuterRingStyle(color)}
        >
          <m.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            style={getVaultInnerRingStyle(color)}
          >
            <m.div
              animate={{ scale: [0.8, 1.2, 0.8] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ width: '10px', height: '10px', background: color, borderRadius: '50%', boxShadow: `0 0 15px ${color}` }}
            />
          </m.div>
        </m.div>
        <div style={{ fontSize: '12px', color: '#fff', letterSpacing: '0.04em', fontWeight: 'bold' }}>VAULT SECURE</div>
        <div style={{ fontSize: '12px', color: color, fontFamily: 'monospace' }}>DECRYPTING: {hex}</div>
      </div>
    </LazyMotion>
  );
};

export const LayoutForge = ({ color }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gridTemplateRows: '1fr 1fr', gap: '4px', height: '100%' }}>
    <div style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}44`, gridRow: '1 / 3' }}></div>
    <div style={{ background: `${color}22`, border: `1px solid ${color}` }}></div>
    <div style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}44` }}></div>
    <div style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}44`, gridColumn: '2 / 4' }}></div>
  </div>
);

// ==========================================
// MEDIA & SECURITY COMPONENTS
// ==========================================

export const AudioAnalyzer = ({ color }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%', gap: '2px', padding: '10px 0' }}>
    {buildStableSequence('audio-band', 24).map((bandId) => {
      const height = deterministicRange(`${bandId}-height`, 10, 90);
      const duration = deterministicRange(`${bandId}-duration`, 0.5, 1.5);
      return (
        <div key={bandId} style={{
          width: '100%',
          height: `${height}%`,
          background: `linear-gradient(to top, ${color}33, ${color})`,
          borderRadius: '2px',
          animation: `pulse ${duration}s infinite alternate`
        }}></div>
      );
    })}
    <div style={{ position: 'absolute', top: 10, left: 10, fontSize: '12px', color: '#fff' }}>FREQ_BAND :: 44.1kHz</div>
  </div>
);

export const FaceVerification = ({ color }) => (
  <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}44`, background: 'rgba(0,0,0,0.5)' }}>
    <div style={{ width: '80%', height: '80%', border: `1px dashed ${color}88`, position: 'relative' }}>
      <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '10px', height: '10px', borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }}></div>
      <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` }}></div>
      <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '10px', height: '10px', borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` }}></div>
      <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }}></div>
      <div style={{ width: '100%', height: '2px', background: `${color}88`, position: 'absolute', animation: 'scan 0.9s infinite linear' }}></div>
    </div>
    <div style={{ position: 'absolute', bottom: 10, fontSize: '12px', color: color, letterSpacing: '0.04em', fontWeight: 'bold' }}>BIOMETRIC_LOCK: ACTIVE</div>
  </div>
);

// ==========================================
// CORE DATA COMPONENTS
// ==========================================

export const TaskQueue = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', overflowY: 'auto' }}>
    {[
      { task: 'Compile ZAIRE OS Kernel', prog: 100, stat: 'DONE' },
      { task: 'Train LLM Local Weights', prog: 64, stat: 'RUNNING' },
      { task: 'Scrape Competitor Pricing', prog: 22, stat: 'RUNNING' },
      { task: 'Defrag Semantic Memory', prog: 0, stat: 'QUEUED' }
    ].map((t) => (
      <div key={t.task} className="elite-task-queue-item">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#fff' }}>
          <span>{t.task}</span>
          <span style={{ color: t.prog === 100 ? '#00ff66' : t.prog === 0 ? '#888' : color }}>{t.stat}</span>
        </div>
        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${t.prog}%`, height: '100%', background: t.prog === 100 ? '#00ff66' : color }}></div>
        </div>
      </div>
    ))}
  </div>
);

export const CodeEditor = ({ color }) => (
  <div style={{ fontFamily: 'monospace', fontSize: '12px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
    <div style={{ color: '#888', marginBottom: '6px' }}>// Initialize Neural Sequence</div>
    <div style={{ color: '#fff' }}><span style={{ color: '#ff3366' }}>const</span> igniteEngine = <span style={{ color: '#00d4ff' }}>async</span> () <span style={{ color: '#ff3366' }}>=&gt;</span> {'{'}</div>
    <div style={{ color: '#fff', marginLeft: '12px' }}>
      <span style={{ color: '#ff3366' }}>await</span> System.<span style={{ color: '#00ff66' }}>boot</span>();<br/>
      <span style={{ color: '#ff3366' }}>const</span> power = System.getVoltage();<br/>
      <span style={{ color: '#00d4ff' }}>if</span> (power &gt; <span style={{ color: '#ff9900' }}>9000</span>) {'{'}
    </div>
    <div style={{ color: '#fff', marginLeft: '24px' }}>Logger.<span style={{ color: '#00ff66' }}>warn</span>(<span style={{ color: '#00d4ff' }}>'Overload imminent.'</span>);</div>
    <div style={{ color: '#fff', marginLeft: '12px' }}>{'}'}</div>
    <div style={{ color: '#fff' }}>{'}'}</div>
    <div style={{ flex: 1, borderTop: `1px solid rgba(255,255,255,0.1)`, marginTop: '10px', paddingTop: '6px', color: color }}>&gt;_ READY</div>
  </div>
);

export const AgentFeed = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: '100%', overflowY: 'auto' }}>
    {[
      { agent: 'ResearchBot', act: 'Found 14 papers on arXiv', time: '1m ago' },
      { agent: 'DevBot', act: 'Commited 400 lines to Core', time: '5m ago' },
      { agent: 'SecBot', act: 'Blocked 4 SQLi attempts', time: '12m ago' }
    ].map((a) => (
      <div key={`${a.agent}-${a.time}`} style={{ display: 'flex', gap: '8px', padding: '6px', background: 'rgba(255,255,255,0.02)', borderLeft: `2px solid ${color}` }}>
        <div style={{ fontSize: '14px' }}>🤖</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>{a.agent}</span>
          <span style={{ fontSize: '12px', color: '#ccc' }}>{a.act}</span>
          <span style={{ fontSize: '12px', opacity: 0.5, marginTop: '2px' }}>{a.time}</span>
        </div>
      </div>
    ))}
  </div>
);


// ==========================================
// FORMER APP.JS COMPONENTS (NOW ELITE)
// ==========================================

export const FileBrowser = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '6px', overflowY: 'auto' }}>
    {['agent_daemon.py', 'App.js', 'db_init.js', 'custom_modes.js', 'SettingsModal.js'].map((f) => (
      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', background: 'rgba(255,255,255,0.02)', borderLeft: `2px solid ${color}`, borderRadius: '2px' }}>
        <span style={{ fontSize: '12px' }}>📄</span>
        <span style={{ fontSize: '12px', color: '#fff', flex: 1 }}>{f}</span>
        <span style={{ fontSize: '12px', color: '#888' }}>{Math.floor(deterministicRange(`file-size-${f}`, 10, 110))} KB</span>
      </div>
    ))}
  </div>
);

export const CalendarPanel = ({ color }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', height: '100%' }}>
    {[
      { id: 'day-sun', label: 'S' },
      { id: 'day-mon', label: 'M' },
      { id: 'day-tue', label: 'T' },
      { id: 'day-wed', label: 'W' },
      { id: 'day-thu', label: 'T' },
      { id: 'day-fri', label: 'F' },
      { id: 'day-sat', label: 'S' }
    ].map((day) => (
      <div key={day.id} style={{ fontSize: '12px', color, textAlign: 'center', fontWeight: 'bold' }}>{day.label}</div>
    ))}
    {buildStableSequence('calendar-day', 28).map((dayId, i) => (
      <div key={dayId} style={getCalendarDayStyle(i === 18, color)}>
        {i + 1}
      </div>
    ))}
  </div>
);

export const ChartPanel = ({ color }) => (
  <div style={{ display: 'flex', height: '100%', alignItems: 'flex-end', gap: '8px', padding: '10px 4px' }}>
    {[40, 75, 50, 90, 60, 80, 100].map((h) => (
      <div key={`chart-bar-${h}`} style={{ flex: 1, height: `${h}%`, background: `linear-gradient(to top, ${color}33, ${color})`, borderRadius: '1px 1px 0 0', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', fontSize: '12px', color: '#fff' }}>{h}</div>
      </div>
    ))}
  </div>
);

export const CameraFeed = ({ color }) => (
  <div style={getCameraFeedShellStyle(color)}>
    <div style={{ width: '80%', height: '80%', border: `1px dashed ${color}88`, position: 'relative' }}>
      <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '10px', height: '10px', borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }}></div>
      <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` }}></div>
      <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '10px', height: '10px', borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` }}></div>
      <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }}></div>
    </div>
    <div style={{ position: 'absolute', bottom: 10, fontSize: '12px', color: color, letterSpacing: '0.04em', fontWeight: 'bold' }}>SECURE LINK: ACTIVE</div>
  </div>
);

export const VoicePanel = ({ color }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '4px' }}>
    {buildStableSequence('voice-band', 15).map((bandId) => {
      const height = deterministicRange(`${bandId}-height`, 20, 100);
      const duration = deterministicRange(`${bandId}-duration`, 0.5, 1);
      return (
        <div key={bandId} style={{ width: '6px', height: `${height}%`, background: color, borderRadius: '3px', animation: `pulse ${duration}s infinite alternate` }}></div>
      );
    })}
  </div>
);

export const Timeline = ({ color }) => (
  <div className="elite-timeline">
    <div className="elite-timeline-track"></div>
    {['INGESTION', 'EXECUTION', 'AUDITING'].map((step, i) => (
      <div key={step} className="elite-timeline-step">
        <div
          className={`elite-timeline-node ${i < 2 ? 'active' : ''}`}
          style={i < 2 ? { '--elite-accent': color, '--elite-accent-soft': `0 0 10px ${color}` } : undefined}
        ></div>
        <div style={{ position: 'absolute', top: '20px', fontSize: '12px', color: i < 2 ? '#fff' : '#888', fontWeight: 'bold' }}>{step}</div>
      </div>
    ))}
  </div>
);

export const ResearchPanel = ({ color }) => (
  <div className="elite-research-panel">
    {[
      { src: 'Reuters', time: '05:30', title: 'Global Sovereign AI networks expansion reaches 85% adoption.' },
      { src: 'Bloomberg', time: '03:15', title: 'Venture flow accelerates towards custom agentic interfaces.' }
    ].map((r) => (
      <div key={`${r.src}-${r.time}`} className="elite-research-item" style={{ '--elite-accent': color }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color, marginBottom: '4px' }}>
          <span>{r.src}</span>
          <span>{r.time}</span>
        </div>
        <div style={{ fontSize: '12px', color: '#ccc', lineHeight: '1.4' }}>{r.title}</div>
      </div>
    ))}
  </div>
);

export const FinancePanel = ({ color }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', height: '100%', alignItems: 'center' }}>
    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px', textAlign: 'center', border: `1px solid ${color}33` }}>
      <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>REVENUE</div>
      <div style={{ fontSize: '16px', color: color, fontWeight: 'bold' }}>$48,250</div>
    </div>
    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px', textAlign: 'center', border: `1px solid rgba(255,51,51,0.3)` }}>
      <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>GAS COST</div>
      <div style={{ fontSize: '16px', color: '#ff3333', fontWeight: 'bold' }}>$0.24</div>
    </div>
  </div>
);

export const DocumentViewer = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px', border: `1px solid ${color}33` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `1px solid ${color}33`, paddingBottom: '8px', marginBottom: '8px' }}>
      <span style={{ fontSize: '14px' }}>📄</span>
      <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>ZAIRE_ARCHITECTURE_SPEC.PDF</span>
    </div>
    <div style={{ fontSize: '12px', color: '#ccc', lineHeight: '1.6', flex: 1, overflowY: 'auto' }}>
      This document defines the 4-layer dynamic workspace engine supporting real-time secure state synchronization.
      <br/><br/>
      <span style={{ color }}>Key capabilities:</span> Dynamic drag-and-drop, real-time agentic swarms, encrypted vaults.
    </div>
  </div>
);

export const Moodboard = ({ color }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', height: '100%' }}>
    {buildStableSequence('moodboard-tile', 6).map((tileId) => {
      const opacity = Math.floor(deterministicRange(tileId, 2, 7));
      return (
        <div key={tileId} style={{ background: `rgba(255,255,255,0.0${opacity})`, border: `1px solid ${color}22`, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '2px', background: `linear-gradient(45deg, ${color}, transparent)`, opacity: 0.5 }}></div>
        </div>
      );
    })}
  </div>
);

export const BrandScanner = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
    <div style={{ fontSize: '12px', color: '#aaa', letterSpacing: '0.04em' }}>COMPETITOR ANALYSIS</div>
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <div style={getBrandScannerBadgeStyle(color)}>
        <span style={{ fontSize: '14px' }}>A</span>
      </div>
      <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
        <div style={{ width: '85%', height: '100%', background: color, borderRadius: '2px' }}></div>
      </div>
      <div style={{ fontSize: '12px', color }}>85% OVERLAP</div>
    </div>
  </div>
);

export const FocusTimer = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
      <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="4" strokeDasharray="283" strokeDashoffset="40" strokeLinecap="round" transform="rotate(-90 50 50)" />
    </svg>
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
      <div style={{ fontSize: '18px', color: '#fff', fontWeight: 'bold', fontFamily: 'monospace' }}>24:32</div>
      <div style={{ fontSize: '12px', color, letterSpacing: '0.04em' }}>DEEP WORK</div>
    </div>
  </div>
);

export const MeetingNotes = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: `1px solid ${color}33` }}>
      <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>Q3 Strategy Sync</span>
      <span style={{ fontSize: '12px', color: color }}>● REC</span>
    </div>
    <div style={{ flex: 1, padding: '8px 0', fontSize: '12px', color: '#ccc', lineHeight: '1.6', overflowY: 'auto' }}>
      - Alice: We need to finalize the neural core transition by Friday. <br/>
      <span style={{ color }}>- ZAIRE: I have already compiled the necessary weights.</span> <br/>
      - Bob: Excellent. Let's review the API metrics.
    </div>
  </div>
);

export const GoalTree = ({ color }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', position: 'relative' }}>
    <svg width="100%" height="100%" style={{ position: 'absolute' }}>
      <path d="M 50% 10% Q 50% 50% 20% 80%" fill="none" stroke={color} strokeWidth="2" opacity="0.6" />
      <path d="M 50% 10% Q 50% 50% 50% 80%" fill="none" stroke={color} strokeWidth="2" opacity="0.6" />
      <path d="M 50% 10% Q 50% 50% 80% 80%" fill="none" stroke={color} strokeWidth="2" opacity="0.6" />
      <circle cx="50%" cy="10%" r="8" fill="#fff" />
      <circle cx="20%" cy="80%" r="6" fill={color} />
      <circle cx="50%" cy="80%" r="6" fill={color} />
      <circle cx="80%" cy="80%" r="6" fill={color} />
    </svg>
    <div style={{ position: 'absolute', top: '15px', fontSize: '12px', color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '2px 4px', borderRadius: '2px' }}>Q3 OKR</div>
  </div>
);

export const WaveformViewer = ({ color }) => (
  <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '2px' }}>
    {buildStableSequence('wave-bar', 40).map((barId, i) => {
      const height = Math.abs(Math.sin(i * 0.2)) * 80 + 10;
      return (
        <div key={barId} style={{ flex: 1, height: `${height}%`, background: `linear-gradient(to bottom, ${color}, ${color}44)`, borderRadius: '2px' }}></div>
      );
    })}
  </div>
);

export const TranscriptPanel = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '6px', overflowY: 'auto' }}>
    {[
      { time: '00:01', text: 'Initiating orbital scan.' },
      { time: '00:05', text: 'Target acquired. Locking on.', highlight: true },
      { time: '00:12', text: 'Commencing data transfer.' }
    ].map((t) => (
      <div key={`${t.time}-${t.text}`} style={{ display: 'flex', gap: '8px', fontSize: '12px', lineHeight: '1.5' }}>
        <span style={{ color: '#888' }}>[{t.time}]</span>
        <span style={{ color: t.highlight ? color : '#ccc', fontWeight: t.highlight ? 'bold' : 'normal' }}>{t.text}</span>
      </div>
    ))}
  </div>
);

export const DecisionMatrix = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4px' }}>
    <div style={{ display: 'flex', borderBottom: `1px solid ${color}33`, paddingBottom: '4px', marginBottom: '4px', fontSize: '12px', color: '#aaa', fontWeight: 'bold' }}>
      <div style={{ flex: 2 }}>OPTION</div>
      <div style={{ flex: 1, textAlign: 'center' }}>RISK</div>
      <div style={{ flex: 1, textAlign: 'center' }}>ROI</div>
      <div style={{ flex: 1, textAlign: 'center' }}>SCORE</div>
    </div>
    {[
      { opt: 'Deploy Alpha', r: 'HIGH', roi: '150%', s: 92 },
      { opt: 'Hold Position', r: 'LOW', roi: '5%', s: 64 },
      { opt: 'Liquidate', r: 'NONE', roi: '-2%', s: 41 }
    ].map((d) => (
      <div key={d.opt} style={{ display: 'flex', padding: '4px 0', fontSize: '12px', color: '#fff', alignItems: 'center' }}>
        <div style={{ flex: 2 }}>{d.opt}</div>
        <div style={{ flex: 1, textAlign: 'center', color: d.r === 'HIGH' ? '#ff3333' : d.r === 'LOW' ? '#00ff66' : '#888' }}>{d.r}</div>
        <div style={{ flex: 1, textAlign: 'center', color: d.s > 80 ? '#00ff66' : '#fff' }}>{d.roi}</div>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', color: d.s > 80 ? color : '#ccc' }}>{d.s}</div>
      </div>
    ))}
  </div>
);

export const RoadmapGenerator = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '6px' }}>
    <div style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>PROJECT: SENTINEL</div>
    <div style={getRoadmapTrackStyle(color)}>
      {[
        { step: 'Phase 1: Architecture', status: 'done' },
        { step: 'Phase 2: Core Loop', status: 'active' },
        { step: 'Phase 3: Beta Test', status: 'pending' }
      ].map((r) => (
        <div key={r.step} style={{ position: 'relative' }}>
          <div style={getRoadmapNodeDotStyle(r.status, color)}></div>
          <div style={{ fontSize: '12px', color: r.status === 'pending' ? '#888' : '#fff', fontWeight: r.status === 'active' ? 'bold' : 'normal' }}>{r.step}</div>
        </div>
      ))}
    </div>
  </div>
);

export const ThinkingStream = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'hidden', gap: '4px', fontFamily: 'monospace', fontSize: '12px' }}>
    {[
      'Analyzing vector embeddings...',
      'Matching user intent to latent tree...',
      'Pruning invalid logic branches...',
      'Synthesizing final response...'
    ].map((t, i) => (
      <div key={t} style={{ opacity: 1 - (i * 0.2), color: i === 0 ? color : '#888', transform: `translateX(${i * 4}px)` }}>
        &gt; {t}
      </div>
    ))}
  </div>
);

export const MachineStatus = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-around' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', color: '#aaa' }}>KERNEL UPTIME</span>
      <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold', fontFamily: 'monospace' }}>24:18:45</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', color: '#aaa' }}>DAEMON HEALTH</span>
      <span style={{ fontSize: '12px', color: color, background: `${color}22`, padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>OPTIMAL</span>
    </div>
  </div>
);
