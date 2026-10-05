import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionHeading } from './section-heading'

const reviews = [
  { name: 'Mary Johnson', product: 'Bride', quote: 'Pixovo made our wedding memories come alive beautifully. The designs were elegant and everything felt so premium.' },
  { name: 'Michael Thompson', product: 'Parent', quote: 'Creating my baby’s first-year album was super easy. I loved the layout templates and how fast it auto-designed!' },
  { name: 'James Anderson', product: 'Graphic Designer', quote: 'As a designer, presentation matters a lot. Pixovo helped me showcase my work in a clean and professional way.' },
  { name: 'Sarah Miller', product: 'Family Travel', quote: 'From photos to keepsake in 30 minutes. The paper quality and vibrant colors exceeded our expectations.' },
  { name: 'David Chen', product: 'Anniversary Gift', quote: 'Printed and delivered from California in 3 days. Super crisp print quality and great customer support.' },
  { name: 'Emily Wilson', product: 'Vacation Album', quote: 'I was blown away by how smart the layout generator is. Saved me hours of tedious photo album designing.' },
]

function ReviewCard({ review }: { review: (typeof reviews)[number] }) {
  return (
    <figure className="flex w-[300px] shrink-0 flex-col gap-4 rounded-3xl bg-card p-6 shadow-float ring-1 ring-foreground/5 transition-transform duration-500 hover:-translate-y-1 md:w-[360px]">
      <div className="flex gap-0.5" aria-label="5 out of 5 stars">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-4 fill-accent text-accent" aria-hidden />
        ))}
      </div>
      <blockquote className="text-pretty font-serif text-xl leading-snug md:text-2xl">
        &ldquo;{review.quote}&rdquo;
      </blockquote>
      <figcaption className="mt-auto flex items-center gap-3 text-sm">
        <span
          className="grid size-9 place-items-center rounded-full bg-secondary text-xs font-medium"
          aria-hidden
        >
          {review.name
            .split(' ')
            .map((p) => p[0])
            .join('')}
        </span>
        <span className="flex flex-col">
          <span className="font-medium">{review.name}</span>
          <span className="text-muted-foreground">{review.product}</span>
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
    <section aria-labelledby="reviews-title" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <SectionHeading
          align="center"
          eyebrow="Loved by 50,000+ Customers"
          title={
            <span id="reviews-title">
              <span className="text-accent">4.8</span> out of 5, loved by memory makers across the USA.
            </span>
          }
        />
      </div>
      <div className="mt-14 flex flex-col gap-2">
        <MarqueeRow items={reviews.slice(0, 3)} />
        <MarqueeRow items={reviews.slice(3)} reverse />
      </div>
    </section>
  )
}
