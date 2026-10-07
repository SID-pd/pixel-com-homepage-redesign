'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { Check, CloudUpload, Palette, Truck, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { easeOutExpo } from '@/lib/motion'
import { SectionHeading } from './section-heading'

const steps = [
  {
    icon: CloudUpload,
    title: 'Select Size & Pages',
    text: 'Choose your custom photo book size (8x8, 10x10, 12x12) and select your preferred page count.',
  },
  {
    icon: Wand2,
    title: 'Upload Your Photos',
    text: 'Drag and drop your favorite photos from any phone, laptop, or social media platform in seconds.',
  },
  {
    icon: Palette,
    title: 'Customize Your Layout',
    text: 'Our smart layout engine automatically builds a personalized layout from your photos; fine-tune colors, text, or theme.',
  },
  {
    icon: Truck,
    title: 'Print & Get Delivered',
    text: 'Your custom photo book is printed in our California factory and delivered right to your door in 3–5 days.',
  },
]

const uploadThumbs = [
  '/images/photo-travel.png',
  '/images/photo-wedding.png',
  '/images/photo-baby.png',
  '/images/template-journal.png',
  '/images/template-collage.png',
  '/images/product-cards.png',
]

function StepItem({ index, active, onActive }: { index: number; active: boolean; onActive: (i: number) => void }) {
  const ref = useRef<HTMLLIElement>(null)
  const inView = useInView(ref, { margin: '-45% 0px -45% 0px' })
  const step = steps[index]
  const Icon = step.icon

  useEffect(() => {
    if (inView) onActive(index)
  }, [inView, index, onActive])

  return (
    <li ref={ref} className="flex min-h-[38vh] items-center lg:min-h-[52vh]">
      <div
        className={cn(
          'flex gap-5 transition-opacity duration-500',
          active ? 'opacity-100' : 'opacity-35',
        )}
      >
        <span
          className={cn(
            'grid size-12 shrink-0 place-items-center rounded-2xl transition-colors duration-500',
            active ? 'bg-accent text-accent-foreground' : 'bg-ink-foreground/10 text-ink-foreground',
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-ink-foreground/50">
            Step {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className="font-serif text-3xl md:text-4xl">{step.title}</h3>
          <p className="max-w-sm text-pretty leading-relaxed text-ink-foreground/70">{step.text}</p>
        </div>
      </div>
    </li>
  )
}

function EditorPreview({ active }: { active: number }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] bg-ink-foreground/[0.06] p-3 ring-1 ring-ink-foreground/10 md:p-4">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-ink-foreground/20" />
          <span className="size-2.5 rounded-full bg-ink-foreground/20" />
          <span className="size-2.5 rounded-full bg-ink-foreground/20" />
        </div>
        <span className="text-xs text-ink-foreground/50">Summer in Amalfi · 48 pages</span>
        <div className="flex gap-1" aria-hidden>
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1 rounded-full transition-all duration-500',
                i === active ? 'w-5 bg-accent' : 'w-1.5 bg-ink-foreground/20',
              )}
            />
          ))}
        </div>
      </div>

      <div className="relative h-[calc(100%-1.75rem)] overflow-hidden rounded-2xl bg-ink-foreground/[0.04]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(6px)' }}
            transition={{ duration: 0.55, ease: easeOutExpo }}
            className="absolute inset-0 p-3 md:p-5"
          >
            {active === 0 && (
              <div className="grid h-full grid-cols-3 gap-2 md:gap-3">
                {uploadThumbs.map((src, i) => (
                  <motion.div
                    key={src}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.5, ease: easeOutExpo }}
                    className="relative overflow-hidden rounded-xl"
                  >
                    <Image src={src} alt="" fill sizes="160px" className="object-cover" />
                    <motion.span
                      aria-hidden
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: easeOutExpo }}
                      className="absolute inset-x-2 bottom-2 h-1 origin-left rounded-full bg-accent"
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {active === 1 && (
              <div className="grid h-full grid-cols-2 gap-1 rounded-xl bg-ink-foreground p-2 shadow-2xl md:p-3">
                <div className="grid grid-rows-2 gap-1.5">
                  <div className="relative overflow-hidden rounded-md">
                    <Image src="/images/photo-travel.png" alt="" fill sizes="200px" className="object-cover" />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="relative overflow-hidden rounded-md">
                      <Image src="/images/template-journal.png" alt="" fill sizes="100px" className="object-cover" />
                    </div>
                    <div className="relative overflow-hidden rounded-md">
                      <Image src="/images/photo-baby.png" alt="" fill sizes="100px" className="object-cover" />
                    </div>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-md">
                  <Image src="/images/photo-wedding.png" alt="" fill sizes="200px" className="object-cover" />
                </div>
              </div>
            )}

            {active === 2 && (
              <div className="flex h-full flex-col gap-3">
                <div className="grid flex-1 grid-cols-2 gap-1 rounded-xl bg-ink-foreground p-2 md:p-3">
                  <div className="relative overflow-hidden rounded-md">
                    <Image src="/images/photo-wedding.png" alt="" fill sizes="200px" className="object-cover" />
                  </div>
                  <div className="flex flex-col justify-center gap-1 p-3 text-ink">
                    <span className="font-serif text-xl italic md:text-3xl">June, always.</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-ink/50 md:text-xs">Positano · 2025</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-ink-foreground/10 p-2">
                  {['bg-[#d9cbb4]', 'bg-[#3a3632]', 'bg-[#8a5a3c]', 'bg-[#8f9c84]'].map((c, i) => (
                    <span
                      key={c}
                      className={cn('size-6 rounded-full ring-2 ring-offset-2 ring-offset-ink', c, i === 2 ? 'ring-accent' : 'ring-transparent')}
                    />
                  ))}
                  <span className="ml-auto text-xs text-ink-foreground/60">Cognac leather</span>
                </div>
              </div>
            )}

            {active === 3 && (
              <div className="relative h-full overflow-hidden rounded-xl">
                <Image src="/images/product-photobook.png" alt="" fill sizes="480px" className="object-cover" />
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.25, type: 'spring', stiffness: 260, damping: 18 }}
                  className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lift"
                >
                  <span className="grid size-5 place-items-center rounded-full bg-accent text-accent-foreground">
                    <Check className="size-3" aria-hidden />
                  </span>
                  Out for delivery
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export function HowItWorks() {
  const [active, setActive] = useState(0)

  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-24 px-3 md:px-6">
      <div className="mx-auto max-w-7xl rounded-[2.5rem] bg-ink px-5 pb-12 pt-20 text-ink-foreground md:px-12 md:pb-20 md:pt-28">
        <SectionHeading
          tone="dark"
          eyebrow="How it works"
          title={
            <span id="how-title">
              From camera roll to coffee table in <em className="text-accent">four</em> calm steps.
            </span>
          }
          description="No design skills. No blank pages. Just your photos, arranged beautifully — with you in control of every detail."
        />

        <div className="mt-10 grid gap-8 lg:mt-6 lg:grid-cols-2 lg:gap-16">
          <div className="sticky top-20 z-10 -mx-1 self-start rounded-[2rem] bg-ink px-1 py-2 lg:top-[18vh] lg:order-2 lg:py-[6vh]">
            <EditorPreview active={active} />
          </div>
          <ol className="lg:order-1">
            {steps.map((step, i) => (
              <StepItem key={step.title} index={i} active={active === i} onActive={setActive} />
            ))}
          </ol>
        </div>

        {/* AI Transparency Integration Banner */}
        <div className="mt-16 rounded-3xl bg-neutral-900/90 border border-neutral-800 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-neutral-800 pb-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Human-First Design</span>
              <h4 className="mt-1 font-serif text-2xl font-medium text-white">
                Our AI doesn’t replace you. <em className="text-amber-400">It helps you.</em>
              </h4>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              <Check className="size-3.5" /> 60-Second Draft Guaranteed
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs text-neutral-300">
            <div className="flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>AI Analyzes Photos:</strong> Evaluates image quality, faces, and events</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>Auto-Chaptering:</strong> Organizes camera rolls into visual stories</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>Smart Suggestions:</strong> Recommends layouts and caption ideas</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>100% User Control:</strong> YOU make all final layout & photo decisions</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
