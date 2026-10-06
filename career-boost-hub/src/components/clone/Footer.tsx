import { Linkedin, Twitter, Instagram, Rocket, Mail, Phone } from 'lucide-react'

const quickLinks = [
  { name: 'Home', href: '#home' },
  { name: 'Services', href: '#services' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Testimonials', href: '#testimonials' },
  { name: 'Contact', href: '#contact' },
]
const serviceList = ['Career Counseling', 'Resume Review', 'Interview Prep', 'Skill Roadmaps', 'Industry Insights']
const socialClass = 'w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent transition-colors'

export default function Footer() {
  const year = new Date().getFullYear()
  const scrollTo = (sel: string) => {
    const el = document.querySelector(sel)
    el && el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-main section-padding pb-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <Rocket className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="font-display font-bold text-xl">
                Career<span className="text-accent">Boost</span>
              </span>
            </div>
            <p className="text-primary-foreground/70 mb-6">
              Empowering students to make confident career decisions through expert mentorship and guidance.
            </p>
            <div className="flex gap-4">
              <a href="#" className={socialClass}>
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className={socialClass}>
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className={socialClass}>
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((l) => (
                <li key={l.name}>
                  <button onClick={() => scrollTo(l.href)} className="text-primary-foreground/70 hover:text-accent transition-colors">
                    {l.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Services</h4>
            <ul className="space-y-3">
              {serviceList.map((s) => (
                <li key={s}>
                  <span className="text-primary-foreground/70">{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent" />
                <span className="text-primary-foreground/70">support@careerboosthub.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-accent" />
                <span className="text-primary-foreground/70">+91 7974163946</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-primary-foreground/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/60 text-sm">© {year} Career Boost Hub. All rights reserved.</p>
          <br />
          <p className="text-primary-foreground/60 text-sm">Created by CareerBoost Team</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors">Privacy Policy</a>
            <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
