"use client";

import styles from "./LoadingText.module.css";

/**
 * Global app loader — four brand-coloured dots (Pixovo's logo palette: teal,
 * sky, amber, rose) orbiting a centre with a staggered pulse, on a frosted
 * cream backdrop. Playful but professional; on-brand with the homepage.
 */
const LoadingText = () => {
  return (
    <div
      className={styles.loader}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className={styles.spinner}>
        <span className={`${styles.dot} ${styles.dot1}`} />
        <span className={`${styles.dot} ${styles.dot2}`} />
        <span className={`${styles.dot} ${styles.dot3}`} />
        <span className={`${styles.dot} ${styles.dot4}`} />
      </div>
      <p className={styles.label}>
        Loading<span className={styles.dots} />
      </p>
    </div>
  );
};

export default LoadingText;
