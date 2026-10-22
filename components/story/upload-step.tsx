'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ImagePlus, Loader2, Sparkles, UploadCloud } from 'lucide-react'
import { SAMPLE_PHOTOS } from '@/lib/flow/catalog'
import { fileToPhoto, makeThumb, samplePhotos } from '@/lib/flow/images'
import { flow } from '@/lib/flow/store'
import type { Photo } from '@/lib/flow/types'

const PACKS: { id: string; label: string; emoji: string; match: (n: string) => boolean }[] = [
  { id: 'travel', label: 'Trip', emoji: '✈️', match: (n) => /travel|about/i.test(n) },
  { id: 'wedding', label: 'Wedding', emoji: '💍', match: (n) => /wedding|classic/i.test(n) },
  { id: 'family', label: 'Family', emoji: '👶', match: (n) => /family|baby|journal/i.test(n) },
  { id: 'mix', label: 'Surprise me', emoji: '✨', match: () => true },
]

/** Photos can be dropped anywhere on the stage: the whole surface lights up while a file is dragged over the window. */
export function useStageDrop(onFiles: (files: File[]) => void, enabled: boolean) {
  const [over, setOver] = useState(false)
  const depth = useRef(0)
  useEffect(() => {
    if (!enabled) return
    const has = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files')
    const enter = (e: DragEvent) => {
      if (!has(e)) return
      e.preventDefault()
      depth.current++
      setOver(true)
    }
    const leave = (e: DragEvent) => {
      if (!has(e)) return
      depth.current = Math.max(0, depth.current - 1)
      if (!depth.current) setOver(false)
    }
    const overEv = (e: DragEvent) => has(e) && e.preventDefault()
    const drop = (e: DragEvent) => {
      if (!has(e)) return
      e.preventDefault()
      depth.current = 0
      setOver(false)
      onFiles(Array.from(e.dataTransfer?.files ?? []))
    }
    window.addEventListener('dragenter', enter)
    window.addEventListener('dragleave', leave)
    window.addEventListener('dragover', overEv)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragenter', enter)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('dragover', overEv)
      window.removeEventListener('drop', drop)
    }
  }, [enabled, onFiles])
  return over
}

// Files go through a small queue instead of all at once: decoding fifty 12-megapixel photos in parallel is what makes
// phones stall or reload the tab. Each photo is added as soon as it is ready, in small batches so the page re-renders rarely.
const coarse = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
const breathe = () => new Promise<void>((r) => setTimeout(r, 24))

export function useIngest(photos: Photo[]) {
  const [reading, setReading] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const queue = useRef<File[]>([])
  const workers = useRef(0)
  const buffer = useRef<Photo[]>([])
  const flushTimer = useRef<number | null>(null)

  const flush = useCallback(() => {
    if (flushTimer.current) window.clearTimeout(flushTimer.current)
    flushTimer.current = null
    if (!buffer.current.length) return
    const batch = buffer.current
    buffer.current = []
    flow.addPhotos(batch)
  }, [])

  const work = useCallback(async () => {
    while (queue.current.length) {
      const f = queue.current.shift()!
      try {
        buffer.current.push(await fileToPhoto(f))
        if (buffer.current.length >= 4 || !queue.current.length) flush()
        else if (!flushTimer.current) flushTimer.current = window.setTimeout(flush, 500)
      } catch (err) {
        setErrors((e) => [...e, err instanceof Error ? err.message : `Could not read ${f.name}`])
      } finally {
        setReading((n) => Math.max(0, n - 1))
      }
      await breathe()
    }
  }, [flush])

  const ingest = useCallback(
    async (files: File[]) => {
      const images = files.filter((f) => f.type.startsWith('image/'))
      if (!images.length) return
      setErrors([])
      setReading((n) => n + images.length)
      queue.current.push(...images)
      const limit = coarse() ? 1 : 2
      const runs: Promise<void>[] = []
      while (workers.current < limit) {
        workers.current++
        runs.push(
          work().finally(() => {
            workers.current--
          }),
        )
      }
      await Promise.all(runs)
      flush()
    },
    [work, flush],
  )

  async function addPack(id: string) {
    setReading((n) => n + 1)
    try {
      const all = await samplePhotos(SAMPLE_PHOTOS.length)
      const pack = PACKS.find((p) => p.id === id)!
      let picks = all.filter((p) => pack.match(p.name))
      if (picks.length < 8) picks = [...picks, ...all.filter((p) => !picks.includes(p))].slice(0, 8)
      const have = new Set(photos.map((p) => p.name))
      // the sample pictures are multi-megabyte PNGs: give each a small copy (one at a time) so grids and rails stay light
      const fresh = picks.filter((p) => !have.has(p.name))
      for (const p of fresh) {
        p.thumb = await makeThumb(p.src)
        await breathe()
      }
      flow.addPhotos(fresh)
    } catch {
      setErrors(['Could not load the sample photos. Try uploading your own.'])
    } finally {
      setReading((n) => Math.max(0, n - 1))
    }
  }

  return { reading, errors, ingest, addPack }
}

export function UploadBody({
  reading,
  errors,
  recommended,
  onFiles,
  onPack,
}: {
  reading: number
  errors: string[]
  recommended: number
  onFiles: (f: File[]) => void
  onPack: (id: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-col items-center gap-3 rounded-[1.75rem] border-2 border-dashed border-[var(--st-peach-ink)]/30 bg-white/70 px-4 py-7 text-center sm:px-5 sm:py-9">
        <motion.span animate={{ y: [0, -5, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }} className="grid size-14 place-items-center rounded-full bg-[var(--st-peach)] text-[var(--st-peach-ink)]">
          {reading ? <Loader2 className="size-6 animate-spin" /> : <UploadCloud className="size-6" />}
        </motion.span>
        <div>
          <p className="text-lg font-semibold">
            <span className="max-sm:hidden">Drag photos anywhere on this page</span>
            <span className="sm:hidden">Add photos from your phone</span>
          </p>
          <p className="text-sm text-foreground/60">JPG, PNG or WebP. Recommended: about {recommended} photos for your book.</p>
        </div>
        <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[var(--st-ink)] px-6 sm:h-11 sm:w-auto text-sm font-semibold text-white transition hover:scale-[1.03] active:scale-95">
          <ImagePlus className="size-4" /> Choose photos
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { onFiles(Array.from(e.target.files ?? [])); e.target.value = '' }} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/55">
          <Sparkles className="size-3.5 text-[var(--st-peach-ink)]" /> No photos handy? Try a sample set:
        </span>
        {PACKS.map((p) => (
          <button key={p.id} type="button" onClick={() => onPack(p.id)} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--st-butter)] px-3.5 text-sm font-medium transition hover:brightness-95 active:scale-95">
            <span aria-hidden>{p.emoji}</span> {p.label}
          </button>
        ))}
      </div>

      {errors.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-xl bg-[var(--st-peach)]/60 p-3 text-xs text-[var(--st-peach-ink)]">
          {errors.slice(0, 3).map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function DropOverlay({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-3 z-40 grid place-items-center rounded-[2rem] border-4 border-dashed border-[var(--st-lilac-ink)] bg-[var(--st-lilac)]/70 backdrop-blur-sm">
          <div className="text-center">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 1, repeat: Infinity }} className="text-5xl" aria-hidden>
              📸
            </motion.div>
            <p className="mt-2 font-[family-name:var(--font-hand)] text-4xl text-[var(--st-lilac-ink)]">Drop them on the table!</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
