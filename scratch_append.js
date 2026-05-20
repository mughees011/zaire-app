const fs = require('fs');

const contentToAppend = `
// ==========================================
// FORMER APP.JS COMPONENTS (NOW ELITE)
// ==========================================

export const FileBrowser = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '6px', overflowY: 'auto' }}>
    {['agent_daemon.py', 'App.js', 'db_init.js', 'custom_modes.js', 'SettingsModal.js'].map((f, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', background: 'rgba(255,255,255,0.02)', borderLeft: \`2px solid \${color}\`, borderRadius: '2px' }}>
        <span style={{ fontSize: '10px' }}>📄</span>
        <span style={{ fontSize: '10px', color: '#fff', flex: 1 }}>{f}</span>
        <span style={{ fontSize: '8px', color: '#888' }}>{Math.floor(Math.random() * 100) + 10} KB</span>
      </div>
    ))}
  </div>
);

export const CalendarPanel = ({ color }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', height: '100%' }}>
    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
      <div key={\`header-\${i}\`} style={{ fontSize: '8px', color, textAlign: 'center', fontWeight: 'bold' }}>{d}</div>
    ))}
    {Array.from({ length: 28 }).map((_, i) => (
      <div key={i} style={{ background: i === 18 ? color : 'rgba(255,255,255,0.05)', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 18 ? '#000' : '#fff', fontSize: '9px', fontWeight: 'bold' }}>
        {i + 1}
      </div>
    ))}
  </div>
);

export const ChartPanel = ({ color }) => (
  <div style={{ display: 'flex', height: '100%', alignItems: 'flex-end', gap: '8px', padding: '10px 4px' }}>
    {[40, 75, 50, 90, 60, 80, 100].map((h, i) => (
      <div key={i} style={{ flex: 1, height: \`\${h}%\`, background: \`linear-gradient(to top, \${color}33, \${color})\`, borderRadius: '1px 1px 0 0', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', fontSize: '8px', color: '#fff' }}>{h}</div>
      </div>
    ))}
  </div>
);

export const CameraFeed = ({ color }) => (
  <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: \`1px solid \${color}44\`, background: 'rgba(0,0,0,0.5)', overflow: 'hidden' }}>
    <div style={{ width: '80%', height: '80%', border: \`1px dashed \${color}88\`, position: 'relative' }}>
      <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '10px', height: '10px', borderTop: \`2px solid \${color}\`, borderLeft: \`2px solid \${color}\` }}></div>
      <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', borderTop: \`2px solid \${color}\`, borderRight: \`2px solid \${color}\` }}></div>
      <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '10px', height: '10px', borderBottom: \`2px solid \${color}\`, borderLeft: \`2px solid \${color}\` }}></div>
      <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', borderBottom: \`2px solid \${color}\`, borderRight: \`2px solid \${color}\` }}></div>
    </div>
    <div style={{ position: 'absolute', bottom: 10, fontSize: '9px', color: color, letterSpacing: '2px', fontWeight: 'bold' }}>SECURE LINK: ACTIVE</div>
  </div>
);

export const VoicePanel = ({ color }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '4px' }}>
    {Array.from({ length: 15 }).map((_, i) => (
      <div key={i} style={{ width: '6px', height: \`\${Math.random() * 80 + 20}%\`, background: color, borderRadius: '3px', animation: \`pulse \${Math.random() * 0.5 + 0.5}s infinite alternate\` }}></div>
    ))}
  </div>
);

export const Timeline = ({ color }) => (
  <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '0 10px', position: 'relative' }}>
    <div style={{ position: 'absolute', top: '50%', left: '10px', right: '10px', height: '2px', background: 'rgba(255,255,255,0.1)', transform: 'translateY(-50%)' }}></div>
    {['INGESTION', 'EXECUTION', 'AUDITING'].map((step, i) => (
      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, position: 'relative' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: i < 2 ? color : '#333', border: \`2px solid \${i < 2 ? color : '#555'}\`, boxShadow: i < 2 ? \`0 0 10px \${color}\` : 'none' }}></div>
        <div style={{ position: 'absolute', top: '20px', fontSize: '9px', color: i < 2 ? '#fff' : '#888', fontWeight: 'bold' }}>{step}</div>
      </div>
    ))}
  </div>
);

export const ResearchPanel = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', overflowY: 'auto' }}>
    {[
      { src: 'Reuters', time: '05:30', title: 'Global Sovereign AI networks expansion reaches 85% adoption.' },
      { src: 'Bloomberg', time: '03:15', title: 'Venture flow accelerates towards custom agentic interfaces.' }
    ].map((r, i) => (
      <div key={i} style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', borderLeft: \`2px solid \${color}\` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color, marginBottom: '4px' }}>
          <span>{r.src}</span>
          <span>{r.time}</span>
        </div>
        <div style={{ fontSize: '10px', color: '#ccc', lineHeight: '1.4' }}>{r.title}</div>
      </div>
    ))}
  </div>
);

export const FinancePanel = ({ color }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', height: '100%', alignItems: 'center' }}>
    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px', textAlign: 'center', border: \`1px solid \${color}33\` }}>
      <div style={{ fontSize: '9px', color: '#aaa', marginBottom: '4px' }}>REVENUE</div>
      <div style={{ fontSize: '16px', color: color, fontWeight: 'bold' }}>$48,250</div>
    </div>
    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px', textAlign: 'center', border: \`1px solid rgba(255,51,51,0.3)\` }}>
      <div style={{ fontSize: '9px', color: '#aaa', marginBottom: '4px' }}>GAS COST</div>
      <div style={{ fontSize: '16px', color: '#ff3333', fontWeight: 'bold' }}>$0.24</div>
    </div>
  </div>
);

export const DocumentViewer = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px', border: \`1px solid \${color}33\` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: \`1px solid \${color}33\`, paddingBottom: '8px', marginBottom: '8px' }}>
      <span style={{ fontSize: '14px' }}>📄</span>
      <span style={{ fontSize: '10px', color: '#fff', fontWeight: 'bold' }}>ZAIRE_ARCHITECTURE_SPEC.PDF</span>
    </div>
    <div style={{ fontSize: '10px', color: '#ccc', lineHeight: '1.6', flex: 1, overflowY: 'auto' }}>
      This document defines the 4-layer dynamic workspace engine supporting real-time secure state synchronization.
      <br/><br/>
      <span style={{ color }}>Key capabilities:</span> Dynamic drag-and-drop, real-time agentic swarms, encrypted vaults.
    </div>
  </div>
);

export const Moodboard = ({ color }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', height: '100%' }}>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} style={{ background: \`rgba(255,255,255,0.0\${Math.floor(Math.random()*5)+2})\`, border: \`1px solid \${color}22\`, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '2px', background: \`linear-gradient(45deg, \${color}, transparent)\`, opacity: 0.5 }}></div>
      </div>
    ))}
  </div>
);

export const BrandScanner = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
    <div style={{ fontSize: '9px', color: '#aaa', letterSpacing: '1px' }}>COMPETITOR ANALYSIS</div>
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: \`1px solid \${color}\` }}>
        <span style={{ fontSize: '14px' }}>A</span>
      </div>
      <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
        <div style={{ width: '85%', height: '100%', background: color, borderRadius: '2px' }}></div>
      </div>
      <div style={{ fontSize: '9px', color }}>85% OVERLAP</div>
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
      <div style={{ fontSize: '8px', color, letterSpacing: '1px' }}>DEEP WORK</div>
    </div>
  </div>
);

export const MeetingNotes = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: \`1px solid \${color}33\` }}>
      <span style={{ fontSize: '9px', color: '#fff', fontWeight: 'bold' }}>Q3 Strategy Sync</span>
      <span style={{ fontSize: '9px', color: color }}>● REC</span>
    </div>
    <div style={{ flex: 1, padding: '8px 0', fontSize: '9px', color: '#ccc', lineHeight: '1.6', overflowY: 'auto' }}>
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
    <div style={{ position: 'absolute', top: '15px', fontSize: '8px', color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '2px 4px', borderRadius: '2px' }}>Q3 OKR</div>
  </div>
);

export const WaveformViewer = ({ color }) => (
  <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '2px' }}>
    {Array.from({ length: 40 }).map((_, i) => {
      const height = Math.abs(Math.sin(i * 0.2)) * 80 + 10;
      return (
        <div key={i} style={{ flex: 1, height: \`\${height}%\`, background: \`linear-gradient(to bottom, \${color}, \${color}44)\`, borderRadius: '2px' }}></div>
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
    ].map((t, i) => (
      <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '9px', lineHeight: '1.5' }}>
        <span style={{ color: '#888' }}>[{t.time}]</span>
        <span style={{ color: t.highlight ? color : '#ccc', fontWeight: t.highlight ? 'bold' : 'normal' }}>{t.text}</span>
      </div>
    ))}
  </div>
);

export const DecisionMatrix = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4px' }}>
    <div style={{ display: 'flex', borderBottom: \`1px solid \${color}33\`, paddingBottom: '4px', marginBottom: '4px', fontSize: '8px', color: '#aaa', fontWeight: 'bold' }}>
      <div style={{ flex: 2 }}>OPTION</div>
      <div style={{ flex: 1, textAlign: 'center' }}>RISK</div>
      <div style={{ flex: 1, textAlign: 'center' }}>ROI</div>
      <div style={{ flex: 1, textAlign: 'center' }}>SCORE</div>
    </div>
    {[
      { opt: 'Deploy Alpha', r: 'HIGH', roi: '150%', s: 92 },
      { opt: 'Hold Position', r: 'LOW', roi: '5%', s: 64 },
      { opt: 'Liquidate', r: 'NONE', roi: '-2%', s: 41 }
    ].map((d, i) => (
      <div key={i} style={{ display: 'flex', padding: '4px 0', fontSize: '9px', color: '#fff', alignItems: 'center' }}>
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
    <div style={{ fontSize: '9px', color: '#fff', fontWeight: 'bold' }}>PROJECT: SENTINEL</div>
    <div style={{ flex: 1, position: 'relative', borderLeft: \`2px solid \${color}44\`, marginLeft: '8px', paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
      {[
        { step: 'Phase 1: Architecture', status: 'done' },
        { step: 'Phase 2: Core Loop', status: 'active' },
        { step: 'Phase 3: Beta Test', status: 'pending' }
      ].map((r, i) => (
        <div key={i} style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '-17px', top: '2px', width: '8px', height: '8px', borderRadius: '50%', background: r.status === 'done' ? color : r.status === 'active' ? '#fff' : '#222', border: \`2px solid \${r.status === 'pending' ? '#444' : color}\` }}></div>
          <div style={{ fontSize: '9px', color: r.status === 'pending' ? '#888' : '#fff', fontWeight: r.status === 'active' ? 'bold' : 'normal' }}>{r.step}</div>
        </div>
      ))}
    </div>
  </div>
);

export const ThinkingStream = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'hidden', gap: '4px', fontFamily: 'monospace', fontSize: '9px' }}>
    {[
      'Analyzing vector embeddings...',
      'Matching user intent to latent tree...',
      'Pruning invalid logic branches...',
      'Synthesizing final response...'
    ].map((t, i) => (
      <div key={i} style={{ opacity: 1 - (i * 0.2), color: i === 0 ? color : '#888', transform: \`translateX(\${i * 4}px)\` }}>
        &gt; {t}
      </div>
    ))}
  </div>
);

export const MachineStatus = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-around' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '10px', color: '#aaa' }}>KERNEL UPTIME</span>
      <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold', fontFamily: 'monospace' }}>24:18:45</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '10px', color: '#aaa' }}>DAEMON HEALTH</span>
      <span style={{ fontSize: '10px', color: color, background: \`\${color}22\`, padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>OPTIMAL</span>
    </div>
  </div>
);

`;

fs.appendFileSync('src/engine/EliteComponents.js', contentToAppend);
console.log('Appended components successfully!');
