import * as lucide from 'lucide-react'
import type { LucideProps } from 'lucide-react'

export default function Icon({ name, ...p }: { name: string } & LucideProps) {
  const C = (lucide as unknown as Record<string, React.ComponentType<LucideProps>>)[name] ?? lucide.Circle
  return <C {...p} />
}
