import { Footer } from '@/shared/components/footer'
import { LandingHeaderRuntime } from '@/featured/landing/components/LandingHeaderRuntime'
import { HeroSection } from '@/featured/landing/components/HeroSection'
import { FeaturesSection } from '@/featured/landing/components/FeaturesSection'
import { HowItWorksSection } from '@/featured/landing/components/HowItWorksSection'
import { TestimonialsSection } from '@/featured/landing/components/TestimonialsSection'
import { CtaSection } from '@/featured/landing/components/CtaSection'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingHeaderRuntime />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CtaSection />
      <Footer />
    </div>
  )
}
