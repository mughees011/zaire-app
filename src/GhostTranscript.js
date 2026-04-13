import React, { useState, useEffect, useRef } from 'react';
import './GhostTranscript.css';

function GhostTranscript({ isListening, interimText, finalText, onTranscriptComplete }) {
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const prevFinalRef = useRef('');

  useEffect(() => {
    if (interimText && !finalText) {
      setDisplayText(interimText);
    }
  }, [interimText, finalText]);

  useEffect(() => {
    if (finalText && finalText !== prevFinalRef.current) {
      prevFinalRef.current = finalText;
      setIsAnimatingIn(true);
      setDisplayText(finalText);
      
      if (onTranscriptComplete) {
        onTranscriptComplete(finalText);
      }
      
      setTimeout(() => {
        setIsAnimatingIn(false);
        setIsAnimatingOut(true);
        
        setTimeout(() => {
          setIsAnimatingOut(false);
          setDisplayText('');
        }, 300);
      }, 1500);
    }
  }, [finalText, onTranscriptComplete]);

  const isStreaming = interimText && !finalText;
  const hasFinal = finalText && !isAnimatingOut;

  return (
    <div className={`ghost-transcript-container ${isListening ? 'listening' : ''}`}>
      <div className="ghost-scanline"></div>
      
      <div className="ghost-transcript-box">
        {displayText && (
          <div className={`ghost-layer ${
            isAnimatingIn ? 'dropping-in' : 
            isAnimatingOut ? 'dropping-out' : ''
          } ${isStreaming ? 'streaming' : ''}`}>
            <span className="ghost-text">{displayText}</span>
            {isStreaming && <span className="ghost-cursor">|</span>}
          </div>
        )}
        
        <div className={`main-input-display ${hasFinal ? 'filled' : ''}`}>
          <span className="input-placeholder">
            {isListening ? 'LISTENING...' : 'SPEAK OR TYPE COMMAND'}
          </span>
          {hasFinal && <span className="final-text">{finalText}</span>}
        </div>
      </div>
    </div>
  );
}

export default GhostTranscript;