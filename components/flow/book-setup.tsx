'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Copy, Ruler } from 'lucide-react'
import { COVERS, MATERIALS, PAGE_COUNTS, SIZES, TEMPLATES, money } from '@/lib/flow/catalog'
import { unitPrice } from '@/lib/flow/pricing'
import { flow } from '@/lib/flow/store'
import type { BookConfig } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { PriceTag } from './offer-ui'
import { RadioCard, RadioDot } from './radio-card'

function Section({
  n,
  icon,
  title,
  hint,
  children,
}: {
  n: number
  icon: React.ReactNode
  title: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="min-w-0 rounded-3xl border border-foreground/8 bg-card p-4 shadow-xs sm:p-5">
      <legend className="sr-only">{title}</legend>
      <div className="mb-4 flex items-center gap-3" aria-hidden>
        <span className="grid size-10 place-items-center rounded-2xl bg-accent/12 text-accent">{icon}</span>
        <div>
          <h2 className="font-semibold leading-tight">
            {n}. {title}
          </h2>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
      </div>
      {children}
    </fieldset>
  )
}

export function BookSetup({ config, showTemplates = true }: { config: BookConfig; showTemplates?: boolean }) {
  return (
    <div className="space-y-4">
      {showTemplates && (
        <div className="rounded-3xl border border-dashed border-foreground/15 bg-card/50 p-4">
          <p className="mb-3 text-sm font-medium">
            In a hurry? <span className="text-muted-foreground">Start from a ready-made design: just add photos.</span>
          </p>
          <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TEMPLATES.map((t) => (
              <li key={t.id} className="shrink-0">
                <Link
                  href={`/photo-book/?template=${t.id}`}
                  className="flex items-center gap-2 rounded-full bg-secondary py-1.5 pl-1.5 pr-4 text-sm font-medium transition hover:bg-foreground hover:text-background"
                >
                  <span className="relative size-8 overflow-hidden rounded-full">
                    <Image src={t.image} alt="" fill sizes="32px" className="object-cover" />
                  </span>
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Section n={1} icon={<Ruler className="size-5" />} title="Choose Your Book Size" hint="Select the size that best fits your memories.">
        <div className="grid gap-3 sm:grid-cols-3">
          {SIZES.map((s) => {
            const checked = config.size === s.id
            return (
              <RadioCard key={s.id} name="size" value={s.id} checked={checked} onChange={() => flow.setConfig({ size: s.id })}>
                <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl bg-secondary">
                  <Image src={s.image} alt="" fill sizes="(min-width:640px) 220px, 90vw" className="object-contain p-2" />
                </div>
                <div className="flex items-center gap-3 p-3.5">
                  <RadioDot checked={checked} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.blurb}</p>
                  </div>
                </div>
              </RadioCard>
            )
          })}
        </div>
      </Section>

      <Section n={2} icon={<Copy className="size-5" />} title="Number of Pages" hint="More pages, more memories.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {PAGE_COUNTS.map((p) => {
            const checked = config.pages === p
            const price = unitPrice({ ...config, packaging: undefined, pages: p })
            return (
              <RadioCard
                key={p}
                name="pages"
                value={String(p)}
                checked={checked}
                onChange={() => flow.setConfig({ pages: p })}
                className="p-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <RadioDot checked={checked} />
                  <div>
                    <p className="text-sm font-semibold">{p} Pages</p>
                    <PriceTag list={price} size="sm" className={cn(checked ? 'font-semibold' : '')} />
                  </div>
                </div>
              </RadioCard>
            )
          })}
        </div>
      </Section>

      <Section n={3} icon={<BookOpen className="size-5" />} title="Cover Type" hint="Choose a cover that matches your style.">
        <div className="grid gap-3 sm:grid-cols-2">
          {COVERS.map((c) => {
            const checked = config.cover === c.id
            return (
              <RadioCard key={c.id} name="cover" value={c.id} checked={checked} onChange={() => flow.setConfig({ cover: c.id })}>
                <div className="flex items-center gap-4 p-3.5">
                  <RadioDot checked={checked} />
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-secondary">
                    <Image
                      src={SIZES.find((s) => s.id === config.size)!.image}
                      alt=""
                      fill
                      sizes="96px"
                      className={cn('object-contain p-1.5', c.id === 'softcover' && 'saturate-75')}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{c.blurb}</p>
                  </div>
                </div>
              </RadioCard>
            )
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-foreground/8 pt-4">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground" id="material-label">
              Cover colour
            </p>
            <div role="radiogroup" aria-labelledby="material-label" className="flex gap-2.5">
              {MATERIALS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={config.material === m.id}
                  aria-label={m.label}
                  title={m.label}
                  onClick={() => flow.setConfig({ material: m.id })}
                  className={cn(
                    'size-9 rounded-full ring-offset-2 ring-offset-card transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    config.material === m.id ? 'ring-2 ring-accent' : 'ring-1 ring-foreground/15 hover:ring-foreground/40',
                  )}
                  style={{ background: m.color }}
                />
              ))}
            </div>
          </div>
          <label className="min-w-[200px] flex-1">
            <span className="mb-2 block text-xs font-medium text-muted-foreground">Title on your cover</span>
            <input
              value={config.title}
              maxLength={40}
              onChange={(e) => flow.setConfig({ title: e.target.value })}
              placeholder="Our Story"
              className="h-11 w-full rounded-xl border border-foreground/12 bg-background px-3.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
            />
          </label>
        </div>
      </Section>
    </div>
  )
}
