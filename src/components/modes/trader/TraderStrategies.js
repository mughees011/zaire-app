import React, { useState } from 'react';
import { Ban, CheckCircle2, Circle } from 'lucide-react';

const TraderStrategies = () => {
  const [halalEngineActive, setHalalEngineActive] = useState(true);
  
  const [universes, setUniverses] = useState([
    { name: 'Crypto Spot', active: true },
    { name: 'US Stocks (Halal)', active: true },
    { name: 'Commodities', active: true },
    { name: 'Forex', active: false },
    { name: 'Crypto Futures', active: false },
  ]);

  const toggleUniverse = (idx) => {
    const updated = [...universes];
    updated[idx].active = !updated[idx].active;
    setUniverses(updated);
  };

  return (
    <div>
      <div className="zth-section-header">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
          <div>
            <div className="zth-section-title">AI Strategy Configuration</div>
            <div className="zth-section-sub">
              Tune ZAIRE's risk parameters and operational universes.
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(12, 1fr)', gap:16 }}>
        
        {/* Halal Engine Config */}
        <div className={halalEngineActive ? "zth-glass-green" : "zth-glass"} style={{ gridColumn:'span 6', padding:20, opacity: halalEngineActive ? 1 : 0.6 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div className="zth-mono" style={{ fontSize:12, fontWeight:600, color: halalEngineActive ? '#10B981' : '#64748B' }}>Halal Filter Engine</div>
            <div 
              className={halalEngineActive ? "zth-toggle-on" : "zth-toggle-off"} 
              onClick={() => setHalalEngineActive(!halalEngineActive)}
              style={{ 
                width:32, height:16, borderRadius:10, position:'relative', cursor:'pointer',
                background: halalEngineActive ? '#10B981' : '#475569'
              }}
            >
              <div style={{ width:12, height:12, background:'white', borderRadius:'50%', position:'absolute', right: halalEngineActive ? 2 : 'auto', left: halalEngineActive ? 'auto' : 2, top:2, transition:'all 0.2s' }} />
            </div>
          </div>
          <p className="zth-mono" style={{ fontSize:10, color:'#64748B', marginBottom:16, lineHeight:1.5 }}>
            ZAIRE will strictly filter out any assets involved in non-permissible activities or those with unacceptable interest-bearing debt ratios.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {['Riba (Interest)', 'Gambling', 'Alcohol', 'Pork', 'Adult Entertainment', 'Weapons/Defense'].map(f => (
              <div key={f} className="zth-mono" style={{ fontSize:9, color: halalEngineActive ? '#94A3B8' : '#64748B', display:'flex', alignItems:'center', gap:6, background: halalEngineActive ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)', padding:'6px 10px', borderRadius:4, border: halalEngineActive ? '1px solid rgba(16,185,129,0.1)' : '1px solid rgba(255,255,255,0.05)' }}>
                <Ban size={12} color={halalEngineActive ? "#EF4444" : "#64748B"} /> {f}
              </div>
            ))}
          </div>
        </div>

        {/* Risk Profile */}
        <div className="zth-glass" style={{ gridColumn:'span 6', padding:20 }}>
          <div className="zth-mono" style={{ fontSize:12, fontWeight:600, marginBottom:20 }}>Risk Tolerance Profile</div>
          
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span className="zth-mono" style={{ fontSize:9, color:'#475569' }}>Conservative</span>
              <span className="zth-mono" style={{ fontSize:9, color:'#10B981', fontWeight:700 }}>Moderate</span>
              <span className="zth-mono" style={{ fontSize:9, color:'#EF4444' }}>Aggressive</span>
            </div>
            <div style={{ height:4, background:'rgba(255,255,255,0.05)', borderRadius:2, position:'relative' }}>
              <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'50%', background:'linear-gradient(90deg, #10B981, #F59E0B)', borderRadius:2 }} />
              <div style={{ position:'absolute', left:'50%', top:-4, width:12, height:12, background:'white', borderRadius:'50%', transform:'translateX(-50%)', boxShadow:'0 0 4px rgba(0,0,0,0.5)', cursor:'ew-resize' }} />
            </div>
          </div>

          {[
            ['Max Position Size', '5% of Portfolio'],
            ['Stop-Loss Baseline', '2.5% per trade'],
            ['Take-Profit Target', 'Dynamic (Avg 6%)'],
            ['Max Daily Drawdown', '3% (Auto-halt)'],
          ].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.02)' }}>
              <span className="zth-mono" style={{ fontSize:10, color:'#94A3B8' }}>{k}</span>
              <span className="zth-mono" style={{ fontSize:10, color:'#F1F5F9', fontWeight:600 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Trading Universes */}
        <div className="zth-glass" style={{ gridColumn:'span 12', padding:20 }}>
          <div className="zth-mono" style={{ fontSize:12, fontWeight:600, marginBottom:16 }}>Active Trading Universes</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:12 }}>
            {universes.map((u, idx) => {
              const active = u.active;
              return (
              <div 
                key={u.name} 
                onClick={() => toggleUniverse(idx)}
                style={{ 
                  background: active?'rgba(16,185,129,0.05)':'rgba(255,255,255,0.02)', 
                  border: active?'1px solid rgba(16,185,129,0.3)':'1px solid rgba(255,255,255,0.05)',
                  padding:12, borderRadius:8, opacity: active?1:0.5, cursor:'pointer',
                  transition: 'all 0.2s'
                }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                  {active ? <CheckCircle2 size={18} color="#10B981" /> : <Circle size={18} color="#475569" />}
                  {active && <span className="zth-pulse-dot" style={{ width:6, height:6 }} />}
                </div>
                <div className="zth-mono" style={{ fontSize:10, fontWeight:600, color:active?'#F1F5F9':'#94A3B8' }}>{u.name}</div>
              </div>
            )})}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TraderStrategies;
