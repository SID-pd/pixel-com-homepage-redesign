import { CheckCircle2, Star, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionHeading } from './section-heading'

function GoogleLogo({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

const reviews = [
  {
    name: 'Jennifer M.',
    location: 'Mother of 3 · Dallas, TX',
    product: '10×10 Hardcover Family Book',
    quote: 'I was skeptical about AI, but it saved me 30 minutes and the result was PERFECT.',
    verified: true,
  },
  {
    name: 'Michael D.',
    location: 'Small Business Owner · Denver, CO',
    product: '12×12 Lay-Flat Portfolio',
    quote: 'Best quality I’ve ever seen. Worth every penny. The USA factory turnaround was incredibly fast.',
    verified: true,
  },
  {
    name: 'Mary Johnson',
    location: 'Austin, TX',
    product: '10×10 Hardcover Lay-Flat',
    quote: 'Pixovo made our wedding memories come alive beautifully. The lay-flat pages were seamless and the print quality felt truly museum-grade.',
    verified: true,
  },
  {
    name: 'Michael Thompson',
    location: 'Seattle, WA',
    product: '8×8 Baby First-Year Album',
    quote: 'Creating my baby’s first-year album was super easy. The auto-layout generator saved me 3 hours of manual formatting.',
    verified: true,
  },
  {
    name: 'James Anderson',
    location: 'San Francisco, CA',
    product: '12×12 Linen Portfolio Book',
    quote: 'As a photographer, paper texture and color fidelity matter a lot. Pixovo delivered crisp prints and solid construction.',
    verified: true,
  },
  {
    name: 'Sarah Miller',
    location: 'Chicago, IL',
    product: '10×10 Family Travel Book',
    quote: 'From phone photos to a physical hardcover keepsake in 3 days. The paper weight and vibrant colors exceeded our expectations.',
    verified: true,
  },
]

function ReviewCard({ review }: { review: (typeof reviews)[number] }) {
  return (
    <figure className="flex w-[300px] shrink-0 flex-col gap-4 rounded-3xl bg-card p-6 shadow-float ring-1 ring-foreground/5 transition-transform duration-500 hover:-translate-y-1 md:w-[360px]">
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5" aria-label="5 out of 5 stars">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="size-4 fill-amber-400 text-amber-400" aria-hidden />
          ))}
        </div>
        {review.verified && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="size-3" />
            Verified Buyer
          </span>
        )}
      </div>

      <blockquote className="text-pretty font-serif text-lg leading-snug md:text-xl text-foreground/90">
        &ldquo;{review.quote}&rdquo;
      </blockquote>

      <figcaption className="mt-auto flex items-center gap-3 pt-2 text-sm border-t border-border/40">
        <span
          className="grid size-9 place-items-center rounded-full bg-secondary text-xs font-semibold text-foreground"
          aria-hidden
        >
          {review.name
            .split(' ')
            .map((p) => p[0])
            .join('')}
        </span>
        <span className="flex flex-col">
          <span className="font-semibold text-foreground leading-tight">
            {review.name} <span className="text-xs font-normal text-muted-foreground">· {review.location}</span>
          </span>
          <span className="text-xs text-muted-foreground">{review.product}</span>
        </span>
      </figcaption>
    </figure>
  )
}

function MarqueeRow({ items, reverse = false }: { items: typeof reviews; reverse?: boolean }) {
  return (
    <div className="group flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div
        className={cn(
          'flex w-max animate-marquee gap-4 py-3 pr-4 group-hover:[animation-play-state:paused]',
          reverse && '[animation-direction:reverse]',
        )}
        style={{ '--marquee-duration': '60s' } as React.CSSProperties}
      >
        {[...items, ...items].map((review, i) => (
          <div key={`${review.name}-${i}`} aria-hidden={i >= items.length || undefined}>
            <ReviewCard review={review} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function Reviews() {
  return (
    <section aria-labelledby="reviews-title" className="py-10 md:py-16">
      <div className="mx-auto max-w-6xl px-5 md:px-6 text-center flex flex-col items-center">
        <SectionHeading
          align="center"
          eyebrow="Verified Customer Reviews"
          title={
            <span id="reviews-title">
              Loved by <span className="text-accent">thousands</span> of memory makers across the USA.
            </span>
          }
        />
      </div>

      <div className="mt-12">
        <MarqueeRow items={reviews} />
      </div>

      {/* Official Google Rating Banner Footer Card */}
      <div className="mt-8 mx-auto max-w-xl px-5 text-center">
        <a
          href="https://www.google.com/search?q=Pixovo&stick=H4sIAAAAAAAA_-NgU1I1qLAwSElKSzJKTUs1MUszM7C0MqgwMjU3NjFKSTIySjI3skw1X8TKFpBZkV-WDwBRDVDCMgAAAA&hl=en&mat=CQk0NxzWu7hcElcBzAmVZgQcmLTQ9588wX0dgKmZtkzqmi7c250ZVxgyArbiP9uGuvyaK9I1c4VfLseEMozg3ssjRs4hYU41lpPiOmfZ4o1KzJsuvHT0hBVKEkxtnRk-Rsc&authuser=0&ved=1t:350944"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-foreground/10 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-white dark:bg-neutral-800 p-2 shadow-inner border border-slate-100 flex items-center justify-center shrink-0">
              <GoogleLogo className="size-6" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-foreground">Official Google Customer Rating</span>
              </div>
              <p className="text-xs text-muted-foreground">Read verified client testimonials & reviews</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-accent group-hover:underline shrink-0">
            View Google Reviews <ExternalLink className="size-3.5" />
          </span>
        </a>
      </div>
    </section>
  )
}
