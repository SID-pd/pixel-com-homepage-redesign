'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { sendContactMessage } from '@/lib/flow/mock-api'
import { FlowButton } from '@/components/flow/flow-button'
import { cn } from '@/lib/utils'

const input = (bad?: boolean) =>
  cn(
    'h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15',
    bad ? 'border-destructive' : 'border-foreground/12',
  )

type Fields = { name: string; email: string; phone: string; subject: string; message: string }

// Module-level on purpose: a component defined inside ContactForm would remount on every keystroke and drop focus.
function Field({ id, label, required, error, children }: { id: keyof Fields; label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={`c-${id}`} className="mb-1.5 block text-sm font-medium">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export function ContactForm() {
  const [v, setV] = useState<Fields>({ name: '', email: '', phone: '', subject: '', message: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({})
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const set = (k: keyof Fields) => (e: { target: { value: string } }) => {
    setV((x) => ({ ...x, [k]: e.target.value }))
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const err: typeof errors = {}
    if (!v.name.trim()) err.name = 'Please tell us your name'
    if (!/^\S+@\S+\.\S+$/.test(v.email)) err.email = 'Enter a valid email so we can reply'
    if (!v.subject.trim()) err.subject = 'A short subject helps us route it'
    if (v.message.trim().length < 10) err.message = 'Tell us a little more (at least 10 characters)'
    setErrors(err)
    if (Object.keys(err).length) {
      document.getElementById(`c-${Object.keys(err)[0]}`)?.focus()
      return
    }
    setState('sending')
    try {
      await sendContactMessage(v)
      setState('sent')
    } catch {
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <div role="status" className="grid place-items-center rounded-3xl bg-card p-10 text-center">
        <CheckCircle2 className="size-12 text-accent" />
        <h3 className="mt-4 font-serif text-3xl">Message received</h3>
        <p className="mt-2 max-w-sm text-muted-foreground">
          Thanks, {v.name.split(' ')[0]}. We reply within 24 hours at <strong className="text-foreground">{v.email}</strong>.
        </p>
        <Link href="/faq/" className="mt-5 text-sm font-medium text-accent underline-offset-4 hover:underline">
          Meanwhile, browse the FAQ
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 rounded-3xl border border-foreground/8 bg-card p-6 shadow-xs sm:grid-cols-2 sm:p-8">
      <Field id="name" label="Full name" required error={errors.name}>
        <input id="c-name" autoComplete="name" value={v.name} onChange={set('name')} className={input(!!errors.name)} />
      </Field>
      <Field id="email" label="Email" required error={errors.email}>
        <input id="c-email" type="email" inputMode="email" autoComplete="email" value={v.email} onChange={set('email')} className={input(!!errors.email)} />
      </Field>
      <Field id="phone" label="Phone number">
        <input id="c-phone" type="tel" inputMode="tel" autoComplete="tel" value={v.phone} onChange={set('phone')} className={input()} />
      </Field>
      <Field id="subject" label="Subject" required error={errors.subject}>
        <input id="c-subject" value={v.subject} onChange={set('subject')} className={input(!!errors.subject)} />
      </Field>
      <div className="sm:col-span-2">
        <Field id="message" label="Message" required error={errors.message}>
          <textarea
            id="c-message"
            rows={5}
            value={v.message}
            onChange={set('message')}
            className={cn(input(!!errors.message), 'h-auto resize-y py-3')}
          />
        </Field>
      </div>
      {state === 'error' && (
        <p role="alert" className="rounded-xl bg-destructive/8 px-4 py-3 text-sm text-destructive sm:col-span-2">
          We couldn’t send that just now. Please email hello@pixovo.com and we’ll pick it up.
        </p>
      )}
      <div className="sm:col-span-2">
        <FlowButton type="submit" variant="accent" size="lg" arrow loading={state === 'sending'} className="w-full sm:w-auto">
          Send message
        </FlowButton>
      </div>
    </form>
  )
}
