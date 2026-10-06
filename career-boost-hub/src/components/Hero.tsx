export default function Hero() {
  return (
    <section id="home" className="relative isolate overflow-hidden bg-gradient-to-br from-brand to-accent text-white">
      <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=60"
           alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-20" />
      <div className="mx-auto max-w-6xl px-4 py-24 md:py-36">
        <h1 className="max-w-3xl text-4xl md:text-6xl font-bold leading-tight">Transform Your Career with Expert Mentorship</h1>
        <p className="mt-6 max-w-xl text-lg text-white/90">Personalized guidance, skill roadmaps and interview prep from mentors who have been where you want to go.</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a href="#contact" className="rounded-lg bg-white px-6 py-3 font-semibold text-brand">Book Session</a>
          <a href="#services" className="rounded-lg border border-white px-6 py-3 font-semibold">Explore Services</a>
        </div>
      </div>
    </section>
  )
}
