'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type WizardStep = 'book' | 'photos' | 'review' | 'preview'

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 'book', label: 'Your book' },
  { id: 'photos', label: 'Photos' },
  { id: 'review', label: 'Review' },
  { id: 'preview', label: 'Preview' },
]

/** Four numbered steps joined by a line. Finished steps can be tapped to go back. */
export function Stepper({ step, reached, onGo }: { step: WizardStep; reached: number; onGo: (s: WizardStep) => void }) {
  const at = STEPS.findIndex((s) => s.id === step)
  return (
    <ol aria-label="Progress" className="relative mx-auto grid max-w-xl grid-cols-4">
      <span aria-hidden className="absolute left-[12.5%] right-[12.5%] top-[17px] h-0.5 bg-[#e5dccf]" />
      <span aria-hidden className="absolute left-[12.5%] top-[17px] h-0.5 bg-[#d4673f] transition-[width] duration-700 ease-out" style={{ width: `${(at / (STEPS.length - 1)) * 75}%` }} />
      {STEPS.map((s, i) => {
        const done = i < at
        const active = i === at
        const can = i <= reached && !active
        return (
          <li key={s.id} className="relative flex flex-col items-center">
            <button
              type="button"
              disabled={!can}
              onClick={() => onGo(s.id)}
              aria-current={active ? 'step' : undefined}
              className={cn('grid size-[34px] place-items-center rounded-full text-sm font-semibold transition', active ? 'bg-[#d4673f] text-white shadow-[0_0_0_5px_rgba(212,103,63,0.16)]' : done ? 'bg-[#d4673f] text-white' : 'bg-[#ece5da] text-[#6f7c8a]', can && 'cursor-pointer hover:brightness-105', !can && !active && 'cursor-default')}
            >
              {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
            </button>
            <span className={cn('mt-2 text-xs', active ? 'font-semibold text-[#d4673f]' : 'text-[#6f7c8a]')}>{s.label}</span>
          </li>
        )
      })}
    </ol>
  )
}
