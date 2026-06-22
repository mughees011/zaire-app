import React, { useMemo } from 'react';

export default function ClientLocalTime({ value, mode = 'time', options }) {
  const formatted = useMemo(() => {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    if (mode === 'datetime') {
      return date.toLocaleString(undefined, options);
    }

    return date.toLocaleTimeString([], options);
  }, [mode, options, value]);

  return <>{formatted || '--'}</>;
}
