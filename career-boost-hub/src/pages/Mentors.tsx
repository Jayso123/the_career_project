import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import ConnectSupabase from '../components/ConnectSupabase'
import { supabase } from '../lib/supabase'

export type Mentor = { id: string; name: string; title: string; company: string; bio: string }

export function MentorShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background">
      <div className="bg-primary py-6 px-4">
        <div className="container-main">
          <Link to="/" className="text-sm text-primary-foreground/80 hover:text-primary-foreground">&larr; Home</Link>
        </div>
      </div>
      <div className="container-main py-10">{children}</div>
    </main>
  )
}

export const BookLink = () => (
  <Link to="/#pricing" className="inline-block mt-4 text-accent font-medium hover:underline">
    Book a session
  </Link>
)

export default function Mentors() {
  const [mentors, setMentors] = useState<Mentor[] | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    if (!supabase) return
    supabase
      .from('mentors')
      .select('id, name, title, company, bio')
      .order('name')
      .then(({ data, error: err }) => (err ? setError(true) : setMentors((data as Mentor[]) ?? [])))
  }, [])

  return (
    <MentorShell>
      <h1 className="font-display text-3xl font-bold text-foreground mb-8">Our Mentors</h1>
      {!supabase ? (
        <ConnectSupabase />
      ) : error ? (
        <p role="alert" className="text-destructive">Could not load mentors. Please try again later.</p>
      ) : !mentors ? (
        <Loader2 className="w-8 h-8 animate-spin text-accent" aria-label="Loading" />
      ) : mentors.length === 0 ? (
        <p className="text-muted-foreground">No mentors yet. Run supabase/seed.sql to add them.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((m) => (
            <div key={m.id} className="card-elevated p-6">
              <h2 className="font-display text-xl font-bold text-foreground">{m.name}</h2>
              <p className="text-sm text-accent font-medium mb-2">{m.title}</p>
              <p className="text-sm text-muted-foreground">{m.bio}</p>
              <Link to={`/mentors/${m.id}`} className="inline-block mt-4 mr-4 text-foreground font-medium hover:underline">
                View profile
              </Link>
              <BookLink />
            </div>
          ))}
        </div>
      )}
    </MentorShell>
  )
}
