import CryptoJS from "crypto-js";

const SECRET_KEY = "my-secret-key-123";
const isBrowser = typeof window !== "undefined";

//===// Save encrypted //===//
export const set = (key: string, data: any) => {
    if (!isBrowser) return;

    const ciphertext = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        SECRET_KEY
    ).toString();
    localStorage.setItem(key, ciphertext);
};

//===// Get decrypted //===//
export const get = <T>(key: string): T | null => {
    if (!isBrowser) return null;

    const ciphertext = localStorage.getItem(key);
    if (!ciphertext) return null;

    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decrypted) as T;
    } catch (err) {
        console.error("Decryption error:", err);
        return null;
    }
};

//===// Remove //===//
export const removeEncrypted = (key: string) => {
    if (!isBrowser) return;

    localStorage.removeItem(key);
};
