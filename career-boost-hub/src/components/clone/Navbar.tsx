import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Rocket, Menu, X } from 'lucide-react'
import { Button, buttonVariants } from '../ui/button'
import { cn } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'
import AccountMenu from '../AccountMenu'

const navLinks = [
  { name: 'Home', href: '#home' },
  { name: 'Services', href: '#services' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Testimonials', href: '#testimonials' },
  { name: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (sel: string) => {
    const el = document.querySelector(sel)
    el && el.scrollIntoView({ behavior: 'smooth' })
    setOpen(false)
  }

  const tone = scrolled ? 'text-foreground' : 'text-primary-foreground'

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-card/95 backdrop-blur-md shadow-lg border-b border-border' : 'bg-transparent'}`}
    >
      <div className="container-main section-padding py-4">
        <div className="flex items-center justify-between">
          <motion.a
            href="#home"
            className="flex items-center gap-2 group"
            whileHover={{ scale: 1.02 }}
            onClick={(e) => {
              e.preventDefault()
              go('#home')
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Rocket className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className={`font-display font-bold text-xl ${tone}`}>
              Career<span className="text-accent">Boost</span>
            </span>
          </motion.a>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <motion.button
                key={l.name}
                onClick={() => go(l.href)}
                className={`font-medium transition-colors hover:text-accent ${tone}`}
                whileHover={{ y: -2 }}
              >
                {l.name}
              </motion.button>
            ))}
          </div>
          {/* Only addition vs the live site: Login, replaced by AccountMenu when signed in */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <AccountMenu scrolled={scrolled} />
            ) : (
              <Link
                to="/login"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  !scrolled &&
                    'border-primary-foreground/80 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground',
                )}
              >
                Login
              </Link>
            )}
            <Button variant={scrolled ? 'highlight' : 'hero'} size="lg" onClick={() => go('#contact')}>
              Book Session
            </Button>
          </div>
          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X className={`w-6 h-6 ${tone}`} /> : <Menu className={`w-6 h-6 ${tone}`} />}
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 bg-card rounded-xl shadow-xl border border-border overflow-hidden"
            >
              <div className="p-4 space-y-2">
                {navLinks.map((l) => (
                  <button
                    key={l.name}
                    onClick={() => go(l.href)}
                    className="block w-full text-left py-3 px-4 rounded-lg font-medium text-foreground hover:bg-accent/10 hover:text-accent transition-colors"
                  >
                    {l.name}
                  </button>
                ))}
                {user ? (
                  <AccountMenu scrolled={scrolled} block onNavigate={() => setOpen(false)} />
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full mt-4')}
                  >
                    Login
                  </Link>
                )}
                <Button variant="highlight" size="lg" className="w-full mt-2" onClick={() => go('#pricing')}>
                  Book Session
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}
