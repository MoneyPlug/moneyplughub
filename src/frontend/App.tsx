import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { DynamicMoneyBackground, MoneyTheme } from './components/DynamicMoneyBackground';
import { LivingVaultBackground } from './components/LivingVaultBackground';
import { GenerativeDesignSwitcher } from './components/GenerativeDesignSwitcher';
import { FloatingMoneyOSWindow } from './components/FloatingMoneyOSWindow';
import { useGenerativeDesign } from './context/GenerativeDesignContext';
import { BootScreen } from './components/BootScreen';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { AdminAnalyticsPage } from './pages/AdminAnalyticsPage';
import { CommandCenterPage } from './pages/CommandCenterPage';
import { FinanceOverviewPage } from './pages/FinanceOverviewPage';
import { BudgetControlPage } from './pages/BudgetControlPage';
import { DebtEliminatorPage } from './pages/DebtEliminatorPage';
import { GoalsPage } from './pages/GoalsPage';
import { RecurringPage } from './pages/RecurringPage';
import { QuestsPage } from './pages/QuestsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { CryptoLedgerPage } from './pages/CryptoLedgerPage';
import { CashbackPackPage } from './pages/CashbackPackPage';
import { CryptoProgramsPage } from './pages/CryptoProgramsPage';
import { ReferralHubPage } from './pages/ReferralHubPage';
import { AffiliateDashboardPage } from './pages/AffiliateDashboardPage';
import { GenerateDashboardPage } from './pages/GenerateDashboardPage';
import { SecurityPolicyPage } from './pages/SecurityPolicyPage';
import { PlugInOSv5DashboardPage } from './pages/PlugInOSv5DashboardPage';
import { MoneyOSPage } from './pages/MoneyOSPage';
import { PricingPage } from './pages/PricingPage';
import { WhatIsThisPage } from './pages/WhatIsThisPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { ComplianceSafetyPage } from './pages/ComplianceSafetyPage';
import { BillingTermsPage } from './pages/BillingTermsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { HelpCenterPage } from './pages/HelpCenterPage';
import { SystemStatusPage } from './pages/SystemStatusPage';
import { ChangelogRoadmapPage } from './pages/ChangelogRoadmapPage';
import { SigilForgePage } from './pages/SigilForgePage';
import { PassportPage } from './pages/PassportPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { SyndicatesPage } from './pages/SyndicatesPage';
import { PrimordiaOSDashboardPage } from './pages/PrimordiaOSDashboardPage';
import { OnboardingWizardModal } from './components/OnboardingWizardModal';
import { LivingRealmProvider } from './context/LivingRealmContext';
import { LiveCompoundingTicker } from './components/LiveCompoundingTicker';
import { ChamberProgressionGate } from './components/ChamberProgressionGate';
import { isChamberUnlocked } from './utils/progression';
import { SigilPassportModal } from './components/SigilPassportModal';
import { TierAscensionModal } from './components/TierAscensionModal';
import { DailyWealthBriefingModal } from './components/DailyWealthBriefingModal';
import { NeuralCalibrationModal } from './components/NeuralCalibrationModal';
import { AntigravityConversionModal } from './components/AntigravityConversionModal';
import { FloatingXpContainer } from './components/FloatingXpContainer';
import { useAdaptiveProfile } from './context/AdaptiveProfileContext';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { trackAction } = useAdaptiveProfile();
  const { wealthMotto, primaryAccent, palette } = useGenerativeDesign();
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [initialRefCode, setInitialRefCode] = useState<string>('');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showXpConversion, setShowXpConversion] = useState<boolean>(false);
  const [hasBooted, setHasBooted] = useState<boolean>(false);

  useEffect(() => {
    (window as any).openXpConversion = () => setShowXpConversion(true);
    return () => {
      delete (window as any).openXpConversion;
    };
  }, []);

  const onBootComplete = useCallback(() => {
    setHasBooted(true);

    // Only show onboarding wizard if not completed before
    if (!localStorage.getItem('creatorMoneyOS_onboarding_done')) {
      setTimeout(() => {
        setShowOnboarding(true);
      }, 50);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    const tabParam = urlParams.get('tab');
    const path = window.location.pathname;

    if (tabParam) {
      setCurrentTab(tabParam);
    } else if (refCode) {
      setInitialRefCode(refCode);
      setCurrentTab('register');
    } else if (path.startsWith('/passport')) {
      setCurrentTab('passport');
    } else if (!user && path === '/') {
      setCurrentTab('landing');
    }
  }, [user]);

  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Passively track interaction telemetry
    let cat: 'growth' | 'vault' | 'alchemist' | 'quant' | 'voice' = 'growth';
    if (['net-worth', 'debts', 'budget', 'recurring', 'goals'].includes(tab)) cat = 'vault';
    else if (['sigil-forge', 'quests', 'leaderboard', 'achievements', 'trophies', 'syndicates', 'guilds', 'guild-wars'].includes(tab)) cat = 'alchemist';
    else if (['crypto', 'v5'].includes(tab)) cat = 'quant';
    else if (['referral-hub', 'generate', 'affiliate', 'referrals'].includes(tab)) cat = 'growth';
    else if (['moneyos'].includes(tab)) cat = 'voice';
    trackAction(tab, cat);

    if (tab === 'landing-calc') {
      setTimeout(() => {
        document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Determine distinctive dynamic money theme per tab
  const getThemeForTab = (tab: string): MoneyTheme => {
    switch (tab) {
      case 'landing':
      case 'landing-calc':
        return 'flying-cash';
      case 'referral-hub':
      case 'affiliate':
      case 'referrals':
      case 'dashboard':
        return 'commission-cascade';
      case 'v5':
      case 'plugin-os-v5':
      case 'generate':
        return 'cyber-matrix';
      case 'moneyos':
      case 'chat':
        return 'financial-brain';
      case 'overview':
      case 'command-center':
        return 'command-radar';
      case 'net-worth':
        return 'golden-vault';
      case 'budget':
        return 'budget-shields';
      case 'debts':
        return 'debt-avalanche';
      case 'goals':
        return 'target-milestones';
      case 'quests':
      case 'leaderboard':
      case 'achievements':
      case 'trophies':
      case 'prestige':
      case 'syndicates':
      case 'guilds':
      case 'guild-wars':
        return 'gamified-gems';
      case 'crypto':
      case 'crypto-programs':
        return 'blockchain-crypto';
      case 'cashback':
        return 'cashback-shower';
      case 'login':
      case 'register':
      case 'pricing':
      case 'security':
      case 'security-policy':
      case 'admin':
      case 'analytics':
      case 'metrics':
        return 'vault-security';
      default:
        return 'flying-cash';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-plug-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-plug-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Loading MoneyPlugHub Command Center...</span>
        </div>
      </div>
    );
  }

  const currentTheme = getThemeForTab(currentTab);

  return (
    <>
      {/* Creator Money OS Boot Screen — First thing users see */}
      {!hasBooted && <BootScreen onBootComplete={onBootComplete} />}

      {/* Real-Time Floating XP Particle Layer & Combo Engine */}
      <FloatingXpContainer />

      <div className="min-h-screen flex flex-col justify-between bg-plug-dark relative overflow-x-hidden">
      {/* Living Breathing Wealth Vault: Dynamically scales with user revenue & net worth */}
      <LivingVaultBackground />

      {/* Floating 1-Click Living Vault & Design Morph Controller */}
      <GenerativeDesignSwitcher />

      {/* Draggable, Minimizable, Movable Floating MoneyOS AI Window */}
      <FloatingMoneyOSWindow onNavigate={handleNavigate} />

      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={handleNavigate} 
        onOpenWizard={() => setShowOnboarding(true)} 
        onOpenXpConversion={() => setShowXpConversion(true)}
      />

      {/* Live Per-Second Compounding Stream Ticker */}
      <LiveCompoundingTicker onNavigate={handleNavigate} />

      {/* Procedural Wealth & Cashflow Directive Ticker */}
      <div 
        className="w-full py-1.5 px-4 text-center text-[11px] font-mono font-bold tracking-wider uppercase border-b border-slate-800/80 backdrop-blur-md transition-colors relative z-20 flex items-center justify-center gap-2"
        style={{
          backgroundColor: 'rgba(10, 15, 29, 0.75)',
          color: primaryAccent,
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: primaryAccent }} />
        <span>{wealthMotto}</span>
        <span className="text-[9px] text-slate-500 font-normal hidden sm:inline">(Shift+D to Morph)</span>
      </div>

      <main className="flex-1 relative z-10">
        {currentTab === 'landing' || currentTab === 'landing-calc' ? (
          <LandingPage onNavigate={handleNavigate} />
        ) : currentTab === 'what-is-this' || currentTab === 'about' ? (
          <WhatIsThisPage onNavigate={handleNavigate} />
        ) : currentTab === 'how-it-works' ? (
          <HowItWorksPage onNavigate={handleNavigate} />
        ) : currentTab === 'compliance' || currentTab === 'safety' ? (
          <ComplianceSafetyPage onNavigate={handleNavigate} />
        ) : currentTab === 'billing-terms' || currentTab === 'terms' ? (
          <BillingTermsPage onNavigate={handleNavigate} />
        ) : currentTab === 'privacy' || currentTab === 'privacy-policy' ? (
          <PrivacyPolicyPage onNavigate={handleNavigate} />
        ) : currentTab === 'help' || currentTab === 'support' ? (
          <HelpCenterPage onNavigate={handleNavigate} />
        ) : currentTab === 'status' ? (
          <SystemStatusPage onNavigate={handleNavigate} />
        ) : currentTab === 'changelog' || currentTab === 'roadmap' ? (
          <ChangelogRoadmapPage onNavigate={handleNavigate} />
        ) : currentTab === 'login' ? (
          <LoginPage onNavigate={handleNavigate} />
        ) : currentTab === 'register' ? (
          <RegisterPage onNavigate={handleNavigate} initialRefCode={initialRefCode} />
        ) : currentTab === 'pricing' ? (
          <PricingPage onNavigate={handleNavigate} />
        ) : currentTab === 'moneyos' || currentTab === 'chat' ? (
          <MoneyOSPage />
        ) : currentTab === 'v5' || currentTab === 'plugin-os-v5' ? (
          user && !isChamberUnlocked('v5', user.level || 1, user.role || 'user') ? (
            <ChamberProgressionGate tabId="v5" onNavigate={handleNavigate} />
          ) : (
            <PlugInOSv5DashboardPage />
          )
        ) : currentTab === 'generate' ? (
          user && !isChamberUnlocked('generate', user.level || 1, user.role || 'user') ? (
            <ChamberProgressionGate tabId="generate" onNavigate={handleNavigate} />
          ) : (
            <GenerateDashboardPage />
          )
        ) : currentTab === 'security' || currentTab === 'security-policy' ? (
          <SecurityPolicyPage />
        ) : currentTab === 'overview' || currentTab === 'command-center' ? (
          user ? <CommandCenterPage onNavigate={handleNavigate} /> : <LandingPage onNavigate={handleNavigate} />
        ) : currentTab === 'net-worth' ? (
          user ? (
            !isChamberUnlocked('net-worth', user.level || 1, user.role || 'user') ? (
              <ChamberProgressionGate tabId="net-worth" onNavigate={handleNavigate} />
            ) : (
              <FinanceOverviewPage onNavigate={handleNavigate} />
            )
          ) : (
            <LandingPage onNavigate={handleNavigate} />
          )
        ) : currentTab === 'primordia' || currentTab === 'primordiaos' || currentTab === 'v5' || currentTab === 'swarm' || currentTab === 'orchestrator' ? (
          <PrimordiaOSDashboardPage onNavigate={handleNavigate} />
        ) : currentTab === 'affiliate' ? (
          <AffiliateDashboardPage />
        ) : currentTab === 'sigil-forge' || currentTab === 'forge' || currentTab === 'sigil-marketplace' ? (
          <SigilForgePage onNavigate={handleNavigate} />
        ) : currentTab === 'passport' || currentTab === 'creator-passport' ? (
          <PassportPage onNavigate={handleNavigate} />
        ) : currentTab === 'referral-hub' ? (
          <ReferralHubPage />
        ) : currentTab === 'budget' ? (
          user ? (
            !isChamberUnlocked('budget', user.level || 1, user.role || 'user') ? (
              <ChamberProgressionGate tabId="budget" onNavigate={handleNavigate} />
            ) : (
              <BudgetControlPage />
            )
          ) : (
            <LoginPage onNavigate={handleNavigate} />
          )
        ) : currentTab === 'debts' ? (
          user ? (
            !isChamberUnlocked('debts', user.level || 1, user.role || 'user') ? (
              <ChamberProgressionGate tabId="debts" onNavigate={handleNavigate} />
            ) : (
              <DebtEliminatorPage />
            )
          ) : (
            <LoginPage onNavigate={handleNavigate} />
          )
        ) : currentTab === 'goals' ? (
          user ? <GoalsPage /> : <LoginPage onNavigate={handleNavigate} />
        ) : currentTab === 'recurring' ? (
          user ? <RecurringPage /> : <LoginPage onNavigate={handleNavigate} />
        ) : currentTab === 'achievements' || currentTab === 'trophies' || currentTab === 'prestige' ? (
          <AchievementsPage onNavigate={handleNavigate} />
        ) : currentTab === 'syndicates' || currentTab === 'guilds' || currentTab === 'guild-wars' ? (
          <SyndicatesPage onNavigate={handleNavigate} />
        ) : currentTab === 'quests' ? (
          user ? (
            !isChamberUnlocked('quests', user.level || 1, user.role || 'user') ? (
              <ChamberProgressionGate tabId="quests" onNavigate={handleNavigate} />
            ) : (
              <QuestsPage />
            )
          ) : (
            <LoginPage onNavigate={handleNavigate} />
          )
        ) : currentTab === 'cashback' ? (
          user && !isChamberUnlocked('cashback', user.level || 1, user.role || 'user') ? (
            <ChamberProgressionGate tabId="cashback" onNavigate={handleNavigate} />
          ) : (
            <CashbackPackPage />
          )
        ) : currentTab === 'crypto-programs' ? (
          <CryptoProgramsPage />
        ) : currentTab === 'leaderboard' ? (
          user ? <LeaderboardPage /> : <LoginPage onNavigate={handleNavigate} />
        ) : currentTab === 'crypto' ? (
          user ? (
            !isChamberUnlocked('crypto', user.level || 1, user.role || 'user') ? (
              <ChamberProgressionGate tabId="crypto" onNavigate={handleNavigate} />
            ) : (
              <CryptoLedgerPage />
            )
          ) : (
            <LoginPage onNavigate={handleNavigate} />
          )
        ) : currentTab === 'referrals' || currentTab === 'dashboard' ? (
          user ? <DashboardPage onNavigate={handleNavigate} /> : <LoginPage onNavigate={handleNavigate} />
        ) : currentTab === 'admin' ? (
          <AdminPage onNavigate={handleNavigate} />
        ) : currentTab === 'analytics' || currentTab === 'metrics' || currentTab === 'database-metrics' ? (
          <AdminAnalyticsPage onNavigate={handleNavigate} />
        ) : (
          user ? <CommandCenterPage onNavigate={handleNavigate} /> : <LandingPage onNavigate={handleNavigate} />
        )}
      </main>

      {/* Interactive First-Time Setup Wizard Modal */}
      <OnboardingWizardModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onNavigate={handleNavigate}
      />

      {/* 3D Holographic Creator Passport Modal */}
      <SigilPassportModal />

      {/* Mythic Level & Tier Ascension Celebration Modal */}
      <TierAscensionModal />

      {/* Proactive Autonomous Daily Wealth Briefing Modal */}
      <DailyWealthBriefingModal onNavigate={handleNavigate} />

      {/* Neural Calibration & Bespoke User Adaptation Modal */}
      <NeuralCalibrationModal />

      {/* Sovereign Antigravity XP -> Cash Conversion Modal */}
      <AntigravityConversionModal
        isOpen={showXpConversion}
        onClose={() => setShowXpConversion(false)}
        onNavigate={handleNavigate}
      />

      <Footer onNavigate={handleNavigate} />
    </div>
    </>
  );
};
