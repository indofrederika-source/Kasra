'use client';

import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { KasraProvider, useKasra } from '@/lib/store/KasraContext';
import { TransactionType } from '@/types';
import { AuthView } from '@/components/auth/AuthView';
import { SidebarRail } from '@/components/layout/SidebarRail';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { CashView } from '@/components/cash/CashView';
import { StorageView } from '@/components/storage/StorageView';
import { AnalyticsView } from '@/components/analytics/AnalyticsView';
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
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<TransactionType>('expense');

  const handleOpenQuickAdd = (type: TransactionType = 'expense') => {
    setQuickAddType(type);
    setIsQuickAddOpen(true);
  };

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden transition-colors ${
        theme === 'dark'
          ? 'bg-[#0D1C42] text-[#FCF1D0]'
          : 'bg-[#F3F4F8] text-slate-900'
      }`}
    >
      {/* 1. Left Sidebar Navigation (Desktop) & Bottom Bar with Center FAB (Mobile) */}
      <SidebarRail
        onOpenQuickAdd={() => handleOpenQuickAdd('expense')}
        onOpenScan={() => setIsScanOpen(true)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar with Theme Toggle (Dark Option 1 / Light Option 2) & Quick Actions */}
        <HeaderBar
          onOpenVoice={() => setIsVoiceOpen(true)}
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
                onOpenVoice={() => setIsVoiceOpen(true)}
                onOpenScan={() => setIsScanOpen(true)}
                onOpenCalculator={() => setIsCalculatorOpen((prev) => !prev)}
                onOpenQuickAdd={(type) => handleOpenQuickAdd(type || 'expense')}
              />
            )}
            {activeTab === 'cash' && (
              <CashView
                onOpenVoice={() => setIsVoiceOpen(true)}
                onOpenScan={() => setIsScanOpen(true)}
                onOpenQuickAdd={(type) => handleOpenQuickAdd(type || 'income')}
              />
            )}
            {activeTab === 'storage' && (
              <StorageView
                onOpenVoice={() => setIsVoiceOpen(true)}
                onOpenScan={() => setIsScanOpen(true)}
              />
            )}
            {activeTab === 'analytics' && <AnalyticsView />}
            {activeTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* 3. Global Modals */}
      {/* Image 1 Combined Numpad + Category Grid + Account Picker Modal */}
      <QuickTransactionModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        initialType={quickAddType}
        onOpenScan={() => setIsScanOpen(true)}
        onOpenVoice={() => setIsVoiceOpen(true)}
      />

      {/* Human-In-The-Loop Draft Confirmation Modal */}
      {activeDraft && <ConfirmationDraftModal draft={activeDraft} />}

      {/* Quick Voice Mic Modal */}
      <QuickVoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
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

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#F3F4F8] flex flex-col items-center justify-center gap-3 text-slate-600 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E2BFF] to-[#4C1D95] text-white flex items-center justify-center shadow-md animate-pulse">
          <KasraLogo className="w-7 h-7 text-white" />
        </div>
        <p className="text-xs font-mono text-slate-500">Memeriksa autentikasi sesi KASRA...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView />;
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
        <div className="h-screen w-screen bg-[#F3F4F8] flex items-center justify-center text-slate-500 text-xs font-mono">
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
