'use client';

import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { KasraProvider, useKasra } from '@/lib/store/KasraContext';
import { TransactionType, Product } from '@/types';
import { AuthView } from '@/components/auth/AuthView';
import { LandingView } from '@/components/landing/LandingView';
import { SidebarRail } from '@/components/layout/SidebarRail';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { CashView } from '@/components/cash/CashView';
import { StorageView } from '@/components/storage/StorageView';
import { AnalyticsView } from '@/components/analytics/AnalyticsView';
import { CommunityView } from '@/components/community/CommunityView';
import { ProfileView, StoreProfileModal } from '@/components/profile/ProfileView';
import { SettingsView } from '@/components/settings/SettingsView';
import { ConfirmationDraftModal } from '@/components/shared/ConfirmationDraftModal';
import { QuickVoiceModal } from '@/components/shared/QuickVoiceModal';
import { ReceiptScanModal } from '@/components/shared/ReceiptScanModal';
import { QuickCalculatorModal } from '@/components/shared/QuickCalculatorModal';
import { QuickTransactionModal } from '@/components/shared/QuickTransactionModal';
import { KasraLogo } from '@/components/ui/KasraLogo';

function KasraAppContent() {
  const { activeTab, activeDraft, theme } = useKasra();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [voiceTargetProduct, setVoiceTargetProduct] = useState<Product | null>(null);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<TransactionType>('expense');

  const handleOpenQuickAdd = (type: TransactionType = 'expense') => {
    setQuickAddType(type);
    setIsQuickAddOpen(true);
  };

  const handleOpenVoice = (targetProduct: Product | null = null) => {
    setVoiceTargetProduct(targetProduct);
    setIsVoiceOpen(true);
  };

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden transition-colors ${
        theme === 'dark'
          ? 'bg-[#0D1C42] text-[#FCF1D0]'
          : 'bg-[#EFF2EC] text-[#142413]'
      }`}
    >
      {/* 1. Left Sidebar Navigation (Desktop) & Bottom Bar (Mobile) */}
      <SidebarRail
        onOpenQuickAdd={() => handleOpenQuickAdd('expense')}
        onOpenScan={() => setIsScanOpen(true)}
        onOpenVoice={() => handleOpenVoice(null)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar with Theme Toggle & Quick Actions */}
        <HeaderBar
          onOpenVoice={() => handleOpenVoice(null)}
          onOpenScan={() => setIsScanOpen(true)}
          onOpenQuickAdd={() => handleOpenQuickAdd('expense')}
          isCalculatorOpen={isCalculatorOpen}
          onToggleCalculator={() => setIsCalculatorOpen((prev) => !prev)}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                onOpenVoice={() => handleOpenVoice(null)}
                onOpenScan={() => setIsScanOpen(true)}
                onOpenCalculator={() => setIsCalculatorOpen((prev) => !prev)}
                onOpenQuickAdd={(type) => handleOpenQuickAdd(type || 'expense')}
              />
            )}
            {activeTab === 'cash' && (
              <CashView
                onOpenVoice={() => handleOpenVoice(null)}
                onOpenScan={() => setIsScanOpen(true)}
                onOpenQuickAdd={(type) => handleOpenQuickAdd(type || 'income')}
              />
            )}
            {activeTab === 'storage' && (
              <StorageView
                onOpenVoice={(prod) => handleOpenVoice(prod || null)}
                onOpenScan={() => setIsScanOpen(true)}
              />
            )}
            {activeTab === 'analytics' && <AnalyticsView />}
            {activeTab === 'community' && <CommunityView />}
            {activeTab === 'profile' && <ProfileView />}
            {activeTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* 3. Global Modals */}
      {/* Public Storefront Viewer Modal (triggered from Community or Followers list) */}
      <StoreProfileModal />

      {/* Combined Numpad + Category Grid + Account Picker Modal */}
      <QuickTransactionModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        initialType={quickAddType}
        onOpenScan={() => setIsScanOpen(true)}
        onOpenVoice={() => handleOpenVoice(null)}
      />

      {/* Human-In-The-Loop Draft Confirmation Modal */}
      {activeDraft && <ConfirmationDraftModal draft={activeDraft} />}

      {/* Quick Voice Mic Modal */}
      <QuickVoiceModal
        isOpen={isVoiceOpen}
        onClose={() => {
          setIsVoiceOpen(false);
          setVoiceTargetProduct(null);
        }}
        initialProduct={voiceTargetProduct}
        contextType={activeTab === 'storage' ? 'storage' : 'omni'}
      />

      {/* Wholesale Receipt OCR Scan Modal */}
      <ReceiptScanModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
      />

      {/* Floating Draggable Quick Calculator */}
      <QuickCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />
    </div>
  );
}

function KasraWorkspaceShell() {
  const { isAuthenticated, isLoading } = useAuth();
  const [authScreenState, setAuthScreenState] = useState<{
    showAuth: boolean;
    mode: 'login' | 'register';
  }>({ showAuth: false, mode: 'login' });

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#EFF2EC] flex flex-col items-center justify-center gap-3 text-[#384936] font-sans">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#21421E] to-[#152D14] text-[#F8FAF6] flex items-center justify-center shadow-md animate-pulse">
          <KasraLogo className="w-7 h-7 text-[#F8FAF6]" />
        </div>
        <p className="text-xs font-mono text-[#6B7B68]">Memeriksa autentikasi sesi KASRA...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (!authScreenState.showAuth) {
      return (
        <LandingView
          onOpenAuth={(selectedMode) =>
            setAuthScreenState({ showAuth: true, mode: selectedMode })
          }
        />
      );
    }

    return (
      <AuthView
        initialMode={authScreenState.mode}
        onBackToLanding={() =>
          setAuthScreenState((prev) => ({ ...prev, showAuth: false }))
        }
      />
    );
  }

  return (
    <KasraProvider>
      <KasraAppContent />
    </KasraProvider>
  );
}

export default function KasraPage() {
  return (
    <React.Suspense
      fallback={
        <div className="h-screen w-screen bg-[#EFF2EC] flex items-center justify-center text-[#6B7B68] text-xs font-mono">
          Memuat Ruang Kerja KASRA...
        </div>
      }
    >
      <AuthProvider>
        <KasraWorkspaceShell />
      </AuthProvider>
    </React.Suspense>
  );
}
