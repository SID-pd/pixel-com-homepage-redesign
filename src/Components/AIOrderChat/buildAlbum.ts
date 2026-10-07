// Turns the chat's collected choices + freshly-dropped photos into a real,
// auto-designed order — reusing the exact backend contract the manual
// step1 -> step3 -> element-editing studio flow already relies on, so
// /element-editing?source=chat can pick up right where step1 would have
// left off (see src/Components/step1.tsx `handleContinue`).
//
// The actual upload/pricing/AI-caption orchestration now lives server-side in
// Pixovo-API's POST chat/build-album (one call instead of four) — see
// FrontEnd_controllers/chat_album_controllers.py. This file just resolves the
// caller's identity (a frontend-only concern: reading localStorage), posts the
// photos + choices, and persists the returned customize_data.
//
// Uses raw fetch (not apiPost) so a flaky network never fires the app's
// global toasts/redirects from inside the chat widget — same reasoning as
// catalog.ts.

import { get, set } from "../../app/api/service/storage";
import { ensureGuestUser } from "../../app/api/service/guest";
import { OrderDraft } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export interface BuildAlbumResult {
  ok: boolean;
  /** Occasion-based heading placed on the album's front page (e.g. "Wedding"). */
  albumTitle?: string;
  /** Short AI-generated caption for the cover photo, from the existing Gemini vision endpoint. */
  caption?: string;
  /** Rendered mockup of the cover (uploaded photo composited full-bleed), for showing inline in chat. */
  coverPreviewUrl?: string;
}

export interface ChatIdentity {
  id: string;
  isGuest: boolean;
  /** Only set (and only needed) for a real logged-in user — guest calls use
   * a plain `user_id` field instead, same as image/temp-add. */
  token?: string;
}

/**
 * Resolves which identity (real user vs. guest) the chat's photo uploads and
 * final chat/build-album call should use. Exported so it can be called ONCE
 * up front (before any photo upload starts — see UploadZone/AIOrderChat.tsx)
 * and threaded explicitly into every subsequent call, instead of being
 * re-resolved independently by each one (which risked minting two different
 * guests if called concurrently).
 */
export async function resolveIdentity(): Promise<ChatIdentity | null> {
  const realUser = get<any>("user");
  if (realUser?._id) return { id: realUser._id, isGuest: false, token: realUser.token };

  const existingTempId = typeof window !== "undefined" ? localStorage.getItem("temp_id") : "";
  if (existingTempId) return { id: existingTempId, isGuest: true };

  const guest = await ensureGuestUser();
  if (guest?._id) {
    // element-editing / image/list resolve guests via the raw "temp_id" key,
    // while ensureGuestUser stores its own object under "guest_user" — mirror
    // the id into both so uploads and the order save agree on one identity.
    localStorage.setItem("temp_id", guest._id);
    return { id: guest._id, isGuest: true };
  }
  return null;
}

/** Merges the customer's email into the already-saved `customize_data` so the studio/checkout can read it later. */
export function saveGuestEmailToCustomizeData(email: string): void {
  try {
    const stored = JSON.parse(localStorage.getItem("customize_data") || "{}");
    localStorage.setItem("customize_data", JSON.stringify({ ...stored, guest_email: email }));
  } catch {
    /* non-fatal — checkout still asks for the email directly if this is missing */
  }
}

/**
 * Best-effort: attaches the customer's email to their guest identity so it's
 * already on file by the time they reach checkout. Guests aren't
 * authenticated, so the backend may reject this — that's fine, checkout
 * already falls back to asking the customer for their email directly
 * whenever the order has no real one on it.
 */
export async function attachGuestEmail(email: string): Promise<boolean> {
  try {
    const identity = await resolveIdentity();
    if (!identity || !identity.isGuest) return false;
    const fd = new FormData();
    fd.append("id", identity.id);
    fd.append("email", email);
    const res = await fetch(`${API_BASE}profile/update`, { method: "POST", body: fd });
    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    return Boolean(data?.status || data?.success);
  } catch {
    return false;
  }
}

