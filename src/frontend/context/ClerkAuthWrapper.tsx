import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { ClerkProvider, SignedIn, SignedOut, SignIn, SignUp, UserProfile, UserButton, useUser, useClerk } from '@clerk/clerk-react';
import { Shield, Key, Lock, Sparkles, X, Check, Copy } from 'lucide-react';

const CLERK_PUBLISHABLE_KEY = (import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY || '';

interface ClerkAuthContextType {
  hasClerkKey: boolean;
  isApiKeyModalOpen: boolean;
  openApiKeyModal: () => void;
  closeApiKeyModal: () => void;
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  isSubscriptionGateOpen: boolean;
  gateRequiredTier: string;
  triggerSubscriptionGate: (tier: string) => void;
  closeSubscriptionGate: () => void;
}

const ClerkAuthContext = createContext<ClerkAuthContextType | undefined>(undefined);

export const ClerkAuthWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSubscriptionGateOpen, setIsSubscriptionGateOpen] = useState(false);
  const [gateRequiredTier, setGateRequiredTier] = useState('Creator');

  const triggerSubscriptionGate = (tier: string) => {
    setGateRequiredTier(tier);
    setIsSubscriptionGateOpen(true);
  };

  const contextValue: ClerkAuthContextType = {
    hasClerkKey: !!CLERK_PUBLISHABLE_KEY,
    isApiKeyModalOpen,
    openApiKeyModal: () => setIsApiKeyModalOpen(true),
    closeApiKeyModal: () => setIsApiKeyModalOpen(false),
    isProfileModalOpen,
    openProfileModal: () => setIsProfileModalOpen(true),
    closeProfileModal: () => setIsProfileModalOpen(false),
    isSubscriptionGateOpen,
    gateRequiredTier,
    triggerSubscriptionGate,
    closeSubscriptionGate: () => setIsSubscriptionGateOpen(false),
  };

  const innerContent = (
    <ClerkAuthContext.Provider value={contextValue}>
      {children}
    </ClerkAuthContext.Provider>
  );

  // If a valid live Clerk key is provided, wrap in real ClerkProvider
  if (CLERK_PUBLISHABLE_KEY && CLERK_PUBLISHABLE_KEY.startsWith('pk_')) {
    return (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        {innerContent}
      </ClerkProvider>
    );
  }

  // Fallback: seamless zero-friction local auth mode
  return innerContent;
};

export const useClerkAuth = () => {
  const context = useContext(ClerkAuthContext);
  if (!context) {
    throw new Error('useClerkAuth must be used within a ClerkAuthWrapper');
  }
  return context;
};
