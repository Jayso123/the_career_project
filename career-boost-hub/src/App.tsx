import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Toaster as RadixToaster } from './components/ui/toaster'
import Index from './pages/Index'
import Payment from './pages/Payment'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import Mentors from './pages/Mentors'
import MentorProfile from './pages/MentorProfile'
import { AuthProvider } from './context/AuthContext'
import { env } from './lib/env'
import { useMockPay } from './lib/bookingService'

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
        <Route path="*" element={<NotFound />} />
      </Routes>
      </AuthProvider>
      </BrowserRouter>
    </>
  )
}
