// src/lib/contact-email-api.ts
// The email the app uses to reach me (separate from the "email" in my profile), and its confirmation by code.
import { apiRequest, jsonInit } from "@/lib/api";

// Where I stand (ContactEmailDto):
//   email null                 nothing saved yet -> the email form
//   email set, verified false  saved, not confirmed -> the code step
//   verified true              confirmed -> the app opens
// expiresInSeconds: how long the current code still works (0 = no working code).
// resendInSeconds: how long until a new code can be asked (0 = now). Both are counted by the server.
export interface ContactEmailState {
  email: string | null;
  verified: boolean;
  expiresInSeconds: number;
  resendInSeconds: number;
}

export async function fetchContactEmail(): Promise<ContactEmailState> {
  const res = await apiRequest("/api/contact-email");
  return res.json();
}

// Saves the email and mails a code to it (nothing is sent when it is already verified).
// The backend answers 400 with its own message for a bad email, a domain that cannot receive mail, or too many codes.
export async function saveContactEmail(email: string): Promise<ContactEmailState> {
  const res = await apiRequest("/api/contact-email", jsonInit("PUT", { email }));
  return res.json();
}

// A new code for the saved email (the old one stops working). The server makes me wait 60 seconds between codes.
export async function resendContactEmailCode(): Promise<ContactEmailState> {
  const res = await apiRequest("/api/contact-email/resend", jsonInit("POST", {}));
  return res.json();
}

// Sends the typed 6 digits. Right: resolves. Wrong, expired or out of tries: throws with the backend's message.
export async function verifyContactEmail(code: string): Promise<void> {
  await apiRequest("/api/contact-email/verify", jsonInit("POST", { code }));
}
