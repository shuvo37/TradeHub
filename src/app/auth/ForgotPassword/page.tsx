"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import AuthShell from "../AuthShell";
import PasswordInput from "../PasswordInput";
import { TextField } from "../FormField";
import { confirmPasswordReset, requestPasswordReset, type PasswordResetRequestResult } from "@/lib/password-reset-api";

type Step = "name" | "reset" | "done";

const CODE_LENGTH = 6;

// The server counts the seconds; the browser turns them into a point in time and counts down from it
const deadlinesOf = (r: PasswordResetRequestResult) => {
  const now = Date.now();
  return { expiresAt: now + r.expiresInSeconds * 1000, resendAt: now + r.resendInSeconds * 1000 };
};
const secondsLeft = (at: number, now: number) => Math.max(0, Math.ceil((at - now) / 1000));
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

const mainButton =
  "w-full rounded-lg bg-[#E8A33D] py-2.5 text-sm font-semibold text-[#16231F] transition hover:bg-[#C97F1E] disabled:opacity-60";
const linkButton =
  "text-sm font-medium text-[#4B5D57] underline underline-offset-2 transition hover:text-[#16231F] disabled:opacity-60 disabled:no-underline";

// Three steps on one page:
//   name   type the unique name; a 6-digit code is mailed to the confirmed email of that account
//   reset  type the code and a new password (the code works 2 minutes, wrong tries are limited)
//   done   the password was changed; log in with it
// The server answers step 1 the same way whether the account exists or not, so this page says
// "if this account has a confirmed email" and never "no such account".
export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("name");
  const [uniqueName, setUniqueName] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"request" | "confirm" | null>(null);
  const [deadlines, setDeadlines] = useState({ expiresAt: 0, resendAt: 0 });
  const [now, setNow] = useState(() => Date.now());

  // One tick per second while the code step is open, for the two countdowns
  useEffect(() => {
    if (step !== "reset") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [step]);

  // Asks the server for a code (first time and "Resend code" both use it). The typed name is kept on failure.
  async function sendCode(): Promise<boolean> {
    setError(null);
    const name = uniqueName.trim();
    if (!name) {
      setError("Enter your unique name.");
      return false;
    }
    setBusy("request");
    try {
      const result = await requestPasswordReset(name);
      setDeadlines(deadlinesOf(result));
      setNow(Date.now());
      setCode("");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function handleRequest(e: FormEvent) {
    e.preventDefault();
    if (await sendCode()) setStep("reset");
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (code.length !== CODE_LENGTH) {
      setError(`Enter the ${CODE_LENGTH}-digit code.`);
      return;
    }
    if (!newPassword) {
      setError("Enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setBusy("confirm");
    try {
      await confirmPasswordReset({ uniqueName: uniqueName.trim(), code, newPassword });
      setStep("done");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  function changeName() {
    setError(null);
    setCode("");
    setStep("name");
  }

  const expiresLeft = secondsLeft(deadlines.expiresAt, now);
  const resendLeft = secondsLeft(deadlines.resendAt, now);
  const working = busy !== null;

  const loginLink = (
    <>
      Remembered it?{" "}
      <Link href="/auth/Login" className="font-medium text-[#FBF7EE] underline underline-offset-2">
        Back to login
      </Link>
    </>
  );

  if (step === "done") {
    return (
      <AuthShell
        title="Password changed"
        subtitle="Your password was changed. Log in with the new one."
        footer={loginLink}
      >
        <Link
          href="/auth/Login"
          className="block w-full rounded-lg bg-[#E8A33D] py-2.5 text-center text-sm font-semibold text-[#16231F] transition hover:bg-[#C97F1E]"
        >
          Go to login
        </Link>
      </AuthShell>
    );
  }

  if (step === "reset") {
    return (
      <AuthShell
        title="Set a new password"
        subtitle="If this account has a confirmed email, we sent a 6-digit code to it. Type it below with your new password."
        footer={loginLink}
      >
        <form onSubmit={handleConfirm} noValidate className="space-y-5">
          <p className="text-sm text-[#4B5D57]">
            Account: <span className="font-semibold text-[#16231F]">{uniqueName.trim()}</span>
          </p>

          <div>
            <label htmlFor="reset-code" className="mb-1.5 block text-sm font-medium text-[#16231F]">
              Code
            </label>
            <input
              id="reset-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={CODE_LENGTH}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
              disabled={working}
              className="w-full rounded-lg border border-[#E3DCC8] bg-white px-3.5 py-2.5 text-center text-lg font-semibold tracking-[0.4em] text-[#16231F] outline-none transition placeholder:text-[#4B5D57]/50 focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/25 disabled:opacity-60"
            />
            <p className="mt-1.5 text-xs text-[#4B5D57]">
              {expiresLeft > 0 ? `Code expires in ${clock(expiresLeft)}` : "The code has expired. Send a new one."}
            </p>
          </div>

          <PasswordInput
            id="newPassword"
            label="New password"
            placeholder="Your new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <PasswordInput
            id="confirmNewPassword"
            label="Confirm new password"
            placeholder="Repeat the new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />

          {error && <p className="text-sm text-[#C1483B]">{error}</p>}

          <button type="submit" disabled={working} className={mainButton}>
            {busy === "confirm" ? "Changing password..." : "Change password"}
          </button>

          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={changeName} disabled={working} className={linkButton}>
              Change unique name
            </button>
            <button
              type="button"
              onClick={sendCode}
              disabled={working || resendLeft > 0}
              className={linkButton}
            >
              {busy === "request" ? "Sending..." : resendLeft > 0 ? `Resend code (${resendLeft}s)` : "Resend code"}
            </button>
          </div>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your unique name. We will email a code to the confirmed email of your account."
      footer={loginLink}
    >
      <form onSubmit={handleRequest} noValidate className="space-y-5">
        <TextField
          id="uniqueName"
          label="Unique name"
          placeholder="e.g. mehedi_7K2"
          value={uniqueName}
          onChange={(e) => setUniqueName(e.target.value)}
          autoComplete="username"
          disabled={working}
        />

        {error && <p className="text-sm text-[#C1483B]">{error}</p>}

        <button type="submit" disabled={working} className={mainButton}>
          {busy === "request" ? "Sending code..." : "Send code"}
        </button>
      </form>
    </AuthShell>
  );
}
