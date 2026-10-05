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
  { name: 'Gallery', tag: 'Minimal', pages: 40, image: '/images/template-minimal.png' },
  { name: 'Road Trip', tag: 'Travel', pages: 60, image: '/images/template-collage.png' },
  { name: 'Ever After', tag: 'Wedding', pages: 80, image: '/images/template-classic.png' },
  { name: 'Field Notes', tag: 'Travel', pages: 48, image: '/images/template-journal.png' },
  { name: 'Our Year', tag: 'Family', pages: 52, image: '/images/hero-book.png' },
  { name: 'Wide Open', tag: 'Landscape', pages: 36, image: '/images/product-photobook.png' },
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
                <TiltCard intensity={9} lift={8} className="rounded-[1.75rem]">
                  <Link href="#start" className="block focus-visible:outline-none">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-muted shadow-float transition-shadow duration-500 group-hover:shadow-lift">
                      <Image
                        src={t.image}
                        alt={`${t.name} template preview`}
                        fill
                        sizes="(min-width: 640px) 340px, 78vw"
                        className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]"
                      />
                      <span className="absolute left-4 top-4 rounded-full bg-card/85 px-3 py-1 text-xs font-medium backdrop-blur">
                        {t.tag}
                      </span>
                      <div className="absolute inset-x-4 bottom-4 translate-y-3 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                        <span className="flex h-11 items-center justify-center rounded-full bg-card/90 text-sm font-medium shadow-lg backdrop-blur">
                          Use this template
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between px-1">
                      <h3 className="font-serif text-2xl">{t.name}</h3>
                      <span className="text-sm text-muted-foreground">{t.pages} pages</span>
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
