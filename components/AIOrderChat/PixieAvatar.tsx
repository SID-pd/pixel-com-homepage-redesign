"use client";

import styles from "./AIOrderChat.module.css";
import { PIXIE_THEME } from "./theme";

interface Props {
  /** Class applied to the <img> when theme.avatarIcon is set. Defaults to filling a square/rounded parent. */
  imgClassName?: string;
}

/** Renders theme.ts's avatarIcon image if set, else the default "✦" glyph — used everywhere Pixie's face shows up (bubbles, header, welcome screen, launcher). */
export default function PixieAvatar({ imgClassName = styles.avatarImg }: Props) {
  if (PIXIE_THEME.avatarIcon) {
    return <img src={PIXIE_THEME.avatarIcon} alt="" className={imgClassName} />;
  }
  return <span className={styles.avatarSpark}>✦</span>;
}
