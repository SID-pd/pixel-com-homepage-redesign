'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { SectionHeading } from './section-heading'
import { TiltCard } from './tilt-card'
import { motion } from 'motion/react'
import { fadeUp } from '@/lib/motion'
import { Reveal } from './reveal'

const templates = [
  { name: 'Gallery', tag: 'Minimal', pages: 40, image: '/images/template-minimal.png', tagBg: '#FFC5C5' },
  { name: 'Road Trip', tag: 'Travel', pages: 60, image: '/images/template-collage.png', tagBg: '#BCEEFA' },
  { name: 'Ever After', tag: 'Wedding', pages: 80, image: '/images/template-classic.png', tagBg: '#FCF876' },
  { name: 'Field Notes', tag: 'Journal', pages: 48, image: '/images/template-journal.png', tagBg: '#DCD3FF' },
  { name: 'Our Year', tag: 'Family', pages: 52, image: '/images/hero-book.png', tagBg: '#FFC5C5' },
  { name: 'Wide Open', tag: 'Landscape', pages: 36, image: '/images/product-photobook.png', tagBg: '#BCEEFA' },
]

export function Templates() {
  const scroller = useRef<HTMLUListElement>(null)

  function scrollBy(dir: 1 | -1) {
    const el = scroller.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <section id="templates" aria-labelledby="templates-title" className="scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <SectionHeading
          eyebrow="Start from a template"
          title={
            <span id="templates-title">
              Designed by editors. <em className="text-accent">Finished</em> by you.
            </span>
          }
          description="Hundreds of layouts made by real book designers. Pick one, drop in photos, done."
          action={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scrollBy(-1)}
                aria-label="Previous templates"
                className="grid size-12 place-items-center rounded-full ring-1 ring-inset ring-foreground/15 transition-all hover:bg-foreground hover:text-background active:scale-95"
              >
                <ArrowLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollBy(1)}
                aria-label="Next templates"
                className="grid size-12 place-items-center rounded-full ring-1 ring-inset ring-foreground/15 transition-all hover:bg-foreground hover:text-background active:scale-95"
              >
                <ArrowRight className="size-5" />
              </button>
            </div>
          }
        />
      </div>

      <Reveal staggerChildren={0.07}>
        <ul
          ref={scroller}
          className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth scroll-px-5 px-5 pb-10 pt-4 [scrollbar-width:none] md:scroll-px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] md:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] [&::-webkit-scrollbar]:hidden"
        >
          {templates.map((t) => (
            <motion.li key={t.name} variants={fadeUp} className="w-[78vw] shrink-0 snap-start sm:w-[340px]">
              <TiltCard intensity={9} lift={8} className="rounded-[2rem]">
                <Link href="#start" className="group block focus-visible:outline-none">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-muted border border-black/5 shadow-md transition-all duration-500 group-hover:shadow-2xl">
                    <Image
                      src={t.image}
                      alt={`${t.name} template preview`}
                      fill
                      sizes="(min-width: 640px) 340px, 78vw"
                      className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]"
                    />
                    
                    {/* Top Tag Pill */}
                    <span 
                      className="absolute left-4 top-4 rounded-full px-3.5 py-1 text-xs font-bold text-[#191514] shadow-sm backdrop-blur-md"
                      style={{ backgroundColor: t.tagBg }}
                    >
                      {t.tag}
                    </span>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                    {/* Bottom Overlay Info Pill */}
                    <div className="absolute inset-x-3 bottom-3 z-10">
                      <div className="flex items-center justify-between gap-3 p-3.5 rounded-[1.5rem] bg-white/90 backdrop-blur-xl border border-white/60 shadow-xl transition-all duration-300 group-hover:bg-white group-hover:scale-[1.02]">
                        <div>
                          <h3 className="font-serif text-lg font-bold text-[#191514] leading-tight">{t.name}</h3>
                          <span className="text-xs font-medium text-muted-foreground">{t.pages} pages layout</span>
                        </div>
                        <span className="shrink-0 rounded-xl bg-accent text-accent-foreground px-3 py-1.5 text-xs font-semibold shadow-sm group-hover:bg-accent/90">
                          Customize
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </TiltCard>
            </motion.li>
          ))}
        </ul>
      </Reveal>
    </section>
  )
}