/**
 * Finalizes the chat's already-uploaded photos into a `customize_data`
 * payload shaped exactly like the manual studio's (see step1.tsx), so the
 * editor can build + auto-save the album without any manual template/size
 * clicks.
 *
 * Photos are uploaded up front via uploadPhotos.ts (fast, parallel, same
 * image/add|temp-add path the regular website upload uses) — this call only
 * sends their already-issued `image_ids`, so Pixovo-API's chat/build-album
 * (see FrontEnd_controllers/chat_album_controllers.py) only has to run the
 * Gemini scan/caption/preview + pricing step, not re-upload anything.
 *
 * `identity` must be the SAME one already used for those uploads (resolved
 * once via resolveIdentity(), see AIOrderChat.tsx) — never re-resolved here,
 * so this can't mint a second, divergent guest mid-flow.
 *
 * Returns `{ ok: false }` (touching no localStorage) if anything required is
 * missing or fails, so the caller can fall back to the manual studio link.
 */
export async function buildAlbumFromChat(
  imageIds: string[],
  draft: OrderDraft,
  identity: ChatIdentity
): Promise<BuildAlbumResult> {
  if (!imageIds.length || !draft.templateId || !draft.sizeRaw) return { ok: false };

  try {
    const fd = new FormData();
    fd.append("template_id", draft.templateId);
    fd.append("page_size", JSON.stringify(draft.sizeRaw));
    if (draft.pages) fd.append("pages", draft.pages);
    if (draft.occasion) fd.append("occasion", draft.occasion);
    // Chosen cover sub-document (hard/soft cover). The backend falls back to
    // its Hardcover default if this is missing/invalid — see build_album.
    if (draft.coverRaw) fd.append("cover", JSON.stringify(draft.coverRaw));
    fd.append("image_ids", JSON.stringify(imageIds));

    const headers: Record<string, string> = {};
    if (!identity.isGuest && identity.token) {
      headers["Authorization"] = `Bearer ${identity.token}`;
    } else {
      fd.append("user_id", identity.id);
    }

    const res = await fetch(`${API_BASE}chat/build-album`, { method: "POST", body: fd, headers });
    if (!res.ok) return { ok: false };
    const json = await res.json().catch(() => null);
    const customizeData = json?.data?.customize_data;
    if (!json?.status || !customizeData) return { ok: false };

    // Backend only returns a token/email when it minted a brand-new guest
    // (shouldn't normally happen now that identity is resolved up front, but
    // kept as a defensive fallback) — persist it the same way
    // ensureGuestUser() does so uploads/order-save/checkout keep agreeing on
    // one identity.
    const respIdentity = json?.data?.identity;
    if (identity.isGuest && respIdentity?.id && respIdentity?.token) {
      set("guest_user", { _id: respIdentity.id, token: respIdentity.token, email: respIdentity.email, type: "guest" });
      localStorage.setItem("temp_id", respIdentity.id);
    }

    localStorage.setItem("customize_data", JSON.stringify(customizeData));
    return {
      ok: true,
      albumTitle: customizeData.album_title,
      caption: customizeData.ai_caption,
      coverPreviewUrl: json?.data?.cover_preview_url || undefined,
    };
  } catch (err) {
    console.error("[Pixie] buildAlbumFromChat failed:", err);
    return { ok: false };
  }
}

const PENDING_ORDER_KEY = "pixie_pending_order_id";
// Unlike PENDING_ORDER_KEY (cleared the moment payment confirms), this sticks
// around so Pixie can still answer "where's my order" days later, in the same
// browser, without the customer re-typing their order number.
const LAST_ORDER_KEY = "pixie_last_order_id";

export function getLastOrderId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_ORDER_KEY);
}

/**
 * Checks whether the order Pixie last handed off to the studio has since
 * been paid for. There's no webhook/polling system on the backend and
 * checkout happens on a totally different page (full navigation resets the
 * chat's React state), so this is the bridge: element-editing stamps the
 * order id into localStorage once it's created, and the chat widget calls
 * this once on mount to see if it's since gone from "Pending" to "complete".
 *
 * Returns the order id if it just got confirmed as paid (and clears the
 * pending flag so this only fires once), otherwise null.
 */
export async function checkPendingOrder(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const orderId = localStorage.getItem(PENDING_ORDER_KEY);
  if (!orderId) return null;

  try {
    const fd = new FormData();
    fd.append("id", orderId);
    const res = await fetch(`${API_BASE}order/detail`, { method: "POST", body: fd });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const order = data?.data;
    if (!order) return null;

    if (order.status === "complete" || order.payment_status === "complete") {
      localStorage.removeItem(PENDING_ORDER_KEY);
      localStorage.setItem(LAST_ORDER_KEY, orderId);
      return orderId;
    }
    return null;
  } catch {
    return null;
  }
}
