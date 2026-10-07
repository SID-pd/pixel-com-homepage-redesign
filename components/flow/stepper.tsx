import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Stepper({
  steps,
  current,
  onGo,
}: {
  steps: string[]
  current: number // 1-based
  onGo?: (step: number) => void
}) {
  return (
    <ol className="flex w-full items-start" aria-label="Progress">
      {steps.map((label, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        const clickable = done && onGo
        return (
          <li key={label} className="relative flex flex-1 flex-col items-center gap-1.5 text-center" aria-current={active ? 'step' : undefined}>
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-[-50%] right-[50%] top-4 h-0.5 -translate-y-1/2 rounded-full transition-colors',
                  n <= current ? 'bg-accent' : 'bg-foreground/12',
                )}
              />
            )}
            <button
              type="button"
              disabled={!clickable}
              onClick={() => onGo?.(n)}
              className={cn(
                'relative z-10 grid size-8 place-items-center rounded-full text-sm font-semibold transition',
                active && 'bg-accent text-accent-foreground shadow-float',
                done && 'bg-accent/90 text-accent-foreground',
                !active && !done && 'bg-secondary text-muted-foreground',
                clickable && 'cursor-pointer hover:brightness-105',
              )}
              aria-label={`Step ${n}: ${label}${done ? ' (completed)' : ''}`}
            >
              {done ? <Check className="size-4" /> : n}
            </button>
            <span className={cn('text-xs font-medium', active ? 'text-accent' : 'text-muted-foreground')}>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
