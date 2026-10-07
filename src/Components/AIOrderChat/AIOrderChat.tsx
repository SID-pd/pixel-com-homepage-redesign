"use client";
 
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./AIOrderChat.module.css";
import ChatBubble from "./ChatBubble";
import ChipSelector from "./ChipSelector";
import ProductOptionsForm from "./ProductOptionsForm";
import UploadZone from "./UploadZone";
import QuotePanel from "./QuotePanel";
import WelcomeScreen from "./WelcomeScreen";
import { Catalog, ChatAction, ChatMessage, ChipOption, FlowStep, OrderDraft } from "./types";
import {
  COVERS,
  OCCASIONS,
  PAGES,
  PAGES_EXTRA,
  PIXIE_GREETING,
  SIZE_PRICES,
  SIZES,
  STEP_PROMPTS,
  SUGGESTED_QUESTIONS,
} from "./flow";
import { loadCatalog } from "./catalog";
import { clearState, loadState, saveState } from "./persistence";
import {
  attachGuestEmail,
  buildAlbumFromChat,
  checkPendingOrder,
  ChatIdentity,
  getLastOrderId,
  resolveIdentity,
  saveGuestEmailToCustomizeData,
} from "./buildAlbum";
import type { UploadZoneResult } from "./UploadZone";
import { PIXIE_THEME, themeToCssVars } from "./theme";
import PixieAvatar from "./PixieAvatar";
 
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 
// Free-text Q&A endpoint. Defaults to the backend's pixie/chat route (which
// calls Groq) — NOT the old Next.js /api/pixie route, which only works when
// the frontend runs as a live Node server. dev.pixovo.com (and any
// static-export deploy) serves pre-built static files via Nginx with no Node
// process behind them, so Next.js API routes can never run there; the
// backend is a real running server, so that's where this now lives instead.
// Set NEXT_PUBLIC_N8N_WEBHOOK_URL to route through n8n/RAG instead.
const PIXIE_ENDPOINT = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_API_URL}pixie/chat`;
// Real site routes (confirmed against the photo-book studio flow).
const STUDIO_PATH = "/photo-book";
// Lands on the same design studio, but tells it to auto-build + auto-preview
// from the chat's choices instead of waiting for manual template/size clicks.
const STUDIO_AUTO_PATH = "/element-editing?source=chat";
const PRICING_PATH = "/pricing";
 
let _idSeq = 0;
const uid = () => `m${Date.now().toString(36)}${(_idSeq++).toString(36)}`;
 
export default function AIOrderChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [booted, setBooted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [hasSavedChat, setHasSavedChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answered, setAnswered] = useState<Set<FlowStep>>(new Set());
  const [draft, setDraft] = useState<OrderDraft>({});
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  // True while Pixie is waiting on the customer's email reply before handing
  // off to the studio/checkout — see handleUpload's success branch.
  const [awaitingEmail, setAwaitingEmail] = useState(false);
  // True while Pixie is waiting on the customer to type their own occasion,
  // after they picked the "Other" chip — see handleChip's occasion branch.
  const [awaitingOccasion, setAwaitingOccasion] = useState(false);
  // Stashes the just-built album's title/caption between "album built" and
  // "email collected", since the final ready-to-checkout message needs both.
  const pendingReadyRef = useRef<{ albumTitle?: string; caption?: string; coverPreviewUrl?: string } | null>(null);
  // Resolved ONCE, right when the upload step is revealed (see
  // handleProductOptionsSubmit) — threaded into every UploadZone photo upload
  // and the final buildAlbumFromChat call so they never disagree on identity.
  const [identity, setIdentity] = useState<ChatIdentity | null>(null);
 
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionId = useMemo(() => uid(), []);
  // Blob URLs handed to <img> tags for the in-chat upload preview — revoked on
  // reset/unmount since they're never persisted (see persistence.ts).
  const objectUrlsRef = useRef<string[]>([]);
  const revokeObjectUrls = useCallback(() => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
  }, []);
  useEffect(() => revokeObjectUrls, [revokeObjectUrls]);
 
  // Real size options when the catalog has loaded; otherwise the static fallback.
  const sizeChips = useMemo<ChipOption[]>(
    () => (catalog?.sizes?.length ? catalog.sizes : SIZES),
    [catalog]
  );
 
  // ---- helpers ----------------------------------------------------------
  const push = useCallback((msg: Omit<ChatMessage, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: uid() }]);
  }, []);
 
  const botText = useCallback((text: string) => push({ sender: "bot", kind: "text", text }), [push]);
 
  const botChips = useCallback(
    (text: string, chips: ChipOption[], step: FlowStep) => {
      push({ sender: "bot", kind: "text", text });
      push({ sender: "bot", kind: "chips", chips, step });
    },
    [push]
  );
 
  // Show a typing indicator for a beat, then run a callback.
  const withTyping = useCallback(
    (ms: number, after: () => void) => {
      const typingId = uid();
      setMessages((prev) => [...prev, { id: typingId, sender: "bot", kind: "typing" }]);
      window.setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== typingId));
        after();
      }, ms);
    },
    []
  );
 
  // ---- hydrate previous conversation ------------------------------------
  // We restore the conversation data but always land on the welcome screen on a
  // fresh page load, surfacing a "Continue your chat" button when a saved chat
  // exists. (Within a session, minimizing keeps `started` in memory, so
  // reopening continues the chat directly — no refresh = seamless continue.)
  useEffect(() => {
    const saved = loadState();
    if (saved && saved.messages.length) {
      setMessages(saved.messages);
      setAnswered(new Set(saved.answered));
      setDraft(saved.draft);
      setBooted(saved.booted);
      setAwaitingEmail(!!saved.awaitingEmail);
      setAwaitingOccasion(!!saved.awaitingOccasion);
      setHasSavedChat(true);
    }
    setHydrated(true);
  }, []);
 
  // ---- notice if a Pixie-built order has since been paid for -------------
  // Checkout happens on a totally different page, and this widget lives in the
  // persistent root layout (main-layout.tsx) rather than remounting per route,
  // so a mount-only check would only ever fire once, on the very first page
  // load of the session — never again after checkout redirects to /thank-you.
  // Re-running on every pathname change (see checkPendingOrder() in
  // buildAlbum.ts) is what actually catches the post-checkout landing.
  useEffect(() => {
    checkPendingOrder().then((orderId) => {
      if (!orderId) return;
      setStarted(true);
      setBooted(true);
      push({
        sender: "bot",
        kind: "text",
        text: "🎉 Your order has been placed! You'll get a confirmation email shortly — thanks for creating with Pixovo.",
      });
    });
  }, [push, pathname]);
 
  // ---- load the real album catalog (sizes & prices) ---------------------
  useEffect(() => {
    const ctrl = new AbortController();
    loadCatalog(ctrl.signal).then((c) => {
      if (c) setCatalog(c);
    });
    return () => ctrl.abort();
  }, []);
 
  // ---- persist the conversation whenever it changes ---------------------
  useEffect(() => {
    if (!hydrated) return;
    saveState({
      messages,
      answered: Array.from(answered),
      draft,
      started,
      booted,
      awaitingEmail,
      awaitingOccasion,
    });
  }, [hydrated, messages, answered, draft, started, booted, awaitingEmail, awaitingOccasion]);
 
  // ---- boot the guided flow once the user chooses to start --------------
  useEffect(() => {
    if (hydrated && started && !booted) {
      setBooted(true);
      withTyping(650, () => {
        botChips(PIXIE_GREETING, OCCASIONS, "occasion");
      });
    }
  }, [hydrated, started, booted, withTyping, botChips]);
 
  // Chat mode follows the newest message; the welcome screen stays pinned to
  // the top so its hero never scrolls up behind the header.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (started) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollTo({ top: 0 });
    }
  }, [messages, open, started]);
 
  // ---- guided flow ------------------------------------------------------
  const revealProductOptions = useCallback(() => {
    withTyping(600, () => {
      botText("Great! Pick your size, pages and cover below — I've pre-picked sensible defaults, so just hit Continue if they look right.");
      push({
        sender: "bot",
        kind: "productOptions",
        sizeOptions: sizeChips,
        pageOptions: PAGES,
        coverOptions: COVERS,
      });
    });
  }, [withTyping, botText, push, sizeChips]);
 
  const handleChip = useCallback(
    (chip: ChipOption, step: FlowStep) => {
      if (answered.has(step)) return;
      push({ sender: "user", kind: "text", text: chip.label });
 
      // "Other" needs the customer to type their own occasion first — held off
      // from `answered` until submitOccasion() actually resolves it, so the
      // chips stay live if they change their mind.
      if (step === "occasion" && chip.value === "other") {
        setAwaitingOccasion(true);
        withTyping(500, () => botText("Sure — what's the occasion?"));
        return;
      }
 
      setAnswered((prev) => new Set(prev).add(step));
      if (step === "occasion") {
        setDraft((d) => ({ ...d, occasion: chip.label }));
        revealProductOptions();
      }
    },
    [answered, push, withTyping, botText, revealProductOptions]
  );
 
  // Free-typed occasion after the "Other" chip — see handleChip.
  const submitOccasion = useCallback(
    (text: string) => {
      const occasion = text.trim();
      if (!occasion) return;
      push({ sender: "user", kind: "text", text: occasion });
      setAwaitingOccasion(false);
      setAnswered((prev) => new Set(prev).add("occasion"));
      setDraft((d) => ({ ...d, occasion }));
      revealProductOptions();
    },
    [push, revealProductOptions]
  );
 
  // Combined size/pages box submits both at once instead of two separate
  // chip-message round trips — see ProductOptionsForm.
  const handleProductOptionsSubmit = useCallback(
    (selection: { size: ChipOption; pages: ChipOption; cover: ChipOption }) => {
      if (answered.has("size")) return;
      setAnswered((prev) => new Set(prev).add("size").add("pages"));
      push({
        sender: "user",
        kind: "text",
        text: `${selection.size.label} · ${selection.pages.label} · ${selection.cover.label}`,
      });
      setDraft((d) => ({
        ...d,
        size: selection.size.label,
        sizePrice: selection.size.price ?? SIZE_PRICES[selection.size.value] ?? 0,
        templateId: selection.size.templateId,
        sizeRaw: selection.size.sizeRaw,
        pages: selection.pages.value,
        pagesPrice: PAGES_EXTRA[selection.pages.value] ?? 0,
        cover: selection.cover.label,
        coverPrice: selection.cover.price ?? 0,
        coverRaw: selection.cover.coverRaw,
      }));
      // Kicked off now (not awaited) so it's very likely resolved by the time
      // the customer actually picks/drops a photo — UploadZone stays disabled
      // until it lands, so no upload can start against a null identity.
      resolveIdentity().then(setIdentity);
      withTyping(600, () => {
        botText(STEP_PROMPTS.upload!);
        push({ sender: "bot", kind: "upload", step: "upload" });
      });
    },
    [answered, push, withTyping, botText]
  );
 
  const handleUpload = useCallback(
    (result: UploadZoneResult) => {
      if (answered.has("upload") || !identity) return;
      setAnswered((prev) => new Set(prev).add("upload"));
      setDraft((d) => ({ ...d, imageIds: result.imageIds }));
 
      // Preview thumbnails (already created by UploadZone) live only in
      // memory for this tab/session — never persisted (see persistence.ts),
      // so they naturally disappear on reload.
      objectUrlsRef.current.push(...result.previewUrls);
      push({ sender: "user", kind: "photos", photos: result.previewUrls });
      push({
        sender: "user",
        kind: "text",
        text: `Uploaded ${result.imageIds.length} photo${result.imageIds.length > 1 ? "s" : ""} 📸`,
      });
      if (result.failedCount > 0) {
        push({
          sender: "bot",
          kind: "text",
          text: `Heads up — ${result.failedCount} photo${result.failedCount > 1 ? "s" : ""} couldn't be uploaded and ${
            result.failedCount > 1 ? "were" : "was"
          } skipped.`,
        });
      }
 
      const typingId = uid();
      setMessages((prev) => [...prev, { id: typingId, sender: "bot", kind: "typing" }]);
      botText("Give me a moment — I'm designing your album…");
 
      buildAlbumFromChat(result.imageIds, draft, identity).then(({ ok, albumTitle, caption, coverPreviewUrl }) => {
        setMessages((prev) => prev.filter((m) => m.id !== typingId));
        if (ok) {
          pendingReadyRef.current = { albumTitle, caption, coverPreviewUrl };
          botText("Almost done! What's your email address? I'll attach it to your order so checkout is one step shorter.");
          setAwaitingEmail(true);
        } else {
          botText("Hmm, I couldn't auto-design your album just now — but your choices are saved, so let's finish it together in the studio ✨");
          const actions: ChatAction[] = [
            { label: "Continue in the studio", action: "preview", href: STUDIO_PATH, icon: "preview" },
            { label: "See full pricing", action: "link", href: PRICING_PATH, icon: "print" },
          ];
          push({ sender: "bot", kind: "actions", actions });
        }
      });
    },
    [answered, push, botText, draft, identity]
  );
 
  // Validates + captures the customer's email once Pixie has asked for it,
  // then reveals the "ready to preview/checkout" message that was pending.
  const submitEmail = useCallback(
    (text: string) => {
      const email = text.trim();
      push({ sender: "user", kind: "text", text: email });
 
      if (!EMAIL_RE.test(email)) {
        botText("That doesn't quite look like an email — mind trying again?");
        return;
      }
 
      setAwaitingEmail(false);
      setAnswered((prev) => new Set(prev).add("email"));
      saveGuestEmailToCustomizeData(email);
      attachGuestEmail(email);
 
      const pending = pendingReadyRef.current;
      pendingReadyRef.current = null;
      const titleNote = pending?.albumTitle ? ` I've titled it "${pending.albumTitle}"` : "";
      const captionNote = pending?.caption ? ` with the caption "${pending.caption}"` : "";
      botText(`Got it, thanks! 🎉 Your photo book is ready${titleNote}${captionNote} — both are on the front page and editable anytime.`);
      if (pending?.coverPreviewUrl) {
        push({ sender: "bot", kind: "photos", photos: [pending.coverPreviewUrl] });
      }
      const actions: ChatAction[] = [
        { label: "Preview my album", action: "preview", href: STUDIO_AUTO_PATH, icon: "preview" },
        { label: "See full pricing", action: "link", href: PRICING_PATH, icon: "print" },
      ];
      push({ sender: "bot", kind: "actions", actions });
    },
    [push, botText]
  );
 
  const handleAction = useCallback((action: ChatAction) => {
    if (action.href) window.location.href = action.href;
  }, []);
 
  // Wipe the conversation back to a clean slate.
  const resetChat = useCallback(() => {
    clearState();
    revokeObjectUrls();
    pendingReadyRef.current = null;
    setMessages([]);
    setAnswered(new Set());
    setDraft({});
    setInput("");
    setBusy(false);
    setBooted(false);
    setHasSavedChat(false);
    setAwaitingEmail(false);
    setAwaitingOccasion(false);
  }, [revokeObjectUrls]);
 
  // Begin a brand-new guided conversation (boot effect fires the greeting).
  const startNew = useCallback(() => {
    resetChat();
    setStarted(true);
  }, [resetChat]);
 
  // Resume the saved conversation as-is.
  const continueChat = useCallback(() => setStarted(true), []);
 
  // Restart button (header): clear everything and return to the welcome screen.
  const handleRestart = useCallback(() => {
    resetChat();
    setStarted(false);
  }, [resetChat]);
 
  // ---- free-text Q&A (grounded in real catalog by the server route) -----
  const askPixie = useCallback(
    async (text: string) => {
      try {
        const orderId = getLastOrderId();
        const res = await fetch(PIXIE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, sessionId, context: draft, orderId }),
        });
        const data = await res.json().catch(() => ({}));
        const reply =
          data.reply || data.output || data.text || data.answer ||
          "Sorry, I didn't catch that — could you rephrase?";
        botText(String(reply));
      } catch {
        botText("Hmm, I couldn't reach my brain just now. Please try again in a moment.");
      }
    },
    [sessionId, draft, botText]
  );
 
  // Send a free-text question and stream back an answer (also starts the chat
  // from the welcome screen, skipping the guided greeting).
  const sendQuestion = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || busy) return;
      setStarted(true);
      setBooted(true); // a direct question shouldn't trigger the guided greeting
      push({ sender: "user", kind: "text", text: q });
      setBusy(true);
      const typingId = uid();
      setMessages((prev) => [...prev, { id: typingId, sender: "bot", kind: "typing" }]);
      await askPixie(q);
      setMessages((prev) => prev.filter((m) => m.id !== typingId));
      setBusy(false);
    },
    [busy, push, askPixie]
  );
 
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    if (awaitingEmail) {
      submitEmail(text);
    } else if (awaitingOccasion) {
      submitOccasion(text);
    } else {
      sendQuestion(text);
    }
  }, [input, awaitingEmail, awaitingOccasion, submitEmail, submitOccasion, sendQuestion]);
 
  // ---- render -----------------------------------------------------------
  return (
    // Theme colors/gradient live in ./theme.ts as CSS custom properties,
    // set here and inherited by every element in the widget below.
    <div style={themeToCssVars(PIXIE_THEME)}>
      {/* Floating launcher */}
      <button
        type="button"
        className={`${styles.launcher} ${open ? styles.launcherOpen : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close Pixie assistant" : "Open Pixie assistant"}
      >
        <span className={styles.launcherGlow} aria-hidden />
        <span className={styles.launcherIcon}>
          {open ? "×" : <PixieAvatar imgClassName={styles.launcherImg} />}
        </span>
      </button>
 
      {/* Chat panel */}
      <div className={`${styles.panel} ${open ? styles.panelOpen : ""}`} role="dialog" aria-label="Pixie chat">
        <div className={styles.header}>
          <div className={styles.headerAvatar}>
            <PixieAvatar />
          </div>
          <div className={styles.headerMeta}>
            <strong>Pixie</strong>
            <span className={styles.headerStatus}>
              <i className={styles.onlineDot} /> Pixovo AI Assistant
            </span>
          </div>
          <div className={styles.headerActions}>
            {started && (
              <button
                type="button"
                className={styles.headerBtn}
                onClick={handleRestart}
                aria-label="Restart chat"
                title="Restart chat"
              >
                <span className={styles.iconRestart} aria-hidden>↻</span>
              </button>
            )}
            <button
              type="button"
              className={styles.headerBtn}
              onClick={() => setOpen(false)}
              aria-label="Minimize chat"
              title="Minimize"
            >
              <span className={styles.iconMinimize} aria-hidden />
            </button>
          </div>
        </div>
 
        {started && <QuotePanel draft={draft} />}
 
        <div className={styles.body} ref={scrollRef}>
          {!started ? (
            <WelcomeScreen
              catalog={catalog}
              questions={SUGGESTED_QUESTIONS}
              hasSavedChat={hasSavedChat}
              onStart={startNew}
              onContinue={continueChat}
              onAsk={sendQuestion}
            />
          ) : (
            messages.map((m) => {
              if (m.kind === "chips" && m.chips && m.step) {
                return (
                  <ChipSelector
                    key={m.id}
                    chips={m.chips}
                    disabled={answered.has(m.step) || (m.step === "occasion" && awaitingOccasion)}
                    onSelect={(chip) => handleChip(chip, m.step!)}
                  />
                );
              }
              if (m.kind === "productOptions" && m.sizeOptions && m.pageOptions) {
                return (
                  <ProductOptionsForm
                    key={m.id}
                    sizes={m.sizeOptions}
                    pages={m.pageOptions}
                    covers={m.coverOptions ?? COVERS}
                    disabled={answered.has("size")}
                    onSubmit={handleProductOptionsSubmit}
                  />
                );
              }
              if (m.kind === "upload") {
                return (
                  <UploadZone
                    key={m.id}
                    disabled={answered.has("upload") || !identity}
                    identity={identity}
                    onConfirm={handleUpload}
                  />
                );
              }
              if (m.kind === "actions" && m.actions) {
                return (
                  <div key={m.id} className={styles.actions}>
                    {m.actions.map((a) => (
                      <button
                        key={a.label}
                        type="button"
                        className={`${styles.actionBtn} ${a.action === "checkout" || a.action === "preview" ? styles.actionBtnPrimary : ""}`}
                        onClick={() => handleAction(a)}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                );
              }
              return <ChatBubble key={m.id} message={m} />;
            })
          )}
        </div>
 
        <div className={styles.inputBar}>
          <input
            className={styles.input}
            value={input}
            placeholder={
              awaitingEmail ? "you@example.com" : awaitingOccasion ? "e.g. Graduation, Anniversary…" : "Ask Pixie anything…"
            }
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
          />
          <button
            type="button"
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={busy || !input.trim()}
            aria-label="Send"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
 
 