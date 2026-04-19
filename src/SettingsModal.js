import React, { useEffect, useState } from 'react';
import './SettingsModal.css';

function SettingsModal({ isOpen, onClose, blobColor, setBlobColor, blobSize, setBlobSize, onEnterDragMode }) {
  const [blobHexInput, setBlobHexInput] = useState((blobColor || '#00d4ff').toUpperCase());

  useEffect(() => {
    setBlobHexInput((blobColor || '#00d4ff').toUpperCase());
  }, [blobColor]);

  const handlePanelClick = (e) => {
    e.stopPropagation();
  };

  const normalizeHex = (hex) => {
    const cleaned = hex.replace(/[^0-9a-f]/gi, '').slice(0, 6);
    if (cleaned.length === 6) {
      return '#' + cleaned;
    }
    return null;
  };

  const handleBlobColorChange = (e) => {
    const hexValue = e.target.value;
    setBlobHexInput(hexValue.toUpperCase());
    const normalized = normalizeHex(hexValue);
    if (normalized) {
      setBlobColor(normalized);
    }
  };

  const handleBlobHexBlur = () => {
    const normalized = normalizeHex(blobHexInput);
    if (normalized) {
      setBlobColor(normalized);
      setBlobHexInput(normalized.toUpperCase());
    } else {
      setBlobHexInput((blobColor || '#00d4ff').toUpperCase());
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="hud-settings-overlay" onClick={onClose}></div>
      <div className="hud-settings-panel" onClick={handlePanelClick}>
      <div className="panel-corner-accent tl"></div>
      <div className="panel-corner-accent br"></div>

      <div className="panel-header">
        <span className="panel-title">BLOB CONFIGURATION</span>
      </div>

      <div className="panel-controls">
        {/* Blob Color Control */}
        <div className="control-row">
          <label className="control-label">COLOR</label>
          <div className="color-input-group">
            <input
              type="color"
              value={blobColor || '#00d4ff'}
              onChange={(e) => {
                const hexValue = e.target.value;
                setBlobColor(hexValue.toLowerCase());
                setBlobHexInput(hexValue.toUpperCase());
              }}
              className="color-picker"
            />
            <input
              type="text"
              value={blobHexInput}
              onChange={handleBlobColorChange}
              onBlur={handleBlobHexBlur}
              className="hex-input"
              maxLength={7}
              placeholder="#00D4FF"
            />
          </div>
        </div>

        {/* Blob Size Control */}
        <div className="control-row">
          <label className="control-label">SIZE</label>
          <div className="control-input-group">
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={blobSize || 1.0}
              onChange={(e) => setBlobSize(parseFloat(e.target.value))}
              className="hud-slider"
            />
            <span className="control-value">{(blobSize || 1.0).toFixed(2)}x</span>
          </div>
        </div>

        {/* Blob Position / Drag Mode */}
        <div className="control-row full-width">
          <button 
            className="drag-mode-btn"
            onClick={() => {
              onEnterDragMode?.();
              onClose();
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{width: '14px', height: '14px', marginRight: '6px'}}>
              <path d="M4 4h4v4H4z M16 4h4v4h-4z M4 16h4v4H4z M16 16h4v4h-4z"/>
              <path d="M9 12h6 M12 9v6"/>
            </svg>
            ENTER DRAG MODE
          </button>
        </div>

        {/* Persist to Core */}
        <div className="control-row full-width">
          <button 
            className="persist-core-btn"
            onClick={() => {
              // Trigger a save event (passed as prop or handled via global sync)
              window.dispatchEvent(new CustomEvent('MMS_PERSIST_CONFIG'));
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width: '12px', height: '12px', marginRight: '6px'}}>
               <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
               <polyline points="17 21 17 13 7 13 7 21" />
               <polyline points="7 3 7 8 15 8" />
            </svg>
            PERSIST TO CORE
          </button>
        </div>
      </div>

      {/* Close Button */}
      <button className="panel-close-btn" onClick={onClose}>✕</button>
      </div>
    </>
  );
}

export default SettingsModal;
