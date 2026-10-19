// src/lib/password-reset-api.ts
// "Forgot password": no login is needed, so these calls carry no token.
import { apiRequest, jsonInit } from "@/lib/api";

// The answer is the same for every unique name (known or not), so the screen can never reveal anything about an account.
// The numbers are the server's fixed rules: how long the code works, and how long until a new one can be asked.
export interface PasswordResetRequestResult {
  expiresInSeconds: number;
  resendInSeconds: number;
}

// Step 1: a 6-digit code is mailed to the confirmed email of the account (if it has one).
export async function requestPasswordReset(uniqueName: string): Promise<PasswordResetRequestResult> {
  const res = await apiRequest("/api/auth/password-reset/request", jsonInit("POST", { uniqueName }));
  return res.json();
}

// Step 2: the code and the new password. Right: resolves. Wrong, expired or out of tries: throws with the backend's message.
export async function confirmPasswordReset(data: {
  uniqueName: string;
  code: string;
  newPassword: string;
}): Promise<void> {
  await apiRequest("/api/auth/password-reset/confirm", jsonInit("POST", data));
}
