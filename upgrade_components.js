const fs = require('fs');
let code = fs.readFileSync('src/engine/EliteComponents.js', 'utf8');

// 1. Add imports at the top
if (!code.includes('framer-motion')) {
  code = "import React, { useState, useEffect } from 'react';\nimport { motion } from 'framer-motion';\n" + code;
}

// 2. Replace ExecutionTimeline
const oldExecutionTimeline = `export const ExecutionTimeline = ({ color }) => (
  <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '0 10px', position: 'relative' }}>
    <div style={{ position: 'absolute', top: '50%', left: '10px', right: '10px', height: '2px', background: 'rgba(255,255,255,0.1)', transform: 'translateY(-50%)' }}></div>
    {['INIT', 'FETCH', 'PARSE', 'RENDER'].map((step, i) => (
      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, position: 'relative' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: i < 2 ? color : '#333', border: \`2px solid \${i < 2 ? color : '#555'}\`, boxShadow: i < 2 ? \`0 0 10px \${color}\` : 'none' }}></div>
        <div style={{ position: 'absolute', top: '20px', fontSize: '9px', color: i < 2 ? '#fff' : '#888', fontWeight: 'bold' }}>{step}</div>
      </div>
    ))}
  </div>
);`;

const newExecutionTimeline = `export const ExecutionTimeline = ({ color }) => (
  <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '0 10px', position: 'relative' }}>
    <div style={{ position: 'absolute', top: '50%', left: '10px', right: '10px', height: '2px', background: 'rgba(255,255,255,0.1)', transform: 'translateY(-50%)' }}></div>
    {['INIT', 'FETCH', 'PARSE', 'RENDER'].map((step, i) => (
      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, position: 'relative' }}>
        <motion.div 
          animate={i === 1 ? { boxShadow: [\`0 0 0px \${color}\`, \`0 0 20px \${color}\`, \`0 0 0px \${color}\`] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ width: '12px', height: '12px', borderRadius: '50%', background: i < 2 ? color : '#333', border: \`2px solid \${i < 2 ? color : '#555'}\`, position: 'relative' }}
        >
          {i === 1 && (
            <motion.div
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
              style={{ position: 'absolute', top: '-2px', left: '-2px', right: '-2px', bottom: '-2px', borderRadius: '50%', border: \`2px solid \${color}\` }}
            />
          )}
        </motion.div>
        <motion.div 
          animate={i === 1 ? { opacity: [0.5, 1, 0.5] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ position: 'absolute', top: '20px', fontSize: '9px', color: i < 2 ? '#fff' : '#888', fontWeight: 'bold' }}>
          {step}
        </motion.div>
      </div>
    ))}
  </div>
);`;
code = code.replace(oldExecutionTimeline, newExecutionTimeline);

// 3. Replace VaultAccess
const oldVaultAccess = `export const VaultAccess = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
    <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: \`2px dashed \${color}\`, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'spin 4s linear infinite' }}>
      <div style={{ width: '20px', height: '20px', background: color, borderRadius: '50%', animation: 'pulse 2s infinite alternate' }}></div>
    </div>
    <div style={{ fontSize: '10px', color: '#fff', letterSpacing: '2px' }}>VAULT ENCRYPTED</div>
    <div style={{ fontSize: '8px', color: color, opacity: 0.8 }}>AES-256 GCM SECURE</div>
  </div>
);`;

const newVaultAccess = `export const VaultAccess = ({ color }) => {
  const [hex, setHex] = useState("0x000000");
  useEffect(() => {
    const int = setInterval(() => {
      setHex("0x" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase());
    }, 100);
    return () => clearInterval(int);
  }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', gap: '10px', position: 'relative', overflow: 'hidden' }}>
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
        style={{ width: '45px', height: '45px', borderRadius: '50%', border: \`1px dashed \${color}\`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <motion.div 
          animate={{ rotate: -360 }} 
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          style={{ width: '30px', height: '30px', borderRadius: '50%', border: \`2px dotted \${color}\`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <motion.div 
            animate={{ scale: [0.8, 1.2, 0.8] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ width: '10px', height: '10px', background: color, borderRadius: '50%', boxShadow: \`0 0 15px \${color}\` }}
          />
        </motion.div>
      </motion.div>
      <div style={{ fontSize: '11px', color: '#fff', letterSpacing: '2px', fontWeight: 'bold' }}>VAULT SECURE</div>
      <div style={{ fontSize: '9px', color: color, fontFamily: 'monospace' }}>DECRYPTING: {hex}</div>
    </div>
  );
};`;
code = code.replace(oldVaultAccess, newVaultAccess);

