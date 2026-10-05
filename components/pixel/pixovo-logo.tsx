import Image from 'next/image'
import { cn } from '@/lib/utils'

export const logoDots = ['#59B0C1', '#D0E5C4', '#FDE489', '#D88591'] as const

interface PixovoLogoProps {
  className?: string
  priority?: boolean
}

export function PixovoLogo({ className, priority = true }: PixovoLogoProps) {
  return (
    <span className={cn('relative inline-flex items-center shrink-0 select-none', className)}>
      <Image
        src="/images/pixovo-logo.png"
        alt="Pixovo"
        width={113}
        height={47}
        priority={priority}
        className="h-10 w-auto object-contain"
      />
    </span>
  )
}
