import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { nav } from '../data/content'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <a href="#home" className="font-bold text-xl text-brand">Career Boost Hub</a>
        <nav className="hidden md:flex items-center gap-6">
          {nav.map(n => <a key={n.href} href={n.href} className="text-sm hover:text-brand">{n.label}</a>)}
          <a href="#contact" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">Book Session</a>
        </nav>
        <button className="md:hidden" aria-label="Toggle menu" onClick={() => setOpen(o => !o)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="md:hidden flex flex-col gap-3 border-t px-4 py-4 bg-white">
          {nav.map(n => <a key={n.href} href={n.href} onClick={() => setOpen(false)}>{n.label}</a>)}
          <a href="#contact" onClick={() => setOpen(false)} className="rounded-lg bg-brand px-4 py-2 text-center text-white">Book Session</a>
        </nav>
      )}
    </header>
  )
}
