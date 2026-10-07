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

function draw(img: HTMLImageElement, max: number, quality: number) {
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
  return { url: canvas.toDataURL('image/jpeg', quality), w, h }
}

export const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif']
export const MAX_FILE_MB = 25

/** Validate, downscale and persist one uploaded file. Throws a human-readable error. */
export async function fileToPhoto(file: File): Promise<Photo> {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image`)
  if (file.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`${file.name} is larger than ${MAX_FILE_MB}MB`)
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(objectUrl)
    const { url, w, h } = draw(img, 1600, 0.82)
    const id = uid('p')
    await savePhotoData(id, url)
    return { id, name: file.name, src: url, kind: 'upload', w, h }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function makeThumb(src: string, max = 360): Promise<string> {
  try {
    const img = await loadImage(src)
    return draw(img, max, 0.7).url
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
