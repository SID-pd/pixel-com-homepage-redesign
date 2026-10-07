// Persists the Pixie conversation to sessionStorage so minimizing the widget
// or reloading the page continues the same chat within this tab, but closing
// the tab (or opening a new one) always starts fresh — sessionStorage is
// cleared by the browser on tab close, unlike localStorage. Photos are
// uploaded up front (see uploadPhotos.ts), so the draft only ever carries
// their already-issued `imageIds` (plain strings) — nothing non-serializable.

import { ChatMessage, FlowStep, OrderDraft } from "./types";

const KEY = "pixie_chat_v1";

export interface PersistedState {
  messages: ChatMessage[];
  answered: FlowStep[];
  draft: OrderDraft;
  started: boolean;
  booted: boolean;
  /** True while Pixie is waiting on the customer's email reply, mid-checkout handoff. */
  awaitingEmail?: boolean;
  /** True while Pixie is waiting on the customer to type their own occasion. */
  awaitingOccasion?: boolean;
}

export function loadState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed || !Array.isArray(parsed.messages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(state: PersistedState): void {
  if (typeof window === "undefined") return;
  try {
    // Never persist transient typing indicators.
    const messages = state.messages.filter((m) => m.kind !== "typing");
    const payload: PersistedState = { ...state, messages };
    window.sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* quota / serialization errors are non-fatal */
  }
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
