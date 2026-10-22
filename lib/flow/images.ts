import { openDB, type IDBPDatabase } from 'idb'
import { SAMPLE_PHOTOS } from './catalog'
import { uid } from './layouts'
import type { Photo } from './types'

// Uploaded photos live in IndexedDB (object URLs would not survive a reload).
// Swap these for real uploads when the backend exists.

let dbPromise: Promise<IDBPDatabase> | null = null
function db() {
  if (!dbPromise) {
    dbPromise = openDB('pixovo-flow', 1, {
      upgrade(d) {
        d.createObjectStore('photos')
      },
    })
  }
  return dbPromise
}

export async function savePhotoData(id: string, dataUrl: string) {
  try {
    await (await db()).put('photos', dataUrl, id)
  } catch {
    /* storage may be unavailable (private mode); photo still works for this session */
  }
}

export async function loadPhotoData(id: string): Promise<string | null> {
  try {
    return ((await (await db()).get('photos', id)) as string | undefined) ?? null
  } catch {
    return null
  }
}

export async function deletePhotoData(id: string) {
  try {
    await (await db()).delete('photos', id)
  } catch {
    /* ignore */
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read image'))
    img.src = src
  })
}

type Source = HTMLImageElement | ImageBitmap | HTMLCanvasElement

const sizeOf = (src: Source) => (src instanceof HTMLImageElement ? { w: src.naturalWidth, h: src.naturalHeight } : { w: src.width, h: src.height })

function draw(src: Source, max: number) {
  const { w: sw, h: sh } = sizeOf(src)
  const scale = Math.min(1, max / Math.max(sw, sh))
  const w = Math.max(1, Math.round(sw * scale))
  const h = Math.max(1, Math.round(sh * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(src, 0, 0, w, h)
  return { canvas, w, h }
}

/** toBlob keeps the encode off the main thread; toDataURL would block it for every photo. */
function encode(canvas: HTMLCanvasElement, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const done = (blob: Blob | null) => {
      if (!blob) return reject(new Error('Could not encode image'))
      const r = new FileReader()
      r.onload = () => resolve(String(r.result))
      r.onerror = () => reject(new Error('Could not encode image'))
      r.readAsDataURL(blob)
    }
    try {
      canvas.toBlob(done, 'image/jpeg', quality)
    } catch (e) {
      reject(e)
    }
  })
}

/** Release a canvas's pixel buffer right away; on phones, waiting for garbage collection is what runs the page out of memory. */
function free(canvas: HTMLCanvasElement) {
  canvas.width = 0
  canvas.height = 0
}

export const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif']
export const MAX_FILE_MB = 25
const FULL_SIDE = 1600
export const THUMB_SIDE = 320

const THUMB_KEY = (id: string) => `${id}:t`

export async function saveThumbData(id: string, dataUrl: string) {
  await savePhotoData(THUMB_KEY(id), dataUrl)
}

export async function loadThumbData(id: string): Promise<string | null> {
  return loadPhotoData(THUMB_KEY(id))
}

export async function deleteThumbData(id: string) {
  await deletePhotoData(THUMB_KEY(id))
}

/** The small copy every grid, rail and pill draws, so the full-size photo is only ever decoded by the close-up and the book. */
export const photoThumb = (p: { src: string; thumb?: string }) => p.thumb || p.src

/**
 * Validate, downscale and persist one uploaded file. Throws a human-readable error.
 * Decoding happens off the main thread where the browser allows it, and the decoded pixels are released before returning,
 * so callers should still feed files through one at a time (see useIngest).
 */
export async function fileToPhoto(file: File): Promise<Photo> {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image`)
  if (file.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`${file.name} is larger than ${MAX_FILE_MB}MB`)

  let bitmap: ImageBitmap | null = null
  let img: HTMLImageElement | null = null
  let objectUrl: string | null = null
  try {
    if (typeof createImageBitmap === 'function') {
      try {
        bitmap = await createImageBitmap(file)
      } catch {
        bitmap = null
      }
    }
    if (!bitmap) {
      objectUrl = URL.createObjectURL(file)
      img = await loadImage(objectUrl).catch(() => {
        throw new Error(`Could not read ${file.name}`)
      })
    }
    const src = (bitmap ?? img)!
    const full = draw(src, FULL_SIDE)
    const thumb = draw(full.canvas, THUMB_SIDE)
    try {
      const [url, thumbUrl] = [await encode(full.canvas, 0.82), await encode(thumb.canvas, 0.7)]
      const id = uid('p')
      await Promise.all([savePhotoData(id, url), saveThumbData(id, thumbUrl)])
      return { id, name: file.name, src: url, thumb: thumbUrl, kind: 'upload', w: full.w, h: full.h }
    } finally {
      free(full.canvas)
      free(thumb.canvas)
    }
  } finally {
    bitmap?.close()
    if (img) img.src = ''
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  }
}

export async function makeThumb(src: string, max = 360): Promise<string> {
  try {
    const img = await loadImage(src)
    const { canvas } = draw(img, max)
    try {
      return await encode(canvas, 0.7)
    } finally {
      free(canvas)
    }
  } catch {
    return src
  }
}

export async function samplePhotos(count: number, kind: Photo['kind'] = 'sample'): Promise<Photo[]> {
  const picks = SAMPLE_PHOTOS.slice(0, Math.min(count, SAMPLE_PHOTOS.length))
  return Promise.all(
    picks.map(async (s) => {
      let w = 1200
      let h = 900
      try {
        const img = await loadImage(s.src)
        w = img.naturalWidth
        h = img.naturalHeight
      } catch {
        /* keep defaults */
      }
      return { id: uid('p'), name: s.name, src: s.src, kind, w, h }
    }),
  )
}
