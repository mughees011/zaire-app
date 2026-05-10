import React, { useState } from 'react';
import './SettingsModal.css';

function SettingsModal({ 
  isOpen, 
  onClose, 
  activeMode,
  blobColor, 
  setBlobColor, 
  blobSize, 
  setBlobSize, 
  hudOpacity,
  setHudOpacity,
  neuralGlowEnabled,
  setNeuralGlowEnabled,
  holographicTiltEnabled,
  setHolographicTiltEnabled,
  halalFilterEnabled,
  setHalalFilterEnabled,
  autoLintEnabled,
  setAutoLintEnabled,
  onEnterDragMode 
}) {
  const [activeTab, setActiveTab] = useState('INTERFACE');

  if (!isOpen) return null;

  const tabs = [
    { id: 'INTERFACE', label: 'HUD & VISUALS', icon: '◈' },
    { id: 'MODES', label: 'SPECIALISTS', icon: '◰' },
    { id: 'NEURAL', label: 'INTELLIGENCE', icon: '❈' },
    { id: 'SECURITY', label: 'PROTECTION', icon: '🛡' },
  ];

  return (
    <>
      <div className="hud-settings-overlay" onClick={onClose}></div>
      <div className="hud-settings-panel">
        <div className="panel-corner-accent tl"></div>
        <div className="panel-corner-accent br"></div>

        <div className="settings-header">
          <span className="settings-title">M.M.S. SYSTEM CONTROL</span>
          <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px' }}>
            CORE_SYNC: ACTIVE // VER: 2.0.0
          </div>
        </div>

        <div className="settings-body">
          <div className="settings-tabs">
            {tabs.map(tab => (
              <div 
                key={tab.id} 
                className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </div>
            ))}
          </div>

          <div className="settings-content">
            {activeTab === 'INTERFACE' && (
              <div className="tab-pane">
                <div className="settings-section-title">INTERFACE CALIBRATION</div>
                
                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-label">HUD OPACITY</span>
                    <span className="setting-desc">Adjust transparency of holographic panels.</span>
                  </div>
                  <div className="cyber-slider-group">
                    <input 
                      type="range" min="0.2" max="1.0" step="0.05" 
                      className="cyber-slider"
                      value={hudOpacity}
                      onChange={(e) => setHudOpacity(parseFloat(e.target.value))}
                    />
                    <span className="slider-val">{(hudOpacity * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-label">NEURAL GLOW</span>
                    <span className="setting-desc">Enable high-intensity bioluminescent UI glow.</span>
                  </div>
                  <label className="cyber-switch">
                    <input 
                      type="checkbox" 
                      checked={neuralGlowEnabled}
                      onChange={(e) => setNeuralGlowEnabled(e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>

                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-label">HOLOGRAPHIC TILT</span>
                    <span className="setting-desc">Enable 3D perspective tracking on mouse move.</span>
                  </div>
                  <label className="cyber-switch">
                    <input 
                      type="checkbox" 
                      checked={holographicTiltEnabled}
                      onChange={(e) => setHolographicTiltEnabled(e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>

                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-label">ORB MAGNIFICATION</span>
                    <span className="setting-desc">Rescale the central neural core.</span>
                  </div>
                  <div className="cyber-slider-group">
                    <input 
                      type="range" min="0.5" max="2.5" step="0.1" 
                      className="cyber-slider"
                      value={blobSize}
                      onChange={(e) => setBlobSize(parseFloat(e.target.value))}
                    />
                    <span className="slider-val">{blobSize.toFixed(1)}x</span>
                  </div>
                </div>

                <button className="footer-btn primary" onClick={onEnterDragMode} style={{ width: '100%', marginTop: '10px' }}>
                  REPOSITION NEURAL CORE
                </button>
              </div>
            )}

            {activeTab === 'MODES' && (
              <div className="tab-pane">
                <div className="settings-section-title">SPECIALIST CONFIGURATION</div>
                
                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-label">TRADER: HALAL FILTER</span>
                    <span className="setting-desc">Automatic screening for Shariah-compliant assets.</span>
                  </div>
                  <label className="cyber-switch">
                    <input 
                      type="checkbox" 
                      checked={halalFilterEnabled}
                      onChange={(e) => setHalalFilterEnabled(e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>

                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-label">ENGINEER: AUTO-LINT</span>
                    <span className="setting-desc">Run static analysis on every file save.</span>
                  </div>
                  <label className="cyber-switch">
                    <input 
                      type="checkbox" 
                      checked={autoLintEnabled}
                      onChange={(e) => setAutoLintEnabled(e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>

                <div className="setting-row" style={{ opacity: 0.4 }}>
                  <div className="setting-info">
                    <span className="setting-label">PROFESSOR: OCR DEPTH</span>
                    <span className="setting-desc">Advanced neural scanning for complex slides.</span>
                  </div>
                  <span style={{ fontSize: '8px', color: 'var(--primary)' }}>ULTRA_SYNC</span>
                </div>
              </div>
            )}

            {activeTab === 'NEURAL' && (
              <div className="tab-pane">
                <div className="settings-section-title">NEURAL NETWORK ARRAYS</div>
                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-label">RESPONSE DEPTH</span>
                    <span className="setting-desc">Switch between fast responses and deep reasoning.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button className="footer-btn active" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>TURBO</button>
                    <button className="footer-btn">THINKER</button>
                  </div>
                </div>
                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-label">VOICE WAKE_WORD</span>
                    <span className="setting-desc">Sensitivity for "Jarvis" / "MMS" detection.</span>
                  </div>
                  <div className="cyber-slider-group">
                    <input type="range" min="0" max="100" className="cyber-slider" defaultValue="85" />
                    <span className="slider-val">85%</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'SECURITY' && (
              <div className="tab-pane">
                <div className="settings-section-title">BIOMETRIC PROTECTION</div>
                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-label">FACIAL SCAN CONFIDENCE</span>
                    <span className="setting-desc">Strictness of biometric identity verification.</span>
                  </div>
                  <div className="cyber-slider-group">
                    <input type="range" min="50" max="100" className="cyber-slider" defaultValue="92" />
                    <span className="slider-val">92%</span>
                  </div>
                </div>
                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-label">INTRUDER SNAPSHOT</span>
                    <span className="setting-desc">Auto-capture camera feed on failed auth.</span>
                  </div>
                  <label className="cyber-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="switch-slider"></span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="settings-footer">
          <button className="footer-btn" onClick={() => {
            if(window.confirm('WIPE ALL SYSTEM PREFERENCES?')) localStorage.clear();
          }}>FACTORY RESET</button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="footer-btn" onClick={onClose}>DISMISS</button>
            <button className="footer-btn primary" onClick={() => {
              window.dispatchEvent(new CustomEvent('MMS_PERSIST_CONFIG'));
              onClose();
            }}>APPLY CORE_SYNC</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default SettingsModal;
