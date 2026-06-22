import React from 'react';

export default function ArchiveActionIcon({ type }) {
  switch (type) {
    case 'rename':
      return (
        <svg viewBox="0 0 16 16" className="archive-action-icon">
          <path d="M3 11.5 11.9 2.6l1.5 1.5L4.5 13H3z" />
          <path d="M10.9 3.6 12.4 2.1 13.9 3.6 12.4 5.1z" />
        </svg>
      );
    case 'copy':
      return (
        <svg viewBox="0 0 16 16" className="archive-action-icon">
          <rect x="5" y="3" width="7" height="9" rx="1" />
          <path d="M3.5 5.5V13h7.5" />
        </svg>
      );
    case 'share':
      return (
        <svg viewBox="0 0 16 16" className="archive-action-icon">
          <path d="M6 10 11.5 4.5" />
          <path d="M8.5 4.5h3v3" />
          <path d="M4 6.5v5h5" />
        </svg>
      );
    case 'like':
      return (
        <svg viewBox="0 0 16 16" className="archive-action-icon">
          <path d="M6.5 6V3.8c0-.8.5-1.5 1.2-1.8l.8 2.2-.7 2.3H12l-.8 5H5V6z" />
          <rect x="3" y="6" width="2" height="6" rx=".5" />
        </svg>
      );
    case 'dislike':
      return (
        <svg viewBox="0 0 16 16" className="archive-action-icon">
          <path d="M6.5 10V12.2c0 .8.5 1.5 1.2 1.8l.8-2.2-.7-2.3H12l-.8-5H5v5z" />
          <rect x="3" y="4" width="2" height="6" rx=".5" />
        </svg>
      );
    case 'open':
      return (
        <svg viewBox="0 0 16 16" className="archive-action-icon">
          <path d="M3 12.5h10" />
          <path d="M8 11V3.5" />
          <path d="M5.5 6 8 3.5 10.5 6" />
        </svg>
      );
    case 'delete':
      return (
        <svg viewBox="0 0 16 16" className="archive-action-icon">
          <path d="M3.5 4.5h9" />
          <path d="M6 4.5V3h4v1.5" />
          <path d="M5 6.5v5.5" />
          <path d="M8 6.5v5.5" />
          <path d="M11 6.5v5.5" />
        </svg>
      );
    default:
      return null;
  }
}
