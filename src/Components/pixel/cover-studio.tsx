'use client'

import { useState, type PointerEvent } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { cn } from '@/lib/utils'
import { SectionHeading } from './section-heading'
import { Reveal, RevealItem } from './reveal'
import { CtaLink } from './cta-link'

const materials = [
  { id: 'oat', name: 'Oat Linen', color: '#d8cab2', spine: '#c4b496', text: '#3b332a' },
  { id: 'charcoal', name: 'Charcoal Linen', color: '#3b3733', spine: '#2a2724', text: '#efe7da' },
  { id: 'cognac', name: 'Cognac Leather', color: '#8a573a', spine: '#6f432b', text: '#f4e6d4' },
  { id: 'sage', name: 'Sage Linen', color: '#97a38b', spine: '#7d8a72', text: '#232a1f' },
]

const specs = [
  { value: '200+', label: 'year archival paper' },
  { value: '180°', label: 'lay-flat binding' },
  { value: '170gsm', label: 'thick, matte pages' },
]

export function CoverStudio() {
  const [materialId, setMaterialId] = useState(materials[2].id)
  const material = materials.find((m) => m.id === materialId) ?? materials[0]
  const reduceMotion = useReducedMotion()
  const px = useMotionValue(0)
  const rotateY = useSpring(useTransform(px, [-1, 1], [-38, -8]), { stiffness: 90, damping: 16 })

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    if (reduceMotion || e.pointerType !== 'mouse') return
    const rect = e.currentTarget.getBoundingClientRect()
    px.set(((e.clientX - rect.left) / rect.width - 0.5) * 2)
  }

  return (
    <section aria-labelledby="studio-title" className="px-5 py-24 md:px-6 md:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div
          onPointerMove={handleMove}
          onPointerLeave={() => px.set(0)}
          className="relative order-2 flex aspect-square items-center justify-center overflow-hidden rounded-[2.5rem] bg-secondary [perspective:1600px] lg:order-1"
        >
          <motion.div
            aria-hidden
            animate={{ backgroundColor: material.color }}
            transition={{ duration: 0.6 }}
            className="absolute bottom-[14%] h-8 w-[52%] rounded-[50%] opacity-40 blur-2xl"
          />
          <motion.div
            style={{ rotateY, rotateX: 8 }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="relative h-[62%] w-[46%] transform-gpu [transform-style:preserve-3d]"
          >
            <div
              className="absolute inset-y-0 left-0 w-full rounded-r-md bg-[repeating-linear-gradient(90deg,#f6f1e8_0px,#f6f1e8_2px,#e6dfd2_3px)]"
              style={{ transform: 'translateZ(-14px) translateX(4px)' }}
            />
            <motion.div
              animate={{ backgroundColor: material.spine }}
              transition={{ duration: 0.6 }}
              className="absolute inset-y-0 left-0 w-7 origin-left"
              style={{ transform: 'rotateY(-90deg)' }}
            />
            <motion.div
              animate={{ backgroundColor: material.color }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 flex flex-col items-center justify-between overflow-hidden rounded-r-lg rounded-l-sm p-[9%] shadow-[inset_6px_0_10px_-6px_rgba(0,0,0,0.35)]"
              style={{ transform: 'translateZ(14px)' }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.25)_0_1px,transparent_1px_3px)]"
              />
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm shadow-md">
                <Image
                  src="/images/photo-travel.png"
                  alt=""
                  fill
                  sizes="240px"
                  className="object-cover"
                />
              </div>
              <motion.span
                animate={{ color: material.text }}
                transition={{ duration: 0.6 }}
                className="relative font-serif text-[clamp(1rem,2.4vw,1.6rem)] italic"
              >
                Summer in Amalfi
              </motion.span>
            </motion.div>
          </motion.div>
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-card/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            {material.name}
          </span>
        </div>

        <div className="order-1 flex flex-col gap-10 lg:order-2">
          <SectionHeading
            eyebrow="Crafted to last"
            title={
              <span id="studio-title">
                Pick a cover you&apos;ll want to <em className="text-accent">touch.</em>
              </span>
            }
            description="Woven linens and full-grain leathers, debossed with your title. Try a few — the preview updates instantly."
          />

          <Reveal className="flex flex-col gap-4">
            <RevealItem>
              <fieldset>
                <legend className="mb-3 text-sm font-medium">Cover material</legend>
                <div className="flex flex-wrap gap-2">
                  {materials.map((m) => {
                    const selected = m.id === materialId
                    return (
                      <button
                        key={m.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setMaterialId(m.id)}
                        className={cn(
                          'relative flex items-center gap-2.5 rounded-full py-2 pl-2 pr-4 text-sm transition-colors',
                          selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {selected && (
                          <motion.span
                            layoutId="material-pill"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            className="absolute inset-0 rounded-full bg-card shadow-float ring-1 ring-foreground/10"
                          />
                        )}
                        <span
                          className="relative size-6 rounded-full ring-1 ring-inset ring-black/10"
                          style={{ backgroundColor: m.color }}
                          aria-hidden
                        />
                        <span className="relative">{m.name}</span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            </RevealItem>

            <RevealItem>
              <dl className="grid grid-cols-3 gap-3 pt-4">
                {specs.map((s) => (
                  <div key={s.label} className="rounded-2xl bg-secondary p-4">
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="font-serif text-3xl leading-none">{s.value}</dd>
                    <dd className="mt-2 text-xs leading-snug text-muted-foreground">{s.label}</dd>
                  </div>
                ))}
              </dl>
            </RevealItem>

            <RevealItem className="pt-2">
              <CtaLink href="#start" magnetic>
                Design with {material.name}
              </CtaLink>
            </RevealItem>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
