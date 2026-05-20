import React from 'react';
import './MorphingCommandButton.css';

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="mic-icon">
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
    </svg>
  );
}

function WaveformBars() {
  return (
    <div className="waveform-bars">
      <div className="waveform-bar bar-1"></div>
      <div className="waveform-bar bar-2"></div>
      <div className="waveform-bar bar-3"></div>
      <div className="waveform-bar bar-4"></div>
      <div className="waveform-bar bar-5"></div>
      <div className="waveform-bar bar-6"></div>
    </div>
  );
}

function MorphingCommandButton({ onToggleMicrophone, isMicrophoneActive }) {
  const handleToggle = () => {
    if (onToggleMicrophone) {
      onToggleMicrophone();
    }
  };

  return (
    <button 
      className={`morphing-command-button ${isMicrophoneActive ? 'listening' : 'idle'}`}
      onClick={handleToggle}
      title={isMicrophoneActive ? 'Click to stop listening' : 'Click to start listening'}
    >
      <div className="button-content">
        {!isMicrophoneActive ? (
          <>
            <MicIcon />
            <span className="button-text">LISTEN</span>
          </>
        ) : (
          <>
            <WaveformBars />
            <span className="button-text">LISTENING</span>
          </>
        )}
      </div>
      <div className="shimmer"></div>
    </button>
  );
}

export default MorphingCommandButton;
