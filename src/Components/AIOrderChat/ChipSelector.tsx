"use client";

import styles from "./AIOrderChat.module.css";
import { ChipOption } from "./types";

interface Props {
  chips: ChipOption[];
  disabled?: boolean;
  onSelect: (chip: ChipOption) => void;
}

/** Quick-reply pill buttons shown under a bot prompt. */
export default function ChipSelector({ chips, disabled, onSelect }: Props) {
  return (
    <div className={styles.chips}>
      {chips.map((chip) => (
        <button
          key={chip.value}
          type="button"
          className={styles.chip}
          disabled={disabled}
          onClick={() => onSelect(chip)}
        >
          <span>{chip.label}</span>
          {chip.priceLabel && <span className={styles.chipPrice}>{chip.priceLabel}</span>}
        </button>
      ))}
    </div>
  );
}
