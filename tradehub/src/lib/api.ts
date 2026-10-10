import type { AuthResponse } from "@/app/auth/auth";
import { getAccessToken, refreshSession } from "./auth-store";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// Error bodies come in three shapes:
//   { message }           from the global exception handler
//   { errors: {f: msg} }  from model validation (first message is shown)
//   plain text            from AuthController / ImagesController BadRequest/Unauthorized
async function readError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    if (typeof json.message === "string") return json.message;
    if (json.errors && typeof json.errors === "object") {
      const first = Object.values(json.errors)[0];
      if (typeof first === "string") return first;
    }
    return json.title ?? json.detail ?? text;
  } catch {
    return text || `Request failed (${res.status})`;
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: "POST",
      credentials: "include", // lets the browser accept/send the refresh cookie
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // fetch only throws on network/CORS failure, not on 4xx/5xx
    throw new Error("Can't reach the server. Is the backend running?");
  }
  if (!res.ok) throw new Error(await readError(res));
  return res.status === 204 ? (undefined as T) : res.json();
}

export const authApi = {
  register: (data: unknown) => post<AuthResponse>("/api/auth/register", data),
  login: (data: unknown) => post<AuthResponse>("/api/auth/login", data),
  logout: () => post<void>("/api/auth/logout", {}),
};

// Every protected endpoint calls this: attaches the token,
// and on a 401 refreshes once and retries.
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const send = () =>
    fetch(`${BASE}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...init.headers,
        ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
      },
    });

  let res = await send();
  if (res.status === 401 && (await refreshSession())) res = await send();
  return res;
}

// The request used by the feature api files (store-api, posts-api):
// authFetch, plus a readable message for a network failure,
// plus an Error carrying the backend's own message for a 4xx/5xx.
export async function apiRequest(path: string, init: RequestInit = {}): Promise<Response> {
  let res: Response;
  try {
    res = await authFetch(path, init);
  } catch {
    throw new Error("Can't reach the server. Is the backend running?");
  }
  if (!res.ok) throw new Error(await readError(res));
  return res;
}

// Request options for a call that sends a JSON body.
export const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// Uploads one image through the backend (which talks to Cloudinary) and returns its URL.
// The form field must be named "file" to match the controller parameter.
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  let res: Response;
  try {
    // No Content-Type header here: the browser sets multipart/form-data with the boundary itself.
    res = await authFetch("/api/images", { method: "POST", body: form });
  } catch {
    throw new Error("Can't reach the server. Is the backend running?");
  }
  if (!res.ok) throw new Error(await readError(res));

  const data = (await res.json()) as { url: string };
  return data.url;
}
