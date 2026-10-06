import Icon from './Icon'
import { services } from '../data/content'

export default function Services() {
  return (
    <section id="services" className="bg-soft py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-center">Our Services</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(s => (
            <div key={s.title} className="rounded-xl bg-white p-6 shadow-sm">
              <Icon name={s.icon} className="h-8 w-8 text-accent" />
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
