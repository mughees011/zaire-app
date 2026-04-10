import React, { useEffect, useState } from 'react';
import './SettingsModal.css';

const PRESET_COLORS = [
  { label: 'JARVIS Blue', hex: '#00b4ff' },
  { label: 'ULTRON Red', hex: '#ff1133' },
  { label: 'EDITH White', hex: '#ffffff' },
  { label: 'FRIDAY Gold', hex: '#ffbb00' },
  { label: 'MATRIX Green', hex: '#00ff66' },
  { label: 'VIOLET Core', hex: '#bb00ff' }
];

function normalizeHexColor(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  const candidate = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  if (/^#[0-9a-f]{6}$/i.test(candidate)) return candidate.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(candidate)) {
    const short = candidate.slice(1);
    return `#${short[0]}${short[0]}${short[1]}${short[1]}${short[2]}${short[2]}`.toLowerCase();
  }
  return null;
}

function SettingsModal({ isOpen, onClose, color, setColor, size, setSize, onEnterDragMode }) {
  const [hexInputValue, setHexInputValue] = useState(color.toUpperCase());

  useEffect(() => {
    setHexInputValue(color.toUpperCase());
  }, [color]);

  const handleHexInputChange = (e) => {
    const value = e.target.value.toUpperCase();
    setHexInputValue(value);
    const normalized = normalizeHexColor(value);
    if (normalized) setColor(normalized);
  };

  const handleHexInputBlur = () => {
    const normalized = normalizeHexColor(hexInputValue);
    if (normalized) {
      setColor(normalized);
      setHexInputValue(normalized.toUpperCase());
      return;
    }
    setHexInputValue(color.toUpperCase());
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
          SYSTEM CONFIGURATION
          <div className="settings-close" onClick={onClose}>X</div>
        </div>

        <div className="settings-body">
          {/* COLOR SECTION */}
          <div className="set-group">
            <label>CORE COLOR</label>
            <div className="color-presets">
              {PRESET_COLORS.map(p => (
                <div 
                  key={p.hex}
                  className={`color-swatch ${color.toLowerCase() === p.hex ? 'active' : ''}`}
                  style={{ background: p.hex, boxShadow: color.toLowerCase() === p.hex ? `0 0 10px ${p.hex}` : 'none' }}
                  onClick={() => setColor(p.hex)}
                  title={p.label}
                />
              ))}
            </div>
            <div className="custom-color-row">
              <span>CUSTOM HEX:</span>
              <input 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)} 
                className="color-picker"
              />
              <input
                type="text"
                value={hexInputValue}
                onChange={handleHexInputChange}
                onBlur={handleHexInputBlur}
                className="hex-input"
                maxLength={7}
                placeholder="#00B4FF"
                spellCheck={false}
                aria-label="Custom hex color input"
              />
            </div>
          </div>

          <div className="set-divider"></div>

          {/* SIZE SECTION */}
          <div className="set-group">
            <label>CORE SIZE [{size.toFixed(2)}x]</label>
            <input 
              type="range" 
              min="0.5" 
              max="2.5" 
              step="0.05" 
              value={size} 
              onChange={(e) => setSize(parseFloat(e.target.value))} 
              className="size-slider"
            />
          </div>

          <div className="set-divider"></div>

          {/* POSITION SECTION */}
          <div className="set-group">
            <label>CORE POSITION</label>
            <button className="hollow-btn" onClick={onEnterDragMode}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" stroke="currentColor" style={{width:'14px', marginRight:'6px', top:'2px', position:'relative'}}>
                <path d="M4 4h4v4H4z M16 4h4v4h-4z M4 16h4v4H4z M16 16h4v4h-4z"/>
                <path d="M9 12h6 M12 9v6"/>
              </svg>
              ENTER DRAG MODE
            </button>
            <span className="drag-hint">Activate to manually position the sphere on the canvas.</span>
          </div>
        </div>

        <div className="settings-footer">
          <button className="solid-btn" onClick={onClose}>SAVE & CLOSE</button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
