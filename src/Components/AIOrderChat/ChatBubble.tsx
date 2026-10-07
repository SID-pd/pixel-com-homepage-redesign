"use client";

import styles from "./AIOrderChat.module.css";
import { ChatMessage } from "./types";
import PixieAvatar from "./PixieAvatar";

interface Props {
  message: ChatMessage;
}

function BotAvatar() {
  return (
    <div className={styles.avatar} aria-hidden>
      <PixieAvatar />
    </div>
  );
}

/** Renders a single bot/user message bubble, or the animated typing dots. */
export default function ChatBubble({ message }: Props) {
  const isBot = message.sender === "bot";

  if (message.kind === "typing") {
    return (
      <div className={`${styles.row} ${styles.rowBot}`}>
        <BotAvatar />
        <div className={`${styles.bubble} ${styles.bubbleBot} ${styles.typing}`}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      </div>
    );
  }

  if (message.kind === "photos" && message.photos?.length) {
    return (
      <div className={`${styles.row} ${isBot ? styles.rowBot : styles.rowUser}`}>
        {isBot && <BotAvatar />}
        <div className={`${styles.bubble} ${isBot ? styles.bubbleBot : styles.bubbleUser} ${styles.photosBubble}`}>
          {message.photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <div key={i} className={styles.thumb}>
              <img src={src} alt={isBot ? "Album cover preview" : `Uploaded photo ${i + 1}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.row} ${isBot ? styles.rowBot : styles.rowUser}`}>
      {isBot && <BotAvatar />}
      <div className={`${styles.bubble} ${isBot ? styles.bubbleBot : styles.bubbleUser}`}>
        {message.text}
      </div>
    </div>
  );
}
