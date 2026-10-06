import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Stats from '../components/Stats'
import WhyChooseUs from '../components/WhyChooseUs'
import Services from '../components/Services'
import CareerPaths from '../components/CareerPaths'
import Pricing from '../components/Pricing'
import Testimonials from '../components/Testimonials'
import Contact from '../components/Contact'
import Footer from '../components/Footer'

export default function Index() {
  return (
    <>
      <Navbar /><Hero /><Stats /><WhyChooseUs /><Services /><CareerPaths />
      <Pricing /><Testimonials /><Contact /><Footer />
    </>
  )
}
