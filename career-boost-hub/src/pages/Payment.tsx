import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Calendar, Clock, Package, CircleCheck, CreditCard, ArrowLeft, Lock, Shield } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useToast } from '../components/ui/use-toast'

export interface PaymentState {
  date: string
  time: string
  mentor: { id?: number | string; name: string; expertise: string; experience?: string }
  plan: { name: string; price: string; period?: string; description: string; features: string[]; popular?: boolean }
}

export interface PayContext extends PaymentState {
  amount: number
}

export type PayResult = void | { paymentId?: string }
export type OnPay = (ctx: PayContext) => Promise<PayResult> | PayResult

// Live site loads Razorpay's checkout script and the Pay button stays disabled until it is ready.
function useRazorpayScript() {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (document.getElementById('razorpay-script')) {
      setLoaded(true)
      return
    }
    const s = document.createElement('script')
    s.id = 'razorpay-script'
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    s.onload = () => setLoaded(true)
    s.onerror = () => console.error('Failed to load Razorpay script')
    document.body.appendChild(s)
  }, [])
  return loaded
}

const parseAmount = (price: string) => parseInt(price.replace(/[^\d]/g, ''), 10) || 0

const Spinner = () => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
  />
)

export function PaymentView({ state, onPay }: { state: PaymentState; onPay?: OnPay }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const scriptLoaded = useRazorpayScript()
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [paymentId, setPaymentId] = useState<string | undefined>()
  const { date, time, mentor, plan } = state

  const handlePay = async () => {
    const amount = parseAmount(plan?.price || '0')
    if (amount === 0) {
      toast({ title: 'Error', description: 'Invalid price amount', variant: 'destructive' })
      return
    }
    setIsLoading(true)
    try {
      // Without onPay there is no payment backend in this clone (live used Razorpay via a Supabase edge function).
      if (!onPay) throw new Error('Payment gateway is not configured')
      const res = await onPay({ ...state, amount })
      if (res && typeof res === 'object') setPaymentId(res.paymentId)
      setDone(true)
      toast({ title: 'Payment Successful!', description: 'Your mentorship session has been booked.' })
    } catch (e) {
      toast({
        title: 'Payment Failed',
        description: (e as Error).message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-accent/20 flex items-center justify-center"
          >
            <CircleCheck className="w-12 h-12 text-accent" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">Booking Confirmed!</h1>
          <p className="text-muted-foreground mb-8">
            Your mentorship session with {mentor?.name} has been scheduled for {date} at {time}.
          </p>
          <div className="p-6 rounded-xl bg-card border border-border mb-8 text-left">
            <h3 className="font-medium text-foreground mb-4">Session Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-accent" />
                <span className="text-muted-foreground">Mentor:</span>
                <span className="text-foreground font-medium">{mentor?.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-accent" />
                <span className="text-muted-foreground">Date:</span>
                <span className="text-foreground font-medium">{date}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-accent" />
                <span className="text-muted-foreground">Time:</span>
                <span className="text-foreground font-medium">{time}</span>
              </div>
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-accent" />
                <span className="text-muted-foreground">Plan:</span>
                <span className="text-foreground font-medium">{plan?.name}</span>
              </div>
              {paymentId && (
                <div className="flex items-center gap-3 pt-2 border-t border-border mt-2">
                  <CreditCard className="w-4 h-4 text-accent" />
                  <span className="text-muted-foreground">Payment ID:</span>
                  <span className="text-foreground font-medium text-xs">{paymentId}</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-6">A confirmation email with meeting details will be sent to you shortly.</p>
          <Button onClick={() => navigate('/')} variant="accent" size="lg" className="w-full">
            Return to Home
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary py-6 px-4">
        <div className="container-main">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-primary-foreground hover:bg-primary-foreground/10 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-display font-bold text-primary-foreground">Complete Your Payment</h1>
        </div>
      </div>
      <div className="container-main py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Booking Summary</h2>
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Mentor</p>
                  <p className="text-foreground font-medium">{mentor?.name}</p>
                  <p className="text-xs text-muted-foreground">{mentor?.expertise}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="text-foreground font-medium">{date}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="text-foreground font-medium">{time}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="text-foreground font-medium">{plan?.name}</p>
                  <p className="text-xs text-muted-foreground">{plan?.description}</p>
                </div>
              </div>
            </div>
            {plan?.features && plan.features.length > 0 && (
              <div className="border-t border-border pt-4 mb-6">
                <p className="text-sm font-medium text-foreground mb-3">What's Included:</p>
                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CircleCheck className="w-4 h-4 text-accent flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center text-xl">
                <span className="font-medium text-foreground">Total</span>
                <span className="font-bold text-highlight">{plan?.price}</span>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="text-center mb-6">
                <CreditCard className="w-12 h-12 text-accent mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-2">Secure Payment via Razorpay</h2>
                <p className="text-sm text-muted-foreground">Pay securely using Credit/Debit Card, UPI, Net Banking, or Wallets</p>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mb-6 py-4 border-y border-border">
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Cards</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                  <span className="text-xs font-semibold text-muted-foreground">UPI</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground">Net Banking</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground">Wallets</span>
                </div>
              </div>
              <Button variant="highlight" size="lg" className="w-full" onClick={handlePay} disabled={isLoading || !scriptLoaded}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner />
                    Processing...
                  </span>
                ) : scriptLoaded ? (
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Pay {plan?.price}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Spinner />
                    Loading...
                  </span>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-4">By proceeding, you agree to our Terms of Service and Refund Policy</p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-accent/5 rounded-lg border border-accent/20">
              <Shield className="w-5 h-5 text-accent flex-shrink-0" />
              <p className="text-sm text-muted-foreground">Your payment is secured with 256-bit SSL encryption via Razorpay's PCI-DSS compliant gateway.</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Powered by <span className="font-semibold">Razorpay</span> - India's trusted payment gateway
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function Payment({ onPay }: { onPay?: OnPay }) {
  const navigate = useNavigate()
  const state = useLocation().state as PaymentState | null
  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">No booking details found</h1>
          <Button onClick={() => navigate('/')} variant="accent">
            Return to Home
          </Button>
        </div>
      </div>
    )
  }
  return <PaymentView state={state} onPay={onPay} />
}
