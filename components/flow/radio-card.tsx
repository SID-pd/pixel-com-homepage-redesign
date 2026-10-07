import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Accessible radio rendered as a card: a real (visually hidden) input drives selection and focus. */
export function RadioCard({
  name,
  value,
  checked,
  onChange,
  children,
  className,
}: {
  name: string
  value: string
  checked: boolean
  onChange: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <label
      className={cn(
        'group relative block cursor-pointer rounded-2xl border bg-card transition-all duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background',
        checked
          ? 'border-accent bg-accent/[0.06] shadow-xs ring-1 ring-accent'
          : 'border-foreground/10 hover:border-foreground/25 hover:shadow-xs',
        className,
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      {children}
    </label>
  )
}

export function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors',
        checked ? 'border-accent' : 'border-foreground/25',
      )}
    >
      <span className={cn('size-2.5 rounded-full bg-accent transition-transform', checked ? 'scale-100' : 'scale-0')} />
    </span>
  )
}
