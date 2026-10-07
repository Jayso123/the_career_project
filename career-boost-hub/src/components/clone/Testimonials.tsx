import { motion } from 'framer-motion'
import { Quote, Star } from 'lucide-react'

const testimonials = [
  { name: 'Priya Sharma', role: 'Software Engineer at Google', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face', content: 'Career Boost Hub completely changed my trajectory. The resume review and interview prep were game-changers. I landed my dream job within 3 months!', rating: 5 },
  { name: 'Rahul Verma', role: 'Product Manager at Microsoft', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', content: "The personalized roadmap helped me transition from engineering to product management. My mentor's industry insights were invaluable.", rating: 5 },
  { name: 'Ananya Patel', role: 'Data Scientist at Amazon', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', content: 'As a confused graduate, I had no idea where to start. The counseling sessions gave me clarity and confidence. Best investment I made!', rating: 5 },
  { name: 'Vikram Singh', role: 'UX Designer at Flipkart', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', content: 'The mock interviews were incredibly realistic. I walked into my actual interview feeling prepared and confident. Highly recommend!', rating: 5 },
]

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const item = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } } }

export default function Testimonials() {
  return (
    <section id="testimonials" className="section-padding bg-primary text-primary-foreground overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-highlight/5 rounded-full blur-3xl" />
      </div>
      <div className="container-main relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-medium mb-4">Success Stories</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Students Who <span className="text-accent">Transformed</span> Their Careers
          </h2>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg">
            Real stories from real students who achieved their career goals with our mentorship.
          </p>
        </motion.div>
        <motion.div variants={container} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {testimonials.map((t) => (
            <motion.div key={t.name} variants={item} className="group">
              <div className="bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10 rounded-2xl p-6 lg:p-8 h-full hover:bg-primary-foreground/10 transition-colors duration-300">
                <Quote className="w-10 h-10 text-accent/50 mb-4" />
                <p className="text-primary-foreground/90 text-lg leading-relaxed mb-6">"{t.content}"</p>
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-highlight fill-highlight" />
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-accent/30" />
                  <div>
                    <h4 className="font-semibold text-primary-foreground">{t.name}</h4>
                    <p className="text-sm text-primary-foreground/60">{t.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
