import Navbar from '../components/clone/Navbar'
import Hero from '../components/clone/Hero'
import WhyChooseUs from '../components/clone/WhyChooseUs'
import Services from '../components/clone/Services'
import CareerPaths from '../components/clone/CareerPaths'

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <WhyChooseUs />
        <Services />
        <CareerPaths />
      </main>
    </div>
  )
}
