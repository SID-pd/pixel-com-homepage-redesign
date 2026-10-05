import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Reveal, RevealItem } from './reveal'

type SectionHeadingProps = {
  eyebrow: string
  title: ReactNode
  description?: string
  align?: 'left' | 'center'
  tone?: 'light' | 'dark'
  className?: string
  action?: ReactNode
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  tone = 'light',
  className,
  action,
}: SectionHeadingProps) {
  const centered = align === 'center'
  return (
    <Reveal
      className={cn(
        'flex flex-col gap-6 md:flex-row md:items-end md:justify-between',
        centered && 'items-center text-center md:flex-col md:items-center',
        className,
      )}
    >
      <div className={cn('flex max-w-2xl flex-col gap-4', centered && 'items-center')}>
        <RevealItem>
          <span
            className={cn(
              'inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em]',
              tone === 'dark' ? 'text-ink-foreground/60' : 'text-muted-foreground',
            )}
          >
            <span className="size-1.5 rounded-full bg-accent" aria-hidden />
            {eyebrow}
          </span>
        </RevealItem>
        <RevealItem>
          <h2 className="text-balance font-serif text-4xl leading-[1.02] tracking-tight md:text-6xl">{title}</h2>
        </RevealItem>
        {description && (
          <RevealItem>
            <p
              className={cn(
                'max-w-lg text-pretty text-base leading-relaxed md:text-lg',
                tone === 'dark' ? 'text-ink-foreground/70' : 'text-muted-foreground',
              )}
            >
              {description}
            </p>
          </RevealItem>
        )}
      </div>
      {action && <RevealItem>{action}</RevealItem>}
    </Reveal>
  )
}
