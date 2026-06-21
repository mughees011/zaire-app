import React, { useState, useEffect } from 'react';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnect, setShowReconnect] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnect(true);
      setTimeout(() => setShowReconnect(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnect) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      zIndex: 9999,
      padding: '10px',
      background: isOnline ? 'rgba(52, 211, 153, 0.9)' : 'rgba(255, 51, 102, 0.9)',
      color: '#fff',
      textAlign: 'center',
      fontFamily: 'monospace',
      fontSize: '12px',
      letterSpacing: '2px',
      fontWeight: 'bold',
      boxShadow: '0 0 15px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(5px)',
      transition: 'all 0.3s ease'
    }}>
      {isOnline ? '✓ ZAIRE NEURAL LINK REESTABLISHED' : '⚠ WARNING: NEURAL LINK DISCONNECTED. OPERATING IN OFFLINE FALLBACK MODE.'}
    </div>
  );
};

export default NetworkStatus;
