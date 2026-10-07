import { openDB } from "idb";
let dbPromise: any;

export const getDb = async () => {
  if (typeof window === "undefined") return null; 
  if (!dbPromise) {
    dbPromise = openDB("pdf-storage", 1, {
      upgrade(db) {
        db.createObjectStore("pdfs");
      },
    });
  }
  return dbPromise;
};

export const savePDF = async (filename: string, blob: Blob) => {
  const db = await getDb();
  if (!db) return; 
  await db.put("pdfs", blob, filename);
};

export const getPDF = async (filename: string): Promise<Blob | null> => {
  const db = await getDb();
  if (!db) return null; 
  return (await db.get("pdfs", filename)) || null;
};


export async function getDBImages() {
  return openDB("AlbumDB", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("albums")) {
        db.createObjectStore("albums");
      }
    },
  });
}

//===// Save full array //===//
export async function saveAlbum(key: string, value: any) {
  const db = await getDBImages();
  await db.put("albums", value, key); 
}

//===// Get full array //===//
export async function getAlbum(key: string) {
  const db = await getDBImages();
  return db.get("albums", key);
}

export async function clearAlbums() {
  const db = await getDBImages();
  await db.clear("albums");
}
