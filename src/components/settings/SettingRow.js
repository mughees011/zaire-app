import React from 'react';

export default function SettingRow({ name, desc, children, muted = false }) {
  return (
    <div className="setting-row" style={muted ? { opacity: 0.42 } : undefined}>
      <div className="setting-info">
        <div className="setting-name">{name}</div>
        <div className="setting-desc">{desc}</div>
      </div>
      <div className="setting-control">{children}</div>
    </div>
  );
}
