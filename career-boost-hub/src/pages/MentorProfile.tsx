import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import ConnectSupabase from '../components/ConnectSupabase'
import { supabase } from '../lib/supabase'
import { BookLink, MentorShell, type Mentor } from './Mentors'

export default function MentorProfile() {
  const { id } = useParams()
  const [mentor, setMentor] = useState<Mentor | null | undefined>(undefined) // undefined = loading
  const [error, setError] = useState(false)
  useEffect(() => {
    if (!supabase || !id) return
    let live = true
    supabase
      .from('mentors')
      .select('id, name, title, company, bio')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (!live) return
        if (err) setError(true)
        else setMentor((data as Mentor | null) ?? null)
      })
    return () => {
      live = false
    }
  }, [id])

  return (
    <MentorShell>
      {!supabase ? (
        <ConnectSupabase />
      ) : error ? (
        <p role="alert" className="text-destructive">Could not load this mentor. Please try again later.</p>
      ) : mentor === undefined ? (
        <Loader2 className="w-8 h-8 animate-spin text-accent" aria-label="Loading" />
      ) : mentor === null ? (
        <p className="text-foreground">Mentor not found.</p>
      ) : (
        <div className="card-elevated p-6 lg:p-8 max-w-2xl">
          <h1 className="font-display text-3xl font-bold text-foreground">{mentor.name}</h1>
          <p className="text-accent font-medium mb-4">{mentor.title}</p>
          <p className="text-muted-foreground">{mentor.bio}</p>
          <BookLink />
        </div>
      )}
    </MentorShell>
  )
}
