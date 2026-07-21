import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import NetworkStatus from './NetworkStatus';
import reportWebVitals from './reportWebVitals';
import { ClerkProvider } from '@clerk/clerk-react';
import { ClerkAuthBridge, isClerkEnabled, LocalAuthProvider } from './authAdapter';
import { resolveApiBase } from './apiBase';

const ENV_PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || '';
const PUBLISHABLE_KEY = ENV_PUBLISHABLE_KEY;
const API_BASE_URL = resolveApiBase();



const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  const urlStr = typeof url === 'string' ? url : url?.url || '';
  if (
    urlStr.includes('/api/') ||
    urlStr.includes('/memory') ||
    urlStr.includes('/llm') ||
    urlStr.includes('/chats') ||
    urlStr.includes('/config') ||
    urlStr.includes('/tts')
  ) {
    const opts = { ...options };
    opts.headers = { ...opts.headers };
    const licenseKey = localStorage.getItem('zaire_license_key');
    if (licenseKey) {
      opts.headers['x-zaire-license'] = licenseKey;
      opts.headers['x-zaire-machine-id'] = 'BROWSER_HUD';
    }
    const resolvedUrl = typeof url === 'string' && url.startsWith('/')
      ? `${API_BASE_URL}${url}`
      : url;
    return originalFetch(resolvedUrl, opts);
  }
  return originalFetch(url, options);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
const appTree = (
  <ErrorBoundary>
    <NetworkStatus />
    <App />
  </ErrorBoundary>
);

const rootTree = isClerkEnabled ? (
  <ClerkProvider
    publishableKey={PUBLISHABLE_KEY}
    afterSignOutUrl="/"
    appearance={{
      layout: {
        socialButtonsPlacement: "top",
        socialButtonsVariant: "iconButton",
        logoImageUrl: "",
      },
      variables: {
        colorPrimary: "#00d4ff",
        colorBackground: "rgba(0, 5, 10, 0.4)",
        colorText: "#ffffff",
        colorTextSecondary: "rgba(255,255,255,0.6)",
        colorInputBackground: "rgba(0, 15, 30, 0.6)",
        colorInputText: "#ffffff",
        colorDanger: "#ff3366",
        borderRadius: "4px",
      },
      elements: {
        card: "zaire-clerk-card",
        headerTitle: "zaire-clerk-title",
        headerSubtitle: "zaire-clerk-subtitle",
        formButtonPrimary: "zaire-clerk-button",
        formFieldInput: "zaire-clerk-input",
        formFieldLabel: "zaire-clerk-label",
        footerActionLink: "zaire-clerk-link",
        socialButtonsIconButton: "zaire-clerk-social-btn",
        dividerLine: "zaire-clerk-divider",
        dividerText: "zaire-clerk-divider-text",
        identityPreview: "zaire-clerk-identity-preview",
        formFieldInputShowPasswordButton: "zaire-clerk-show-password"
      }
    }}
  >
    <ClerkAuthBridge>{appTree}</ClerkAuthBridge>
  </ClerkProvider>
) : <LocalAuthProvider>{appTree}</LocalAuthProvider>;

root.render(
  <React.StrictMode>
    {rootTree}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
