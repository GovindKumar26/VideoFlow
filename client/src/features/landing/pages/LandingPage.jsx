import React from 'react'
import Navbar from '../components/Navbar/Navbar'
import Hero from '../components/Hero/Hero'
import PlatformSection from '../components/PlatformSection/PlatformSection'
import StudioSection from '../components/StudioSection/StudioSection'
import DevelopersSection from '../components/DevelopersSection/DevelopersSection'
import SecuritySection from '../components/SecuritySection.jsx/SecuritySection'
import NetworkSection from '../components/NetworkSection/NetworkSection'
import UseCasesSection from '../components/UseCaseSection/UseCaseSection'
import PricingSection from '../components/PricingSection/PricingSection'
import Footer from '../components/Footer/Footer'

function LandingPage() {
  return (
   <>
        <Navbar />
        <Hero />
        <PlatformSection />
        <StudioSection />
        <SecuritySection />
        <DevelopersSection />
        <NetworkSection />
        <UseCasesSection />
        <PricingSection />
        <Footer />
   </>
  )
}

export default LandingPage