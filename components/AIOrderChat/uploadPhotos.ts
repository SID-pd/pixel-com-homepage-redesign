// Fast, parallel, per-photo upload for the chat widget — ports step3.tsx's
// XHR upload pattern (see uploadFile/handleFiles there) so Pixie's photo
// upload feels as instant as the regular website's, instead of blocking on
// one giant multipart POST. Each photo lands via image/add|temp-add (the
// SAME endpoints step3.tsx uses) as soon as it's picked, in batches of 3, with
// live per-photo progress — the slow AI work then only runs afterward, on
// these already-uploaded photos' ids (see buildAlbum.ts's image_ids param).
//
// Takes `identity` as a parameter everywhere rather than resolving it itself,
// so it can never mint a second, divergent guest mid-batch — see
// resolveIdentity() in buildAlbum.ts, which must be called once up front.

import type { ChatIdentity } from "./buildAlbum";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export type UploadStatus = "pending" | "uploading" | "done" | "failed";

export interface UploadItem {
  file: File;
  /** Instant local preview — never re-fetched from the server. */
  previewUrl: string;
  status: UploadStatus;
  progress: number;
  /** Mongo _id, set once the upload completes successfully. */
  id?: string;
  width?: number;
  height?: number;
}

export interface SinglePhotoUploadResult {
  ok: boolean;
  id?: string;
  width?: number;
  height?: number;
}

/** Uploads one photo via image/add (real user) or image/temp-add (guest) —
 * same URL/auth branching and progress math as step3.tsx's uploadFile(). */
export function uploadOnePhoto(
  file: File,
  identity: ChatIdentity,
  onProgress: (pct: number) => void
): Promise<SinglePhotoUploadResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const url = !identity.isGuest ? `${API_BASE}image/add` : `${API_BASE}image/temp-add`;

    let lastUpdateTime = 0;
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const now = Date.now();
      if (now - lastUpdateTime < 200) return;
      lastUpdateTime = now;
      onProgress((event.loaded / event.total) * 100);
    };

    xhr.onload = () => {
      let responseData: any = {};
      try {
        responseData = JSON.parse(xhr.responseText);
      } catch {
        // fall through to the failure branch below
      }
      const inserted = responseData?.data?.inserted?.[0];
      if (xhr.status >= 200 && xhr.status < 300 && inserted) {
        resolve({ ok: true, id: inserted._id, width: inserted.width, height: inserted.height });
      } else {
        resolve({ ok: false });
      }
    };
    xhr.onerror = () => resolve({ ok: false });

    xhr.open("POST", url, true);
    if (!identity.isGuest && identity.token) {
      xhr.setRequestHeader("Authorization", `Bearer ${identity.token}`);
    }

    const formData = new FormData();
    formData.append("image_type", "computer");
    formData.append("user_id", identity.id);
    formData.append("images", file);
    xhr.send(formData);
  });
}

/** Uploads `items` 3-at-a-time in parallel (same batching as step3.tsx's
 * handleFiles/startUpload), calling `onItemUpdate` as each one's status,
 * progress, or result changes. */
export async function uploadPhotosInBatches(
  items: UploadItem[],
  identity: ChatIdentity,
  onItemUpdate: (index: number, patch: Partial<UploadItem>) => void,
  batchSize = 3
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (item, j) => {
        const index = i + j;
        onItemUpdate(index, { status: "uploading", progress: 0 });
        const result = await uploadOnePhoto(item.file, identity, (pct) =>
          onItemUpdate(index, { progress: pct })
        );
        if (result.ok) {
          onItemUpdate(index, {
            status: "done",
            progress: 100,
            id: result.id,
            width: result.width,
            height: result.height,
          });
        } else {
          onItemUpdate(index, { status: "failed" });
        }
      })
    );
  }
}
