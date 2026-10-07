import { apiPost } from "./api-service";
import { get, set, removeEncrypted } from "./storage";

export type ActiveUser = {
  _id: string;
  token?: string;
  email?: string;
  type?: string;
  [key: string]: any;
};

// Returns the active identity (real user wins; otherwise existing guest).
export const getActiveUser = (): ActiveUser | null => {
  return get<ActiveUser>("user") || get<ActiveUser>("guest_user");
};

// Ensure a guest identity exists; creates one on the server if needed.
// Stored under "guest_user" so the header/AuthGuard (which key off "user")
// continue to treat guests as logged-out.
export const ensureGuestUser = async (): Promise<ActiveUser | null> => {
  const existing = getActiveUser();
  if (existing && existing._id) return existing;

  const fd = new FormData();
  fd.append("image_type", "guest");

  try {
    const res = await apiPost<any>("guest-register", fd);
    if (res?.status && res?.data?.id) {
      const guest: ActiveUser = {
        _id: res.data.id,
        token: res.data.token,
        email: res.data.email,
        type: "guest",
      };
      set("guest_user", guest);
      return guest;
    }
  } catch (err) {
    console.error("ensureGuestUser failed:", err);
  }
  return null;
};


export const claimGuestSessionIfAny = async (): Promise<void> => {
  const guest = get<ActiveUser>("guest_user");
  if (!guest?._id) return;
  try {
    await apiPost<any>("order/claim-guest", { guest_user_id: guest._id });
  } catch (err) {
    console.error("claimGuestSessionIfAny failed:", err);
  } finally {
    // Always drop the guest identity locally — the real user is in charge now.
    removeEncrypted("guest_user");
  }
};