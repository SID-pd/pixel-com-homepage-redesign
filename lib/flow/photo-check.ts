import type { Photo } from './types'

// Photo review for Story Mode (step 3). Runs entirely in the browser on the photos the customer added:
//  - near-duplicates: a 64-bit difference hash per photo; photos within a few bits of each other are the same shot
//  - blurry: variance of a Laplacian over a small greyscale copy (low variance = few sharp edges)
//  - dark: very low average brightness
//  - low resolution: pixel size too small to print crisply at book size
// These are heuristics, so the UI only ever *suggests*; the customer decides what to remove.

export type PhotoIssue = 'duplicate' | 'low-res' | 'blurry' | 'dark'

export type PhotoReport = {
  id: string
  issues: PhotoIssue[]
  /** for a duplicate: the photo we suggest keeping instead */
  duplicateOf?: string
  /** 0-1, how strongly we recommend removing it (>= 0.6 is part of "remove suggested") */
  severity: number
}

type Raw = { hash: string; sharp: number; bright: number }
const cache = new Map<string, Raw>()

export const ISSUE_LABEL: Record<PhotoIssue, string> = {
  duplicate: 'Very similar to another photo',
  'low-res': 'Low resolution',
  blurry: 'Looks blurry',
  dark: 'Very dark',
}

const MIN_SIDE = 800 // px; below this a 10x10 print starts to look soft
const SEVERE_SIDE = 500
const BLUR_BELOW = 28
const DARK_BELOW = 42
const DUP_DISTANCE = 6

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image failed to load'))
    img.src = src
  })
}

function grey(img: HTMLImageElement, w: number, h: number): Uint8ClampedArray {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, w, h)
  const d = ctx.getImageData(0, 0, w, h).data
  const out = new Uint8ClampedArray(w * h)
  for (let i = 0; i < w * h; i++) out[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]
  return out
}

async function measure(p: Photo): Promise<Raw | null> {
  const hit = cache.get(p.id)
  if (hit) return hit
  try {
    const img = await load(p.src)
    // difference hash: 9x8 greyscale, one bit per left>right comparison (64 chars of 0/1)
    const g = grey(img, 9, 8)
    let hash = ''
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) hash += g[y * 9 + x] > g[y * 9 + x + 1] ? '1' : '0'

    // sharpness + brightness on a ~160px copy so the score does not depend on the original size
    const scale = 160 / Math.max(img.naturalWidth, img.naturalHeight)
    const w = Math.max(8, Math.round(img.naturalWidth * scale))
    const h = Math.max(8, Math.round(img.naturalHeight * scale))
    const s = grey(img, w, h)
    let sum = 0
    let lapSum = 0
    let lapSq = 0
    let n = 0
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x
        const lap = 4 * s[i] - s[i - 1] - s[i + 1] - s[i - w] - s[i + w]
        lapSum += lap
        lapSq += lap * lap
        sum += s[i]
        n++
      }
    }
    const mean = lapSum / n
    const raw = { hash, sharp: lapSq / n - mean * mean, bright: sum / n }
    cache.set(p.id, raw)
    return raw
  } catch {
    return null
  }
}

function distance(a: string, b: string): number {
  let c = 0
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) c++
  return c
}

export async function analyzePhotos(photos: Photo[], onProgress?: (done: number, total: number) => void): Promise<Record<string, PhotoReport>> {
  const raws = new Map<string, Raw | null>()
  let done = 0
  for (const p of photos) {
    raws.set(p.id, await measure(p))
    onProgress?.(++done, photos.length)
    // yield so the UI keeps animating while we crunch pixels
    await new Promise((r) => setTimeout(r, 0))
  }

  const reports: Record<string, PhotoReport> = Object.fromEntries(photos.map((p) => [p.id, { id: p.id, issues: [], severity: 0 }]))

  // duplicates: greedy clusters, keep the sharpest, largest copy
  const score = (p: Photo) => (raws.get(p.id)?.sharp ?? 0) + (p.w * p.h) / 1e6
  const used = new Set<string>()
  for (const a of photos) {
    if (used.has(a.id)) continue
    const ra = raws.get(a.id)
    if (!ra) continue
    const group = photos.filter((b) => {
      const rb = raws.get(b.id)
      return b.id === a.id || (!used.has(b.id) && rb && distance(ra.hash, rb.hash) <= DUP_DISTANCE)
    })
    if (group.length < 2) continue
    const best = group.reduce((m, p) => (score(p) > score(m) ? p : m))
    for (const p of group) {
      used.add(p.id)
      if (p.id === best.id) continue
      reports[p.id].issues.push('duplicate')
      reports[p.id].duplicateOf = best.id
      reports[p.id].severity = Math.max(reports[p.id].severity, 0.9)
    }
  }

  for (const p of photos) {
    const r = reports[p.id]
    const raw = raws.get(p.id)
    const side = Math.min(p.w, p.h)
    if (side < MIN_SIDE) {
      r.issues.push('low-res')
      r.severity = Math.max(r.severity, side < SEVERE_SIDE ? 0.7 : 0.4)
    }
    if (raw && raw.sharp < BLUR_BELOW) {
      r.issues.push('blurry')
      r.severity = Math.max(r.severity, raw.sharp < BLUR_BELOW / 2 ? 0.7 : 0.45)
    }
    if (raw && raw.bright < DARK_BELOW) {
      r.issues.push('dark')
      r.severity = Math.max(r.severity, 0.4)
    }
    // several problems at once: worth removing
    if (r.issues.filter((i) => i !== 'duplicate').length >= 2) r.severity = Math.max(r.severity, 0.65)
  }
  return reports
}

export const isSuggestedRemoval = (r: PhotoReport) => r.severity >= 0.6
