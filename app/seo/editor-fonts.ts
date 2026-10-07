/**
 * The decorative font families the album editor offers.
 *
 * Two consumers, loaded two different ways:
 *
 *  1. /element-editing — app/head.tsx renders a plain <link> gated on the route,
 *     so it lands in that page's prerendered HTML where it is verifiable. It is
 *     deliberately NOT site-wide: it was, and every page paid for the whole
 *     variable-font payload as a render-blocking request.
 *
 *  2. /checkout — loadEditorFonts() below, called only once a stored album
 *     preview actually renders. The preview injects order_html straight from the
 *     database, and that HTML carries inline font-family values naming these
 *     families; without them the customer's text falls back to Poppins and the
 *     preview stops matching their book. Injecting after mount keeps
 *     fonts.googleapis.com out of checkout's critical path — the highest-value
 *     page on the site — at the cost of one repaint when the faces arrive, which
 *     &display=swap already covers.
 *
 * Two other placements were tried and rejected: a remote @import in
 * element-editing-tool.css (silently dropped by Turbopack's CSS pipeline) and a
 * component rendering <link precedence>, which never reached the prerendered
 * HTML because the editor page bails to client rendering.
 *
 * Keep in sync with the fontFamilies array in
 * element-editing/font-family/font-family.tsx. Poppins is intentionally absent —
 * it is self-hosted from public/fonts and loaded site-wide.
 */
export const EDITOR_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Baloo+2:wght@400..800&family=Bungee" +
  "&family=Chewy&family=Dancing+Script:wght@400..700&family=Fredoka:wght@300..700" +
  "&family=Gloria+Hallelujah&family=Great+Vibes" +
  "&family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700" +
  "&family=Lora:ital,wght@0,400..700;1,400..700" +
  "&family=Merriweather:ital,opsz,wght@0,18..144,300..900;1,18..144,300..900" +
  "&family=Monoton&family=Montserrat:ital,wght@0,100..900;1,100..900" +
  "&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Pacifico" +
  "&family=Playfair+Display:ital,wght@0,400..900;1,400..900" +
  "&family=Roboto:ital,wght@0,100..900;1,100..900&family=Rubik+Moonrocks" +
  "&family=Source+Sans+3:ital,wght@0,200..900;1,200..900" +
  "&family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap";

/**
 * Append the editor font stylesheet to <head>, once per document.
 *
 * Idempotent and safe to call from an effect that re-runs: it checks for an
 * existing link with the same href first, so it is also a no-op on
 * /element-editing where head.tsx already rendered one.
 */
export function loadEditorFonts(): void {
  if (typeof document === "undefined") return;
  if (document.querySelector(`link[href="${EDITOR_FONTS_HREF}"]`)) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = EDITOR_FONTS_HREF;
  document.head.appendChild(link);
}
