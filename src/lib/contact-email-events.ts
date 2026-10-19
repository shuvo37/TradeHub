// src/lib/contact-email-events.ts
// A tiny signal between the "Contact email" popup and ContactEmailGate (same idea as feed-refresh.ts).
// When the email is changed in the popup it is no longer confirmed, and the app must block again at once instead of
// after the next reload. The popup calls notifyContactEmailChanged(); the gate listens and checks the server again.

const EVENT = "tradehub:contact-email-changed";

export function notifyContactEmailChanged(): void {
  window.dispatchEvent(new Event(EVENT));
}

// Returns the function that stops listening (use it as the cleanup of an effect)
export function onContactEmailChanged(handler: () => void): () => void {
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
