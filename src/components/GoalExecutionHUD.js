import React from 'react';
import './GoalExecutionHUD.css';

const GoalExecutionHUD = ({ goal, steps, currentStepIdx, isSonaMatch, isComplete }) => {
  if (!goal || !steps || steps.length === 0) return null;

  return (
    <div className="goal-execution-hud">
      <div className="hud-header">
        <div className="goal-icon">🎯</div>
        <div className="goal-info">
          <span className="goal-label">SOVEREIGN GOAL</span>
          <h3 className="goal-title">{goal}</h3>
        </div>
        {isSonaMatch && (
          <div className="sona-badge">
            <span className="sona-icon">🧠</span>
            <span className="sona-text">SONA OPTIMIZED</span>
          </div>
        )}
      </div>

      <div className="execution-timeline">
        {steps.map((step, idx) => {
          const isPending = idx > currentStepIdx;
          const isActive = idx === currentStepIdx && !isComplete;
          const isDone = idx < currentStepIdx || (isComplete && idx === steps.length - 1);

          return (
            <div key={idx} className={`timeline-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''} ${isPending ? 'pending' : ''}`}>
              <div className="step-node">
                <div className="node-core"></div>
                {idx < steps.length - 1 && <div className="node-connector"></div>}
              </div>
              <div className="step-content">
                <span className="step-specialist">{step.specialist}</span>
                <span className="step-name">{step.name}</span>
              </div>
              {isActive && <div className="step-pulse"></div>}
            </div>
          );
        })}
      </div>

      {isComplete && (
        <div className="completion-banner">
          <span className="check-icon">✅</span>
          <span className="completion-text">TRAJECTORY SYNTHESIZED</span>
        </div>
      )}
    </div>
  );
};

export default GoalExecutionHUD;
