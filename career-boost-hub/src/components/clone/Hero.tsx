import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '../ui/button'
import heroBg from '../../assets/hero-bg.jpg'
import Stats from './Stats'

export default function Hero() {
  const go = (sel: string) => {
    const el = document.querySelector(sel)
    el && el.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={heroBg} alt="Career mentorship" className="w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, hsla(215, 65%, 18%, 0.92) 0%, hsla(215, 55%, 25%, 0.88) 50%, hsla(200, 60%, 28%, 0.85) 100%)',
          }}
        />
      </div>
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 left-10 w-96 h-96 bg-highlight/10 rounded-full blur-3xl"
        />
      </div>
      <div className="container-main section-padding relative z-10 pt-32">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-medium">Expert Career Guidance for Students</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6"
          >
            Transform Your{' '}
            <span className="relative">
              <span className="text-highlight">Career</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="absolute -bottom-2 left-0 right-0 h-1 bg-highlight origin-left rounded-full"
              />
            </span>{' '}
            with Expert Mentorship
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-primary-foreground/80 mb-10 max-w-2xl"
          >
            Connect with experienced mentors who guide you through personalized career roadmaps, resume reviews, and interview preparation. Make confident decisions about your future.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 mb-16"
          >
            <Button variant="hero" size="xl" onClick={() => go('#pricing')} className="group">
              Start Your Journey
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="heroOutline" size="xl" onClick={() => go('#services')}>
              Explore Services
            </Button>
          </motion.div>
          <Stats />
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex justify-center pt-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground/50" />
        </motion.div>
      </motion.div>
    </section>
  )
}
