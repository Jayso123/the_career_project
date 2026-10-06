import Navbar from '../components/clone/Navbar'
import Hero from '../components/clone/Hero'

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
      </main>
    </div>
  )
}
