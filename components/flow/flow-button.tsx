'use client'

import Link from 'next/link'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const variants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  accent: 'bg-accent text-accent-foreground hover:brightness-105',
  secondary: 'bg-card text-foreground ring-1 ring-inset ring-foreground/12 hover:ring-foreground/25 hover:bg-card',
  ghost: 'text-foreground hover:bg-foreground/6',
  danger: 'text-destructive ring-1 ring-inset ring-destructive/30 hover:bg-destructive/8',
}
const sizes = { sm: 'h-9 px-4 text-sm', md: 'h-11 px-5 text-sm', lg: 'h-14 px-7 text-base' }

type Common = {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  arrow?: boolean
  loading?: boolean
  className?: string
  children: ReactNode
}

const base =
  'group/btn relative inline-flex select-none items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-[background-color,box-shadow,filter,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50'

export const FlowButton = forwardRef<HTMLButtonElement, Common & ButtonHTMLAttributes<HTMLButtonElement>>(
  function FlowButton(
    { variant = 'primary', size = 'md', arrow, loading, className, children, disabled, type = 'button', ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...rest}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
        {arrow && !loading && (
          <ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" aria-hidden />
        )}
      </button>
    )
  },
)

export function FlowLink({
  href,
  variant = 'primary',
  size = 'md',
  arrow,
  className,
  children,
}: Common & { href: string }) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)}>
      {children}
      {arrow && <ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" aria-hidden />}
    </Link>
  )
}
