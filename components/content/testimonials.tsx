import { Star } from 'lucide-react'

// Verbatim from the original How It Works page. The CMS kept no names, so none are invented here.
const QUOTES = [
  'The quality is absolutely stunning. Every page brings back beautiful memories. This is my third book from Pixovo and I’m already planning the next!',
  'So easy to use and the result is beyond my expectations. The colors are vibrant and the book feels so premium. Highly recommended!',
  'Perfect gift for my parents’ anniversary. They loved it so much! Thank you Pixovo for helping me create something so special.',
  'Fast delivery, beautiful packaging and amazing quality. Pixovo has become my go-to for preserving all our family memories.',
]

export function Testimonials() {
  return (
    <ul className="grid gap-5 sm:grid-cols-2">
      {QUOTES.map((q) => (
        <li key={q} className="flex flex-col rounded-3xl border border-foreground/8 bg-card p-6 shadow-xs sm:p-7">
          <div className="flex gap-0.5 text-accent" aria-label="5 out of 5 stars" role="img">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-4 fill-current" />
            ))}
          </div>
          <blockquote className="mt-4 text-pretty font-serif text-xl leading-snug">“{q}”</blockquote>
          <p className="mt-4 text-sm text-muted-foreground">Pixovo customer</p>
        </li>
      ))}
    </ul>
  )
}
