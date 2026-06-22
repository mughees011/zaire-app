import React, { useState, useEffect } from 'react';
import { Activity, List, Network, ShieldCheck } from 'lucide-react';
import './TraderModeV2.css';

const TraderModeV2 = () => {
  const [activeAsset, setActiveAsset] = useState('BTC/USD');
  const [scanLinePos, setScanLinePos] = useState(0);

  // Animate a scanline for high-tech effect in the chart
  useEffect(() => {
    const interval = setInterval(() => {
      setScanLinePos(prev => (prev > 100 ? 0 : prev + 1));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const watchlist = [
    { pair: 'BTC/USD', price: '71,230.50', change: '+2.41%', up: true },
    { pair: 'ETH/USD', price: '3,820.15', change: '-0.82%', up: false },
    { pair: 'SOL/USD', price: '165.20', change: '+5.10%', up: true },
    { pair: 'NVDA', price: '125.80', change: '+1.20%', up: true },
    { pair: 'AAPL', price: '210.45', change: '-0.30%', up: false }
  ];

  const signals = [
    { time: '10:45', type: 'BUY', msg: 'Technical Analyst detected ascending triangle breakout.' },
    { time: '10:42', type: 'ALERT', msg: 'Whale accumulated 1,500 BTC on Binance.' },
    { time: '10:15', type: 'SELL', msg: 'Risk Engine warns of rising macro volatility.' }
  ];

  return (
    <div className="trader-v2-container">
      <div className="t-cyber-grid"></div>
      
      {/* ROW 1: DECISION HERO (What should I do next?) */}
      <div className="t-decision-hero">
        
        {/* Left: The Ultimate Recommendation */}
        <div className="t-decision-action">
          <div className="d-asset-name">{activeAsset}{' // '}ZAIRE AI PREDICTION</div>
          <div className="d-action-title">TARGET ACTION</div>
          <div className="d-action-val">STRONG BUY</div>
        </div>

        {/* Middle: Core Metrics */}
        <div className="t-decision-metrics">
          <div className="d-metric-box">
            <span className="d-m-label">CONFIDENCE</span>
            <span className="d-m-val">84.5%</span>
          </div>
          <div className="d-metric-box">
            <span className="d-m-label">TARGET PRICE</span>
            <span className="d-m-val">$74,000</span>
          </div>
          <div className="d-metric-box">
            <span className="d-m-label">SYSTEM RISK</span>
            <span className="d-m-val text-yellow-400">MEDIUM</span>
          </div>
          <div className="d-metric-box">
            <span className="d-m-label">EST. ROI</span>
            <span className="d-m-val text-green-400">+4.2%</span>
          </div>
        </div>

        {/* Right: Swarm Reasoning */}
        <div className="t-decision-swarm">
          <div className="d-swarm-header">
            SWARM CONSENSUS MATRIX
            <span className="text-white bg-green-500/20 px-2 py-1 rounded font-mono">SCORE: 82%</span>
          </div>
          <div className="d-swarm-agents">
            <div className="d-agent-tag">
              <span className="d-agent-name">TECHNICAL</span>
              <span className="d-agent-signal sig-buy">BUY</span>
            </div>
            <div className="d-agent-tag">
              <span className="d-agent-name">SENTIMENT</span>
              <span className="d-agent-signal sig-buy">BUY</span>
            </div>
            <div className="d-agent-tag">
              <span className="d-agent-name">WHALE</span>
              <span className="d-agent-signal sig-buy">BUY</span>
            </div>
            <div className="d-agent-tag">
              <span className="d-agent-name">MACRO</span>
              <span className="d-agent-signal sig-hold">HOLD</span>
            </div>
            <div className="d-agent-tag">
              <span className="d-agent-name">RISK</span>
              <span className="d-agent-signal sig-hold">HOLD</span>
            </div>
          </div>
          <div className="d-swarm-reason">
            <strong>REASONING:</strong> Whale accumulation detected. Bullish sentiment rising across crypto-native social networks. Volume expansion confirmed on the 4H timeframe.
          </div>
        </div>
      </div>

      {/* ROW 2: WATCHLIST & CHART */}
      <div className="t-middle-row">
        
        {/* Watchlist */}
        <div className="t-panel t-watchlist-panel">
          <div className="t-panel-header"><List size={14} /> LIVE WATCHLIST</div>
          <div className="t-wl-list">
            {watchlist.map(a => (
              <div 
                key={a.pair} 
                className={`t-wl-row ${activeAsset === a.pair ? 'active' : ''}`}
                onClick={() => setActiveAsset(a.pair)}
              >
                <span className="wl-name">{a.pair}</span>
                <span className="wl-price">{a.price}</span>
                <span className={`wl-change ${a.up ? 'up' : 'down'}`}>
                  {a.up ? '+' : ''}{a.change}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* High-Tech Chart */}
        <div className="t-panel t-chart-panel">
          <div className="t-panel-header justify-between">
            <span className="flex items-center gap-2"><Activity size={14} /> {activeAsset} PRICE ACTION MATRIX</span>
            <div className="flex gap-2 text-xs font-mono text-gray-400">
              <span className="bg-white/5 px-2 py-1 rounded hover:text-white cursor-pointer transition">15M</span>
              <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded cursor-pointer transition">1H</span>
              <span className="bg-white/5 px-2 py-1 rounded hover:text-white cursor-pointer transition">4H</span>
              <span className="bg-white/5 px-2 py-1 rounded hover:text-white cursor-pointer transition">1D</span>
            </div>
          </div>
          
          <div className="t-svg-container">
            <div className="t-scanline" style={{ top: scanLinePos + '%' }}></div>
            <svg viewBox="0 0 800 300" className="t-crypto-chart" preserveAspectRatio="none">
              <defs>
                <linearGradient id="upGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(0, 255, 136, 0.5)" />
                  <stop offset="100%" stopColor="rgba(0, 255, 136, 0)" />
                </linearGradient>
              </defs>
              <path d="M 0 50 L 800 50 M 0 100 L 800 100 M 0 150 L 800 150 M 0 200 L 800 200 M 0 250 L 800 250" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" />
              <path d="M 100 0 L 100 300 M 200 0 L 200 300 M 300 0 L 300 300 M 400 0 L 400 300 M 500 0 L 500 300 M 600 0 L 600 300 M 700 0 L 700 300" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" />
              
              <path className="t-path-anim" d="M 0 250 Q 100 200 200 220 T 400 150 T 600 80 T 800 50" stroke="#00ff88" strokeWidth="3" fill="none" filter="drop-shadow(0px 0px 8px #00ff88)" />
              <path d="M 0 250 Q 100 200 200 220 T 400 150 T 600 80 T 800 50 L 800 300 L 0 300 Z" fill="url(#upGrad)" />
              
              <g className="t-candlesticks">
                <line x1="50" y1="200" x2="50" y2="280" stroke="#ff3366" strokeWidth="2" />
                <rect x="46" y="220" width="8" height="40" fill="#ff3366" />
                
                <line x1="150" y1="180" x2="150" y2="240" stroke="#00ff88" strokeWidth="2" />
                <rect x="146" y="190" width="8" height="30" fill="#00ff88" />
                
                <line x1="250" y1="150" x2="250" y2="230" stroke="#00ff88" strokeWidth="2" />
                <rect x="246" y="150" width="8" height="50" fill="#00ff88" />

                <line x1="350" y1="120" x2="350" y2="190" stroke="#00ff88" strokeWidth="2" />
                <rect x="346" y="130" width="8" height="40" fill="#00ff88" />

                <line x1="450" y1="100" x2="450" y2="160" stroke="#ff3366" strokeWidth="2" />
                <rect x="446" y="110" width="8" height="40" fill="#ff3366" />
                
                <line x1="550" y1="60" x2="550" y2="140" stroke="#00ff88" strokeWidth="2" />
                <rect x="546" y="70" width="8" height="50" fill="#00ff88" />

                <line x1="650" y1="40" x2="650" y2="100" stroke="#00ff88" strokeWidth="2" />
                <rect x="646" y="50" width="8" height="30" fill="#00ff88" />
              </g>

              <circle cx="800" cy="50" r="6" fill="#00ff88" className="t-pulse-point" />
              <circle cx="800" cy="50" r="15" fill="none" stroke="#00ff88" className="t-pulse-ring" />
            </svg>
          </div>
        </div>
      </div>

      {/* ROW 3: SIGNALS & RISK */}
      <div className="t-bottom-row">
        
        {/* AI Signals */}
        <div className="t-panel t-signals-panel">
          <div className="t-panel-header"><Network size={14} /> LIVE SWARM SIGNALS</div>
          <div className="t-signals-feed">
            {signals.map((sig, i) => (
              <div key={i} className={`sig-row ${sig.type.toLowerCase()}`}>
                <span className="sig-time">{sig.time}</span>
                <span className={`sig-badge ${sig.type.toLowerCase()}`}>{sig.type}</span>
                <span className="sig-msg">{sig.msg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Engine */}
        <div className="t-panel t-risk-engine-panel">
          <div className="t-panel-header"><ShieldCheck size={14} className="text-green-400" /> RISK ENGINE TELEMETRY</div>
          <div className="risk-content">
            <div className="risk-score-box">
              <div className="risk-circle">32</div>
              <span className="risk-label">RISK INDEX</span>
            </div>
            <div className="risk-details">
              <div className="risk-bar-wrap">
                <div className="rb-label"><span>VOLATILITY</span> <span>LOW</span></div>
                <div className="rb-bg"><div className="rb-fill" style={{width: '30%'}}></div></div>
              </div>
              <div className="risk-bar-wrap">
                <div className="rb-label"><span>LIQUIDATION THREAT</span> <span>MINIMAL</span></div>
                <div className="rb-bg"><div className="rb-fill" style={{width: '15%'}}></div></div>
              </div>
              <div className="risk-bar-wrap">
                <div className="rb-label"><span>MACRO EXPOSURE</span> <span className="text-yellow-400">ELEVATED</span></div>
                <div className="rb-bg"><div className="rb-fill warn" style={{width: '65%'}}></div></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TraderModeV2;
