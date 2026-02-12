import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Activity, Zap, Shield, BarChart } from 'lucide-react';

export default async function Home() {
  const { userId } = await auth();

  // If authenticated, redirect to dashboard
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-gray-900" />
            <span className="text-2xl font-bold text-gray-900">Bagula</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          AI Agent Monitoring & Optimization
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Monitor your AI agents in production. Find cost savings, performance
          issues, and quality improvements automatically.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/sign-up"
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Start Free Trial
          </Link>
          <a
            href="https://github.com/justcopyai/bagula.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            View Documentation
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="inline-block p-3 bg-blue-100 rounded-lg mb-4">
              <BarChart className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cost Optimization
            </h3>
            <p className="text-gray-600 text-sm">
              Identify expensive LLM calls and find opportunities to reduce costs
            </p>
          </div>

          <div className="text-center">
            <div className="inline-block p-3 bg-green-100 rounded-lg mb-4">
              <Zap className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Performance Monitoring
            </h3>
            <p className="text-gray-600 text-sm">
              Track latency, throughput, and detect performance regressions
            </p>
          </div>

          <div className="text-center">
            <div className="inline-block p-3 bg-purple-100 rounded-lg mb-4">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Quality Detection
            </h3>
            <p className="text-gray-600 text-sm">
              Catch quality issues and regressions before they impact users
            </p>
          </div>

          <div className="text-center">
            <div className="inline-block p-3 bg-orange-100 rounded-lg mb-4">
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Real-time Dashboard
            </h3>
            <p className="text-gray-600 text-sm">
              View sessions, metrics, and opportunities in real-time
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600 text-sm">
          <p>
            © 2025 Bagula. Powered by{' '}
            <a
              href="https://justcopy.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 hover:underline"
            >
              JustCopy.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
