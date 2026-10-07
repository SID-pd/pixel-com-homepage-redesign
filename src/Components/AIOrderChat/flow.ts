// Guided-order flow configuration + live pricing for Pixie.
// All copy and prices live here so they are easy to tune without touching UI code.

import { ChipOption, FlowStep, OrderDraft, SuggestedQuestion } from "./types";

export const PIXIE_GREETING =
  "Hi! I'm Pixie, your Pixovo assistant 👋 Let's design your perfect photo album in under a minute. What's the occasion?";

/** Clickable starter questions shown on the welcome screen (answered via /api/pixie). */
export const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  { icon: "💸", text: "How much does a photo album cost?" },
  { icon: "📐", text: "What album sizes do you offer?" },
  { icon: "🚚", text: "How long does shipping take?" },
  { icon: "🪄", text: "How do I create my own album?" },
];

export const OCCASIONS: ChipOption[] = [
  { label: "💍 Wedding", value: "wedding" },
  { label: "✈️ Travel", value: "travel" },
  { label: "👨‍👩‍👧 Family", value: "family" },
  { label: "👶 Baby", value: "baby" },
  { label: "✨ Other", value: "other" },
];

// Size -> base price (includes 20 pages).
export const SIZES: ChipOption[] = [
  { label: "8×8", value: "8x8", priceLabel: "$12.99" },
  { label: "10×10", value: "10x10", priceLabel: "$19.99" },
  { label: "12×12", value: "12x12", priceLabel: "$26.99" },
];

export const SIZE_PRICES: Record<string, number> = {
  "8x8": 12.99,
  "10x10": 19.99,
  "12x12": 26.99,
};

// Pages -> extra cost on top of the 20 pages included in the base size price.
export const PAGES: ChipOption[] = [
  { label: "20 pages", value: "20", priceLabel: "included" },
  { label: "40 pages", value: "40", priceLabel: "+$4" },
  { label: "60 pages", value: "60", priceLabel: "+$8" },
  { label: "80 pages", value: "80", priceLabel: "+$12" },
  { label: "100 pages", value: "100", priceLabel: "+$16" },
];

export const PAGES_EXTRA: Record<string, number> = {
  "20": 0,
  "40": 4,
  "60": 8,
  "80": 12,
  "100": 16,
};

// Cover type -> extra cost + the exact backend cover sub-document. Mirrors the
// studio's own `coverOptions` (see src/Components/step1.tsx) and the backend's
// HARDCOVER_DEFAULT so the chat-built album matches the manual flow exactly.
export const COVERS: ChipOption[] = [
  {
    label: "Hardcover",
    value: "hardcover",
    price: 7,
    priceLabel: "+$7",
    coverRaw: { _id: "69b26242ff6f88df5f41340e", cover_name: "Hardcover", desc: "Hardcover", price: 7.0, spine: 0.289, sku: "HC" },
  },
  {
    label: "Softcover",
    value: "softcover",
    price: 0,
    priceLabel: "included",
    coverRaw: { _id: "69b26242ff6f88df5f41340d", cover_name: "Softcover", desc: "Softcover", price: 0, spine: 0.039, sku: "SC" },
  },
];

/** Running total = base size price + extra pages cost + cover surcharge. */
export function quoteTotal(draft: OrderDraft): number {
  const size = draft.sizePrice ?? 0;
  const pages = draft.pagesPrice ?? 0;
  const cover = draft.coverPrice ?? 0;
  return Math.round((size + pages + cover) * 100) / 100;
}

export function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** Human-readable bot prompt for each step, plus the chips to show. */
export const STEP_PROMPTS: Partial<Record<FlowStep, string>> = {
  size: "Perfect. Which album size would you like? (price shown per size)",
  pages: "Nice! How many pages should your album have?",
  upload: "Awesome 🎉 Now drop your photos below and I'll prep them for your album.",
  preview: "All set! I'm building a live preview of your album…",
};

/** Returns the next step given the current one. */
export function nextStep(step: FlowStep): FlowStep {
  const order: FlowStep[] = [
    "greeting",
    "occasion",
    "size",
    "pages",
    "upload",
    "preview",
    "done",
  ];
  const i = order.indexOf(step);
  return order[Math.min(i + 1, order.length - 1)];
}
