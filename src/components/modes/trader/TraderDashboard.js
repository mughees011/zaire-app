import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { ArrowUp, ArrowDown, Pause, Landmark, Cpu, Sparkles } from 'lucide-react';

// ── Live feed items (fallback initial state) ──
const FEED_SEED = [
  { action:'HOLD',  amount:'—', asset:'BTC/USD', price:null, reason:'System Initializing. Awaiting live telemetry from Apex Daemon...', sym:'BTC-USD' },
];

const colorFor = a => a==='BUY'?'#10B981':a==='SELL'?'#EF4444':'#F59E0B';
const iconFor  = a => a==='BUY'?<ArrowUp size={14}/>:a==='SELL'?<ArrowDown size={14}/>:<Pause size={14}/>;

const TraderDashboard = ({ traderData, decisions, profit, apiBase }) => {
  const { prices, isLive, fmtPrice, fmtPercent } = traderData;
  const [feed, setFeed] = useState(FEED_SEED);

  const getQuote = sym => prices.find(p => p.symbol === sym);

  // enrich feed with live prices
  const enrichedFeed = feed.map(item => ({
    ...item,
    livePrice: getQuote(item.sym)?.price ?? null,
  }));

  useEffect(() => {
    if (!apiBase) return;
    const socket = io(apiBase, { transports: ['polling', 'websocket'] });

    socket.on('APEX_SIGNAL', (signal) => {
      // transform backend signal to frontend format
      const newItem = {
        action: signal.action,
        amount: signal.action === 'HOLD' ? '—' : 'Calculated Size',
        asset: signal.asset.replace('-', '/'),
        price: signal.price,
        reason: signal.reason,
        sym: signal.asset
      };
      setFeed(prev => [newItem, ...prev].slice(0, 50)); // keep last 50
    });

    return () => socket.disconnect();
  }, [apiBase]);

  const btc = getQuote('BTC-USD');
  const eth = getQuote('ETH-USD');
  const sol = getQuote('SOL-USD');
  const gold = getQuote('GC=F');

  const fmtProfit = () => '+$' + profit.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });

  return (
    <div>
      {/* Header */}
      <div className="zth-section-header">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
          <div>
            <div className="zth-section-title">Portfolio Overview</div>
            <div className="zth-section-sub">
              <span className="zth-pulse-dot" style={{ width:6, height:6 }} />
              Live Market Data · Real-time AI Execution · Halal Only
            </div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {['1D','1W','1M','YTD'].map((t,i) => (
              <button key={t} className="zth-mono" style={{
                padding:'4px 12px', border:`1px solid ${i===1?'rgba(16,185,129,0.4)':'rgba(255,255,255,0.07)'}`,
                background: i===1?'rgba(16,185,129,0.08)':'transparent',
                color: i===1?'#10B981':'#475569',
                borderRadius:6, fontSize:10, cursor:'pointer'
              }}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(12, 1fr)', gap:16 }}>

        {/* Hero NAV card */}
        <div className="zth-glass" style={{ gridColumn:'span 8', padding:20, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(16,185,129,0.03), transparent)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', opacity:0.15 }}>
            <div className="zth-scan-line" style={{ width:'100%', height:1, background:'linear-gradient(90deg,transparent,#10B981,transparent)' }} />
          </div>
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div>
                <div className="zth-mono" style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Total Net Asset Value</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
                  <div className="zth-mono" style={{ fontSize:32, fontWeight:700, color:'#F1F5F9' }}>$2,458,910.45</div>
                  <div className="zth-mono" style={{ fontSize:16, color:'#10B981', display:'flex', alignItems:'center', gap:4 }}>
                    <ArrowUp size={14} color="#10B981" />+14.2%
                  </div>
                </div>
                <div className="zth-mono" style={{ fontSize:9, color:'#334155', marginTop:2 }}>≈ PKR 685,023,430 · {isLive ? 'Live' : 'Simulated'}</div>
              </div>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Landmark size={18} color="#10B981" />
              </div>
            </div>
            {/* SVG Chart */}
            <div style={{ height:96, width:'100%', position:'relative' }}>
              <svg viewBox="0 0 800 90" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
                <defs>
                  <linearGradient id="navGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M0,85 Q80,78 160,72 T320,55 T480,38 T640,22 T800,8" fill="none" stroke="#10B981" strokeWidth="2" className="zth-chart-line"/>
                <path d="M0,85 Q80,78 160,72 T320,55 T480,38 T640,22 T800,8 L800,90 L0,90 Z" fill="url(#navGrad)"/>
              </svg>
              <div className="zth-mono" style={{ position:'absolute', bottom:0, right:0, fontSize:9, color:'#334155' }}>7-day</div>
            </div>
          </div>
        </div>

        {/* P&L card */}
        <div className="zth-glass" style={{ gridColumn:'span 4', padding:20 }}>
          <div className="zth-mono" style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Today's P&L</div>
          <div className="zth-mono" style={{ fontSize:26, fontWeight:700, color:'#10B981', marginBottom:4 }}>{fmtProfit()}</div>
          <div className="zth-mono" style={{ fontSize:9, color:'#475569', marginBottom:16 }}>Realized: $9,850 · Unrealized: $4,380</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:60 }}>
            {[45,65,20,80,55,100].map((h,i) => (
              <div key={i} style={{
                flex:1, height:`${h}%`, borderRadius:'2px 2px 0 0',
                background: i===2?'rgba(239,68,68,0.3)': i===5?'#10B981':'rgba(16,185,129,0.25)',
                boxShadow: i===5?'0 0 8px rgba(16,185,129,0.4)':'none',
              }} />
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            {['M','T','W','T','F','T'].map((d,i) => (
              <span key={i} className="zth-mono" style={{ fontSize:8, color: i===5?'#10B981':'#334155' }}>{d}</span>
            ))}
          </div>
        </div>

        {/* Halal Filter */}
        <div className="zth-glass-green" style={{ gridColumn:'span 4', padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div className="zth-mono" style={{ fontSize:9, color:'#10B981', textTransform:'uppercase', letterSpacing:'0.1em' }}>Halal Filter Engine</div>
            <span className="zth-halal-badge">ACTIVE</span>
          </div>
          {[['Screened Out','23 assets','red',8],['Halal Compliant','94.2%','',94]].map(([label,val,c,pct])=>(
            <div key={label} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span className="zth-mono" style={{ fontSize:10, color:'#64748B' }}>{label}</span>
                <span className="zth-mono" style={{ fontSize:10, color:c==='red'?'#EF4444':'#10B981' }}>{val}</span>
              </div>
              <div className="zth-bar"><div className={`zth-bar-fill ${c}`} style={{ width:`${pct}%` }} /></div>
            </div>
          ))}
          <div className="zth-mono" style={{ fontSize:9, color:'#334155', paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            Filtered: Riba, Gambling, Alcohol, Pork, Weapons
          </div>
        </div>

        {/* Market Sessions */}
        <div className="zth-glass" style={{ gridColumn:'span 4', padding:20 }}>
          <div className="zth-mono" style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:16 }}>Active Market Sessions</div>
          {[
            { label:'Crypto (Binance)', status:'24/7 OPEN', color:'#10B981', live:true },
            { label:'NYSE / NASDAQ',    status:'CLOSED 04:30', color:'#475569', live:false },
            { label:'PSX (Karachi)',    status:'PRE-OPEN 09:15', color:'#F59E0B', live:false },
            { label:'Gold / Commodities', status:'CLOSED', color:'#475569', live:false },
            { label:'DEX Spot (24/7)', status:'OPEN', color:'#10B981', live:true },
          ].map(item => (
            <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span className="zth-pulse-dot" style={{ width:6, height:6, background:item.color, boxShadow:`0 0 6px ${item.color}`, animation:item.live?'zth-pulse 2s ease-in-out infinite':'none' }} />
                <span className="zth-mono" style={{ fontSize:10, color:item.live?'#94A3B8':'#475569' }}>{item.label}</span>
              </div>
              <span className="zth-mono" style={{ fontSize:9, color:item.color }}>{item.status}</span>
            </div>
          ))}
        </div>

        {/* AI Brain Stats */}
        <div className="zth-ai-border" style={{ gridColumn:'span 4', padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div className="zth-mono" style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:'0.1em' }}>AI Brain Stats</div>
            <Cpu size={16} color="#8B5CF6" />
          </div>
          {[
            ['Decisions Today', `${decisions}`, '#94A3B8'],
            ['Win Rate',        '72.4%',        '#10B981'],
            ['Avg Confidence',  '81.2%',        '#94A3B8'],
            ['News Scanned',    '2,341 articles','#94A3B8'],
            ['Current Action',  'ANALYZING SOL','#F59E0B'],
          ].map(([k,v,c]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span className="zth-mono" style={{ fontSize:10, color:'#475569' }}>{k}</span>
              <span className="zth-mono" style={{ fontSize:10, color:c }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Live Execution Feed */}
        <div className="zth-glass" style={{ gridColumn:'span 8', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:8 }}>
            <span className="zth-pulse-dot red" style={{ width:8, height:8 }} />
            <span className="zth-mono" style={{ fontSize:12, fontWeight:600 }}>Live Execution Feed</span>
            <span className="zth-mono" style={{ marginLeft:'auto', fontSize:9, color:'#334155' }}>Auto-updating</span>
          </div>
          <div style={{ padding:8, maxHeight:260, overflowY:'auto' }}>
            {enrichedFeed.map((item, i) => {
              const c = colorFor(item.action);
              const displayPrice = item.livePrice ? fmtPrice(item.livePrice) : item.price || '—';
              return (
                <div key={i} style={{ display:'flex', gap:10, padding:10, borderRadius:8, marginBottom:6, background:'rgba(255,255,255,0.015)', border:'1px solid transparent' }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:`rgba(${c==='#10B981'?'16,185,129':c==='#EF4444'?'239,68,68':'245,158,11'},0.1)`, border:`1px solid rgba(${c==='#10B981'?'16,185,129':c==='#EF4444'?'239,68,68':'245,158,11'},0.2)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:c }}>
                    {iconFor(item.action)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span className="zth-mono" style={{ fontSize:11, fontWeight:700, color:'#F1F5F9' }}>
                        {item.action} {item.amount} <span style={{ color:'#475569', fontWeight:400 }}>@ {displayPrice}</span>
                      </span>
                      <span className="zth-mono" style={{ fontSize:9, color:'#334155' }}>{i===0?'just now':`${(i+1)*2}m ago`}</span>
                    </div>
                    <div style={{ background:'rgba(2,3,5,0.4)', borderLeft:`2px solid ${c}40`, padding:'6px 8px', borderRadius:4 }}>
                      <span className="zth-mono" style={{ fontSize:9, color:'#64748B', display:'flex', alignItems:'flex-start', gap:4 }}>
                        <Sparkles size={11} color="#8B5CF6" />
                        <span><strong style={{ color:'#94A3B8' }}>ZAIRE:</strong> {item.reason}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Strategies */}
        <div className="zth-glass" style={{ gridColumn:'span 4', padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <span className="zth-mono" style={{ fontSize:12, fontWeight:600 }}>Active Strategies</span>
            <span className="zth-live-badge">3 LIVE</span>
          </div>
          {[
            { name:'DCA Accumulator', sub:'BTC/ETH/SOL · DCA', ret:'+3.1%', pct:72 },
            { name:'Momentum Scalper', sub:'Crypto Spot · 5m Breakouts', ret:'+1.8%', pct:58 },
            { name:'News Sentiment', sub:'All Markets · News-driven', ret:'SCANNING', pct:90, amber:true },
          ].map(s => (
            <div key={s.name} className="zth-glass" style={{ padding:12, marginBottom:8, cursor:'pointer' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span className="zth-mono" style={{ fontSize:10, fontWeight:600, color:'#94A3B8' }}>{s.name}</span>
                <span className="zth-mono" style={{ fontSize:10, color:s.amber?'#F59E0B':'#10B981' }}>{s.ret}</span>
              </div>
              <div className="zth-mono" style={{ fontSize:9, color:'#334155', marginBottom:6 }}>{s.sub}</div>
              <div className="zth-bar"><div className={`zth-bar-fill ${s.amber?'amber':''}`} style={{ width:`${s.pct}%` }} /></div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default TraderDashboard;
