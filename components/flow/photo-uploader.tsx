'use client'

import { useCallback, useRef, useState } from 'react'
import { AlertCircle, Cloud, FolderOpen, ImagePlus, Images, Sparkles, UploadCloud, X } from 'lucide-react'
import { SAMPLE_PHOTOS } from '@/lib/flow/catalog'
import { fileToPhoto, samplePhotos } from '@/lib/flow/images'
import { flow } from '@/lib/flow/store'
import type { Photo } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { FlowButton } from './flow-button'
import { Modal } from './modal'

const DRIVE_FOLDERS = [
  { name: 'Summer 2025', count: 6, from: 0 },
  { name: 'Wedding', count: 4, from: 2 },
  { name: 'Family weekends', count: 8, from: 0 },
]

export function PhotoUploader({ photos, recommended, compact }: { photos: Photo[]; recommended: number; compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [drive, setDrive] = useState(false)

  const ingest = useCallback(async (files: File[]) => {
    if (!files.length) return
    setErrors([])
    setBusy(files.length)
    const ok: Photo[] = []
    const bad: string[] = []
    for (const f of files) {
      try {
        ok.push(await fileToPhoto(f))
      } catch (e) {
        bad.push(e instanceof Error ? e.message : `Couldn’t add ${f.name}`)
      }
      setBusy((n) => n - 1)
    }
    flow.addPhotos(ok)
    setErrors(bad)
  }, [])

  async function addSamples() {
    const existing = new Set(photos.map((p) => p.name))
    const all = await samplePhotos(SAMPLE_PHOTOS.length)
    flow.addPhotos(all.filter((p) => !existing.has(p.name)))
  }

  async function addFromDrive(from: number, count: number) {
    const picks = (await samplePhotos(SAMPLE_PHOTOS.length, 'drive')).slice(from, from + count)
    flow.addPhotos(picks)
    setDrive(false)
  }

  const pct = Math.min(100, Math.round((photos.length / recommended) * 100))

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          void ingest(Array.from(e.dataTransfer.files))
        }}
        className={cn(
          'rounded-3xl border-2 border-dashed bg-card p-6 text-center transition-colors sm:p-10',
          over ? 'border-accent bg-accent/[0.06]' : 'border-foreground/15',
          compact && 'sm:p-6',
        )}
      >
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent/12 text-accent">
          <UploadCloud className="size-7" />
        </span>
        <h2 className="mt-4 text-lg font-semibold">Drag and drop your photos here</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          JPG, PNG, WEBP or HEIC, up to 25MB each. Your photos stay private.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <FlowButton variant="primary" onClick={() => input.current?.click()}>
            <ImagePlus className="size-4" /> Choose from device
          </FlowButton>
          <FlowButton variant="secondary" onClick={() => setDrive(true)}>
            <Cloud className="size-4" /> Google Drive
          </FlowButton>
          <FlowButton variant="ghost" onClick={addSamples}>
            <Sparkles className="size-4" /> Try sample photos
          </FlowButton>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-label="Upload photos"
          onChange={(e) => {
            void ingest(Array.from(e.target.files ?? []))
            e.target.value = ''
          }}
        />
      </div>

      {busy > 0 && (
        <p role="status" className="text-sm text-muted-foreground">
          Adding {busy} photo{busy === 1 ? '' : 's'}…
        </p>
      )}
      {errors.length > 0 && (
        <ul className="space-y-1 rounded-2xl bg-destructive/8 p-3 text-sm text-destructive" role="alert">
          {errors.map((e) => (
            <li key={e} className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-4 shrink-0" /> {e}
            </li>
          ))}
        </ul>
      )}

      {photos.length > 0 && (
        <div className="rounded-3xl border border-foreground/8 bg-card p-4 shadow-xs sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-semibold">
              <Images className="size-4 text-accent" /> {photos.length} photo{photos.length === 1 ? '' : 's'} added
            </div>
            <p className="text-xs text-muted-foreground">Aim for about {recommended} for a full book</p>
          </div>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden>
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {photos.map((p) => (
              <li key={p.id} className="group relative aspect-square overflow-hidden rounded-xl bg-secondary">
                {p.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.src} alt={p.name} className="size-full object-cover" draggable={false} />
                ) : (
                  <div className="size-full animate-pulse bg-foreground/8" />
                )}
                <button
                  type="button"
                  onClick={() => flow.removePhoto(p.id)}
                  aria-label={`Remove ${p.name}`}
                  className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-background/90 opacity-100 shadow-xs transition hover:bg-background sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal open={drive} onClose={() => setDrive(false)} title="Import from Google Drive">
        <div className="p-5">
          <p className="mb-4 rounded-xl bg-secondary px-3.5 py-2.5 text-xs text-muted-foreground">
            Demo preview: connecting a real Google account arrives with the backend. Pick a folder to see how importing will feel.
          </p>
          <ul className="space-y-2">
            {DRIVE_FOLDERS.map((f) => (
              <li key={f.name}>
                <button
                  type="button"
                  onClick={() => addFromDrive(f.from, f.count)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-foreground/10 p-3.5 text-left transition hover:border-accent hover:bg-accent/5"
                >
                  <FolderOpen className="size-5 text-accent" />
                  <span className="flex-1 font-medium">{f.name}</span>
                  <span className="text-xs text-muted-foreground">{f.count} photos</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </div>
  )
}
