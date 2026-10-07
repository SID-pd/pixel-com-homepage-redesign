"use client";

import styles from "./AIOrderChat.module.css";
import { OrderDraft } from "./types";
import { formatPrice, quoteTotal } from "./flow";

interface Props {
  draft: OrderDraft;
}

/** Sticky live-price summary that fills in as the order takes shape. */
export default function QuotePanel({ draft }: Props) {
  const hasAnything = draft.occasion || draft.size || draft.pages || draft.cover;
  if (!hasAnything) return null;

  return (
    <div className={styles.quote}>
      <div className={styles.quoteRows}>
        {draft.occasion && (
          <span className={styles.quoteTag}>{draft.occasion}</span>
        )}
        {draft.size && <span className={styles.quoteTag}>{draft.size.replace("x", "×")}</span>}
        {draft.pages && <span className={styles.quoteTag}>{draft.pages} pages</span>}
        {draft.cover && <span className={styles.quoteTag}>{draft.cover}</span>}
      </div>
      <div className={styles.quoteTotal}>
        <span>Estimated</span>
        <strong>{formatPrice(quoteTotal(draft))}</strong>
      </div>
    </div>
  );
}
