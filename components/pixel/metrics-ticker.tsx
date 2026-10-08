'use client'

import { motion } from 'motion/react'
import { CheckCircle2, Clock, DollarSign, ShieldCheck, Sparkles, Star, Trophy, Users } from 'lucide-react'

const metrics = [
  { icon: Users, label: 'Loved by Thousands of Customers' },
  { icon: Sparkles, label: '1,000,000+ Books Printed' },
  { icon: Star, label: '2,000+ 5-Star Reviews / Mo' },
  { icon: Clock, label: 'Design Free, Pay Only to Print' },
  { icon: Trophy, label: 'Smart Auto-Layout in About a Minute' },
  { icon: DollarSign, label: 'Factory-Direct Pricing' },
  { icon: CheckCircle2, label: '98.5% Delivery On-Time Rate' },
  { icon: ShieldCheck, label: '99.2% Customer Satisfaction Score' },
]

export function MetricsTicker() {
  return (
    <section aria-label="Customer Success Metrics" className="w-full overflow-hidden bg-neutral-900 py-3 text-neutral-300 border-y border-neutral-800">
      <div className="flex select-none gap-8 overflow-hidden">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 35, ease: 'linear', repeat: Infinity }}
          className="flex shrink-0 items-center gap-8 whitespace-nowrap"
        >
          {[...metrics, ...metrics].map((m, i) => {
            const Icon = m.icon
            return (
              <div key={i} className="flex items-center gap-2 text-xs md:text-sm font-medium">
                <span className="grid size-6 place-items-center rounded-md bg-neutral-800 text-amber-400 border border-neutral-700/60">
                  <Icon className="size-3.5" />
                </span>
                <span className="text-white font-semibold">{m.label}</span>
                <span className="ml-6 text-neutral-700">•</span>
              </div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
