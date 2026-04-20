'use client';

import { Users, User, Receipt, MessageCircle } from 'lucide-react';

export type TabId = 'pub' | 'tab' | 'crew' | 'profile';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; Icon: typeof Users }[] = [
  { id: 'pub', label: 'Pub', Icon: MessageCircle },
  { id: 'tab', label: 'Tab', Icon: Receipt },
  { id: 'crew', label: 'Crew', Icon: Users },
  { id: 'profile', label: 'Profile', Icon: User },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 pointer-events-none">
      {/* Soft fade above nav so cards don't butt up against the pill */}
      <div className="h-10 bg-gradient-to-t from-brand-dark to-transparent" />

      <div className="px-4 pb-5 pt-1 pointer-events-auto">
        <div className="glass rounded-[22px] shadow-pill flex items-center p-1.5 relative">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex-1 relative flex flex-col items-center justify-center gap-0.5 py-2 rounded-[16px] press"
                aria-current={active ? 'page' : undefined}
              >
                {active && (
                  <span className="absolute inset-0 rounded-[16px] bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 shadow-[0_0_24px_-6px_rgba(139,92,246,0.6)]" />
                )}
                <tab.Icon
                  size={20}
                  className={`relative z-10 transition-colors ${
                    active ? 'text-brand-purple-light' : 'text-ink-300'
                  }`}
                  strokeWidth={active ? 2.4 : 1.8}
                />
                <span
                  className={`relative z-10 text-[10px] font-semibold tracking-wide transition-colors ${
                    active ? 'text-ink-50' : 'text-ink-400'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
