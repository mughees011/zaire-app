import React, { useEffect, useMemo, useState } from 'react';
import { emitEliteBusEvent } from './eliteBus';
import './EliteHUDWrapper.css';

const STATE_LABELS = {
  idle: 'IDLE',
  loading: 'LOADING',
  active: 'ACTIVE',
  warning: 'WARNING',
  error: 'ERROR',
  locked: 'LOCKED',
  streaming: 'STREAMING',
  syncing: 'SYNCING',
  thinking: 'THINKING',
  offline: 'OFFLINE'
};

const getStateTone = (state, accent) => {
  switch (state) {
    case 'warning':
      return '#ffbf60';
    case 'error':
      return '#ff6b6b';
    case 'locked':
      return '#a58cff';
    case 'streaming':
      return '#4dffde';
    case 'syncing':
      return '#89f0ff';
    case 'thinking':
      return '#9f8cff';
    case 'offline':
      return '#7f93a7';
    case 'active':
    case 'loading':
    case 'idle':
    default:
      return accent;
  }
};

const WrapperControl = ({ label, onClick, active = false }) => (
  <button
    type="button"
    className={`elite-wrapper-control ${active ? 'active' : ''}`}
    onClick={onClick}
    title={label}
    aria-label={label}
  >
    {label}
  </button>
);

export default function EliteHUDWrapper({
  blueprint,
  accentColor = '#00d4ff',
  componentState = 'idle',
  statusText = 'STANDBY',
  icon = '⚡',
  children,
  componentKey,
  title
}) {
  const [isPinned, setIsPinned] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const stateTone = useMemo(
    () => getStateTone(componentState, accentColor),
    [componentState, accentColor]
  );

  useEffect(() => {
    emitEliteBusEvent('component-mounted', {
      componentKey,
      componentId: blueprint?.id,
      category: blueprint?.meta?.category
    });
  }, [componentKey, blueprint]);

  useEffect(() => {
    emitEliteBusEvent('component-state', {
      componentKey,
      componentId: blueprint?.id,
      state: componentState,
      statusText
    });
  }, [componentKey, blueprint, componentState, statusText]);

  return (
    <div
      className={[
        'elite-hud-wrapper',
        `state-${componentState}`,
        isPinned ? 'is-pinned' : '',
        isCollapsed ? 'is-collapsed' : '',
        isFullscreen ? 'is-fullscreen' : ''
      ].filter(Boolean).join(' ')}
      style={{
        '--elite-accent': accentColor,
        '--elite-state-tone': stateTone
      }}
      data-rarity={blueprint?.rarity || 'COMMON'}
      data-border-style={blueprint?.ui?.borderStyle || 'neural'}
      data-animation-profile={blueprint?.ui?.animations || 'neural_pulse'}
    >
      <div className="elite-hud-ambient-grid" />
      <div className="elite-hud-breathe-line" />
      <div className="card-hud-bracket top-left" style={{ borderColor: `${stateTone}88` }}></div>
      <div className="card-hud-bracket top-right" style={{ borderColor: `${stateTone}88` }}></div>
      <div className="card-hud-bracket bottom-left" style={{ borderColor: `${stateTone}88` }}></div>
      <div className="card-hud-bracket bottom-right" style={{ borderColor: `${stateTone}88` }}></div>
      <div className="card-scanline"></div>

      <div className="elite-hud-header">
        <div className="elite-hud-title-group">
          <span className="elite-hud-state-dot" style={{ background: stateTone }} />
          <span className="elite-hud-icon">{icon}</span>
          <div className="elite-hud-title-stack">
            <span className="elite-hud-title">{title || blueprint?.meta?.name || 'ZAIRE MODULE'}</span>
            <span className="elite-hud-subtitle">{statusText}</span>
          </div>
        </div>

        <div className="elite-hud-badges">
          <span className="elite-hud-rarity">{blueprint?.rarity || 'COMMON'}</span>
          <span className="elite-hud-state">{STATE_LABELS[componentState] || 'IDLE'}</span>
        </div>
      </div>

      <div className="elite-hud-toolbar">
        <div className="elite-hud-meta">
          <span>{blueprint?.meta?.category || 'CORE'}</span>
          <span>{blueprint?.meta?.version || '2.0.0'}</span>
          <span>{blueprint?.layout?.draggable ? 'DRAG' : 'STATIC'}</span>
          <span>{blueprint?.layout?.resizable ? 'RESIZE' : 'LOCKED'}</span>
        </div>

        <div className="elite-hud-controls">
          <WrapperControl label="PIN" active={isPinned} onClick={() => setIsPinned((value) => !value)} />
          <WrapperControl label="COLLAPSE" active={isCollapsed} onClick={() => setIsCollapsed((value) => !value)} />
          <WrapperControl label="FULL" active={isFullscreen} onClick={() => setIsFullscreen((value) => !value)} />
        </div>
      </div>

      {!isCollapsed && (
        <div className="elite-hud-body">
          {children}
        </div>
      )}
    </div>
  );
}
