// src/Navbar.js
import React, { useEffect, useRef, useState } from 'react';
import './Navbar.css';

function Navbar() {
  const logoCanvasRef = useRef(null);
  const [activeItem, setActiveItem] = useState('HOME');
  const [activeMode, setActiveMode] = useState('VOICE');
  const [clock, setClock] = useState({ timeStr: '00:00:00', dateStr: 'THU 00:00' });

  useEffect(() => {
    // Clock tick
    const tick = () => {
      const now = new Date();
      const hms = [now.getHours(), now.getMinutes(), now.getSeconds()]
        .map(n => String(n).padStart(2, '0'))
        .join(':');
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      setClock({
        timeStr: hms,
        dateStr: days[now.getDay()] + ' ' + hms.slice(0, 5)
      });
    };

    const interval = setInterval(tick, 1000);
    tick();

    // Context graphic animation
    const lc = logoCanvasRef.current;
    if (!lc) return;
    const lctx = lc.getContext('2d');
    let lt = 0;
    let animationId;

    const drawLogo = () => {
      lt += 0.025;
      lctx.clearRect(0, 0, 60, 60);
      const cx = 30, cy = 30;
      [22, 16, 10].forEach((r, i) => {
        const speeds = [1, -1.6, 2.2];
        const a = lt * speeds[i];
        const dashL = [1.8, 1.2, 0.8][i];

        lctx.beginPath();
        lctx.arc(cx, cy, r, a, a + dashL);
        lctx.strokeStyle = `rgba(0,212,255,${[0.7, 0.5, 0.4][i]})`;
        lctx.lineWidth = [1.5, 1, 0.8][i];
        lctx.stroke();

        lctx.beginPath();
        lctx.arc(cx, cy, r, a + Math.PI, a + Math.PI + dashL * 0.5);
        lctx.strokeStyle = `rgba(0,212,255,${[0.3, 0.2, 0.15][i]})`;
        lctx.lineWidth = [1, 0.7, 0.5][i];
        lctx.stroke();
      });

      const coreR = 5 + Math.sin(lt * 2) * 0.8;
      const g = lctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      g.addColorStop(0, 'rgba(0,212,255,0.9)');
      g.addColorStop(1, 'rgba(0,212,255,0)');

      lctx.beginPath();
      lctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      lctx.fillStyle = g;
      lctx.fill();

      animationId = requestAnimationFrame(drawLogo);
    };

    drawLogo();

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const { timeStr, dateStr } = clock;

  const navItems = [
    {
      id: 'HOME',
      icon: (
        <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'DASHBOARD',
      icon: (
        <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
      )
    },
    {
      id: 'COMMAND',
      badge: true,
      icon: (
        <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      )
    },
    'DIVIDER',
    {
      id: 'MEMORY',
      icon: (
        <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M1 6l11 6 11-6M1 18l11-6 11 6" />
        </svg>
      )
    },
    {
      id: 'NEURAL',
      icon: (
        <svg className="ni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
      )
    }
  ];

  return (
    <div className="navbar-container">
      <div className="nav-wrap">
        <div style={{ position: 'relative' }}>
          <nav className="nav">
            <div className="nav-scan"></div>
            <div className="corner-accent ca-tl"></div>
            <div className="corner-accent ca-tr"></div>
            <div className="corner-accent ca-bl"></div>

            {/* LOGO */}
            <div className="logo-block">
              <div className="logo-arc">
                <canvas ref={logoCanvasRef} width="60" height="60"></canvas>
              </div>
              <div>
                <div className="logo-text">ZAIRE</div>
                <div className="logo-sub">ZAIRE AI REASONING ENTITY · v1.0</div>
              </div>
            </div>

            {/* NAV LINKS */}
            <div className="nav-links">
              {navItems.map((item, idx) => {
                if (item === 'DIVIDER') return <div key="nav-divider-primary" className="nav-divider"></div>;
                return (
                  <div
                    key={item.id}
                    className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
                    onClick={() => setActiveItem(item.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setActiveItem(item.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    style={item.badge ? { position: 'relative' } : {}}
                  >
                    {item.icon}
                    {item.id}
                    {item.badge && <div className="badge"></div>}
                  </div>
                );
              })}
            </div>

            {/* SYSTEM CONTROLS (Clock Only Now) */}
            <div className="sys-controls">
              <div className="sys-status">
                <div className="status-row">
                  <div className="status-dot"></div>
                  <div className="status-txt">ONLINE</div>
                </div>
                <div className="status-sub" id="clockDisp">{timeStr}</div>
              </div>
            </div>
          </nav>
        </div>
      </div>

      <div className="sec-strip">
        <div className="sec-left">
          <span className="sec-item">ZAIRE CORE</span>
          <span className="breadcrumb-sep">›</span>
          <span className="sec-item" style={{ color: 'rgba(0,212,255,0.7)' }}>v1.0</span>
          <span className="sec-item" style={{ marginLeft: '15px', color: 'var(--accent-green)' }}>AUTH: VERIFIED</span>
          <span className="breadcrumb-sep">›</span>
          <span className="sec-item" style={{ color: 'rgba(0,212,255,0.55)' }}>{activeItem}</span>
        </div>
        <div className="sec-right">
          <span className="sec-item">KARACHI · PKT</span>
          <span className="clock-val">{dateStr}</span>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
