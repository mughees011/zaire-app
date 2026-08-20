import React, { useState, useEffect, useRef, useCallback } from 'react';
import useTraderData from './useTraderData';
import './ZaireTraderHub.css';

// ─── Sub-page imports ─────────────────────────────────────────────────────────
import TraderDashboard    from './trader/TraderDashboard';
import TraderMarkets      from './trader/TraderMarkets';
import TraderIntelligence from './trader/TraderIntelligence';
import TraderPortfolio    from './trader/TraderPortfolio';
import TraderStrategies   from './trader/TraderStrategies';
import TraderAnalytics    from './trader/TraderAnalytics';
import { Brain, LayoutDashboard, LineChart, Cpu, PieChart, SlidersHorizontal, BarChart3, ShieldCheck } from 'lucide-react';

const PAGES = [
  { id: 'dashboard',     label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'markets',       label: 'Markets',         icon: LineChart },
  { id: 'intelligence',  label: 'Intelligence',    icon: Cpu,     badge: 'LIVE' },
  { id: 'portfolio',     label: 'Portfolio',       icon: PieChart },
  { id: 'strategies',    label: 'Strategies',      icon: SlidersHorizontal },
  { id: 'analytics',     label: 'Analytics',       icon: BarChart3 },
];

const ZaireTraderHub = ({ apiBase = 'http://localhost:3001' }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [uptime, setUptime]         = useState(127 * 3600 + 43 * 60 + 21);
  const [scanCountdown, setScan]    = useState(28);
  const [decisions, setDecisions]   = useState(847);
  const [profit, setProfit]         = useState(14230.45);
  const [clock, setClock]           = useState('');

  const traderData = useTraderData(apiBase);
  const { prices, isLive, fmtPrice, fmtPercent } = traderData;

  // ── Live uptime clock ──
  useEffect(() => {
    const t = setInterval(() => {
      setUptime(u => u + 1);
      setScan(s => (s <= 0 ? 29 : s - 1));
      // decisions tick occasionally
      if (Math.random() > 0.85) setDecisions(d => d + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // ── Profit ticker ──
  useEffect(() => {
    const t = setInterval(() => {
      setProfit(p => Math.max(0, p + (Math.random() - 0.35) * 45));
    }, 3500);
    return () => clearInterval(t);
  }, []);

  // ── PKT Clock ──
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const opts = { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
      setClock(now.toLocaleTimeString('en-US', opts) + ' PKT');
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const fmtUptime = () => {
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = uptime % 60;
    return `${String(h).padStart(3,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const fmtProfit = () => '+$' + profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── Build ticker items from real prices ──
  const tickerItems = prices.slice(0, 10).map(p => ({
    label: `${p.displaySymbol}/USD`,
    price: fmtPrice(p.price),
    change: fmtPercent(p.changePercent),
    up: (p.changePercent ?? 0) >= 0,
  }));
  const doubledTicker = [...tickerItems, ...tickerItems]; // seamless loop

  const renderPage = () => {
    const sharedProps = { traderData, apiBase };
    switch (activePage) {
      case 'dashboard':    return <TraderDashboard    {...sharedProps} decisions={decisions} profit={profit} />;
      case 'markets':      return <TraderMarkets      {...sharedProps} />;
      case 'intelligence': return <TraderIntelligence {...sharedProps} />;
      case 'portfolio':    return <TraderPortfolio    {...sharedProps} />;
      case 'strategies':   return <TraderStrategies   {...sharedProps} />;
      case 'analytics':    return <TraderAnalytics    {...sharedProps} />;
      default:             return <TraderDashboard    {...sharedProps} decisions={decisions} profit={profit} />;
    }
  };

  return (
    <div className="zth-root">
      <div className="zth-grid-bg" />

      {/* ── STATUS BAR ── */}
      <div className="zth-status-bar">
        <div className="zth-status-left">
          <span style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span className="zth-status-dot" />
            <span className="zth-mono" style={{ fontSize:10, color:'#10B981', fontWeight:700 }}>ZAIRE DAEMON ONLINE</span>
          </span>
          <span className="zth-status-text">Uptime: <b>{fmtUptime()}</b></span>
          <span className="zth-status-text" style={{ display:'none' }}>Decisions: <b>{decisions}</b></span>
          <span className="zth-status-text">Profit: <b style={{ color:'#10B981' }}>{fmtProfit()}</b></span>
        </div>
        <div className="zth-status-right">
          <span className="zth-halal-badge">HALAL ✓</span>
          <span className={`zth-live-badge ${isLive ? '' : 'offline'}`}>
            {isLive ? '● LIVE DATA' : '○ SIM DATA'}
          </span>
          <span className="zth-status-text">Scan: {String(scanCountdown).padStart(2,'0')}s</span>
          <span className="zth-status-text" style={{ display:'none' }}>{clock}</span>
        </div>
      </div>

      {/* ── TICKER BAR ── */}
      <div className="zth-ticker" style={{ background:'rgba(11,19,41,0.5)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'4px 0' }}>
        <div className="zth-ticker-inner">
          {doubledTicker.map((t, i) => (
            <span key={i} className="zth-ticker-item">
              {t.label}{' '}
              <span className={t.up ? 'up' : 'dn'}>{t.price} {t.change}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── LAYOUT ── */}
      <div className="zth-layout">

        {/* ── SIDEBAR ── */}
        <aside className="zth-sidebar">
          {/* Identity */}
          <div className="zth-identity">
            <div className="zth-identity-icon">
              <Brain size={18} />
              <span className="zth-identity-dot" />
            </div>
            <div>
              <div className="zth-identity-name">ZAIRE</div>
              <div className="zth-identity-sub">Trader v4.2</div>
            </div>
          </div>

          {/* Nav */}
          <div className="zth-nav-group-label">Main</div>
          {PAGES.map(page => {
            const Icon = page.icon;
            return (
              <div
                key={page.id}
                className={`zth-nav-item ${activePage === page.id ? 'active' : ''}`}
                onClick={() => setActivePage(page.id)}
              >
                <div className="icon"><Icon size={15} /></div>
                {page.label}
                {page.badge && <span className="zth-nav-badge">{page.badge}</span>}
              </div>
            );
          })}

          <div className="zth-nav-group-label">System</div>
          <div className="zth-nav-item">
            <div className="icon"><ShieldCheck size={15} /></div>
            Halal Engine
            <span className="zth-pulse-dot" style={{ marginLeft:'auto', width:6, height:6 }} />
          </div>

          {/* Sidebar Stats */}
          <div className="zth-sidebar-stats">
            <div className="zth-sidebar-stats-inner">
              <div className="zth-mono" style={{ fontSize:9, color:'#334155', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>ZAIRE Status</div>
              {[['CPU','12%',12],['RAM','284MB',28],['Latency','18ms',8]].map(([label, val, pct]) => (
                <div key={label} style={{ marginBottom:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                    <span className="zth-mono" style={{ fontSize:9, color:'#475569' }}>{label}</span>
                    <span className="zth-mono" style={{ fontSize:9, color:'#10B981' }}>{val}</span>
                  </div>
                  <div className="zth-bar"><div className="zth-bar-fill" style={{ width:`${pct}%` }} /></div>
                </div>
              ))}
            </div>
            <button className="zth-brain-btn" onClick={() => setActivePage('intelligence')}>
              ⚡ VIEW BRAIN
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="zth-main">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default ZaireTraderHub;
