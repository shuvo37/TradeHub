"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import AuthShell from "../AuthShell";
import PasswordInput from "../PasswordInput";
import { TextField, TextAreaField } from "../FormField";
import type { RegisterFormData } from "../auth";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { setAuth } from "@/lib/auth-store";

const initialForm: RegisterFormData = {
  name: "",
  password: "",
  confirmPassword: "",
  avatar: "",
  location: "",
  paymentNumber: "",
  email: "",
  phone: "",
  necessaryInfo: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterFormData>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field: keyof RegisterFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.password || !form.confirmPassword) {
      setError("Name and password are required.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

       setSubmitting(true);
    try {
      const user = await authApi.register({
        name: form.name.trim(),
        password: form.password,
        avatar: form.avatar || undefined,
        location: form.location || undefined,
        paymentNumber: form.paymentNumber || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        necessaryInfo: form.necessaryInfo || undefined,
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
      title="Create your account"
      subtitle="Your unique name is generated automatically after signup."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/Login" className="font-medium text-[#FBF7EE] underline underline-offset-2">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField
          id="name"
          label="Name"
          placeholder="Your full name"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          autoComplete="name"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <PasswordInput
            id="password"
            label="Password"
            placeholder="Create a password"
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            autoComplete="new-password"
          />
          <PasswordInput
            id="confirmPassword"
            label="Confirm password"
            placeholder="Repeat password"
            value={form.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div className="border-t border-[#E3DCC8] pt-5">
          <p className="mb-4 text-sm text-[#4B5D57]">
            The rest helps buyers reach and trust you — add it now or later from your profile.
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id="avatar"
              label="Avatar URL"
              optional
              placeholder="https://..."
              value={form.avatar}
              onChange={(e) => handleChange("avatar", e.target.value)}
            />
            <TextField
              id="location"
              label="Location"
              optional
              placeholder="e.g. Gazipur, Dhaka"
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
              autoComplete="address-level2"
            />
            <TextField
              id="paymentNumber"
              label="Payment number"
              optional
              placeholder="bKash / Nagad number"
              value={form.paymentNumber}
              onChange={(e) => handleChange("paymentNumber", e.target.value)}
            />
            <TextField
              id="email"
              label="Email"
              optional
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              autoComplete="email"
            />
            <TextField
              id="phone"
              label="Phone"
              optional
              placeholder="01XXXXXXXXX"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              autoComplete="tel"
            />
          </div>

          <div className="mt-5">
            <TextAreaField
              id="necessaryInfo"
              label="Anything buyers should know"
              optional
              placeholder="e.g. usually replies after 6pm, cash on delivery only in Gazipur"
              value={form.necessaryInfo}
              onChange={(e) => handleChange("necessaryInfo", e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-[#C1483B]">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-[#E8A33D] py-2.5 text-sm font-semibold text-[#16231F] transition hover:bg-[#C97F1E] disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
