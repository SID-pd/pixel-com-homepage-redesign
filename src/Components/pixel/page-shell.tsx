'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SiteNav } from './site-nav'
import { SiteFooter } from './final-cta'

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
      <main className="min-h-screen bg-background pt-32 pb-20 px-6">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>

          <header className="mb-10">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
                {subtitle}
              </p>
            )}
          </header>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            {children || (
              <div className="rounded-3xl border border-border bg-card p-8 text-card-foreground shadow-sm">
                <h2 className="text-xl font-semibold mb-3">Welcome to {title}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Discover our specialized {title.toLowerCase()} tailored for high quality photo book printing and custom design solutions.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
