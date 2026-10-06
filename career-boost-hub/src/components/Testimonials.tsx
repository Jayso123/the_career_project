import { testimonials } from '../data/content'

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-center">Success Stories</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {testimonials.map(t => (
            <figure key={t.name} className="rounded-xl border p-6">
              <blockquote className="text-slate-700">"{t.quote}"</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <img src={`https://i.pravatar.cc/80?u=${encodeURIComponent(t.name)}`} alt={t.name} className="h-10 w-10 rounded-full" />
                <div className="text-sm"><div className="font-semibold">{t.name}</div><div className="text-slate-500">{t.role}, {t.company}</div></div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
