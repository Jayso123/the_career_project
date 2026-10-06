import Icon from './Icon'
import { reasons } from '../data/content'

export default function WhyChooseUs() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-center">Why Choose Us</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map(r => (
            <div key={r.title} className="rounded-xl border p-6 text-center">
              <Icon name={r.icon} className="mx-auto h-10 w-10 text-brand" />
              <h3 className="mt-4 font-semibold">{r.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
