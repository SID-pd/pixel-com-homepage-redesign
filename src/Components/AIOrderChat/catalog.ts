// Loads the REAL album catalog from the Pixovo backend so Pixie quotes actual
// sizes and prices instead of hardcoded values. Mirrors the `template/list`
// call used by the photo-book studio (see src/Components/step1.tsx), but kept
// standalone here so the widget never triggers the app's global toasts/redirects.

import { Catalog, CatalogTemplate, ChipOption } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

/** "10 X 10" / "10x10 inches" -> { label: "10×10", value: "10x10" }. */
function normalizeSize(sizeName: string): { label: string; value: string } {
  const raw = String(sizeName || "").trim();
  const match = raw.match(/(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)/);
  if (match) {
    return { label: `${match[1]}×${match[2]}`, value: `${match[1]}x${match[2]}` };
  }
  return { label: raw || "Standard", value: raw.toLowerCase().replace(/\s+/g, "-") };
}

function toTemplate(t: any): CatalogTemplate | null {
  if (!t) return null;
  const id = String(t._id || "");
  const basePrice = Number(t.base_price) || 0;
  const minPage = Number(t.min_page) || 20;
  const sizes: ChipOption[] = Array.isArray(t.sizes)
    ? t.sizes.map((s: any) => {
        const { label, value } = normalizeSize(s.size_name);
        // Starting price for this size = base (for the minimum page count) + size surcharge.
        const price = Math.round((basePrice + (Number(s.price) || 0)) * 100) / 100;
        return {
          label,
          value,
          price,
          priceLabel: price ? `from $${price.toFixed(2)}` : undefined,
          // Carried along so the chat can create a real order later without
          // a second round-trip to figure out which template a size came from.
          templateId: id,
          sizeRaw: { _id: String(s._id || ""), size_name: String(s.size_name || ""), price: Number(s.price) || 0 },
        };
      })
    : [];
  return {
    id,
    name: String(t.template_name || "Photo Album"),
    basePrice,
    minPage,
    maxPage: Number(t.max_page) || 100,
    sizes,
  };
}

/** Fetch & distil the catalog. Returns null on any failure so callers can fall back. */
export async function loadCatalog(signal?: AbortSignal): Promise<Catalog | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}template/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: 1, limit: 20, search: "" }),
      cache: "no-store",
      signal,
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const records: any[] = data?.data?.records || data?.records || [];
    const templates = records.map(toTemplate).filter(Boolean) as CatalogTemplate[];
    if (!templates.length) return null;

    // Unique size options across templates (cheapest price wins for the live quote).
    const byValue = new Map<string, ChipOption>();
    for (const tpl of templates) {
      for (const s of tpl.sizes) {
        const prev = byValue.get(s.value);
        if (!prev || (s.price ?? Infinity) < (prev.price ?? Infinity)) byValue.set(s.value, s);
      }
    }
    const sizes = Array.from(byValue.values()).sort(
      (a, b) => (a.price ?? 0) - (b.price ?? 0)
    );
    const fromPrice = sizes.reduce(
      (min, s) => (s.price != null && s.price < min ? s.price : min),
      Infinity
    );

    return {
      templates,
      sizes,
      fromPrice: Number.isFinite(fromPrice) ? fromPrice : undefined,
    };
  } catch {
    return null;
  }
}
