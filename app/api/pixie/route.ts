import { NextRequest, NextResponse } from "next/server";

// Server-side proxy to Groq. The GROQ_API_KEY stays on the server and is
// never shipped to the browser. The Pixie widget POSTs here.
//
// Answers are grounded in the REAL Pixovo catalog: we fetch live templates,
// sizes and prices from the backend (cached briefly) and feed them to the model
// so quotes reflect actual products rather than hardcoded numbers.

export const runtime = "nodejs";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const SYSTEM_PROMPT = `You are Pixie, the friendly AI assistant for Pixovo — a custom photo album / photo book printing service.
Your job is to help customers design and order personalized photo albums, and answer their questions.

General facts:
- Customers can upload their own photos; we auto-enhance and lay them out.
- To design an album, customers use the photo-book studio at /photo-book. Full pricing lives at /pricing.
- Extra pages are added in steps of 20 beyond the included minimum.

If the customer asks about an existing order (e.g. "where's my order", "is it placed", "order status"):
look at the very end of this system message for a line starting with "The customer's most recent order:"
or "Orders found for the customer's reference:". If that line is present, you ALREADY have the answer —
state those facts directly, do NOT ask the customer for their order number or email. Only ask for their
order number or email if no such line is present below.

Style: warm, upbeat, and concise — keep replies to 1–3 short sentences, good for a chat bubble.
Always prefer the live catalog data below over any assumption. Quote prices as "starting from".
If you don't know something, say you'll connect them to Pixovo support rather than guessing.`;

// ---- live catalog (cached in-memory for a few minutes) -------------------
let _catalogText = "";
let _catalogAt = 0;
const CATALOG_TTL = 10 * 60 * 1000; // 10 minutes

function normalizeSize(name: string): string {
  const m = String(name || "").match(/(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)/);
  return m ? `${m[1]}×${m[2]}` : String(name || "").trim();
}

// ---- order-status awareness -----------------------------------------------
// Lets Pixie answer "where's my order" with real facts instead of guessing.
// Preferred path: the browser already knows its own last order id (see
// getLastOrderId() in buildAlbum.ts) and sends it as `orderId`. Fallback: the
// customer is on a different device/tab with no localStorage, so we scan
// their raw message for an order number ("#012", "order 12") or an email
// address and look it up server-side instead.
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const ORDER_NO_RE = /\border\s*(?:no\.?|number|#)?\s*#?(\d{1,6})\b/i;

function summarizeOrder(o: any): string {
  const paid = o.payment_status === "complete" || o.status === "complete";
  const bits = [
    `order #${o.order_no ?? o.id}`,
    paid ? "payment complete" : `status: ${o.status || o.payment_status || "pending"}`,
  ];
  if (o.template_name) bits.push(o.template_name);
  if (o.number_of_pages) bits.push(`${o.number_of_pages} pages`);
  // Only worth mentioning when it isn't the default single copy.
  if ((o.quantity ?? 1) > 1) bits.push(`${o.quantity} copies`);
  if (o.total_price) bits.push(`total $${o.total_price}`);
  if (o.order_date) bits.push(`placed ${String(o.order_date).slice(0, 10)}`);
  return bits.join(", ");
}

async function getOrderFactsLine(orderId: string | undefined, message: string): Promise<string> {
  if (!API_BASE) return "";
  try {
    if (orderId) {
      const fd = new URLSearchParams({ id: orderId });
      const res = await fetch(`${API_BASE}order/detail`, { method: "POST", body: fd, cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (data?.status && data?.data) {
        const o = data.data;
        return `\nThe customer's most recent order: ${summarizeOrder({
          order_no: o.order_no,
          id: o._id,
          status: o.status,
          payment_status: o.payment_status,
          template_name: o.template_id?.template_name,
          number_of_pages: o.number_of_pages,
          quantity: o.quantity ?? 1,
          // total_price is the per-book price; quote what was actually charged.
          total_price: o.grand_total ?? o.total_price,
          order_date: o.order_date || o.created_at,
        })}.`;
      }
    }

    const emailMatch = message.match(EMAIL_RE);
    const orderNoMatch = message.match(ORDER_NO_RE);
    if (!emailMatch && !orderNoMatch) return "";

    const fd = new URLSearchParams();
    if (orderNoMatch) fd.set("order_no", orderNoMatch[1]);
    else if (emailMatch) fd.set("email", emailMatch[0]);

    const res = await fetch(`${API_BASE}order/lookup`, { method: "POST", body: fd, cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (data?.status && data?.data?.orders?.length) {
      const lines = data.data.orders.map(summarizeOrder).join("; ");
      return `\nOrders found for the customer's reference: ${lines}.`;
    }
    return "\nThe customer asked about an order but none was found for the order number/email they gave — ask them to double-check it, or offer to connect them to Pixovo support.";
  } catch {
    return "";
  }
}

async function getCatalogText(): Promise<string> {
  const now = Date.now();
  if (_catalogText && now - _catalogAt < CATALOG_TTL) return _catalogText;
  if (!API_BASE) return "";

  try {
    const res = await fetch(`${API_BASE}template/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: 1, limit: 20, search: "" }),
      cache: "no-store",
    });
    if (!res.ok) return _catalogText;
    const data = await res.json().catch(() => null);
    const records: any[] = data?.data?.records || data?.records || [];
    if (!records.length) return _catalogText;

    const lines = records.slice(0, 12).map((t) => {
      const base = Number(t.base_price) || 0;
      const sizes = Array.isArray(t.sizes)
        ? t.sizes
            .map((s: any) => {
              const from = Math.round((base + (Number(s.price) || 0)) * 100) / 100;
              return `${normalizeSize(s.size_name)} from $${from.toFixed(2)}`;
            })
            .join(", ")
        : "";
      const pages = `${Number(t.min_page) || 20}-${Number(t.max_page) || 100} pages`;
      return `- ${t.template_name || "Album"}: ${sizes || "various sizes"}; ${pages}.`;
    });

    _catalogText = `Live catalog (real prices, includes the minimum page count):\n${lines.join("\n")}`;
    _catalogAt = now;
    return _catalogText;
  } catch {
    return _catalogText;
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      reply:
        "I'm not fully connected yet — but you can still tap the buttons above and I'll build your album! 🎨",
    });
  }

  try {
    const { message, context, orderId } = await req.json();
    const messageText = String(message ?? "");
    const contextLine =
      context && Object.keys(context).length
        ? `\nThe customer's current order so far: ${JSON.stringify(context)}.`
        : "";

    const catalogText = await getCatalogText();
    const catalogBlock = catalogText ? `\n\n${catalogText}` : "";
    const orderLine = await getOrderFactsLine(orderId, messageText);

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        max_tokens: 400,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + catalogBlock + contextLine + orderLine },
          { role: "user", content: messageText },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[pixie] Groq error", res.status, detail);
      return NextResponse.json({
        reply: "Sorry, I had trouble thinking just now — please try again in a moment.",
      });
    }

    const data = await res.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Hmm, I'm not sure how to answer that — could you rephrase?";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[pixie] route error", err);
    return NextResponse.json({
      reply: "Something went wrong on my end. Please try again.",
    });
  }
}
