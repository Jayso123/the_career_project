import { useEffect, useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const st = (r: Element) => ({ trigger: r, start: 'top 85%', toggleActions: 'play none none reverse' })

export default function PageWrapper({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<Element>('[data-gsap-fade]').forEach((r) => {
        gsap.fromTo(r, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: st(r) })
      })
      gsap.utils.toArray<Element>('[data-gsap-scale]').forEach((r) => {
        gsap.fromTo(r, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)', scrollTrigger: st(r) })
      })
      gsap.utils.toArray<Element>('[data-gsap-slide-left]').forEach((r) => {
        gsap.fromTo(r, { opacity: 0, x: -100 }, { opacity: 1, x: 0, duration: 1, ease: 'power3.out', scrollTrigger: st(r) })
      })
      gsap.utils.toArray<Element>('[data-gsap-slide-right]').forEach((r) => {
        gsap.fromTo(r, { opacity: 0, x: 100 }, { opacity: 1, x: 0, duration: 1, ease: 'power3.out', scrollTrigger: st(r) })
      })
      gsap.utils.toArray<Element>('[data-gsap-stagger]').forEach((r) => {
        gsap.fromTo(r.children, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out', scrollTrigger: st(r) })
      })
    }, ref)
    return () => {
      ctx.revert()
    }
  }, [])

  return (
    <div ref={ref} className="gsap-wrapper">
      {children}
    </div>
  )
}
