'use client'

import Image from 'next/image'
import { CheckCircle2, DollarSign, Factory, MapPin, Sparkles } from 'lucide-react'
import { Reveal, RevealItem } from './reveal'
import { SectionHeading } from './section-heading'

const factoryHighlights = [
  {
    title: 'California Printing Facility',
    subtitle: 'State-of-the-Art Printing',
    text: 'Located in California, our factory houses high-definition HP Indigo commercial photo presses delivering true color depth and museum fidelity.',
    image: '/images/factory-printing-facility.png',
  },
  {
    title: 'Strict Quality Control',
    subtitle: 'Hand-Inspected Every Page',
    text: 'Every single album undergoes a 12-point manual inspection for binding tightness, color alignment, and paper spine durability.',
    image: '/images/factory-quality-control.png',
  },
  {
    title: '20+ Years of Craftsmanship',
    subtitle: 'Built by Photobook Experts',
    text: 'Our master bookbinders have perfected archival layflat binding and premium cover leather crafting since 2003.',
    image: '/images/factory-craftsmanship.png',
  },
]

export function FactoryTour() {
  return (
    <section aria-labelledby="factory-tour-title" className="px-3 md:px-6 my-16">
      <div className="mx-auto max-w-7xl rounded-[2.5rem] bg-secondary/80 px-6 py-16 md:px-12 md:py-24 border border-foreground/5 shadow-sm">
        <SectionHeading
          eyebrow="Manufacturing Transparency"
          title={
            <span id="factory-tour-title">
              Tour Our California Factory. <em className="text-accent">Made in the USA.</em>
            </span>
          }
          description="We don’t outsource to overseas budget factories. Every Pixovo photo book is printed, bound, and hand-checked right here in California."
        />

        <Reveal staggerChildren={0.08} className="mt-12 grid gap-6 md:grid-cols-3">
          {factoryHighlights.map((item) => (
            <RevealItem
              key={item.title}
              className="group flex flex-col overflow-hidden rounded-3xl bg-background border border-foreground/[0.06] shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                  <MapPin className="size-3 text-amber-400" /> California Facility
                </span>
              </div>
              <div className="flex flex-col gap-1.5 p-6">
                <span className="text-xs font-semibold tracking-wider uppercase text-accent">{item.subtitle}</span>
                <h3 className="font-serif text-xl font-medium tracking-tight text-foreground">{item.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground mt-1">{item.text}</p>
              </div>
            </RevealItem>
          ))}
        </Reveal>

        {/* Certifications & Badges Row */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-2xl bg-background p-4 border border-foreground/[0.06] shadow-sm">
            <DollarSign className="size-5 text-emerald-500 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-foreground">Factory Direct Pricing</h4>
              <p className="text-[11px] text-muted-foreground">No middlemen, buy from the printer</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-background p-4 border border-foreground/[0.06] shadow-sm">
            <Sparkles className="size-5 text-purple-500 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-foreground">Design Free</h4>
              <p className="text-[11px] text-muted-foreground">Pay only when you print</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-background p-4 border border-foreground/[0.06] shadow-sm">
            <Factory className="size-5 text-blue-500 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-foreground">Ships Out in 3–5 Business Days</h4>
              <p className="text-[11px] text-muted-foreground">Direct from USA Facility</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-background p-4 border border-foreground/[0.06] shadow-sm">
            <CheckCircle2 className="size-5 text-amber-500 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-foreground">Archival Grade Paper</h4>
              <p className="text-[11px] text-muted-foreground">Fade-Resistant Printing</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
