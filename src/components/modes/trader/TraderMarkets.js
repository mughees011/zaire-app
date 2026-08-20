import React, { useState } from 'react';
import { Sparkles, Menu } from 'lucide-react';

const TraderMarkets = ({ traderData }) => {
  const { prices, fmtPrice, fmtPercent, fmtChange } = traderData;
  const [timeframe, setTimeframe] = useState('4H');

  const btc = prices['BTC-USD'];
  const isUp = btc && btc.changePercent > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Bar with BTC price and chart */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(12, 1fr)', gap:16 }}>
        
        {/* Market Context Box */}
        <div className="zth-glass" style={{ gridColumn:'span 8', padding:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:20, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div className="zth-mono" style={{ fontSize:10, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.1em' }}>Primary Context</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:12, marginTop:4 }}>
                <span className="zth-mono" style={{ fontSize:28, fontWeight:700, color:'#F1F5F9' }}>{btc ? fmtPrice(btc.price) : '...'}</span>
                <span className="zth-mono" style={{ fontSize:14, color: isUp?'#10B981':'#EF4444' }}>{btc ? fmtPercent(btc.changePercent) : '...'}</span>
              </div>
              <div className="zth-mono" style={{ fontSize:10, color:'#64748B', marginTop:4 }}>BTC/USD · Spot · Binance</div>
            </div>
            <div style={{ textAlign:'right' }}>
               <div className="zth-mono" style={{ fontSize:10, color:'#475569', marginBottom:8 }}>AI TREND FORECAST</div>
               <div className="zth-mono" style={{ fontSize:16, fontWeight:700, color:'#10B981' }}>BULLISH (82%)</div>
            </div>
          </div>
          
          {/* Main Chart */}
          <div style={{ flex:1, position:'relative', minHeight:160, background:'linear-gradient(180deg, rgba(16,185,129,0.05) 0%, rgba(0,0,0,0) 100%)', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <svg viewBox="0 0 1000 200" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {/* Grid */}
              {[40,80,120,160].map(y => <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>)}
              <path d="M0,150 Q200,160 400,120 T800,80 T1000,40" fill="none" stroke="#10B981" strokeWidth="2.5" className="zth-chart-line"/>
              <path d="M0,150 Q200,160 400,120 T800,80 T1000,40 L1000,200 L0,200 Z" fill="url(#chartGrad)"/>
              
              {/* Candlesticks overlay */}
              {[
                { x:100, y:145, h:20, type:'up' },
                { x:200, y:155, h:15, type:'down' },
                { x:300, y:130, h:30, type:'up' },
                { x:400, y:120, h:18, type:'up' },
                { x:500, y:100, h:25, type:'up' },
                { x:600, y:110, h:20, type:'down' },
                { x:700, y:90,  h:25, type:'up' },
                { x:800, y:80,  h:15, type:'up' },
                { x:900, y:60,  h:28, type:'up' },
              ].map((c, i) => (
                <g key={i}>
                  <line x1={c.x} y1={c.y-c.h/2-5} x2={c.x} y2={c.y+c.h/2+5} stroke={c.type==='up'?'#10B981':'#EF4444'} strokeWidth="1" opacity="0.5" />
                  <rect x={c.x-3} y={c.y-c.h/2} width="6" height={c.h} fill={c.type==='up'?'#10B981':'#EF4444'} />
                </g>
              ))}
            </svg>
            <div style={{ position:'absolute', bottom:10, left:16, display:'flex', gap:10 }}>
              <span className="zth-mono" style={{ fontSize:9, color:'#10B981', display:'flex', alignItems:'center', gap:4, background:'rgba(16,185,129,0.1)', padding:'2px 6px', borderRadius:4 }}>
                <Sparkles size={12} /> AI Trend Active
              </span>
            </div>
            <div style={{ position:'absolute', bottom:10, right:16, display:'flex', gap:10 }}>
               {['1H','4H','1D','1W'].map(tf => (
                 <button 
                   key={tf} 
                   onClick={() => setTimeframe(tf)}
                   className="zth-mono" 
                   style={{ 
                     fontSize:10, 
                     color: timeframe === tf ? '#10B981' : '#64748B', 
                     fontWeight: timeframe === tf ? 700 : 400, 
                     cursor:'pointer',
                     background: 'transparent',
                     border: 'none',
                     padding: '4px 8px',
                     outline: 'none'
                   }}
                 >
                   {tf}
                 </button>
               ))}
            </div>
          </div>
        </div>

        {/* Watchlist */}
        <div className="zth-glass" style={{ gridColumn:'span 4', padding:16, display:'flex', flexDirection:'column' }}>
          <div className="zth-mono" style={{ fontSize:10, fontWeight:600, marginBottom:16 }}>Active Universe Watchlist</div>
          <div style={{ flex:1, overflowY:'auto', paddingRight:4 }}>
            {Object.keys(prices).filter(sym => prices[sym] && (prices[sym].isCrypto || prices[sym].isCommodity || prices[sym].isHalal)).map(sym => {
              const data = prices[sym];
              if (!data) return null;
              const up = data.changePercent >= 0;
              return (
                <div key={sym} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'rgba(255,255,255,0.02)', borderRadius:6, marginBottom:6, border:'1px solid transparent', cursor:'pointer' }} className="zth-nav-item">
                  <div>
                    <div className="zth-mono" style={{ fontSize:11, fontWeight:600, color:'#F1F5F9' }}>{data.symbol}</div>
                    <div className="zth-mono" style={{ fontSize:9, color:'#64748B' }}>{data.isCrypto?'Crypto':data.isCommodity?'Commodity':'Stock'}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div className="zth-mono" style={{ fontSize:11, color:'#F1F5F9' }}>{fmtPrice(data.price)}</div>
                    <div className="zth-mono" style={{ fontSize:9, color: up?'#10B981':'#EF4444' }}>{fmtChange(data.changePercent)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(12, 1fr)', gap:16 }}>
        {/* Order Book */}
        <div className="zth-glass" style={{ gridColumn:'span 4', padding:16 }}>
           <div className="zth-mono" style={{ fontSize:10, fontWeight:600, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
             <Menu size={12} color="#475569" />Order Book
           </div>
           <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
             {/* Sells */}
             {[68450.2, 68445.1, 68430.8, 68425.5, 68420.0].map((p,i) => (
               <div key={`sell-${i}`} style={{ display:'flex', justifyContent:'space-between', position:'relative', padding:'4px 0' }}>
                 <div style={{ position:'absolute', right:0, top:0, bottom:0, width:`${Math.random()*80}%`, background:'rgba(239,68,68,0.1)' }} />
                 <span className="zth-mono" style={{ fontSize:10, color:'#EF4444' }}>{p.toFixed(1)}</span>
                 <span className="zth-mono" style={{ fontSize:10, color:'#94A3B8' }}>{(Math.random()*2).toFixed(3)}</span>
               </div>
             ))}
             <div className="zth-mono" style={{ textAlign:'center', margin:'8px 0', fontSize:14, fontWeight:700, color:isUp?'#10B981':'#EF4444' }}>
               {btc ? btc.price.toFixed(1) : '...'}
             </div>
             {/* Buys */}
             {[68410.5, 68405.0, 68400.2, 68390.8, 68385.1].map((p,i) => (
               <div key={`buy-${i}`} style={{ display:'flex', justifyContent:'space-between', position:'relative', padding:'4px 0' }}>
                 <div style={{ position:'absolute', right:0, top:0, bottom:0, width:`${Math.random()*80}%`, background:'rgba(16,185,129,0.1)' }} />
                 <span className="zth-mono" style={{ fontSize:10, color:'#10B981' }}>{p.toFixed(1)}</span>
                 <span className="zth-mono" style={{ fontSize:10, color:'#94A3B8' }}>{(Math.random()*2).toFixed(3)}</span>
               </div>
             ))}
           </div>
        </div>

        {/* AI Insight */}
        <div className="zth-ai-border" style={{ gridColumn:'span 8', padding:20, display:'flex', flexDirection:'column', justifyContent:'center' }}>
           <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
             <div className="zth-pulse-dot violet" style={{ width:8, height:8 }} />
             <div className="zth-mono" style={{ fontSize:10, color:'#8B5CF6', textTransform:'uppercase', letterSpacing:'0.1em' }}>
               <Sparkles size={11} style={{ display:'inline-block', verticalAlign:'text-bottom', marginRight:4 }} />AI Insight Generated
             </div>
           </div>
           <p className="zth-mono" style={{ fontSize:14, color:'#F1F5F9', lineHeight:1.6, margin:0 }}>
             "Bitcoin is currently consolidating just below the $69,000 resistance block. Order book analysis shows heavy sell walls at $68,500, but increasing spot buying pressure on Binance and Coinbase. Moving averages are aligned bullishly on the 4H timeframe. ZAIRE recommends a <strong style={{color:'#10B981'}}>BUY</strong> at current levels with a stop-loss at $66,200."
           </p>
        </div>
      </div>

    </div>
  );
};

export default TraderMarkets;
