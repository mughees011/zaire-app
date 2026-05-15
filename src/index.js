import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = "pk_test_dHJ1c3RpbmctZ25hdC0yMS5jbGVyay5hY2NvdW50cy5kZXYk";

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
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
      <App />
    </ClerkProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
