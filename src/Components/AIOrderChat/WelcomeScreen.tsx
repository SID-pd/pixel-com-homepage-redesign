"use client";

import styles from "./AIOrderChat.module.css";
import { Catalog, SuggestedQuestion } from "./types";
import PixieAvatar from "./PixieAvatar";

interface Props {
  catalog: Catalog | null;
  questions: SuggestedQuestion[];
  /** Whether a previous conversation is saved (enables the "Continue" button). */
  hasSavedChat: boolean;
  onStart: () => void;
  onContinue: () => void;
  onAsk: (question: string) => void;
}

/**
 * Intro view shown before the conversation begins — branding, a "start"
 * call-to-action, and clickable starter questions that jump straight into a
 * real-data answer. Replaces the old behaviour of dumping the greeting (which
 * could clip the first line on shorter viewports).
 */
export default function WelcomeScreen({
  catalog,
  questions,
  hasSavedChat,
  onStart,
  onContinue,
  onAsk,
}: Props) {
  const fromPrice = catalog?.fromPrice;

  return (
    <div className={styles.welcome}>
      <div className={styles.welcomeHero}>
        <div className={styles.welcomeIcon} aria-hidden>
          <PixieAvatar />
        </div>
        <h3 className={styles.welcomeTitle}>Hi, I&apos;m Pixie</h3>
        <p className={styles.welcomeSubtitle}>
          Your Pixovo photo-album assistant. Design a custom album in under a
          minute{fromPrice ? <> — starting from <strong>${fromPrice.toFixed(2)}</strong></> : null}, or
          ask me anything.
        </p>
      </div>

      {hasSavedChat ? (
        <div className={styles.startGroup}>
          <button type="button" className={styles.startBtn} onClick={onContinue}>
            <span>Continue your chat</span>
            <span className={styles.startArrow} aria-hidden>
              →
            </span>
          </button>
          <button type="button" className={styles.startGhost} onClick={onStart}>
            Start a new conversation
          </button>
        </div>
      ) : (
        <button type="button" className={styles.startBtn} onClick={onStart}>
          <span>Start Conversation</span>
          <span className={styles.startArrow} aria-hidden>
            →
          </span>
        </button>
      )}

      <div className={styles.suggestBlock}>
        <span className={styles.suggestLabel}>Popular questions</span>
        <div className={styles.suggestList}>
          {questions.map((q) => (
            <button
              key={q.text}
              type="button"
              className={styles.suggestItem}
              onClick={() => onAsk(q.text)}
            >
              <span className={styles.suggestIcon} aria-hidden>
                {q.icon}
              </span>
              <span>{q.text}</span>
              <span className={styles.suggestChevron} aria-hidden>
                ›
              </span>
            </button>
          ))}
        </div>
      </div>

      
    </div>
  );
}
