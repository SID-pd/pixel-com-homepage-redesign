'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CheckCircle2, Eye, EyeOff, Mail } from 'lucide-react'
import { closeAuth, setAuthMode, useAuthUi, type AuthMode } from '@/lib/flow/auth'
import { mockRequestReset, mockSignIn, mockSignUp } from '@/lib/flow/mock-api'
import { cn } from '@/lib/utils'
import { FlowButton } from './flow-button'
import { Modal } from './modal'

const input = (bad?: boolean) =>
  cn(
    'h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15',
    bad ? 'border-destructive' : 'border-foreground/12',
  )

const TITLES: Record<AuthMode, string> = { signin: 'Sign in', signup: 'Create your account', forgot: 'Reset your password' }

// One modal for the whole app, mounted once in app/providers.tsx and opened from anywhere with openAuth().
export function AuthModal() {
  const { open, mode, prefillEmail, reason } = useAuthUi()
  return (
    <Modal open={open} onClose={closeAuth} title={TITLES[mode]} className="sm:max-w-md">
      {open && <AuthForm key={mode} mode={mode} prefillEmail={prefillEmail} reason={reason} />}
    </Modal>
  )
}

function AuthForm({ mode, prefillEmail, reason }: { mode: AuthMode; prefillEmail: string; reason: string }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState(prefillEmail)
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<{ field?: string; msg: string } | null>(null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    document.getElementById(prefillEmail && mode !== 'signup' ? 'auth-password' : mode === 'signup' ? 'auth-name' : 'auth-email')?.focus()
  }, [mode, prefillEmail])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (mode === 'signup' && !name.trim()) return fail('name', 'Please tell us your name.')
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail('email', 'Enter a valid email address.')
    if (mode !== 'forgot' && password.length < 8) return fail('password', 'Use at least 8 characters.')

    setBusy(true)
    if (mode === 'forgot') {
      await mockRequestReset(email)
      setBusy(false)
      setSent(true)
      return
    }
    const res = mode === 'signup' ? await mockSignUp({ name, email, password }) : await mockSignIn({ email, password })
    setBusy(false)
    if (!res.ok) return fail(res.field, res.error)
    closeAuth()
  }

  function fail(field: string | undefined, msg: string) {
    setErr({ field, msg })
    if (field) document.getElementById(`auth-${field}`)?.focus()
  }

  if (sent) {
    return (
      <div role="status" className="p-8 text-center">
        <CheckCircle2 className="mx-auto size-12 text-accent" />
        <h3 className="mt-4 font-serif text-2xl">Check your email</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists for <strong className="text-foreground">{email}</strong>, we’ve sent a link to reset your password.
        </p>
        <FlowButton variant="secondary" className="mt-6" onClick={() => setAuthMode('signin')}>
          Back to sign in
        </FlowButton>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4 p-6 sm:p-8">
      {reason && <p className="rounded-xl bg-accent/10 px-4 py-3 text-sm text-foreground">{reason}</p>}
      {mode === 'forgot' && <p className="text-sm text-muted-foreground">Enter your email and we’ll send you a link to choose a new password.</p>}

      {mode === 'signup' && (
        <div>
          <label htmlFor="auth-name" className="mb-1.5 block text-sm font-medium">
            Full name
          </label>
          <input id="auth-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={input(err?.field === 'name')} />
        </div>
      )}

      <div>
        <label htmlFor="auth-email" className="mb-1.5 block text-sm font-medium">
          Email
        </label>
        <input
          id="auth-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input(err?.field === 'email')}
        />
      </div>

      {mode !== 'forgot' && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="auth-password" className="text-sm font-medium">
              Password
            </label>
            {mode === 'signin' && (
              <button type="button" onClick={() => setAuthMode('forgot')} className="text-xs font-medium text-accent underline-offset-4 hover:underline">
                Forgot password?
              </button>
            )}
          </div>
          <div className="relative">
            <input
              id="auth-password"
              type={show ? 'text' : 'password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(input(err?.field === 'password'), 'pr-12')}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide password' : 'Show password'}
              aria-pressed={show}
              className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:bg-foreground/5"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {mode === 'signup' && <p className="mt-1.5 text-xs text-muted-foreground">At least 8 characters.</p>}
        </div>
      )}

      {err && (
        <p role="alert" className="rounded-xl bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {err.msg}
          {err.field === 'email' && mode === 'signin' && (
            <>
              {' '}
              <button type="button" onClick={() => setAuthMode('signup')} className="font-semibold underline underline-offset-2">
                Create account
              </button>
            </>
          )}
          {err.field === 'email' && mode === 'signup' && (
            <>
              {' '}
              <button type="button" onClick={() => setAuthMode('signin')} className="font-semibold underline underline-offset-2">
                Sign in
              </button>
            </>
          )}
        </p>
      )}

      <FlowButton type="submit" variant="accent" size="lg" loading={busy} className="w-full">
        {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : (<><Mail className="size-4" /> Send reset link</>)}
      </FlowButton>

      <p className="text-center text-sm text-muted-foreground">
        {mode === 'signin' && (
          <>
            New to Pixovo?{' '}
            <button type="button" onClick={() => setAuthMode('signup')} className="font-semibold text-accent underline-offset-4 hover:underline">
              Create an account
            </button>
          </>
        )}
        {mode === 'signup' && (
          <>
            Already have an account?{' '}
            <button type="button" onClick={() => setAuthMode('signin')} className="font-semibold text-accent underline-offset-4 hover:underline">
              Sign in
            </button>
          </>
        )}
        {mode === 'forgot' && (
          <button type="button" onClick={() => setAuthMode('signin')} className="font-semibold text-accent underline-offset-4 hover:underline">
            Back to sign in
          </button>
        )}
      </p>

      {mode === 'signup' && (
        <p className="text-center text-xs text-muted-foreground">
          By creating an account you agree to our{' '}
          <Link href="/terms/" onClick={closeAuth} className="underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy-policy/" onClick={closeAuth} className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      )}
      <p className="text-center text-xs text-muted-foreground">You never need an account to order. It just saves your books and makes reordering one tap.</p>
    </form>
  )
}
