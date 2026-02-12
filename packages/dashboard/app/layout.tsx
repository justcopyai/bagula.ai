import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bagula - AI Agent Monitoring",
  description: "Monitor your AI agents in production. Find cost savings and performance issues.",
};

// Check if Clerk is configured (cloud mode) or not (self-hosted mode)
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isCloudMode = !!clerkPublishableKey;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bodyContent = (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );

  // Cloud mode: Use Clerk authentication
  if (isCloudMode) {
    return (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        {bodyContent}
      </ClerkProvider>
    );
  }

  // Self-hosted mode: No authentication required
  return bodyContent;
}
