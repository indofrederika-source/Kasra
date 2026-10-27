'use client';

import React, { useState } from 'react';
import { KasraProvider, useKasra } from '@/lib/store/KasraContext';
import { SidebarRail } from '@/components/layout/SidebarRail';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { CashView } from '@/components/cash/CashView';
import { StorageView } from '@/components/storage/StorageView';
import { AnalyticsView } from '@/components/analytics/AnalyticsView';
import { PromoView } from '@/components/promo/PromoView';
import { SettingsView } from '@/components/settings/SettingsView';
import { ConfirmationDraftModal } from '@/components/shared/ConfirmationDraftModal';
import { QuickVoiceModal } from '@/components/shared/QuickVoiceModal';
import { ReceiptScanModal } from '@/components/shared/ReceiptScanModal';

function KasraAppContent() {
  const { activeTab, activeDraft } = useKasra();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#121214] text-[#f4f4f6]">
      {/* 1. Left Sidebar Navigation (Desktop) & Bottom Bar (Mobile) */}
      <SidebarRail />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar with Live Status Chips & Quick Actions */}
        <HeaderBar
          onOpenVoice={() => setIsVoiceOpen(true)}
          onOpenScan={() => setIsScanOpen(true)}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                onOpenVoice={() => setIsVoiceOpen(true)}
                onOpenScan={() => setIsScanOpen(true)}
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
            {activeTab === 'promo' && <PromoView />}
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
    </div>
  );
}

export default function KasraPage() {
  return (
    <React.Suspense
      fallback={
        <div className="h-screen w-screen bg-[#121214] flex items-center justify-center text-[#8a8a92] text-xs font-mono">
          Memuat Workspace KASRA...
        </div>
      }
    >
      <KasraProvider>
        <KasraAppContent />
      </KasraProvider>
    </React.Suspense>
  );
}
