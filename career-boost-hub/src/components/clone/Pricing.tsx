import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Star, Check, User, Calendar as CalendarIcon, Clock, ArrowRight } from 'lucide-react'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Calendar } from '../ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { cn } from '../../lib/utils'

export type Plan = {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  popular: boolean
}

const mentors = [
  { id: '1', name: 'Priya Sharma', expertise: 'Tech & IT Careers', experience: '8+ years' },
  { id: '2', name: 'Rahul Verma', expertise: 'Business & Finance', experience: '10+ years' },
  { id: '3', name: 'Ananya Gupta', expertise: 'Healthcare & Medicine', experience: '12+ years' },
  { id: '4', name: 'Vikram Singh', expertise: 'Creative Industries', experience: '7+ years' },
  { id: '5', name: 'Sneha Patel', expertise: 'Engineering & Manufacturing', experience: '9+ years' },
]

const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM']

const PlanModal = ({ isOpen, onClose, plan }: { isOpen: boolean; onClose: () => void; plan: Plan | null }) => {
  const navigate = useNavigate()
  const [date, setDate] = useState<Date | undefined>()
  const [time, setTime] = useState('')
  const [mentorId, setMentorId] = useState('')
  const [step, setStep] = useState(1)
  const complete = date && time && mentorId

  const reset = () => {
    setDate(undefined)
    setTime('')
    setMentorId('')
    setStep(1)
  }
  const proceed = () => {
    if (complete && plan) {
      const state = { date: format(date, 'PPP'), time, mentor: mentors.find((m) => m.id === mentorId), plan }
      navigate('/payment', { state })
      onClose()
      reset()
    }
  }
  const handleClose = () => {
    onClose()
    reset()
  }
  const mentor = mentors.find((m) => m.id === mentorId)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 bg-card border-border overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary to-primary/80">
          <DialogTitle className="text-xl font-display text-primary-foreground">Book Your Mentorship Session</DialogTitle>
          {plan && (
            <p className="text-primary-foreground/80 text-sm mt-1">
              {plan.name} Plan - {plan.price}
            </p>
          )}
        </DialogHeader>
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    step >= n ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {n}
                </div>
                {n < 3 && <div className={cn('w-16 sm:w-24 h-1 mx-2 rounded', step > n ? 'bg-accent' : 'bg-muted')} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Select Mentor</span>
            <span>Choose Date</span>
            <span>Pick Time</span>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <User className="w-4 h-4 text-accent" />
                  Select Your Mentor
                </label>
                <Select value={mentorId} onValueChange={setMentorId}>
                  <SelectTrigger className="w-full h-12">
                    <SelectValue placeholder="Choose a mentor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentors.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{m.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {m.expertise} • {m.experience}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {mentor && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="font-medium text-foreground">{mentor.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {mentor.expertise} • {mentor.experience}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CalendarIcon className="w-4 h-4 text-accent" />
                  Select Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full h-12 justify-start text-left font-normal', !date && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(d) => d < new Date() || d > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {date && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-lg bg-highlight/10 border border-highlight/20">
                    <p className="text-sm text-foreground">
                      Selected: <span className="font-medium">{format(date, 'EEEE, MMMM d, yyyy')}</span>
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Clock className="w-4 h-4 text-accent" />
                  Select Time Slot
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {timeSlots.map((s) => (
                    <Button key={s} type="button" variant={time === s ? 'accent' : 'outline'} size="sm" onClick={() => setTime(s)} className="h-10">
                      {s}
                    </Button>
                  ))}
                </div>
                {time && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-sm text-foreground">
                      Selected time: <span className="font-medium">{time}</span>
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          {step === 3 && complete && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
              <h4 className="font-medium text-foreground">Booking Summary</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>👤 Mentor: {mentor?.name}</p>
                <p>📅 Date: {date && format(date, 'EEEE, MMMM d, yyyy')}</p>
                <p>⏰ Time: {time}</p>
                <p>
                  📋 Plan: {plan?.name} - {plan?.price}
                </p>
              </div>
            </motion.div>
          )}
        </div>
        <div className="p-6 pt-0 flex gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              Back
            </Button>
          )}
          {step < 3 && (
            <Button variant="accent" onClick={() => setStep(step + 1)} disabled={step === 1 ? !mentorId : !date} className="flex-1">
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          {step === 3 && (
            <Button variant="highlight" onClick={proceed} disabled={!complete} className="flex-1">
              Proceed to Payment
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

const plans: Plan[] = [
  { name: 'Basic', price: '₹299', period: 'per session', description: 'Perfect for students seeking quick career clarity', features: ['30-minute 1:1 video call', 'Career path exploration', 'Basic skill assessment', 'Email follow-up support', 'Resource recommendations'], popular: false },
  { name: 'Standard', price: '₹699', period: 'per session', description: 'Comprehensive guidance for serious career planning', features: ['60-minute 1:1 video call', 'Personalized career roadmap', 'Resume review & optimization', 'LinkedIn profile audit', '2 weeks email support', 'Action plan document'], popular: true },
  { name: 'Premium', price: '₹1,199', period: 'per month', description: 'Complete mentorship for career transformation', features: ['4 x 60-minute video calls', 'Full career strategy plan', 'Resume & cover letter creation', 'Mock interview sessions', 'Unlimited chat support', 'Industry connections intro', 'Job application guidance'], popular: false },
]

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } }
const item = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }

export default function Pricing() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Plan | null>(null)
  const book = (p: Plan) => {
    setSelected(p)
    setOpen(true)
  }

  return (
    <>
      <PlanModal isOpen={open} onClose={() => setOpen(false)} plan={selected} />
      <section id="pricing" className="section-padding bg-background">
        <div className="container-main">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-highlight/10 text-highlight text-sm font-medium mb-4">Pricing Plans</span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Invest in Your <span className="text-highlight">Future</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Affordable mentorship plans designed for students. Choose the level of guidance that fits your needs.
            </p>
          </motion.div>
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto"
          >
            {plans.map((p) => (
              <motion.div
                key={p.name}
                variants={item}
                className={`relative rounded-2xl bg-card border-2 transition-all duration-300 hover:shadow-xl ${p.popular ? 'border-accent shadow-lg scale-105 md:scale-110' : 'border-border hover:border-accent/30'}`}
              >
                {p.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-semibold shadow-md">
                      <Star className="w-4 h-4 fill-current" />
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="p-6 lg:p-8">
                  <div className="text-center mb-6 pb-6 border-b border-border">
                    <h3 className="font-display text-xl font-bold text-foreground mb-2">{p.name}</h3>
                    <div className="flex items-baseline justify-center gap-1 mb-2">
                      <span className="text-4xl lg:text-5xl font-bold text-foreground">{p.price}</span>
                      <span className="text-muted-foreground">/{p.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-accent" />
                        </div>
                        <span className="text-foreground text-sm">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant={p.popular ? 'highlight' : 'accent'} size="lg" className="w-full" onClick={() => book(p)}>
                    Book Session
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center text-muted-foreground text-sm mt-12"
          >
            All plans include a satisfaction guarantee. Not happy? We'll make it right.
          </motion.p>
        </div>
      </section>
    </>
  )
}
