import React from 'react';

export default function Slider({ min, max, step, value, onChange, suffix = '%', format, id, name }) {
  const display = format ? format(value) : `${value}${suffix}`;

  return (
    <div className="slider-wrap">
      <input
        id={id}
        name={name || id}
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="slider-val">{display}</span>
    </div>
  );
}
