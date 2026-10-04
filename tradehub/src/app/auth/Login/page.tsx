"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "../AuthShell";
import PasswordInput from "../PasswordInput";
import { TextField } from "../FormField";
import type { LoginFormData } from "../auth";
import { authApi } from "@/lib/api";
import { setAuth } from "@/lib/auth-store";

const initialForm: LoginFormData = { uniqueName: "", password: "" };

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginFormData>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field: keyof LoginFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.uniqueName || !form.password) {
      setError("Enter your unique name and password.");
      return;
    }

    setSubmitting(true);
    try {
      const user = await authApi.login({
        uniqueName: form.uniqueName.trim(),
        password: form.password,
      });
      setAuth(user);
      router.push("/Home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with your unique name and password."
      footer={
        <>
          New to TradeHub?{" "}
          <Link href="/auth/Register" className="font-medium text-[#FBF7EE] underline underline-offset-2">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField
          id="uniqueName"
          label="Unique name"
          placeholder="e.g. mehedi_7K2"
          value={form.uniqueName}
          onChange={(e) => handleChange("uniqueName", e.target.value)}
          autoComplete="username"
        />

        <PasswordInput
          id="password"
          label="Password"
          placeholder="Your password"
          value={form.password}
          onChange={(e) => handleChange("password", e.target.value)}
          autoComplete="current-password"
        />

        {error && <p className="text-sm text-[#C1483B]">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-[#E8A33D] py-2.5 text-sm font-semibold text-[#16231F] transition hover:bg-[#C97F1E] disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}