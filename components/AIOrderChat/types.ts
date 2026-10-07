// Shared types for the Pixie AI order-assistant chat widget.

export type Sender = "bot" | "user";

export type MessageKind = "text" | "chips" | "productOptions" | "upload" | "photos" | "quote" | "actions" | "typing";

export interface ChatAction {
  label: string;
  /** Internal action id the widget reacts to (e.g. "preview", "checkout"). */
  action: "preview" | "checkout" | "restart" | "link";
  href?: string;
  icon?: "preview" | "print";
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  kind: MessageKind;
  /** Plain text body (for "text" / "typing"). */
  text?: string;
  /** Quick-reply chips (for "chips"). */
  chips?: ChipOption[];
  /** Thumbnail preview URLs of photos the user just uploaded (for "photos"). */
  photos?: string[];
  /** Size options for the combined selector (for "productOptions"). */
  sizeOptions?: ChipOption[];
  /** Page-count options for the combined selector (for "productOptions"). */
  pageOptions?: ChipOption[];
  /** Cover-type options for the combined selector (for "productOptions"). */
  coverOptions?: ChipOption[];
  /** Which flow step a chip set belongs to, so we know how to advance. */
  step?: FlowStep;
  /** CTA buttons (for "actions"). */
  actions?: ChatAction[];
}

export interface ChipOption {
  /** What the user sees. */
  label: string;
  /** Stable value stored in the order draft. */
  value: string;
  /** Optional price delta shown inline, e.g. "$12.99". */
  priceLabel?: string;
  /** Numeric price carried from the real catalog (used for the live quote). */
  price?: number;
  /** Real backend template `_id` this size chip belongs to (from the live catalog). */
  templateId?: string;
  /** The exact backend size sub-document `{_id, size_name, price}` this chip resolves to. */
  sizeRaw?: { _id: string; size_name: string; price: number };
  /** The exact backend cover sub-document this chip resolves to (hard/soft cover). */
  coverRaw?: CoverRaw;
}

/** Backend cover sub-document (from `template_cover`), mirrors step1.tsx's coverOptions. */
export interface CoverRaw {
  _id: string;
  cover_name: string;
  desc?: string;
  price: number;
  spine?: number;
  cover_image?: string;
  sku?: string;
}

/** A clickable starter question shown on the welcome screen. */
export interface SuggestedQuestion {
  icon: string;
  text: string;
}

/** One album product, distilled from the backend `template/list` response. */
export interface CatalogTemplate {
  /** Real backend template `_id`, needed to create a real order. */
  id: string;
  name: string;
  basePrice: number;
  minPage: number;
  maxPage: number;
  sizes: ChipOption[];
}

/** Real album catalog the widget loads from the site backend. */
export interface Catalog {
  templates: CatalogTemplate[];
  /** Unique size options across templates, for the guided "size" step. */
  sizes: ChipOption[];
  /** Lowest starting price across the catalog, e.g. for "from $X" copy. */
  fromPrice?: number;
}

/** The guided-order state machine steps, in order. */
export type FlowStep =
  | "greeting"
  | "occasion"
  | "size"
  | "pages"
  | "upload"
  | "email"
  | "preview"
  | "done";

/** Everything Pixie collects while guiding the order. */
export interface OrderDraft {
  occasion?: string;
  size?: string;
  sizePrice?: number;
  pages?: string;
  pagesPrice?: number;
  /** Chosen cover type label, e.g. "Hardcover" / "Softcover". */
  cover?: string;
  /** Extra cost of the chosen cover, added to the live quote. */
  coverPrice?: number;
  /** Mongo _ids of photos already uploaded via image/add|temp-add (see uploadPhotos.ts). */
  imageIds?: string[];
  /** Real backend template `_id` behind the chosen size (set once the catalog has loaded). */
  templateId?: string;
  /** The exact backend size sub-document behind the chosen size. */
  sizeRaw?: { _id: string; size_name: string; price: number };
  /** The exact backend cover sub-document behind the chosen cover. */
  coverRaw?: CoverRaw;
}
