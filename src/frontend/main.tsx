import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { GenerativeDesignProvider } from './context/GenerativeDesignContext';
import { LivingVaultProvider } from './context/LivingVaultContext';
import { LivingRealmProvider } from './context/LivingRealmContext';
import { AdaptiveProfileProvider } from './context/AdaptiveProfileContext';
import { GamificationXpProvider } from './context/GamificationXpContext';
import { ClerkAuthWrapper } from './context/ClerkAuthWrapper';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <ClerkAuthWrapper>
        <GenerativeDesignProvider>
          <LivingVaultProvider>
            <LivingRealmProvider>
              <AdaptiveProfileProvider>
                <GamificationXpProvider>
                  <App />
                </GamificationXpProvider>
              </AdaptiveProfileProvider>
            </LivingRealmProvider>
          </LivingVaultProvider>
        </GenerativeDesignProvider>
      </ClerkAuthWrapper>
    </AuthProvider>
  </React.StrictMode>
);
