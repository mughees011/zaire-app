import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ZAIRE Error Boundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#020305',
          color: '#06B6D4', fontFamily: 'monospace', textAlign: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'rgba(255, 51, 102, 0.1)', border: '1px solid #ff3366',
            padding: '40px', borderRadius: '4px', maxWidth: '600px',
            boxShadow: '0 0 20px rgba(255, 51, 102, 0.2)'
          }}>
            <h1 style={{ color: '#ff3366', marginBottom: '20px', letterSpacing: '2px' }}>
              CRITICAL SYSTEM FAILURE
            </h1>
            <p style={{ color: '#94A3B8', marginBottom: '30px' }}>
              The ZAIRE Neural Interface has encountered a fatal exception. Our diagnostic routines have been deployed.
            </p>
            <div style={{ background: '#000', padding: '10px', borderRadius: '4px', color: '#ff3366', marginBottom: '30px', overflowX: 'auto', textAlign: 'left', fontSize: '12px' }}>
              {this.state.error && this.state.error.toString()}
            </div>
            <button 
              onClick={this.handleReload}
              style={{
                background: '#ff3366', color: '#000', border: 'none', padding: '12px 24px',
                fontFamily: 'monospace', fontWeight: 'bold', cursor: 'pointer',
                letterSpacing: '1px', textTransform: 'uppercase'
              }}
            >
              Reboot Neural Interface
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
