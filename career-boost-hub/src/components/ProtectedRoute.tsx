import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth, type Profile } from '../context/AuthContext'

export default function ProtectedRoute({ role, children }: { role?: Profile['role']; children: ReactNode }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label="Loading">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (role && profile?.role !== role) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
