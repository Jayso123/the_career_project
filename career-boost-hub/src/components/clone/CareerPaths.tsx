import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Code, ChartColumn, PenTool, Briefcase, Megaphone, Shield } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const paths = [
  { icon: Code, title: 'Software Engineering', companies: ['Google', 'Microsoft', 'Amazon'], color: 'from-blue-500 to-cyan-500' },
  { icon: ChartColumn, title: 'Data Science', companies: ['Meta', 'Netflix', 'Spotify'], color: 'from-purple-500 to-pink-500' },
  { icon: PenTool, title: 'UX/UI Design', companies: ['Apple', 'Airbnb', 'Figma'], color: 'from-orange-500 to-rose-500' },
  { icon: Briefcase, title: 'Product Management', companies: ['Stripe', 'Uber', 'Coinbase'], color: 'from-green-500 to-emerald-500' },
  { icon: Megaphone, title: 'Digital Marketing', companies: ['HubSpot', 'Salesforce', 'Adobe'], color: 'from-yellow-500 to-orange-500' },
  { icon: Shield, title: 'Cybersecurity', companies: ['CrowdStrike', 'Palo Alto', 'Okta'], color: 'from-red-500 to-pink-500' },
]

export default function CareerPaths() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    const header = headerRef.current
    if (!section || !track) return
    const dist = track.scrollWidth - window.innerWidth

    header &&
      gsap.fromTo(
        header,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none reverse' },
        },
      )
    const scroll = gsap.to(track, {
      x: -dist,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top 10%', end: () => `+=${dist}`, scrub: 1, pin: true, anticipatePin: 1 },
    })
    track.querySelectorAll('.career-card').forEach((card) => {
      gsap.fromTo(
        card,
        { opacity: 0.5, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          scrollTrigger: { trigger: card, containerAnimation: scroll, start: 'left 80%', end: 'left 40%', scrub: true },
        },
      )
    })
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [])

  return (
    <section ref={sectionRef} className="relative bg-primary overflow-hidden" style={{ height: '100vh' }}>
      <div ref={headerRef} className="absolute top-8 left-0 right-0 z-20 text-center px-4">
        <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-medium mb-4">
          Career Paths
        </span>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground">
          Explore Popular <span className="text-highlight">Destinations</span>
        </h2>
      </div>
      <div
        ref={trackRef}
        className="flex items-center gap-8 px-8 absolute top-1/2 -translate-y-1/2"
        style={{ paddingLeft: '10vw' }}
      >
        {paths.map((p, i) => (
          <div key={p.title} className="career-card flex-shrink-0 w-80 h-96 relative group">
            <div
              className="absolute inset-0 bg-gradient-to-br opacity-10 rounded-3xl blur-xl group-hover:opacity-30 transition-opacity duration-500"
              style={{ background: 'linear-gradient(135deg, var(--tw-gradient-stops))' }}
            />
            <div className="relative h-full bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10 rounded-3xl p-8 flex flex-col justify-between overflow-hidden group-hover:border-primary-foreground/30 transition-all duration-500">
              <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${p.color} opacity-20 blur-3xl`} />
              <div className="relative z-10">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <p.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-display text-2xl font-bold text-primary-foreground mb-4">{p.title}</h3>
              </div>
              <div className="relative z-10">
                <p className="text-primary-foreground/60 text-sm mb-3">Top Companies</p>
                <div className="flex flex-wrap gap-2">
                  {p.companies.map((c) => (
                    <span key={c} className="px-3 py-1 bg-primary-foreground/10 rounded-full text-sm text-primary-foreground/80">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-4 right-4 text-8xl font-bold text-primary-foreground/5 group-hover:text-primary-foreground/10 transition-colors">
                {String(i + 1).padStart(2, '0')}
              </div>
            </div>
          </div>
        ))}
        <div className="flex-shrink-0 w-[50vw]" />
      </div>
    </section>
  )
}
