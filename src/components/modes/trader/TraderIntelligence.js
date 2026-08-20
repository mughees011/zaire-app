import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Activity } from 'lucide-react';

const BRAIN_LINES = [
  { text: "[MARKET-SCAN] Aggregating order book depth across 12 exchanges...", type: 'violet' },
  { text: "[HALAL-ENGINE] Screening TSLA for recent interest-bearing debt ratio changes...", type: 'green' },
  { text: "[HALAL-ENGINE] TSLA cleared. Debt ratio within acceptable Islamic finance limits (<30%).", type: 'green' },
  { text: "[INTELLIGENCE] NLP analyzing Fed chair speech transcripts...", type: 'violet' },
  { text: "[INTELLIGENCE] Sentiment classified as DOVISH (Confidence: 89%).", type: 'amber' },
  { text: "[TECHNICAL] BTC/USD approaching 200 EMA resistance at $68,400.", type: 'violet' },
  { text: "[TECHNICAL] Volume profile indicates weak sell-side liquidity above $69K.", type: 'amber' },
  { text: "[DECISION-ENGINE] Swarm consensus matrix simulating 5,000 outcomes...", type: 'violet' },
  { text: "[DECISION-ENGINE] Scenario 4A (Breakout) probability increased to 72%.", type: 'green' },
  { text: "[RISK-ENGINE] Stress testing portfolio against -15% flash crash...", type: 'violet' },
  { text: "[RISK-ENGINE] Max drawdown contained to -1.2%. Approved.", type: 'green' },
  { text: "[EXECUTION] Routing 0.25 BTC BUY order via smart router...", type: 'violet' },
  { text: "[EXECUTION] Order filled completely at $67,950.40.", type: 'green', bold: true },
];

const TraderIntelligence = () => {
  const [lines, setLines] = useState([
    { text: "ZAIRE DAEMON CORE [v4.2.0-trader]", type: 'green', bold: true },
    { text: "Consciousness Terminal Online.", type: 'green' },
    { text: "----------------------------------------", type: 'dim' },
  ]);
  const [lineIdx, setLineIdx] = useState(0);
  const terminalRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => {
      setLines(prev => {
        const newLine = BRAIN_LINES[lineIdx % BRAIN_LINES.length];
        const updated = [...prev, newLine];
        if (updated.length > 50) updated.shift();
        return updated;
      });
      setLineIdx(i => i + 1);
    }, 1200 + Math.random() * 800);
    return () => clearInterval(t);
  }, [lineIdx]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div>
      <div className="zth-section-header">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
          <div>
            <div className="zth-section-title">Synthetic Intelligence <span style={{ fontSize:18 }}>🧠</span></div>
            <div className="zth-section-sub">
              <span className="zth-pulse-dot violet" style={{ width:6, height:6, background:'#8B5CF6', boxShadow:'0 0 6px #8B5CF6' }} />
              Inside the ZAIRE Brain Room — Real-time reasoning terminal
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(12, 1fr)', gap:16 }}>
        
        {/* Terminal */}
        <div className="zth-glass" style={{ gridColumn:'span 8', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:8 }}>
            <Terminal size={16} color="#8B5CF6" />
            <span className="zth-mono" style={{ fontSize:12, fontWeight:600 }}>Consciousness Stream</span>
          </div>
          <div className="zth-terminal" ref={terminalRef}>
            {lines.map((l, i) => (
              <div key={i} className={`zth-terminal-line ${l.type}`} style={{ fontWeight: l.bold?700:400 }}>
                {l.text}
              </div>
            ))}
            <div className="zth-terminal-line green" style={{ animation:'zth-pulse 1s infinite' }}>_</div>
          </div>
        </div>

        {/* Right side stats */}
        <div style={{ gridColumn:'span 4', display:'flex', flexDirection:'column', gap:16 }}>
          
          <div className="zth-ai-border" style={{ padding:20, flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
             <div className="zth-mono" style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:16 }}>Decision Confidence Matrix</div>
             <div style={{ position:'relative', width:120, height:120, marginBottom:16 }}>
               <svg viewBox="0 0 100 100" style={{ width:'100%', height:'100%' }}>
                 <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                 <circle className="zth-conf-ring" cx="50" cy="50" r="45" fill="none" stroke="#8B5CF6" strokeWidth="6" strokeDasharray="283" strokeDashoffset="42" />
               </svg>
               <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                 <div className="zth-mono" style={{ fontSize:24, fontWeight:700, color:'#F1F5F9' }}>85%</div>
               </div>
             </div>
             <div className="zth-mono" style={{ fontSize:11, color:'#10B981', background:'rgba(16,185,129,0.1)', padding:'4px 12px', borderRadius:20 }}>
               ACTION APPROVED
             </div>
          </div>

          <div className="zth-glass" style={{ padding:16 }}>
             <div className="zth-mono" style={{ fontSize:10, fontWeight:600, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
               <Activity size={12} color="#8B5CF6" /> Technicals
             </div>
             {[
               ['RSI (14)', '58.4 - Neutral', '#94A3B8'],
               ['MACD', 'Bullish Cross', '#10B981'],
               ['Volume', '+24% Above Avg', '#10B981'],
               ['Volatility', 'Low Expansion', '#94A3B8'],
             ].map(([k,v,c])=>(
               <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                 <span className="zth-mono" style={{ fontSize:9, color:'#475569' }}>{k}</span>
                 <span className="zth-mono" style={{ fontSize:9, color:c }}>{v}</span>
               </div>
             ))}
          </div>

        </div>

      </div>
    </div>
  );
};

export default TraderIntelligence;
