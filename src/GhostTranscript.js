import React, { useState, useEffect, useRef } from 'react';
import './GhostTranscript.css';

function GhostTranscript({ isListening, interimText, finalText, onTranscriptComplete }) {
  const [transcriptState, setTranscriptState] = useState({
    isAnimatingIn: false,
    isAnimatingOut: false,
    displayText: ''
  });
  const prevFinalRef = useRef('');
  const fadeTimerRef = useRef(null);
  const clearTimerRef = useRef(null);

  useEffect(() => {
    if (interimText && !finalText) {
      setTranscriptState((prev) => ({
        ...prev,
        displayText: interimText
      }));
    }
  }, [interimText, finalText]);

  useEffect(() => {
    if (finalText && finalText !== prevFinalRef.current) {
      prevFinalRef.current = finalText;
      setTranscriptState({
        isAnimatingIn: true,
        isAnimatingOut: false,
        displayText: finalText
      });
      
      if (onTranscriptComplete) {
        onTranscriptComplete(finalText);
      }
      
      fadeTimerRef.current = setTimeout(() => {
        setTranscriptState((prev) => ({
          ...prev,
          isAnimatingIn: false,
          isAnimatingOut: true
        }));
        
        clearTimerRef.current = setTimeout(() => {
          setTranscriptState({
            isAnimatingIn: false,
            isAnimatingOut: false,
            displayText: ''
          });
        }, 300);
      }, 1500);
    }

    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, [finalText, onTranscriptComplete]);

  const { isAnimatingIn, isAnimatingOut, displayText } = transcriptState;
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
            {isListening ? 'LISTENING…' : 'SPEAK OR TYPE COMMAND'}
          </span>
          {hasFinal && <span className="final-text">{finalText}</span>}
        </div>
      </div>
    </div>
  );
}

export default GhostTranscript;
