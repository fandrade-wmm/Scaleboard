"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function NewClientForm() {
  const t = useTranslations();
  const router = useRouter();
  const [name, setName] = useState("");
  const [vertical, setVertical] = useState("");
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, vertical, language }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Failed" }));
      setError(body.error ?? "Failed");
      setSubmitting(false);
      return;
    }
    const created = await res.json();
    router.push(`/onboarding/${created.slug}`);
  }

  return (
    <form onSubmit={submit} className="glass-card-elevated p-7 flex flex-col gap-4 max-w-lg mx-auto">
      <div>
        <p className="label-caps mb-2">New Client</p>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--color-text)" }}>
          {t("onboarding.title")}
        </h1>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="label-caps">{t("onboarding.newClient.name")}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="glass-input" placeholder="Acme Corp" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label-caps">{t("onboarding.newClient.vertical")}</span>
        <input value={vertical} onChange={(e) => setVertical(e.target.value)} required className="glass-input" placeholder="SaaS / E-commerce / Services…" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label-caps">{t("settings.app.language")}</span>
        <select value={language} onChange={(e) => setLanguage(e.target.value as "es" | "en")} className="glass-input">
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </label>
      {error && <p className="text-sm" style={{ color: "#EA2143" }}>{error}</p>}
      <button type="submit" disabled={submitting} className="btn-primary w-full mt-1">
        {submitting ? <span className="spinner" /> : t("onboarding.newClient.create")}
      </button>
    </form>
  );
}
