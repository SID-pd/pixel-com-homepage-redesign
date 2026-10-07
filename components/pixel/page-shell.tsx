'use client'

import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { SiteNav } from './site-nav'
import { SiteFooter } from './final-cta'
import { CtaLink } from './cta-link'

export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-background pt-36 sm:pt-44 pb-20 px-5 md:px-6">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="size-3.5" />
            Back to Home
          </Link>

          <header className="mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2.5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                {subtitle}
              </p>
            )}
          </header>

          <div className="w-full">
            {children || (
              <div className="rounded-3xl border border-foreground/10 bg-card p-6 md:p-10 shadow-xs flex flex-col gap-6">
                <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="size-4" />
                  <span>Pixovo Feature Preview</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">{title} Page</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                    This section contains our specialized content for {title.toLowerCase()}. Explore our direct-from-factory photo book layouts, custom sizing, and instant AI design tools.
                  </p>
                </div>
                <div className="pt-2 border-t flex flex-wrap items-center gap-3">
                  <CtaLink href="/photo-book/" size="sm">
                    Start Custom Photo Book
                  </CtaLink>
                  <Link
                    href="/"
                    className="rounded-full px-4 py-2 text-xs font-medium text-foreground/70 hover:bg-foreground/5 transition-colors"
                  >
                    Return to Homepage
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
