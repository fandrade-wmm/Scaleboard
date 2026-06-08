"use client";

import Link from "next/link";
import type { Brief, Client } from "@/lib/schemas";

export function BriefView({ client, brief }: { client: Client; brief: Brief }) {
  const fm = brief.frontmatter;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-caps mb-2">{client.vertical}</p>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--color-text)" }}>
            {client.name}
          </h1>
        </div>
        <Link href={`/onboarding/${client.slug}`} className="btn-ghost text-sm">
          Re-run AI →
        </Link>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <BriefField label="Offer" value={fm.offer} accent="primary" />
        <BriefField label="ICP" value={fm.icp} />
        <BriefField label="USP" value={fm.usp} />
        <BriefField label="KPI" value={fm.kpi} accent="success" />
        <BriefField label="Budget" value={fm.budget} accent="warning" />
        <div className="glass-card p-4">
          <p className="label-caps mb-2">Competitors</p>
          {fm.competitors.length ? (
            <div className="flex flex-wrap gap-1.5">
              {fm.competitors.map((c) => (
                <span key={c.slug} className="badge badge-muted">{c.name}</span>
              ))}
            </div>
          ) : (
            <span className="text-sm" style={{ color: "var(--color-secondary)" }}>—</span>
          )}
        </div>
      </div>

      {/* Raw brief body */}
      {brief.body && (
        <div className="glass-card p-4">
          <p className="label-caps mb-3">Full brief</p>
          <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed" style={{ color: "var(--color-secondary)" }}>
            {brief.body}
          </pre>
        </div>
      )}
    </div>
  );
}

function BriefField({ label, value, accent }: { label: string; value: string; accent?: "primary" | "success" | "warning" }) {
  const accentClass = accent ? `accent-${accent}` : "";
  return (
    <div className={`glass-card p-4 ${accentClass}`}>
      <p className="label-caps mb-2">{label}</p>
      <p className="text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>{value}</p>
    </div>
  );
}
