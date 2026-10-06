import { Check } from 'lucide-react'
import { plans } from '../data/content'

export default function Pricing() {
  return (
    <section id="pricing" className="bg-soft py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-center">Simple, Affordable Pricing</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map(p => (
            <div key={p.name} className={`relative rounded-xl bg-white p-8 shadow-sm ${p.popular ? 'ring-2 ring-brand' : ''}`}>
              {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs text-white">Most Popular</span>}
              <h3 className="font-semibold">{p.name}</h3>
              <div className="mt-2"><span className="text-4xl font-bold">{p.price}</span><span className="text-slate-500">{p.unit}</span></div>
              <ul className="mt-6 space-y-2 text-sm">
                {p.features.map(f => <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-accent" />{f}</li>)}
              </ul>
              <a href="#contact" className="mt-8 block rounded-lg bg-brand py-2 text-center text-white hover:bg-brand-dark">Get Started</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
