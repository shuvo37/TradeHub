// src/components/AiAssistant.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  askAi,
  AI_MAX_QUESTION,
  AI_MEMORY_QUESTIONS,
  type AiChatMessage,
} from "@/lib/ai-api";

// The few icons this window needs, kept here so no other file has to change.
const ICON_PATHS = {
  sparkles:
    "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9zM5 3l.6 1.4L7 5l-1.4.6L5 7l-.6-1.4L3 5l1.4-.6z",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  close: "M18 6L6 18M6 6l12 12",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4z",
} as const;

function Icon({ name, className = "h-5 w-5" }: { name: keyof typeof ICON_PATHS; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

// What the backend tools are called, in words for the "Looked at" line under an answer
const TOOL_LABELS: Record<string, string> = {
  get_categories: "categories",
  search_products: "products",
  get_orders: "orders",
  get_sales_summary: "sales",
  get_my_posts: "posts",
};

const SUGGESTIONS = [
  "List all my products under $50",
  "Which products are out of stock?",
  "How much did I earn in the last 30 days?",
  "Which of my posts got the most likes?",
];

// A chat line: the two fields the backend needs, plus (for an answer) which data the AI looked at
interface ChatLine extends AiChatMessage {
  tools?: string[];
}

// The memory sent with a new question: the last 10 questions of this chat, each with its answer.
function memoryOf(lines: ChatLine[]): AiChatMessage[] {
  // Walk back from the newest line and stop on the 10th question, so the memory always starts with a question.
  let questions = 0;
  let start = lines.length;
  while (start > 0) {
    start--;
    if (lines[start].role === "user" && ++questions === AI_MEMORY_QUESTIONS) break;
  }
  return lines.slice(start).map(({ role, text }) => ({ role, text }));
}

// The sparkle button in the top bar and its chat window.
//
// The chat lives ONLY in the state of <AiPanel>, which exists only while the window is open. So closing the window,
// the reset button, or reloading the page starts a fresh chat. Nothing is saved in the browser or in the database:
// the last 10 questions are simply sent along with each new question.
export default function AiAssistant() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="AI assistant"
        aria-label="AI assistant"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          open
            ? "bg-blue-100 text-blue-600"
            : "bg-gradient-to-br from-blue-50 to-violet-100 text-violet-600 hover:from-blue-100 hover:to-violet-200"
        }`}
      >
        <Icon name="sparkles" />
      </button>

      {open && <AiPanel onClose={() => setOpen(false)} />}
    </div>
  );
}

function AiPanel({ onClose }: { onClose: () => void }) {
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Counts the questions sent. An answer that arrives after a reset belongs to an older number and is thrown away.
  const runRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Keep the newest line in view
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines, loading, error]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;

    const memory = memoryOf(lines);
    const run = ++runRef.current;
    setLines((l) => [...l, { role: "user", text: question }]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await askAi(question, memory);
      if (run !== runRef.current) return; // reset while waiting
      setLines((l) => [...l, { role: "model", text: res.answer, tools: res.toolsUsed }]);
    } catch (err) {
      if (run !== runRef.current) return;
      // A question with no answer must not stay in the chat (the memory has to alternate question / answer):
      // take it back into the box so it can be sent again.
      setLines((l) => l.slice(0, -1));
      setInput(question);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      if (run === runRef.current) setLoading(false);
    }
  };

  // The circular arrow: forget everything
  const reset = () => {
    runRef.current++;
    setLines([]);
    setInput("");
    setError(null);
    setLoading(false);
  };

  return (
    <div
      role="dialog"
      aria-label="AI assistant"
      className="fixed inset-x-2 top-16 z-50 flex h-[min(32rem,calc(100dvh-5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[26rem]"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white">
          <Icon name="sparkles" className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">AI assistant</p>
          <p className="truncate text-xs text-slate-500">Ask about your store, orders and posts</p>
        </div>
        <button
          type="button"
          onClick={reset}
          title="Start a new chat"
          aria-label="Start a new chat"
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Icon name="refresh" className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          title="Close"
          aria-label="Close"
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Icon name="close" className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {lines.length === 0 && !loading && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Ask me about your own business. I read your live store data and never change anything.
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              I remember your last {AI_MEMORY_QUESTIONS} questions in this chat. Closing this window or pressing
              the circular arrow clears them.
            </p>
          </div>
        )}

        {lines.map((line, i) =>
          line.role === "user" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-blue-600 px-3 py-2 text-sm text-white">
                {line.text}
              </p>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2 text-sm text-slate-800">
                <p className="whitespace-pre-wrap break-words">{line.text}</p>
                {line.tools && line.tools.length > 0 && (
                  <p className="mt-2 text-[11px] text-slate-400">
                    Looked at: {line.tools.map((t) => TOOL_LABELS[t] ?? t).join(", ")}
                  </p>
                )}
              </div>
            </div>
          ),
        )}

        {loading && (
          <div className="flex justify-start">
            <p className="animate-pulse rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2 text-sm text-slate-500">
              Looking at your store…
            </p>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2 border-t border-slate-200 p-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter adds a new line (and Enter while typing with an IME is left alone)
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={2}
          maxLength={AI_MAX_QUESTION}
          autoFocus
          placeholder="Ask about your products, orders or posts…"
          aria-label="Your question"
          className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <button
          type="submit"
          disabled={loading || input.trim() === ""}
          title="Send"
          aria-label="Send"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Icon name="send" />
        </button>
      </form>
    </div>
  );
}
