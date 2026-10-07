const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
import { get, removeEncrypted } from "./storage";
import { toastError, toastWarning, toastInfo } from "./common";

interface ApiOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  token?: string;
}

// Thrown only for the "stale guest token" 401 case (see handleApiResponse) —
// distinguishes it from every other error so apiCall can retry exactly that
// case and nothing else.
class StaleGuestSessionError extends Error {}

export async function apiCall<T>(endpoint: string, { method = "GET", body, headers = {}, token }: ApiOptions = {}, _isRetry = false): Promise<T> {
  const reqHeaders: Record<string, string> = { ...headers };

  if (!(body instanceof FormData)) {
    reqHeaders["Content-Type"] = "application/json";
  }

  // guest user token is used for cart operations, so we need to include it in the headers if available
  const localToken = get<any>("user") || get<any>("guest_user");
  if (localToken?.token) {
    reqHeaders["Authorization"] = `Bearer ${localToken.token}`;
  }

  // Hard timeout so a hung/unresponsive backend can never freeze the caller (and
  // any loader it's holding open) indefinitely. Without this, `await fetch` never
  // settles when the server stops responding, leaving the checkout stuck on
  // "Loading..." forever. On timeout we abort, which rejects here and flows to the
  // caller's catch/finally so the loader clears and the user can retry.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: reqHeaders,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      toastError("The server took too long to respond. Please try again.");
      throw new Error(`Request timed out: ${endpoint}`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  try {
    return (await handleApiResponse(res)) as T;
  } catch (err) {
    // A guest's JWT expiring mid-session used to just dead-end every call that
    // hit it (state_tax/list, order/apply-promotion, ...) with a toast the
    // caller had to notice and manually retry — the same underlying cause
    // behind several "clear localStorage and reload" fixes this session.
    // Minting a fresh guest and replaying the SAME request once, transparently,
    // means a real user never has to see or recover from this themselves.
    if (err instanceof StaleGuestSessionError && !_isRetry) {
      const { ensureGuestUser } = await import("./guest");
      const fresh = await ensureGuestUser();
      if (fresh) {
        return apiCall<T>(endpoint, { method, body, headers, token }, true);
      }
    }
    throw err;
  }
}

export function apiGet<T>(endpoint: string, options: Omit<ApiOptions, "method" | "body"> = {}) {
  return apiCall<T>(endpoint, { ...options, method: "GET" });
}

export function apiPost<T>(endpoint: string, body: any, options: Omit<ApiOptions, "method" | "body"> = {}) {
  return apiCall<T>(endpoint, { ...options, method: "POST", body });
}

export function apiDelete<T>(endpoint: string, options: Omit<ApiOptions, "method" | "body"> = {}) {
  return apiCall<T>(endpoint, { ...options, method: "DELETE" });
}


function handleApiResponse(res: Response): Promise<any> {
  switch (res.status) {
    case 200:
    case 201:
      return res.json();

    case 400:
      return res.json().then((data) => {
        console.error("[API 400]", res.url, data.message || data.detail || "(no message in response body)");
        toastError(data.message || "Bad Request");
        throw new Error(data.message || "Bad Request");
      });

    case 401: {
      const hasRealUser = !!get<any>("user");
      const hasGuestUser = !!get<any>("guest_user");
      console.error("[API 401]", res.url, { hasRealUser, hasGuestUser });
      if (!hasRealUser && hasGuestUser) {
        // Stale guest token — drop only the guest identity (and legacy temp_id)
        // so the next ensureGuestUser() mints a fresh one. No toast, no redirect;
        // apiCall() catches this specific error type and retries the request once.
        removeEncrypted("guest_user");
        localStorage.removeItem("temp_id");
        throw new StaleGuestSessionError("Guest session refreshed. Please retry.");
      }
      removeEncrypted("user");
      // localStorage.clear();
      toastWarning("Unauthorized. Please log in again.");
      window.location.href = "/";
      throw new Error("Unauthorized. Please log in again.");
    }

    case 403:
      return res.json().catch(() => null).then((data) => {
        console.error("[API 403]", res.url, data?.detail || data?.message || "(no detail in response body)");
        toastError("You don't have login to access this resource.");
        throw new Error("You don't have login to access this resource.");
      });

    case 404:
      toastInfo("Not Found. The requested resource does not exist.");
      throw new Error("Not Found. The requested resource does not exist.");

    case 500:
      return res.json().catch(() => null).then((data) => {
        const detail = data?.errors?.detail || data?.message;
        console.error("[API 500]", res.url, detail || "(no detail in response body)");
        toastError(detail || "Internal Server Error. Please try again later.");
        throw new Error(detail || "Internal Server Error. Please try again later.");
      });

    default:
      return res.json().catch(() => {
        toastError(`Unexpected Error: ${res.status}`);
        throw new Error(`Unexpected Error: ${res.status}`);
      });
  }
}