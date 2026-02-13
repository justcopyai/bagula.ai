'use client'

import Hero from './Hero';
import ProblemSection from './ProblemSection';
import Features from './Features';
import HowItWorks from './HowItWorks';
import SocialProof from './SocialProof';
import Pricing from './Pricing';
import Footer from './Footer';

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <Features />
      <HowItWorks />
      <SocialProof />
      <Pricing />
      <Footer />
    </>
  );
}
