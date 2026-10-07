import type { CoverId, MaterialId, PageCount, ShippingId, SizeId, TemplateId } from './catalog'

export type BookConfig = {
  size: SizeId
  pages: PageCount
  cover: CoverId
  material: MaterialId
  title: string
  templateId?: TemplateId
}

export type Photo = {
  id: string
  name: string
  /** sample photos keep their public path; uploads are resolved from IndexedDB */
  src: string
  kind: 'sample' | 'upload' | 'drive'
  w: number
  h: number
}

export type Adjust = { brightness: number; contrast: number; saturation: number; warmth: number }

export type Item = {
  id: string
  type: 'photo' | 'text' | 'sticker'
  /** percent of the spread canvas */
  x: number
  y: number
  w: number
  h: number
  rotation: number
  locked?: boolean
  // photo
  photoId?: string | null
  fit?: 'fill' | 'fit' | 'stretch'
  filter?: string
  adjust?: Adjust
  // text
  text?: string
  font?: string
  color?: string
  size?: number
  align?: 'left' | 'center' | 'right' | 'justify'
  bold?: boolean
  italic?: boolean
  /** background colour behind the text box (null/undefined = none) */
  fill?: string | null
  border?: boolean
  // sticker
  emoji?: string
}

export type Spread = {
  id: string
  kind: 'cover' | 'spread'
  bg: string
  items: Item[]
}

export type Draft = {
  id: string
  config: BookConfig
  photos: Photo[]
  spreads: Spread[]
  /** wizard progress, so a reload resumes where the customer left off */
  step: number
  updatedAt: number
  /** set when the draft was reopened from the cart, so saving replaces that item */
  cartItemId?: string
}

export type CartItem = {
  id: string
  title: string
  config: BookConfig
  unitPrice: number
  qty: number
  thumb: string
  photoCount: number
  /** full snapshot so "Edit" can restore the book */
  snapshot: { photos: Photo[]; spreads: Spread[] }
  addedAt: number
}

export type Contact = {
  email: string
  firstName: string
  lastName: string
  phone: string
  address1: string
  address2: string
  city: string
  state: string
  zip: string
}

export type OrderTotals = {
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
}

export type Order = {
  id: string
  createdAt: number
  items: CartItem[]
  contact: Contact
  shipping: ShippingId
  promo: string | null
  totals: OrderTotals
  payment: string
}

export type MockUser = { name: string; email: string }
