import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock, Heart, Lock, Mail, MapPin, Phone, Smile } from 'lucide-react'
import { IconTile, MarketingShell, PageHero, Section } from '@/components/content/blocks'
import { ContactForm } from '@/components/content/contact-form'

export const metadata: Metadata = {
  title: 'Contact Pixovo: We’d Love to Hear From You',
  description: 'Reach the Pixovo team by phone, email or message. We reply within 24 hours.',
  alternates: { canonical: '/contact-us/' },
}

const CHANNELS = [
  { icon: MapPin, label: 'Address', value: 'Poway, CA 92064', href: undefined },
  { icon: Phone, label: 'Phone', value: '+1 619-701-6222', href: 'tel:+16197016222' },
  { icon: Mail, label: 'E-Mail', value: 'hello@pixovo.com', href: 'mailto:hello@pixovo.com' },
]

const PROMISES = [
  { icon: Clock, title: 'Fast Response', text: 'We reply within 24 hours' },
  { icon: Smile, title: 'Friendly Support', text: 'We’re here to help' },
  { icon: Lock, title: 'Secure & Safe', text: 'Your information is safe' },
  { icon: Heart, title: 'Customer First', text: 'Your satisfaction matters' },
]

export default function ContactUsPage() {
  return (
    <MarketingShell>
      <PageHero
        eyebrow="Contact us"
        title={
          <>
            We’d love to <em className="text-accent">hear from you!</em>
          </>
        }
        description="Our team is available to provide prompt and helpful responses to all inquiries. You can reach us via phone, email, or by filling out the contact form below."
      />

      <section className="px-5 pb-16 md:px-6 md:pb-24">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-12">
          <div className="space-y-4">
            {CHANNELS.map(({ icon: Icon, label, value, href }) => {
              const body = (
                <>
                  <IconTile icon={<Icon className="size-5" />} className="size-11" />
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="font-semibold">{value}</p>
                  </div>
                </>
              )
              return href ? (
                <a key={label} href={href} className="flex items-center gap-4 rounded-3xl border border-foreground/8 bg-card p-5 shadow-xs transition hover:shadow-float">
                  {body}
                </a>
              ) : (
                <div key={label} className="flex items-center gap-4 rounded-3xl border border-foreground/8 bg-card p-5 shadow-xs">
                  {body}
                </div>
              )
            })}
            <p className="rounded-3xl bg-secondary p-5 text-sm text-muted-foreground">
              Looking for a quick answer? Most questions about sizes, shipping and returns are already covered in the{' '}
              <Link href="/faq/" className="font-medium text-accent underline-offset-4 hover:underline">
                FAQ
              </Link>{' '}
              and{' '}
              <Link href="/help-center/" className="font-medium text-accent underline-offset-4 hover:underline">
                Help Center
              </Link>
              . To check on an order, use{' '}
              <Link href="/track-order/" className="font-medium text-accent underline-offset-4 hover:underline">
                Track my order
              </Link>
              .
            </p>
          </div>
          <ContactForm />
        </div>
      </section>

      <Section tone="soft">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-4">
              <IconTile icon={<Icon className="size-5" />} className="size-11 shrink-0" />
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </MarketingShell>
  )
}
