"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function CreateAdmin() {
  const t = useTranslations("firstRun");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, role: "admin" }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => ({ error: "Failed" }))).error ?? "Failed");
      setSubmitting(false);
      return;
    }
    router.refresh();
  }

  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/scaleboard-mark.svg" alt="Scaleboard" width={48} height={48} className="mb-3" />
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--color-text)" }}>Scaleboard</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-secondary)" }}>by Web My Money</p>
        </div>

        <form onSubmit={submit} className="glass-card-elevated p-7 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold mb-1" style={{ color: "var(--color-text)" }}>{t("title")}</h2>
            <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{t("subtitle")}</p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="label-caps">{t("name")}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="glass-input"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="label-caps">{t("email")}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="glass-input"
            />
          </label>

          {error && (
            <p className="text-sm" style={{ color: "#EA2143" }}>{error}</p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full mt-1">
            {submitting ? <span className="spinner" /> : t("submit")}
          </button>
        </form>
      </div>
    </main>
  );
}
