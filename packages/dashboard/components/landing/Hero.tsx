'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'

const LiveDashboard = dynamic(() => import('./LiveDashboard'), {
  ssr: false,
  loading: () => (
    <div className="relative aspect-square rounded-3xl overflow-hidden bg-black/5 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading...</div>
      </div>
    </div>
  )
})

export default function Hero() {
  return (
    <section className="relative bg-white border-b border-neutral-200">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-neutral-900">
              Bagula<span className="text-primary-600">.ai</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
              Pricing
            </Link>
            <Link href="https://github.com/justcopyai/bagula.ai" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
              Docs
            </Link>
            <Link
              href="/sign-in"
              className="text-sm font-medium text-neutral-900 hover:text-primary-600 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-neutral-900 hover:bg-neutral-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 tracking-tight mb-6 leading-tight">
              Monitor AI agents, skills, and prompts in production
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 mb-8 leading-relaxed">
              Track costs, latency, and quality. Pinpoint issues before they impact users. Full visibility into every tool call and LLM interaction.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-neutral-900 hover:bg-neutral-800 transition-colors shadow-sm"
              >
                Get Started
              </Link>
              <Link
                href="https://calendly.com/anup-bagula/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 border border-neutral-300 text-base font-medium rounded-lg text-neutral-900 bg-white hover:bg-neutral-50 transition-colors"
              >
                Book a Demo
              </Link>
            </div>
            <p className="mt-6 text-sm text-neutral-500">
              Self-hosted version available. No credit card required.
            </p>
          </div>

          {/* Right Column - Live Dashboard Animation */}
          <div className="relative">
            <LiveDashboard />
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500 rounded-full opacity-20 blur-2xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-600 rounded-full opacity-15 blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
