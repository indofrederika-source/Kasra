'use client';

import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { KasraProvider, useKasra } from '@/lib/store/KasraContext';
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
import { KasraLogo } from '@/components/ui/KasraLogo';

function KasraAppContent() {
  const { activeTab, activeDraft } = useKasra();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-slate-900">
      {/* 1. Left Sidebar Navigation (Desktop) & Bottom Bar (Mobile) */}
      <SidebarRail />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar with Live Status Chips & Quick Actions */}
        <HeaderBar
          onOpenVoice={() => setIsVoiceOpen(true)}
          onOpenScan={() => setIsScanOpen(true)}
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
              />
            )}
            {activeTab === 'cash' && (
              <CashView
                onOpenVoice={() => setIsVoiceOpen(true)}
                onOpenScan={() => setIsScanOpen(true)}
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

      {/* 3. Global AI Modals */}
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
      <div className="h-screen w-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3 text-slate-600 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md ring-4 ring-slate-100 animate-pulse">
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
        <div className="h-screen w-screen bg-[#F8FAFC] flex items-center justify-center text-slate-500 text-xs font-mono">
          Memuat Workspace KASRA...
        </div>
      }
    >
      <AuthProvider>
        <KasraWorkspaceShell />
      </AuthProvider>
    </React.Suspense>
  );
}
