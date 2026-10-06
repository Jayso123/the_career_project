import { paths } from '../data/content'

export default function CareerPaths() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-center">Popular Career Paths</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map(p => (
            <div key={p.title} className="rounded-xl border p-6">
              <h3 className="font-semibold">{p.title}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.companies.map(c => <span key={c} className="rounded-full bg-soft px-3 py-1 text-xs">{c}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
