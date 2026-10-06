import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Toaster as RadixToaster } from './components/ui/toaster'
import Index from './pages/Index'
import Payment from './pages/Payment'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import ProtectedRoute from './components/ProtectedRoute'
import Mentors from './pages/Mentors'
import MentorProfile from './pages/MentorProfile'
import { AuthProvider } from './context/AuthContext'

import { env } from './lib/env'
import { useMockPay } from './lib/bookingService'
const AtsChecker = lazy(() => import('./pages/AtsChecker'))
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'))

function PaymentRoute() {
  const mockPay = useMockPay()
  return <Payment onPay={env.paymentMode === 'mock' ? mockPay : undefined} />
}

export default function App() {
  return (
    <>
      <RadixToaster />
      <Toaster
        theme="system"
        className="toaster group"
        toastOptions={{
          classNames: {
            toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
            description: 'group-[.toast]:text-muted-foreground',
            actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
            cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          },
        }}
      />
      <BrowserRouter>
      <AuthProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/payment" element={<PaymentRoute />} />
        <Route path="/mentors" element={<Mentors />} />
        <Route path="/mentors/:id" element={<MentorProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><Admin /></ProtectedRoute>} />
        <Route
          path="/ats-checker"
          element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" aria-label="Loading" /></div>}>
              <AtsChecker />
            </Suspense>
          }
        />
        <Route
          path="/resume-builder"
          element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" aria-label="Loading" /></div>}>
              <ResumeBuilder />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </AuthProvider>
      </BrowserRouter>
    </>
  )
}
