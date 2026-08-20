import React from 'react';

const TraderPortfolio = () => {
  return (
    <div>
      <div className="zth-section-header">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
          <div>
            <div className="zth-section-title">Portfolio & History</div>
            <div className="zth-section-sub">
              Track current allocations and past execution logs.
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(12, 1fr)', gap:16 }}>
        <div className="zth-glass" style={{ gridColumn:'span 4', padding:20, display:'flex', flexDirection:'column', alignItems:'center' }}>
           <div className="zth-mono" style={{ fontSize:10, fontWeight:600, alignSelf:'flex-start', marginBottom:20 }}>Asset Allocation</div>
           {/* Mock Donut */}
           <div style={{ width:160, height:160, borderRadius:'50%', background:'conic-gradient(#10B981 0% 45%, #8B5CF6 45% 70%, #F59E0B 70% 85%, #334155 85% 100%)', position:'relative', marginBottom:24 }}>
             <div style={{ position:'absolute', inset:20, background:'#0b1329', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
               <div className="zth-mono" style={{ fontSize:14, fontWeight:700, color:'#F1F5F9' }}>4 Assets</div>
             </div>
           </div>
           <div style={{ width:'100%' }}>
             {[
               ['Bitcoin', '45%', '#10B981'],
               ['Ethereum', '25%', '#8B5CF6'],
               ['Solana', '15%', '#F59E0B'],
               ['Cash (USDC)', '15%', '#334155'],
             ].map(([n,p,c]) => (
               <div key={n} style={{ display:'flex', justifyContent:'space-between', marginBottom:8, alignItems:'center' }}>
                 <span className="zth-mono" style={{ fontSize:10, color:'#94A3B8', display:'flex', alignItems:'center', gap:6 }}>
                   <span style={{ width:8, height:8, borderRadius:'50%', background:c }} />
                   {n}
                 </span>
                 <span className="zth-mono" style={{ fontSize:10, fontWeight:600 }}>{p}</span>
               </div>
             ))}
           </div>
        </div>

        <div className="zth-glass" style={{ gridColumn:'span 8', padding:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between' }}>
            <span className="zth-mono" style={{ fontSize:10, fontWeight:600 }}>Execution History</span>
            <span className="zth-mono" style={{ fontSize:9, color:'#475569' }}>Last 50 trades</span>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'rgba(255,255,255,0.02)' }}>
                  {['Time','Asset','Action','Price','Amount','ZAIRE Reasoning'].map(h => (
                    <th key={h} className="zth-mono" style={{ fontSize:8, color:'#475569', textTransform:'uppercase', padding:'10px 16px', textAlign:'left', fontWeight:400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['10:42 AM','BTC/USD','BUY','$64,230.50','0.15','Breakout confirmed on 1H chart. RSI resetting.'],
                  ['09:15 AM','TSLA','SELL','$215.10','50','Resistance met. Macro volatility increasing.'],
                  ['Yesterday','ETH/USD','BUY','$3,420.00','1.5','DCA protocol active. Undervalued vs historical.'],
                  ['Yesterday','GC=F','BUY','$2,040.00','10','Gold futures added as inflation hedge. Halal.'],
                  ['Oct 12','AAPL','SELL','$179.20','100','Taking profits before earnings report.'],
                  ['Oct 11','SOL/USD','BUY','$142.50','25','Momentum scalper strategy signal fired.'],
                ].map((r,i) => (
                  <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.02)' }}>
                    <td className="zth-mono" style={{ fontSize:10, color:'#64748B', padding:'12px 16px' }}>{r[0]}</td>
                    <td className="zth-mono" style={{ fontSize:10, color:'#F1F5F9', padding:'12px 16px' }}>{r[1]}</td>
                    <td className="zth-mono" style={{ fontSize:10, padding:'12px 16px' }}>
                      <span style={{ color:r[2]==='BUY'?'#10B981':'#EF4444', background:`rgba(${r[2]==='BUY'?'16,185,129':'239,68,68'},0.1)`, padding:'2px 6px', borderRadius:3, fontWeight:600 }}>{r[2]}</span>
                    </td>
                    <td className="zth-mono" style={{ fontSize:10, color:'#94A3B8', padding:'12px 16px' }}>{r[3]}</td>
                    <td className="zth-mono" style={{ fontSize:10, color:'#94A3B8', padding:'12px 16px' }}>{r[4]}</td>
                    <td className="zth-mono" style={{ fontSize:9, color:'#64748B', padding:'12px 16px', maxWidth:200, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r[5]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraderPortfolio;
