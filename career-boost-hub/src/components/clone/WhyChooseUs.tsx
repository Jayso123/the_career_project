import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Sparkles, Rocket, Target, Zap } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const features = [
  { icon: Sparkles, title: 'Personalized Approach', description: 'Every career path is unique. We tailor our guidance to your specific goals and strengths.' },
  { icon: Rocket, title: 'Fast Track Growth', description: 'Accelerate your career with proven strategies from industry veterans.' },
  { icon: Target, title: 'Goal Oriented', description: 'Clear milestones and actionable steps to achieve your dream career.' },
  { icon: Zap, title: 'Real Results', description: 'Join thousands of students who landed their dream jobs through our mentorship.' },
]

export default function WhyChooseUs() {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const title = titleRef.current
    const grid = gridRef.current
    if (!section || !title || !grid) return

    gsap.fromTo(
      title,
      { y: 100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.5,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 20%', scrub: 1 },
      },
    )
    const cards = grid.querySelectorAll('.feature-card')
    gsap.fromTo(
      cards,
      { y: 80, opacity: 0, scale: 0.9 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: { trigger: grid, start: 'top 75%', toggleActions: 'play none none reverse' },
      },
    )
    section.querySelectorAll('.floating-element').forEach((el, i) => {
      gsap.to(el, {
        y: -30 * (i + 1),
        rotation: 5 * (i % 2 === 0 ? 1 : -1),
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 2 },
      })
    })
    // live code kills every ScrollTrigger on unmount
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative py-24 lg:py-32 bg-gradient-to-b from-background via-secondary/20 to-background overflow-hidden"
    >
      <div className="floating-element absolute top-20 left-10 w-20 h-20 bg-accent/20 rounded-full blur-xl" />
      <div className="floating-element absolute top-40 right-20 w-32 h-32 bg-highlight/20 rounded-full blur-2xl" />
      <div className="floating-element absolute bottom-20 left-1/4 w-24 h-24 bg-accent/15 rounded-full blur-xl" />
      <div className="container-main relative z-10">
        <h2
          ref={titleRef}
          className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-center mb-16"
        >
          Why Choose{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-highlight">
            Career Boost Hub
          </span>
        </h2>
        <div ref={gridRef} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="feature-card group relative bg-card border border-border rounded-2xl p-6 hover:border-accent/50 transition-all duration-500 hover:shadow-2xl hover:shadow-accent/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-accent transition-all duration-300">
                  <f.icon className="w-7 h-7 text-accent group-hover:text-accent-foreground transition-colors" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3 text-foreground">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden rounded-tr-2xl">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
