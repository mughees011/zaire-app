import React, { createContext, useContext } from 'react';
import { UserButton as ClerkUserButton, useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-react';

const clerkKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || '';
export const isClerkEnabled = Boolean(clerkKey);

const fallbackAuth = {
  getToken: async () => null,
  isSignedIn: false,
  isLoaded: true,
  userId: null,
  user: null
};

const AuthContext = createContext(fallbackAuth);

export function ClerkAuthBridge({ children }) {
  const auth = useClerkAuth();
  const userState = useClerkUser();
  return (
    <AuthContext.Provider value={{ ...fallbackAuth, ...auth, user: userState.user, isLoaded: userState.isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function LocalAuthProvider({ children }) {
  return <AuthContext.Provider value={fallbackAuth}>{children}</AuthContext.Provider>;
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}

export function useOptionalUser() {
  const auth = useContext(AuthContext);
  return { user: auth.user, isSignedIn: auth.isSignedIn, isLoaded: auth.isLoaded };
}

export function OptionalUserButton(props) {
  if (!isClerkEnabled) return null;
  return <ClerkUserButton {...props} />;
}
