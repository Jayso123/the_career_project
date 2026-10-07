import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PageWrapper from '../components/clone/PageWrapper'
import ScrollProgress from '../components/clone/ScrollProgress'
import Navbar from '../components/clone/Navbar'
import Hero from '../components/clone/Hero'
import WhyChooseUs from '../components/clone/WhyChooseUs'
import Services from '../components/clone/Services'
import CareerPaths from '../components/clone/CareerPaths'
import CareerJourney from '../components/clone/CareerJourney'
import Pricing from '../components/clone/Pricing'
import Testimonials from '../components/clone/Testimonials'
import Contact from '../components/clone/Contact'
import Footer from '../components/clone/Footer'

export default function Index() {
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash) return
    // wait for GSAP pin-spacers (CareerPaths/CareerJourney sit above #pricing) before scrolling
    const t = setTimeout(() => {
      try {
        ScrollTrigger.refresh()
        let id = hash.slice(1)
        try { id = decodeURIComponent(id) } catch { /* keep raw */ }
        document.getElementById(id)?.scrollIntoView()
      } catch (e) {
        console.warn('hash scroll failed', e)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [hash])
  return (
    <PageWrapper>
      <ScrollProgress />
      <main className="min-h-screen overflow-x-hidden">
        <Navbar />
        <Hero />
        <WhyChooseUs />
        <Services />
        <CareerPaths />
        <CareerJourney />
        <Pricing />
        <Testimonials />
        <Contact />
        <Footer />
      </main>
    </PageWrapper>
  )
}
