import React from 'react';

const TraderAnalytics = () => {
  return (
    <div>
      <div className="zth-section-header">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
          <div>
            <div className="zth-section-title">Performance Analytics</div>
            <div className="zth-section-sub">
              Deep dive into ZAIRE's historical trading metrics.
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(12, 1fr)', gap:16 }}>
        
        {/* Metric Cards */}
        {[
          ['Net Profit (YTD)', '+42.8%', '#10B981'],
          ['Max Drawdown', '-12.4%', '#EF4444'],
          ['Win Rate', '68.2%', '#10B981'],
          ['Avg Trade Duration', '4h 12m', '#94A3B8'],
        ].map(([title, val, c]) => (
          <div key={title} className="zth-glass" style={{ gridColumn:'span 3', padding:20 }}>
            <div className="zth-mono" style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>{title}</div>
            <div className="zth-mono" style={{ fontSize:24, fontWeight:700, color:c }}>{val}</div>
          </div>
        ))}

        {/* Big Chart area */}
        <div className="zth-glass" style={{ gridColumn:'span 8', padding:20 }}>
          <div className="zth-mono" style={{ fontSize:12, fontWeight:600, marginBottom:20 }}>Cumulative Returns (YTD)</div>
          <div style={{ height:200, width:'100%', position:'relative' }}>
            <svg viewBox="0 0 800 200" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
              <defs>
                <linearGradient id="anGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[40,80,120,160].map(y => <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />)}
              
              <path d="M0,180 Q100,160 200,170 T400,120 T600,50 T800,20" fill="none" stroke="#10B981" strokeWidth="2.5" className="zth-chart-line"/>
              <path d="M0,180 Q100,160 200,170 T400,120 T600,50 T800,20 L800,200 L0,200 Z" fill="url(#anGrad)"/>
            </svg>
            {/* Months */}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'].map(m => (
                <span key={m} className="zth-mono" style={{ fontSize:9, color:'#475569' }}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Donut */}
        <div className="zth-glass" style={{ gridColumn:'span 4', padding:20, display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div className="zth-mono" style={{ fontSize:10, fontWeight:600, alignSelf:'flex-start', marginBottom:20 }}>Trade Outcomes</div>
          <div style={{ width:140, height:140, borderRadius:'50%', background:'conic-gradient(#10B981 0% 68.2%, #EF4444 68.2% 95.2%, #F59E0B 95.2% 100%)', position:'relative', marginBottom:20 }}>
             <div style={{ position:'absolute', inset:16, background:'#0b1329', borderRadius:'50%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
               <div className="zth-mono" style={{ fontSize:16, fontWeight:700, color:'#10B981' }}>68.2%</div>
               <div className="zth-mono" style={{ fontSize:8, color:'#94A3B8' }}>WIN RATE</div>
             </div>
          </div>
          <div style={{ width:'100%' }}>
             {[
               ['Wins', '68.2%', '#10B981'],
               ['Losses', '27.0%', '#EF4444'],
               ['Break Even', '4.8%', '#F59E0B'],
             ].map(([n,p,c]) => (
               <div key={n} style={{ display:'flex', justifyContent:'space-between', marginBottom:6, alignItems:'center' }}>
                 <span className="zth-mono" style={{ fontSize:9, color:'#94A3B8', display:'flex', alignItems:'center', gap:6 }}>
                   <span style={{ width:6, height:6, borderRadius:'50%', background:c }} />
                   {n}
                 </span>
                 <span className="zth-mono" style={{ fontSize:9, fontWeight:600 }}>{p}</span>
               </div>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
};

export default TraderAnalytics;
