import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import LandingPage from '@/components/landing/LandingPage';

export default async function Home() {
  const { userId } = await auth();

  // If authenticated, redirect to dashboard
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen">
      <LandingPage />
    </main>
  );
}
