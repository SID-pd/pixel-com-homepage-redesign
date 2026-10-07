"use client";

import { useState } from "react";
import styles from "./AIOrderChat.module.css";
import { ChipOption } from "./types";

interface Props {
  sizes: ChipOption[];
  pages: ChipOption[];
  covers: ChipOption[];
  disabled?: boolean;
  onSubmit: (selection: { size: ChipOption; pages: ChipOption; cover: ChipOption }) => void;
}

/**
 * Size, pages and cover type as pill chips (same look as the occasion picker)
 * grouped into one box with sensible defaults pre-selected — one "Continue"
 * click instead of separate chip-message round trips.
 */
export default function ProductOptionsForm({ sizes, pages, covers, disabled, onSubmit }: Props) {
  // Defaults to the middle size (e.g. 10x10) when there are 3+, matching the
  // studio's own default — otherwise falls back to the first option.
  const [size, setSize] = useState(sizes[Math.min(1, sizes.length - 1)] ?? sizes[0]);
  const [pageCount, setPageCount] = useState(pages[0]);
  // Default to Hardcover, matching the studio's default (see step1.tsx).
  const [cover, setCover] = useState(covers[0]);

  const renderChips = (
    options: ChipOption[],
    selected: ChipOption,
    onPick: (opt: ChipOption) => void
  ) => (
    <div className={styles.comboChipRow}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`${styles.chip} ${selected?.value === opt.value ? styles.chipActive : ""}`}
          disabled={disabled}
          onClick={() => onPick(opt)}
        >
          <span>{opt.label}</span>
          {opt.priceLabel && <span className={styles.chipPrice}>{opt.priceLabel}</span>}
        </button>
      ))}
    </div>
  );

  return (
    <div className={styles.comboWrap}>
      <div className={styles.comboBox}>
        <div className={styles.comboSection}>
          <span className={styles.comboLabel}>Album size</span>
          {renderChips(sizes, size, setSize)}
        </div>
        <div className={styles.comboSection}>
          <span className={styles.comboLabel}>Number of pages</span>
          {renderChips(pages, pageCount, setPageCount)}
        </div>
        <div className={styles.comboSection}>
          <span className={styles.comboLabel}>Cover type</span>
          {renderChips(covers, cover, setCover)}
        </div>
      </div>
      <button
        type="button"
        className={styles.comboContinue}
        disabled={disabled}
        onClick={() => onSubmit({ size, pages: pageCount, cover })}
      >
        Continue →
      </button>
    </div>
  );
}
