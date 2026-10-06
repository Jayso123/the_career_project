import { motion } from 'framer-motion'
import { Users, Award, TrendingUp } from 'lucide-react'

export const stats = [
  { icon: Users, value: '5000+', label: 'Students Guided' },
  { icon: Award, value: '98%', label: 'Success Rate' },
  { icon: TrendingUp, value: '200+', label: 'Career Transitions' },
]

export default function Stats() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="grid grid-cols-3 gap-8"
    >
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
          className="text-center sm:text-left"
        >
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <s.icon className="w-5 h-5 text-accent" />
            <span className="text-2xl sm:text-3xl font-bold text-primary-foreground">{s.value}</span>
          </div>
          <p className="text-sm text-primary-foreground/60">{s.label}</p>
        </motion.div>
      ))}
    </motion.div>
  )
}
