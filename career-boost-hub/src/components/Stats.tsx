import { stats } from '../data/content'

export default function Stats() {
  return (
    <section className="bg-ink text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 sm:grid-cols-3 text-center">
        {stats.map(s => (
          <div key={s.label}>
            <div className="text-4xl font-bold text-accent">{s.value}</div>
            <div className="text-sm text-white/80">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
