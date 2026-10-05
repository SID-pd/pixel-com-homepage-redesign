import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal, RevealItem } from './reveal'
import { SectionHeading } from './section-heading'
import { TiltCard } from './tilt-card'
import { CtaLink } from './cta-link'

const products = [
  {
    title: '8x8 Square Book',
    copy: 'Perfect for everyday moments, trip highlights, and short stories.',
    price: 'From $19.99',
    href: '/photo-book/?size=8x8',
    image: '/images/choose_your_size_1.webp',
    alt: '8x8 Custom square photo book',
    badge: 'Popular',
    span: 'lg:col-span-4',
    minH: 'min-h-[380px]',
    sizes: '(min-width: 1024px) 380px, 100vw',
  },
  {
    title: '10x10 Square Book',
    copy: 'Our most popular size for all of life’s big moments and family albums.',
    price: 'From $29.99',
    href: '/photo-book/?size=10x10',
    image: '/images/choose_your_size_2.webp',
    alt: '10x10 Custom square photo book',
    badge: 'Most Popular',
    span: 'lg:col-span-4',
    minH: 'min-h-[380px]',
    sizes: '(min-width: 1024px) 380px, 100vw',
  },
  {
    title: '12x12 Square Book',
    copy: 'More room for your favorite photos and unforgettable milestone memories.',
    price: 'From $39.99',
    href: '/photo-book/?size=12x12',
    image: '/images/choose_your_size_3.webp',
    alt: '12x12 Custom square photo book',
    badge: 'Deluxe',
    span: 'lg:col-span-4',
    minH: 'min-h-[380px]',
    sizes: '(min-width: 1024px) 380px, 100vw',
  },
]

function ProductCard({ product }: { product: (typeof products)[number] }) {
  return (
    <TiltCard intensity={4} className="h-full rounded-[2rem]">
      <Link
        href={product.href}
        className={cn('relative flex h-full flex-col justify-end overflow-hidden rounded-[2rem] bg-muted p-6 text-ink-foreground shadow-float transition-shadow duration-500 group-hover:shadow-lift md:p-8', product.minH)}
      >
        <Image
          src={product.image}
          alt={product.alt}
          fill
          sizes={product.sizes}
          className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
        {product.badge && (
          <span className="absolute left-6 top-6 rounded-full bg-card/85 px-3 py-1 text-xs font-medium text-foreground backdrop-blur md:left-8 md:top-8">
            {product.badge}
          </span>
        )}
        <span
          aria-hidden
          className="absolute right-6 top-6 grid size-11 place-items-center rounded-full bg-card/85 text-foreground backdrop-blur transition-all duration-500 group-hover:rotate-45 group-hover:bg-accent group-hover:text-accent-foreground md:right-8 md:top-8"
        >
          <ArrowUpRight className="size-5" />
        </span>
        <div className="relative flex items-end justify-between gap-4">
          <div>
            <h3 className="font-serif text-3xl md:text-4xl">{product.title}</h3>
            <p className="mt-1 max-w-xs text-sm text-ink-foreground/80">{product.copy}</p>
          </div>
          <span className="shrink-0 text-sm font-medium">{product.price}</span>
        </div>
      </Link>
    </TiltCard>
  )
}

export function Products() {
  return (
    <section id="products" aria-labelledby="products-title" className="scroll-mt-24 px-5 py-24 md:px-6 md:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Choose Your Size"
          title={
            <span id="products-title">
              Three square sizes. <em className="text-accent">Endless memories.</em>
            </span>
          }
          description="Custom square photo books designed automatically in minutes from your uploaded photos, printed and shipped from the USA."
          action={
            <CtaLink href="/photo-book/" variant="secondary" showArrow>
              Create Photo Book
            </CtaLink>
          }
        />

        <Reveal className="mt-14 grid gap-4 md:gap-5 lg:grid-cols-12" staggerChildren={0.1}>
          {products.map((product) => (
            <RevealItem key={product.title} className={product.span}>
              <ProductCard product={product} />
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
