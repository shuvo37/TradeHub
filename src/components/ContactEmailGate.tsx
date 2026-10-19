// src/components/ContactEmailGate.tsx
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ensureUser, getUser } from "@/lib/auth-store";
import { fetchContactEmail, type ContactEmailState } from "@/lib/contact-email-api";
import { onContactEmailChanged } from "@/lib/contact-email-events";
import { useLogout } from "@/hooks/useLogout";
import ContactEmailFlow from "./ContactEmailFlow";

// Pages that do not need a login (the login page is also shown at "/")
const isPublicPath = (path: string) =>
  path === "/" || path.startsWith("/auth") || path.startsWith("/welcome");

// What the last check found.
//   userId null  nobody is logged in
//   pending      what the user still has to do (add the email, or confirm it); null = nothing, the app opens
interface Check {
  userId: string | null;
  pending: ContactEmailState | null;
}

function FullScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 p-4 text-sm text-slate-900">
      {children}
    </div>
  );
}

// Wraps the whole app (see app/layout.tsx). A logged-in user whose contact email is missing or not confirmed sees only
// the email / code screen (confirm it, or log out) instead of the page. Everyone else sees the page as usual.
// It sits in the root layout so that no page can be reached around it by typing its address.
export default function ContactEmailGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublic = isPublicPath(pathname);
  const logout = useLogout();
  const [check, setCheck] = useState<Check | null>(null);
  // The account we already know is confirmed: it is not asked again on every page change
  const confirmedRef = useRef<string | null>(null);
  // Goes up when the email was changed in the popup: the check below then runs again
  const [recheck, setRecheck] = useState(0);

  useEffect(
    () =>
      onContactEmailChanged(() => {
        confirmedRef.current = null;
        setRecheck((n) => n + 1);
      }),
    []
  );

  // Runs when we enter or leave the public pages (so also right after a login), and when the email was changed
  useEffect(() => {
    if (isPublic) return;
    let cancelled = false;

    ensureUser().then(async (user) => {
      if (cancelled) return;
      if (!user) {
        setCheck({ userId: null, pending: null }); // the page itself sends them to the login
        return;
      }
      if (confirmedRef.current === user.id) {
        setCheck({ userId: user.id, pending: null });
        return;
      }

      let pending: ContactEmailState | null = null; // if the server cannot be reached, do not lock the user out
      try {
        const state = await fetchContactEmail();
        if (state.email && state.verified) confirmedRef.current = user.id;
        else pending = state;
      } catch {
        // keep null
      }
      if (cancelled) return;
      setCheck({ userId: user.id, pending });
    });

    return () => {
      cancelled = true;
    };
  }, [isPublic, recheck]);

  if (isPublic) return <>{children}</>;

  const me = getUser();
  // Nobody logged in: show the page, it redirects to the login
  if (check?.userId === null && !me) return <>{children}</>;
  // Not checked yet, or the check belongs to another account (someone logged in or out since)
  if (!check || check.userId !== me?.id) return <FullScreen>Loading...</FullScreen>;

  if (check.pending) {
    return (
      <FullScreen>
        <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <ContactEmailFlow
            key={check.userId}
            initial={check.pending}
            showHeading
            onVerified={() => {
              confirmedRef.current = check.userId;
              setCheck({ userId: check.userId, pending: null });
            }}
            leave={{ label: "Log out", onClick: logout }}
          />
        </div>
      </FullScreen>
    );
  }

  return <>{children}</>;
}
