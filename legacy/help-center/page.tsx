'use client'

import Link from 'next/link'
import { SiteNav } from '@/components/pixel/site-nav'
import { SiteFooter } from '@/components/pixel/final-cta'
import { BookOpen, HelpCircle, Image as ImageIcon, MessageSquare, Search, ShieldCheck, Sparkles, Truck, Wand2 } from 'lucide-react'

const helpTopics = [
  {
    icon: Wand2,
    title: 'Getting Started & AI Builder',
    description: 'Learn how to upload photos, use automatic auto-layouts, and generate your first draft in 60 seconds.',
    articles: ['How to upload photos from phone or computer', 'How AI auto-layout organizes your photos', 'Editing photo order and page sequences'],
  },
  {
    icon: ImageIcon,
    title: 'Photo Sizing & Image Quality',
    description: 'Ensure your photos print crisp and vibrant with our resolution guidelines and photo warning badges.',
    articles: ['Minimum photo resolution recommendations', 'What does low resolution warning mean?', 'Using phone photos vs DSLR camera photos'],
  },
  {
    icon: BookOpen,
    title: 'Covers, Paper & Sizing',
    description: 'Explore differences between 8x8, 10x10, 12x12 sizes, Layflat paper, and hardcover matte finishes.',
    articles: ['8x8 vs 10x10 vs 12x12 size comparison', 'Standard Luster vs Seamless Layflat paper', 'Customizing spine text and cover titles'],
  },
  {
    icon: Truck,
    title: 'Shipping, Delivery & Tracking',
    description: 'Track your package, learn about California factory production times, and view shipping options.',
    articles: ['Tracking your shipped photo book order', 'Production lead time (1–2 business days)', 'Rush shipping options and international delivery'],
  },
  {
    icon: ShieldCheck,
    title: 'Returns & 100% Guarantee',
    description: 'Information on our satisfaction guarantee, reprinting damaged items, and order cancellations.',
    articles: ['100% Quality Guarantee policy details', 'What to do if your package arrives damaged', 'Canceling or changing an order within 2 hours'],
  },
]

export default function HelpCenterPage() {
  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-background pt-36 sm:pt-44 pb-20 md:pb-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
          
          {/* Hero Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-accent mb-4">
              <HelpCircle className="size-3.5" />
              Pixovo Support & Knowledge Base
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              How Can We <em className="text-accent">Help You Today?</em>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Explore step-by-step tutorials, photo preparation tips, shipping guidelines, and troubleshooting articles.
            </p>
          </div>

          {/* Help Topics Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
            {helpTopics.map((topic) => {
              const Icon = topic.icon
              return (
                <div key={topic.title} className="rounded-3xl bg-card border border-foreground/10 p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="grid size-10 place-items-center rounded-2xl bg-accent/10 text-accent mb-4">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="font-serif text-xl font-bold text-foreground mb-2">{topic.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">{topic.description}</p>
                  </div>
                  
                  <ul className="space-y-2 pt-3 border-t border-foreground/5 text-xs">
                    {topic.articles.map((art) => (
                      <li key={art}>
                        <Link href="/faq/" className="text-foreground/80 hover:text-accent font-medium flex items-center gap-1.5 transition-colors">
                          <span className="text-accent font-bold">•</span>
                          <span>{art}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          {/* Contact Support CTA Banner */}
          <div className="rounded-3xl bg-ink text-ink-foreground p-8 text-center max-w-3xl mx-auto shadow-lift space-y-4">
            <h3 className="font-serif text-2xl font-bold text-accent">Need Live Support Assistance?</h3>
            <p className="text-xs text-ink-foreground/80 leading-relaxed max-w-md mx-auto">
              Our California customer care team is available 24/7 to inspect your photo layout or help with order updates.
            </p>
            <div className="pt-2">
              <Link
                href="/contact-us/"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-xs font-extrabold text-accent-foreground shadow-sm hover:bg-accent/90"
              >
                <MessageSquare className="size-4" />
                Contact Pixovo Customer Care
              </Link>
            </div>
          </div>

        </div>
      </main>
      <SiteFooter />
    </>
  )
}
