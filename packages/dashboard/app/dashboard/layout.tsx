'use client';

import { UserButton, OrganizationSwitcher, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Activity, CreditCard, Settings, Key } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Always use Clerk hooks - they handle missing auth gracefully
  const { user } = useUser();
  const isCloudMode = !!user; // Cloud mode = user is logged in via Clerk

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Bagula</h1>
          <p className="text-xs text-gray-400 mt-1">AI Agent Monitoring</p>
          {!isCloudMode && (
            <p className="text-xs text-gray-500 mt-2">Self-Hosted</p>
          )}
        </div>
        <nav className="mt-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-6 py-3 hover:bg-gray-800 transition-colors"
          >
            <Activity className="w-5 h-5" />
            <span>Sessions</span>
          </Link>

          {/* Cloud-only features */}
          {isCloudMode && (
            <>
              <Link
                href="/dashboard/billing"
                className="flex items-center gap-3 px-6 py-3 hover:bg-gray-800 transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                <span>Billing</span>
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 px-6 py-3 hover:bg-gray-800 transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
              <Link
                href="/dashboard/settings/api-keys"
                className="flex items-center gap-3 px-6 py-3 hover:bg-gray-800 transition-colors pl-12"
              >
                <Key className="w-4 h-4" />
                <span className="text-sm">API Keys</span>
              </Link>
            </>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {isCloudMode ? (
              <>
                <OrganizationSwitcher
                  appearance={{
                    elements: {
                      rootBox: 'flex items-center gap-2',
                    },
                  }}
                />
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'w-10 h-10',
                    },
                  }}
                  afterSignOutUrl="/sign-in"
                />
              </>
            ) : (
              <div className="flex items-center justify-between w-full">
                <h2 className="text-lg font-semibold text-gray-900">
                  Bagula Dashboard
                </h2>
                <a
                  href="https://github.com/justcopyai/bagula.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Documentation →
                </a>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
