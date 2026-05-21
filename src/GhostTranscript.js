import React, { useReducer, useEffect, useRef } from 'react';
import './GhostTranscript.css';

const initialTranscriptState = {
  isAnimatingIn: false,
  isAnimatingOut: false,
  displayText: ''
};

function transcriptReducer(state, action) {
  switch (action.type) {
    case 'show_interim':
      return {
        ...state,
        displayText: action.text
      };
    case 'show_final':
      return {
        isAnimatingIn: true,
        isAnimatingOut: false,
        displayText: action.text
      };
    case 'start_fade':
      return {
        ...state,
        isAnimatingIn: false,
        isAnimatingOut: true
      };
    case 'clear':
      return initialTranscriptState;
    default:
      return state;
  }
}

function GhostTranscript({ isListening, interimText, finalText, onTranscriptComplete }) {
  const [transcriptState, dispatch] = useReducer(transcriptReducer, initialTranscriptState);
  const prevFinalRef = useRef('');
  const fadeTimerRef = useRef(null);
  const clearTimerRef = useRef(null);

  useEffect(() => {
    if (interimText && !finalText) {
      dispatch({ type: 'show_interim', text: interimText });
    }
  }, [interimText, finalText]);

  useEffect(() => {
    if (finalText && finalText !== prevFinalRef.current) {
      prevFinalRef.current = finalText;
      dispatch({ type: 'show_final', text: finalText });
      
      if (onTranscriptComplete) {
        onTranscriptComplete(finalText);
      }
      
      fadeTimerRef.current = setTimeout(() => {
        dispatch({ type: 'start_fade' });
        
        clearTimerRef.current = setTimeout(() => {
          dispatch({ type: 'clear' });
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
