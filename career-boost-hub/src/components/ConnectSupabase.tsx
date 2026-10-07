import { Database } from 'lucide-react'

export default function ConnectSupabase() {
  return (
    <div className="card-elevated p-6 lg:p-8" role="note">
      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
        <Database className="w-6 h-6 text-accent" />
      </div>
      <h3 className="font-display text-xl font-bold text-foreground mb-2">Supabase is not configured</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Copy <code className="font-mono">.env.example</code> to <code className="font-mono">.env</code>, fill in{' '}
        <code className="font-mono">VITE_SUPABASE_URL</code> and <code className="font-mono">VITE_SUPABASE_ANON_KEY</code>, run{' '}
        <code className="font-mono">supabase/migrations/0001_init.sql</code> in your Supabase project, then restart the dev server.
      </p>
    </div>
  )
}
