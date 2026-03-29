import { Nav } from "@/components/marketing/nav"
import { Hero } from "@/components/marketing/hero"
import { Features } from "@/components/marketing/features"
import { SocialProof } from "@/components/marketing/social-proof"
import { CtaSection } from "@/components/marketing/cta-section"
import { Footer } from "@/components/marketing/footer"

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Features />
        <SocialProof />
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}
