import React from 'react';

export default function Section({ title, children }) {
  return (
    <div className="setting-section">
      <div className="section-title">{title}</div>
      {children}
    </div>
  );
}
