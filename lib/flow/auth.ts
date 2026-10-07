'use client'

import { useSyncExternalStore } from 'react'

// Front-end stand-in for accounts until the backend exists.
//  - Accounts live in localStorage on this device only.
//  - Passwords are never stored: only a per-account random salt + SHA-256 hash (still not production security,
//    the real check will happen server-side; this just means the mock never holds a readable password).
// Swap the functions in lib/flow/mock-api.ts for `login` / `register` / `forgot-password` calls later.

type Account = { name: string; email: string; salt: string; hash: string }
const KEY = 'pixovo-accounts'

const norm = (email: string) => email.trim().toLowerCase()

function read(): Record<string, Account> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}
function write(all: Record<string, Account>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* storage unavailable */
  }
}

async function digest(password: string, salt: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export type AuthResult<T = { name: string; email: string }> = { ok: true; user: T } | { ok: false; error: string; field?: 'email' | 'password' | 'name' }

export async function registerAccount(name: string, email: string, password: string): Promise<AuthResult> {
  const all = read()
  const key = norm(email)
  if (all[key]) return { ok: false, field: 'email', error: 'An account with that email already exists. Try signing in.' }
  const salt = crypto.getRandomValues(new Uint8Array(12)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '')
  all[key] = { name: name.trim(), email: key, salt, hash: await digest(password, salt) }
  write(all)
  return { ok: true, user: { name: all[key].name, email: key } }
}

export async function verifyAccount(email: string, password: string): Promise<AuthResult> {
  const acct = read()[norm(email)]
  if (!acct) return { ok: false, field: 'email', error: 'We couldn’t find an account with that email. Create one in a few seconds.' }
  if ((await digest(password, acct.salt)) !== acct.hash) return { ok: false, field: 'password', error: 'That password doesn’t match. Try again or reset it.' }
  return { ok: true, user: { name: acct.name, email: acct.email } }
}

export const accountExists = (email: string) => !!read()[norm(email)]

// ---- modal UI state ---------------------------------------------------------
export type AuthMode = 'signin' | 'signup' | 'forgot'
type UiState = { open: boolean; mode: AuthMode; prefillEmail: string; reason: string }
let ui: UiState = { open: false, mode: 'signin', prefillEmail: '', reason: '' }
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function openAuth(mode: AuthMode = 'signin', opts: { email?: string; reason?: string } = {}) {
  ui = { open: true, mode, prefillEmail: opts.email ?? '', reason: opts.reason ?? '' }
  emit()
}
export function closeAuth() {
  ui = { ...ui, open: false }
  emit()
}
export function setAuthMode(mode: AuthMode) {
  ui = { ...ui, mode }
  emit()
}
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
const SERVER: UiState = { open: false, mode: 'signin', prefillEmail: '', reason: '' }
export const useAuthUi = () => useSyncExternalStore(subscribe, () => ui, () => SERVER)
