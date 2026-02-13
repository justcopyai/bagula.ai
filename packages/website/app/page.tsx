import Hero from '@/components/Hero'
import ProblemSection from '@/components/ProblemSection'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import SocialProof from '@/components/SocialProof'
import Pricing from '@/components/Pricing'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <ProblemSection />
      <Features />
      <HowItWorks />
      <SocialProof />
      <Pricing />
      <Footer />
    </main>
  )
}
