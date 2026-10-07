'use client'

import Image from 'next/image'
import { BookOpen, FileText, Layers, ShieldCheck, Truck } from 'lucide-react'
import { COVERS, MATERIALS, SIZES, money } from '@/lib/flow/catalog'
import { extraPagesPrice, unitPrice } from '@/lib/flow/pricing'
import type { BookConfig } from '@/lib/flow/types'

function Row({ icon, label, value, onEdit }: { icon: React.ReactNode; label: string; value: string; onEdit?: () => void }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
      {onEdit && (
        <button type="button" onClick={onEdit} className="text-xs font-medium text-accent hover:underline">
          Edit
        </button>
      )}
    </div>
  )
}

export function SummaryCard({ config, onEdit }: { config: BookConfig; onEdit?: () => void }) {
  const size = SIZES.find((s) => s.id === config.size)!
  const cover = COVERS.find((c) => c.id === config.cover)!
  const material = MATERIALS.find((m) => m.id === config.material)!
  const total = unitPrice(config)
  const extra = extraPagesPrice(config)

  return (
    <aside aria-label="Your book summary" className="rounded-3xl border border-foreground/8 bg-card p-5 shadow-xs">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-accent/12 text-accent">
          <BookOpen className="size-5" />
        </span>
        <div>
          <h2 className="font-semibold leading-tight">Your Book</h2>
          <p className="text-xs text-muted-foreground">Customize it and see the live price.</p>
        </div>
      </div>

      <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-2xl bg-secondary">
        <Image src={size.image} alt={`${size.label} photo book`} fill sizes="320px" className="object-contain p-3" />
        <span
          aria-hidden
          className="absolute bottom-2.5 right-2.5 size-5 rounded-full ring-2 ring-card"
          style={{ background: material.color }}
          title={material.label}
        />
      </div>

      <div className="mt-3 divide-y divide-foreground/6">
        <Row icon={<Layers className="size-4" />} label="Size" value={size.label} onEdit={onEdit} />
        <Row icon={<FileText className="size-4" />} label="Pages" value={`${config.pages} pages`} onEdit={onEdit} />
        <Row icon={<BookOpen className="size-4" />} label="Cover" value={cover.label} onEdit={onEdit} />
      </div>

      <div className="mt-4 rounded-2xl bg-secondary/60 p-4">
        <p className="text-sm font-semibold">Price Summary</p>
        <dl className="mt-2 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              Photobook ({size.label}, {Math.min(config.pages, 20)} pages)
            </dt>
            <dd>{money(size.base)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{cover.label}</dt>
            <dd>{cover.adjust === 0 ? 'Included' : `−${money(-cover.adjust)}`}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Extra pages</dt>
            <dd>{extra ? money(extra) : '–'}</dd>
          </div>
        </dl>
        <div className="mt-3 flex items-baseline justify-between border-t border-foreground/8 pt-3">
          <span className="font-semibold">Total</span>
          <span className="text-2xl font-semibold tracking-tight" aria-live="polite">
            {money(total)}
          </span>
        </div>
      </div>

      <ul className="mt-3 space-y-2 text-xs">
        <li className="flex items-center gap-2.5 rounded-xl bg-[oklch(0.95_0.04_150)] px-3 py-2.5 text-[oklch(0.35_0.08_150)]">
          <Truck className="size-4 shrink-0" />
          <span>
            <strong className="font-semibold">Ships from the USA.</strong> Estimated delivery in 5–10 days.
          </span>
        </li>
        <li className="flex items-center gap-2.5 rounded-xl bg-accent/10 px-3 py-2.5 text-[oklch(0.42_0.12_42)]">
          <ShieldCheck className="size-4 shrink-0" />
          <span>
            <strong className="font-semibold">100% Happiness Guarantee.</strong> Love it or we’ll make it right.
          </span>
        </li>
      </ul>
    </aside>
  )
}
