import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Bagula.ai - Production-ready AI agent monitoring',
  description: 'See what\'s happening inside your agents. Find cost savings, performance issues, and quality problems before your users do.',
  openGraph: {
    title: 'Bagula.ai - Production-ready AI agent monitoring',
    description: 'See what\'s happening inside your agents. Find cost savings, performance issues, and quality problems before your users do.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
