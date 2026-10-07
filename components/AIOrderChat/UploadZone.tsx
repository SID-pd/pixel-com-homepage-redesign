"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./AIOrderChat.module.css";
import type { ChatIdentity } from "./buildAlbum";
import { uploadPhotosInBatches, type UploadItem } from "./uploadPhotos";

export interface UploadZoneResult {
  imageIds: string[];
  previewUrls: string[];
  failedCount: number;
}

interface Props {
  disabled?: boolean;
  /** Resolved once up front (see AIOrderChat.tsx) — uploads can't start until this is set. */
  identity: ChatIdentity | null;
  onConfirm: (result: UploadZoneResult) => void;
}

/** Drag-and-drop photo picker rendered inline inside the chat. Uploads each
 * photo immediately (fast, parallel, per-photo — same image/add|temp-add
 * path the regular website upload uses) instead of waiting for confirmation,
 * so the slow AI album-building step only ever runs on already-uploaded
 * photos — see uploadPhotos.ts and buildAlbum.ts's image_ids param. */
export default function UploadZone({ disabled, identity, onConfirm }: Props) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Mirrors step3.tsx's filesRef: setItems + this callback's `items.length`
  // closure can both lag behind rapid successive drops, so the true "how many
  // items exist right now" count is tracked in a ref instead.
  const itemsRef = useRef<UploadItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const updateItem = useCallback((index: number, patch: Partial<UploadItem>) => {
    setItems((prev) => {
      const updated = [...prev];
      if (!updated[index]) return prev;
      updated[index] = { ...updated[index], ...patch };
      return updated;
    });
  }, []);

  const addFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming || !identity) return;
      const imgs = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
      if (!imgs.length) return;

      const baseIndex = itemsRef.current.length;
      const newItems: UploadItem[] = imgs.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        status: "pending",
        progress: 0,
      }));
      setItems((prev) => [...prev, ...newItems]);

      uploadPhotosInBatches(newItems, identity, (localIndex, patch) =>
        updateItem(baseIndex + localIndex, patch)
      );
    },
    [identity, updateItem]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      addFiles(e.dataTransfer.files);
    },
    [addFiles, disabled]
  );

  const removeAt = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const uploadingCount = items.filter((it) => it.status === "pending" || it.status === "uploading").length;
  const doneItems = items.filter((it) => it.status === "done");
  const failedCount = items.length - doneItems.length - uploadingCount;
  const confirmDisabled = Boolean(disabled) || items.length === 0 || uploadingCount > 0 || doneItems.length === 0;

  const handleConfirmClick = () => {
    if (confirmDisabled) return;
    onConfirm({
      imageIds: doneItems.map((it) => it.id!).filter(Boolean),
      previewUrls: doneItems.map((it) => it.previewUrl),
      failedCount,
    });
  };

  return (
    <div className={styles.uploadWrap}>
      <div
        className={`${styles.dropZone} ${dragging ? styles.dropZoneActive : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
        <div className={styles.dropIcon}>⬆</div>
        <p className={styles.dropTitle}>Drag &amp; drop photos</p>
        <p className={styles.dropHint}>or click to browse — JPG / PNG / HEIC</p>
      </div>

      {items.length > 0 && (
        <>
          <div className={styles.thumbs}>
            {items.slice(0, 12).map((item, i) => (
              <div
                key={`${item.file.name}-${i}`}
                className={`${styles.thumb} ${item.status === "failed" ? styles.thumbFailed : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.previewUrl} alt={item.file.name} />
                {item.status === "failed" && <div className={styles.thumbFailedLabel}>Upload failed</div>}
                {(item.status === "pending" || item.status === "uploading") && (
                  <div className={styles.thumbProgressTrack}>
                    <div className={styles.thumbProgressFill} style={{ width: `${item.progress}%` }} />
                  </div>
                )}
                <button
                  type="button"
                  className={styles.thumbRemove}
                  onClick={() => removeAt(i)}
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
            {items.length > 12 && (
              <div className={`${styles.thumb} ${styles.thumbMore}`}>+{items.length - 12}</div>
            )}
          </div>

          <button
            type="button"
            className={styles.uploadConfirm}
            disabled={confirmDisabled}
            onClick={handleConfirmClick}
          >
            {uploadingCount > 0
              ? `Uploading ${doneItems.length}/${items.length}…`
              : `Use these ${doneItems.length} photo${doneItems.length > 1 ? "s" : ""} →`}
          </button>
        </>
      )}
    </div>
  );
}
