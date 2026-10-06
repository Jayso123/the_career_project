import { nav, services } from '../data/content'

export default function Footer() {
  return (
    <footer className="bg-ink text-white/80">
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-8 sm:grid-cols-3 text-sm">
        <div><div className="text-lg font-bold text-white">Career Boost Hub</div><p className="mt-2">Affordable career mentorship for Indian students.</p></div>
        <div><div className="font-semibold text-white">Links</div><ul className="mt-2 space-y-1">{nav.map(n => <li key={n.href}><a href={n.href}>{n.label}</a></li>)}</ul></div>
        <div><div className="font-semibold text-white">Services</div><ul className="mt-2 space-y-1">{services.map(s => <li key={s.title}>{s.title}</li>)}</ul></div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs">
        © {new Date().getFullYear()} Career Boost Hub · <a href="#">Privacy</a> · <a href="#">Terms</a>
      </div>
    </footer>
  )
}
