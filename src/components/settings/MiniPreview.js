import React from 'react';

export default function MiniPreview({ type, color = '#00d4ff' }) {
  const isFinance = type.includes('Market') || type.includes('Scanner') || type.includes('Chart') || type.includes('Grid') || type.includes('Finance');
  const isTerminal = type.includes('Terminal') || type.includes('Console') || type.includes('Shell') || type.includes('Logs');
  const isMemory = type.includes('Memory') || type.includes('Graph') || type.includes('Vault');
  const isCode = type.includes('File') || type.includes('Code') || type.includes('Builder') || type.includes('Preview') || type.includes('Canvas');
  const isTask = type.includes('Task') || type.includes('Planner') || type.includes('Roadmap') || type.includes('Board') || type.includes('Timeline') || type.includes('Queue');
  const baseContainer = {
    background: '#0a0a0a',
    border: '1px solid #1f1f1f',
    borderRadius: '4px',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'JetBrains Mono', monospace"
  };

  const headerStyle = {
    padding: '4px 6px',
    background: '#000000',
    borderBottom: '1px solid #1f1f1f',
    fontSize: '7px',
    color: '#888',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  };

  if (isFinance) {
    return (
      <div style={baseContainer}>
        <div style={headerStyle}>
          <span style={{ color }}>QUANTUM_FIN</span>
          <span className="animate-pulse" style={{ background: color, width: '4px', height: '4px', borderRadius: '50%' }} />
        </div>
        <div style={{ flex: 1, padding: '6px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '30px', height: '30px', border: `1px solid ${color}40`, borderRadius: '50%' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '15px', height: '15px', border: `1px solid ${color}80`, borderRadius: '50%' }} />
          <div style={{ position: 'absolute', top: '20%', left: '30%', width: '2px', height: '2px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 4px #ef4444' }} />
          <div style={{ position: 'absolute', bottom: '30%', right: '20%', width: '2px', height: '2px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 4px #10b981' }} />
        </div>
        <div style={{ height: '15px', display: 'flex', alignItems: 'flex-end', gap: '1px', padding: '2px 4px', borderTop: '1px solid #1f1f1f', background: '#000000' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ flex: 1, background: i === 7 ? color : '#333', height: `${Math.max(10, Math.random() * 100)}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (isMemory) {
    return (
      <div style={baseContainer}>
        <div style={headerStyle}>
          <span>VECTOR_DB</span>
          <span style={{ color }}>1536_DIM</span>
        </div>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
          <div style={{ transform: 'rotateX(60deg) rotateZ(45deg)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', width: '40px', height: '40px' }}>
            {[...Array(16)].map((_, i) => (
              <div key={i} style={{ background: Math.random() > 0.7 ? `${color}40` : `${color}10`, border: `1px solid ${color}30` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isTerminal) {
    return (
      <div style={baseContainer}>
        <div style={headerStyle}>
          <span>root@zaire</span>
          <span>TTY1</span>
        </div>
        <div style={{ flex: 1, padding: '4px', background: '#000', fontSize: '6px', color: '#555', lineHeight: '1.4' }}>
          <div style={{ color }}>$ init_sequence()</div>
          <div>[OK] Kernel loaded</div>
          <div>[OK] Neuro-link active</div>
          <div style={{ color, marginTop: '2px' }}>$ <span className="animate-pulse">_</span></div>
        </div>
      </div>
    );
  }

  if (isCode) {
    return (
      <div style={baseContainer}>
        <div style={headerStyle}>
          <span>AST_WORKSPACE</span>
          <span style={{ color: '#f59e0b' }}>MODIFIED</span>
        </div>
        <div style={{ flex: 1, display: 'flex' }}>
          <div style={{ width: '20px', borderRight: '1px solid #1f1f1f', padding: '4px 2px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ width: '100%', height: '2px', background: '#444' }} />
            <div style={{ width: '70%', height: '2px', background: color }} />
            <div style={{ width: '80%', height: '2px', background: '#444' }} />
          </div>
          <div style={{ flex: 1, padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px', background: '#000' }}>
            <div style={{ width: '40%', height: '3px', background: '#c678dd' }} />
            <div style={{ width: '60%', height: '3px', background: '#61afef' }} />
            <div style={{ width: '80%', height: '3px', background: '#98c379', marginLeft: '4px' }} />
            <div style={{ width: '50%', height: '3px', background: '#e5c07b', marginLeft: '4px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (isTask) {
    return (
      <div style={baseContainer}>
        <div style={headerStyle}>
          <span>TELEMETRY</span>
          <span style={{ color: '#10b981' }}>NOMINAL</span>
        </div>
        <div style={{ flex: 1, padding: '4px', display: 'flex', flexDirection: 'column', gap: '3px', background: '#000' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', border: '1px solid #10b981' }} />
            <div style={{ flex: 1, height: '1px', background: '#1f1f1f', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '1px', width: '100%', background: '#10b981' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', border: '1px solid #444' }} />
            <div style={{ flex: 1, height: '1px', background: '#1f1f1f', position: 'relative' }}>
              <div className="animate-[scanning-laser_1.5s_infinite]" style={{ position: 'absolute', left: 0, top: 0, height: '1px', width: '40%', background: color }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', border: '1px solid #444' }} />
            <div style={{ flex: 1, height: '1px', background: '#1f1f1f' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={baseContainer}>
      <div style={headerStyle}>
        <span>COMPOSER</span>
        <span style={{ color }}>IDLE</span>
      </div>
      <div style={{ flex: 1, padding: '4px', background: '#000', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <div style={{ width: '4px', height: '4px', background: '#555', marginTop: '1px' }} />
          <div style={{ width: '100%', height: '2px', background: '#444', marginTop: '2px' }} />
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <div style={{ width: '4px', height: '4px', background: color, borderRadius: '50%', marginTop: '1px' }} />
          <div style={{ flex: 1, border: '1px solid #1f1f1f', borderRadius: '2px', padding: '2px', background: '#0a0a0a' }}>
            <div style={{ width: '80%', height: '2px', background: '#666', marginBottom: '2px' }} />
            <div style={{ width: '60%', height: '2px', background: '#666' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
