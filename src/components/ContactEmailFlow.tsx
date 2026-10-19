// src/components/ContactEmailFlow.tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  resendContactEmailCode,
  saveContactEmail,
  verifyContactEmail,
  type ContactEmailState,
} from "@/lib/contact-email-api";

type Mode = "form" | "code" | "verified";

interface Props {
  initial: ContactEmailState; // what the server said when this screen opened
  onVerified?: () => void; // called once the code was right (the required screen then opens the app)
  leave?: { label: string; onClick: () => void }; // always shown at the bottom ("Log out" on the required screen)
  onEmailChanged?: () => void; // called after every Save, so the popup can tell the gate to check the server again
  showHeading?: boolean; // the popup has its own title bar, the required screen does not
}

const CODE_LENGTH = 6;

const modeOf = (s: ContactEmailState): Mode => (!s.email ? "form" : s.verified ? "verified" : "code");

// The server counts the seconds; the browser turns them into a point in time and counts down from it
const deadlinesOf = (s: ContactEmailState) => {
  const now = Date.now();
  return { expiresAt: now + s.expiresInSeconds * 1000, resendAt: now + s.resendInSeconds * 1000 };
};

const secondsLeft = (at: number, now: number) => Math.max(0, Math.ceil((at - now) / 1000));
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

const primaryButton =
  "rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60";
const textButton =
  "rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-60";
const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 disabled:opacity-60";

// The three steps of the contact email, used by the required screen (ContactEmailGate) and the popup (ContactEmailModal):
//   form      type the email; Save checks it and mails a 6-digit code
//   code      type the code (it works 2 minutes); wrong tries are limited; a new code can be asked after 60 seconds
//   verified  the email is confirmed; it can still be changed
// Every message comes from the backend and the typed text is kept when something fails.
export default function ContactEmailFlow({ initial, onVerified, leave, onEmailChanged, showHeading = false }: Props) {
  const [state, setState] = useState(initial);
  const [mode, setMode] = useState<Mode>(() => modeOf(initial));
  const [deadlines, setDeadlines] = useState(() => deadlinesOf(initial));
  const [now, setNow] = useState(() => Date.now());
  const [email, setEmail] = useState(initial.email ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "verify" | "resend" | null>(null);

  // One tick per second while the code step is open, for the two countdowns
  useEffect(() => {
    if (mode !== "code") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [mode]);

  function apply(next: ContactEmailState) {
    setState(next);
    setDeadlines(deadlinesOf(next));
    setNow(Date.now());
  }

  const fail = (err: unknown) => setError(err instanceof Error ? err.message : "Something went wrong.");

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy("save");
    try {
      const next = await saveContactEmail(email);
      apply(next);
      setCode("");
      setMode(modeOf(next));
      if (next.verified) onVerified?.();
      else onEmailChanged?.();
    } catch (err) {
      fail(err);
      // The email may have been saved even though the code could not be sent (too many codes, mail problem)
      onEmailChanged?.();
    } finally {
      setBusy(null);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy("verify");
    try {
      await verifyContactEmail(code);
      apply({ ...state, verified: true, expiresInSeconds: 0, resendInSeconds: 0 });
      setCode("");
      setMode("verified");
      onVerified?.();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(null);
    }
  }

  async function handleResend() {
    setError(null);
    setBusy("resend");
    try {
      apply(await resendContactEmailCode());
      setCode("");
    } catch (err) {
      fail(err);
    } finally {
      setBusy(null);
    }
  }

  function changeEmail() {
    setError(null);
    setEmail(state.email ?? "");
    setMode("form");
  }

  function back() {
    setError(null);
    setNow(Date.now()); // the countdown was not ticking while the form was open
    setMode(modeOf(state));
  }

  const expiresLeft = secondsLeft(deadlines.expiresAt, now);
  const resendLeft = secondsLeft(deadlines.resendAt, now);
  const codeWorks = expiresLeft > 0;
  const working = busy !== null;

  const heading =
    mode === "form" ? (state.email ? "Change your email" : "Add your email") : mode === "code" ? "Confirm your email" : "Email confirmed";

  return (
    <div className="space-y-4">
      {showHeading && <h1 className="text-xl font-bold text-slate-900">{heading}</h1>}

      {mode === "form" && (
        <form onSubmit={handleSave} noValidate className="space-y-4">
          <p className="text-sm text-slate-500">
            We use this email to contact you about your account. You can use the same email for more than one account.
            We will send a {CODE_LENGTH}-digit code to confirm it.
          </p>
          <div>
            <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              autoComplete="email"
              maxLength={254}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={working}
              className={inputClass}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-between gap-3">
            {state.email ? (
              <button type="button" onClick={back} disabled={working} className={textButton}>
                Back
              </button>
            ) : (
              <span />
            )}
            <button type="submit" disabled={working} className={primaryButton}>
              {busy === "save" ? "Sending code..." : "Save and send code"}
            </button>
          </div>
        </form>
      )}

      {mode === "code" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {codeWorks ? (
              <>
                We sent a {CODE_LENGTH}-digit code to <span className="font-semibold text-slate-800">{state.email}</span>.
                Type it here. It also may take a moment to arrive; check the spam folder too.
              </>
            ) : (
              <>
                There is no working code for <span className="font-semibold text-slate-800">{state.email}</span>.
                Send a new one and type it here.
              </>
            )}
          </p>

          {codeWorks && (
            <form onSubmit={handleVerify} noValidate className="space-y-3">
              <div>
                <label htmlFor="contact-code" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Code
                </label>
                <input
                  id="contact-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={CODE_LENGTH}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
                  disabled={working}
                  className={`${inputClass} text-center text-lg font-semibold tracking-[0.4em]`}
                />
              </div>

              <p className="text-xs text-slate-500">Expires in {clock(expiresLeft)}</p>
              {error && <p className="text-sm text-red-600">{error}</p>}

              <button type="submit" disabled={working || code.length !== CODE_LENGTH} className={`${primaryButton} w-full`}>
                {busy === "verify" ? "Checking..." : "Confirm"}
              </button>
            </form>
          )}

          {!codeWorks && error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={changeEmail} disabled={working} className={textButton}>
              Change email
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={working || resendLeft > 0}
              className={codeWorks ? textButton : primaryButton}
            >
              {busy === "resend"
                ? "Sending..."
                : resendLeft > 0
                  ? `${codeWorks ? "Resend code" : "Send code"} (${resendLeft}s)`
                  : codeWorks
                    ? "Resend code"
                    : "Send code"}
            </button>
          </div>
        </div>
      )}

      {mode === "verified" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{state.email}</span> is confirmed. We use it to contact you
            about your account.
          </p>
          <p className="text-sm font-semibold text-green-600">Verified</p>
          <button type="button" onClick={changeEmail} className={textButton}>
            Change email
          </button>
        </div>
      )}

      {leave && (
        <div className="border-t border-slate-100 pt-3 text-center">
          <button type="button" onClick={leave.onClick} className={textButton}>
            {leave.label}
          </button>
        </div>
      )}
    </div>
  );
}
