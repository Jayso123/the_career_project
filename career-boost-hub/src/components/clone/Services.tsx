import { motion } from 'framer-motion'
import { Target, Map, FileText, MessageSquare, Lightbulb, GraduationCap } from 'lucide-react'

const services = [
  { icon: Target, title: 'Career Counseling', description: 'One-on-one sessions to help you identify your strengths, interests, and the perfect career path aligned with your goals.' },
  { icon: Map, title: 'Skill Roadmaps', description: 'Personalized learning paths with step-by-step guidance on skills you need to master for your dream role.' },
  { icon: FileText, title: 'Resume Review', description: 'Expert feedback on your resume to make it stand out. ATS-friendly formatting and impactful content optimization.' },
  { icon: MessageSquare, title: 'Interview Prep', description: 'Mock interviews with detailed feedback. Learn to confidently answer tough questions and negotiate offers.' },
  { icon: Lightbulb, title: 'Industry Insights', description: 'Real-world knowledge from experienced professionals. Understand industry trends, culture, and expectations.' },
  { icon: GraduationCap, title: 'Higher Education Guidance', description: 'Strategic advice on pursuing further studies—choosing programs, universities, and application strategies.' },
]

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }

export default function Services() {
  return (
    <section id="services" className="section-padding bg-secondary/30">
      <div className="container-main">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Our Services
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Everything You Need to{' '}
            <span className="text-accent">Succeed</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Comprehensive mentorship services designed to guide you at every stage of your career journey.
          </p>
        </motion.div>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {services.map((s) => (
            <motion.div key={s.title} variants={item} className="group">
              <div className="card-elevated p-6 lg:p-8 h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-accent/30">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                  <s.icon className="w-7 h-7 text-accent group-hover:text-accent-foreground transition-colors" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-3">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{s.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
