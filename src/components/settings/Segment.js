import React from 'react';

export default function Segment({ value, options, onChange }) {
  return (
    <div className="segment">
      {options.map((option) => (
        <button
          type="button"
          key={option}
          className={`seg-btn ${value === option ? 'active' : ''}`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