// 4. Replace ThreatFeed
const oldThreatFeed = `export const ThreatFeed = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '4px', overflowY: 'auto' }}>
    {[
      { ip: '192.168.1.44', threat: 'SQL Injection', status: 'BLOCKED' },
      { ip: '10.0.0.5', threat: 'Brute Force', status: 'WARN' }
    ].map((t, i) => (
      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px', background: 'rgba(255,255,255,0.02)', borderLeft: \`2px solid \${t.status === 'BLOCKED' ? '#ff3333' : '#ffaa00'}\` }}>
        <div style={{ fontSize: '9px', color: '#fff' }}>{t.ip}</div>
        <div style={{ fontSize: '8px', color: '#aaa' }}>{t.threat}</div>
      </div>
    ))}
  </div>
);`;

const newThreatFeed = `export const ThreatFeed = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '6px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '100px', height: '100px', opacity: 0.15, pointerEvents: 'none' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
        style={{ width: '100%', height: '100%', borderRadius: '50%', border: \`1px solid \${color}\`, position: 'relative' }}
      >
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: '50%', height: '2px', background: \`linear-gradient(90deg, \${color}, transparent)\`, transformOrigin: 'left center' }} />
      </motion.div>
    </div>
    {[
      { ip: '192.168.1.44', threat: 'SQL Injection', status: 'BLOCKED' },
      { ip: '10.0.0.5', threat: 'Brute Force', status: 'WARN' },
      { ip: '172.16.0.8', threat: 'Port Scan', status: 'MONITOR' }
    ].map((t, i) => (
      <motion.div 
        key={i} 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.2 }}
        style={{ display: 'flex', justifyContent: 'space-between', padding: '6px', background: 'rgba(255,255,255,0.03)', borderLeft: \`2px solid \${t.status === 'BLOCKED' ? '#ff3333' : t.status === 'WARN' ? '#ffaa00' : color}\`, borderRadius: '0 4px 4px 0', zIndex: 1 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '9px', color: '#fff', fontFamily: 'monospace' }}>{t.ip}</span>
          <span style={{ fontSize: '7px', color: '#888' }}>{t.threat}</span>
        </div>
        <motion.div 
          animate={t.status === 'BLOCKED' ? { opacity: [1, 0, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
          style={{ fontSize: '8px', color: t.status === 'BLOCKED' ? '#ff3333' : t.status === 'WARN' ? '#ffaa00' : color, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
        >
          {t.status}
        </motion.div>
      </motion.div>
    ))}
  </div>
);`;
code = code.replace(oldThreatFeed, newThreatFeed);

// 5. Replace ModelRouter
const oldModelRouter = `export const ModelRouter = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-around' }}>
    {['FAST_CLAUDE', 'DEEP_THINK', 'VISION_PARSER'].map((m, i) => (
      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: i === 1 ? \`\${color}22\` : 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '4px', borderLeft: i === 1 ? \`2px solid \${color}\` : '2px solid transparent' }}>
        <div style={{ fontSize: '10px', color: i === 1 ? '#fff' : '#888', fontWeight: i === 1 ? 'bold' : 'normal' }}>{m}</div>
        <div style={{ width: '20px', height: '10px', borderRadius: '10px', background: i === 1 ? color : '#333', position: 'relative' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '1px', left: i === 1 ? '11px' : '1px', transition: 'left 0.3s' }}></div>
        </div>
      </div>
    ))}
  </div>
);`;

const newModelRouter = `export const ModelRouter = ({ color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-around', position: 'relative' }}>
    {/* Animated Data Packets Flowing in the background */}
    <div style={{ position: 'absolute', left: '10px', top: '0', bottom: '0', width: '2px', background: 'rgba(255,255,255,0.05)', zIndex: 0 }}>
      <motion.div 
        animate={{ top: ['0%', '100%'] }} 
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        style={{ position: 'absolute', left: '-1px', width: '4px', height: '15px', background: color, borderRadius: '2px', boxShadow: \`0 0 10px \${color}\` }}
      />
    </div>
    {['FAST_CLAUDE', 'DEEP_THINK', 'VISION_PARSER'].map((m, i) => (
      <div key={i} style={{ zIndex: 1, marginLeft: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: i === 1 ? \`\${color}22\` : 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '4px', border: \`1px solid \${i === 1 ? color : 'rgba(255,255,255,0.05)'}\` }}>
        <div style={{ fontSize: '10px', color: i === 1 ? '#fff' : '#888', fontWeight: i === 1 ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {i === 1 && <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, boxShadow: \`0 0 5px \${color}\` }} />}
          {m}
        </div>
        <div style={{ fontSize: '8px', color: i === 1 ? color : '#555', fontFamily: 'monospace' }}>
          {i === 1 ? 'ACTIVE (14ms)' : 'STANDBY'}
        </div>
      </div>
    ))}
  </div>
);`;
code = code.replace(oldModelRouter, newModelRouter);

fs.writeFileSync('src/engine/EliteComponents.js', code);
console.log("Upgraded Components successfully!");
