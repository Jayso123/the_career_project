import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MessageCircle, MapPin, Send } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { useToast } from '../ui/use-toast'
import { supabase } from '../../lib/supabase'
import { notifyOwner } from '../../lib/notify'
import { leadFromContact } from '../../lib/leadFromContact'

// Live site: no validation beyond HTML `required`. Saves a lead (when Supabase is configured) and emails the owner.
export default function Contact() {
  const { toast } = useToast()
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [loading, setLoading] = useState(false)

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const lead = leadFromContact(form)
      if (supabase) {
        const { error } = await supabase.from('leads').insert(lead) // no .select(): anon has no SELECT policy
        if (error) throw error
      }
      await notifyOwner({ kind: 'contact', name: lead.name, email: lead.email, phone: lead.phone, requirements: lead.goals })
      toast({ title: 'Message Sent! 🎉', description: "We'll get back to you within 24 hours." })
      setForm({ name: '', email: '', phone: '', message: '' })
    } catch (err) {
      console.error('lead insert failed', err)
      toast({ title: 'Something went wrong', description: 'Please try again or email us directly.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const linkClass = 'flex items-start gap-4 group cursor-pointer hover:bg-accent/5 p-2 -m-2 rounded-xl transition-colors'
  const iconBox = 'w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors'
  const labelClass = 'block text-sm font-medium text-foreground mb-2'

  return (
    <section id="contact" className="section-padding bg-secondary/30">
      <div className="container-main">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">Get in Touch</span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Ready to <span className="text-accent">Boost</span> Your Career?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Take the first step towards your dream career. Fill out the form and our team will reach out to schedule your mentorship session.
            </p>
            <div className="space-y-6">
              <a href="mailto:hello@careerboosthub.com" className={linkClass}>
                <div className={iconBox}>
                  <Mail className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1 group-hover:text-accent transition-colors">Email Us</h4>
                  <p className="text-muted-foreground">support@careerboosthub.com</p>
                </div>
              </a>
              <a href="tel:+917974163946" className={linkClass}>
                <div className={iconBox}>
                  <Phone className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1 group-hover:text-accent transition-colors">Call Us</h4>
                  <p className="text-muted-foreground">+91 7974163946</p>
                </div>
              </a>
              <a href="https://wa.me/917974163946" target="_blank" rel="noopener noreferrer" className={linkClass}>
                <div className={iconBox}>
                  <MessageCircle className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1 group-hover:text-accent transition-colors">WhatsApp Support</h4>
                  <p className="text-muted-foreground">Quick responses within hours</p>
                </div>
              </a>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Location</h4>
                  <p className="text-muted-foreground">100% Online — Available Worldwide</p>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
            <div className="card-elevated p-6 lg:p-8">
              <h3 className="font-display text-xl font-bold text-foreground mb-6">Book Your Free Consultation</h3>
              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className={labelClass}>Full Name</label>
                  <Input id="name" name="name" value={form.name} onChange={onChange} placeholder="Enter your name" required className="h-12" />
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>Email Address</label>
                  <Input id="email" name="email" type="email" value={form.email} onChange={onChange} placeholder="you@example.com" required className="h-12" />
                </div>
                <div>
                  <label htmlFor="phone" className={labelClass}>Phone Number</label>
                  <Input id="phone" name="phone" type="tel" value={form.phone} onChange={onChange} placeholder="+91 7974163946" className="h-12" />
                </div>
                <div>
                  <label htmlFor="message" className={labelClass}>What are your career goals?</label>
                  <Textarea id="message" name="message" value={form.message} onChange={onChange} placeholder="Tell us about your career aspirations..." rows={4} required className="resize-none" />
                </div>
                <Button type="submit" variant="highlight" size="lg" className="w-full" disabled={loading}>
                  {loading ? (
                    'Sending...'
                  ) : (
                    <>
                      Send Message
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
              <p className="text-sm text-muted-foreground text-center mt-4">We respect your privacy. No spam, ever.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
