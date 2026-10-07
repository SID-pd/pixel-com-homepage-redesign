const STRAPI_API_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

import { get, removeEncrypted } from "./storage";
import Router from "next/router";
import { toastError, toastWarning, toastInfo } from "./common";

interface ApiOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  token?: string;
}

export async function apiCall<T>(endpoint: string, { method = "GET", body, headers = {}, token }: ApiOptions = {}): Promise<T> {
  const reqHeaders: Record<string, string> = { ...headers };

  if (!(body instanceof FormData)) {
    reqHeaders["Content-Type"] = "application/json";
  }

  if (STRAPI_API_TOKEN) {
    reqHeaders["Authorization"] = `Bearer ${STRAPI_API_TOKEN}`;
  }

  const localToken = get<any>("user");
  if (localToken?.token) {
    reqHeaders["Authorization"] = `Bearer ${localToken.token}`;
  }

  if (token) {
    reqHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    method,
    headers: reqHeaders,
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  return handleApiResponse(res) as Promise<T>;
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

export const getPageBySlug = async (): Promise<any> => {
  try {
    const url = `${STRAPI_URL}/pages?populate=*`;
    console.log("Fetching from Strapi:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(STRAPI_API_TOKEN && {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.data && data.data.length > 0) {
      return data.data[0];
    }

    return null;
  } catch (err) {
    console.error("Error fetching page from Strapi:", err);
    return null;
  }
};

export const getPageBySlugParam = async (slug: string): Promise<any> => {
  try {
    const url = `${STRAPI_URL}/pages?filters[slug][$eq]=${slug}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(STRAPI_API_TOKEN && {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        }),
      },
    });

    return handleApiResponse(response) as Promise<any>;
  } catch (err) {
    console.error("Error fetching page from Strapi:", err);
    return null;
  }
};

export const getAllPages = async (): Promise<any[]> => {
  try {
    const url = `${STRAPI_URL}/pages?populate=*`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(STRAPI_API_TOKEN && {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      return data.data;
    }

    return [];
  } catch (err) {
    console.error("Error fetching pages from Strapi:", err);
    return [];
  }
};

export const testStrapiConnection = async (): Promise<boolean> => {
  try {
    const url = `${STRAPI_URL}/pages`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(STRAPI_API_TOKEN && {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        }),
      },
    });

    if (response.ok) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.error("Strapi connection error:", err);
    return false;
  }
};

function handleApiResponse(res: Response): Promise<any> {
  switch (res.status) {
    case 200:
    case 201:
      return res.json();

    case 400:
      return res.json().then((data) => {
        toastError(data.message || "Bad Request");
        throw new Error(data.message || "Bad Request");
      });

    case 401:
      removeEncrypted("user");
      toastWarning("Unauthorized. Please log in again.");
      window.location.href = "/";
      throw new Error("Unauthorized. Please log in again.");

    case 403:
      toastError("You don't have login to access this resource.");
      throw new Error("You don't have login to access this resource.");

    case 404:
      toastInfo("Not Found. The requested resource does not exist.");
      throw new Error("Not Found. The requested resource does not exist.");

    case 500:
      toastError("Internal Server Error. Please try again later.");
      throw new Error("Internal Server Error. Please try again later.");

    default:
      return res.json().catch(() => {
        toastError(`Unexpected Error: ${res.status}`);
        throw new Error(`Unexpected Error: ${res.status}`);
      });
  }
}
