import PageWrapper from '../components/clone/PageWrapper'
import ScrollProgress from '../components/clone/ScrollProgress'
import Navbar from '../components/clone/Navbar'
import Hero from '../components/clone/Hero'
import WhyChooseUs from '../components/clone/WhyChooseUs'
import Services from '../components/clone/Services'
import CareerPaths from '../components/clone/CareerPaths'
import CareerJourney from '../components/clone/CareerJourney'

export default function Index() {
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
      </main>
    </PageWrapper>
  )
}
