import { Leaf, Package, ShieldCheck, Wand2 } from 'lucide-react'
import { Reveal, RevealItem } from './reveal'

const values = [
  { icon: Wand2, title: 'Made in the USA', text: 'Printed & shipped from California' },
  { icon: Leaf, title: 'Vibrant Full Color', text: 'Premium museum-grade paper' },
  { icon: Package, title: 'Fast 3–5 Day Turnaround', text: 'Fast printing & US delivery' },
  { icon: ShieldCheck, title: '100% Satisfaction', text: 'Guaranteed quality on every order' },
]

export function ValueStrip() {
  return (
    <section aria-label="Why Pixovo" className="px-5 md:px-6">
      <Reveal
        staggerChildren={0.06}
        className="mx-auto grid max-w-6xl grid-cols-2 gap-4 md:grid-cols-4"
      >
        {values.map(({ icon: Icon, title, text }) => (
          <RevealItem key={title} className="flex flex-col gap-3 rounded-2xl bg-card p-5 md:p-6 shadow-sm">
            <Icon className="size-5 text-accent" aria-hidden />
            <div>
              <h3 className="font-medium tracking-tight">{title}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
            </div>
          </RevealItem>
        ))}
      </Reveal>
    </section>
  )
}
