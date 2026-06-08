"use client";

import { useState } from "react";
import type { Client, Brief } from "@/lib/schemas";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

const STATUS_STYLES: Record<string, string> = {
  ok: "text-success",
  warning: "text-warning",
  critical: "text-danger",
};
const STATUS_ICON: Record<string, string> = { ok: "✓", warning: "⚠", critical: "✕" };
const ALERT_STYLES: Record<string, string> = {
  warning: "border-warning/30 bg-warning/5",
  critical: "border-danger/30 bg-danger/5",
};

export function FinancialsView({ client, brief, initialData }: {
  client: Client; brief: Brief | null; initialData: unknown;
}) {
  const [data, setData] = useState<AnyObj | null>(initialData as AnyObj | null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${client.id}/financials`, { method: "POST" });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? `HTTP ${res.status}`);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx = buf.indexOf("\n\n");
        while (idx >= 0) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 2);
          idx = buf.indexOf("\n\n");
          if (!line.startsWith("data: ")) continue;
          const evt = JSON.parse(line.slice(6)) as AnyObj;
          if (evt.type === "done") setData(evt.data as AnyObj);
          if (evt.type === "error") setError(String(evt.error));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }

  function copyAll() {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const fmtUSD = (n: number) => n >= 1000
    ? `$${(n / 1000).toFixed(1)}k`
    : `$${n.toLocaleString()}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="label-caps text-secondary mb-1">{client.vertical}</div>
          <h1 className="text-2xl font-bold">{client.name} — Financial Model</h1>
          {brief && <p className="text-sm text-secondary mt-1">Budget: {brief.frontmatter.budget} · KPI: {brief.frontmatter.kpi}</p>}
        </div>
        <div className="flex gap-2">
          {data && (
            <button onClick={copyAll} className="glass-card px-3 py-2 text-sm hover:bg-glass-elevated">
              {copied ? "✓ Copied" : "Copy JSON"}
            </button>
          )}
          <button onClick={generate} disabled={generating || !brief}
            className="bg-primary text-white font-medium px-4 py-2 rounded-md-token text-sm disabled:opacity-50 hover:opacity-90">
            {generating ? "Generating…" : data ? "Regenerate" : "Generate Model"}
          </button>
        </div>
      </div>

      {!brief && (
        <div className="glass-card p-4 text-sm text-secondary text-center">Complete onboarding first.</div>
      )}
      {generating && (
        <div className="glass-card p-4 flex items-center gap-3 text-sm text-secondary">
          <span className="inline-block w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Building financial model…
        </div>
      )}
      {error && <div className="glass-card p-4 text-sm text-danger">{error}</div>}

      {data && (
        <>
          {/* Verdict */}
          <div className={`glass-card-elevated p-4 border-l-4 ${data.viable ? "border-success" : "border-danger"}`}>
            <div className={`label-caps mb-1 ${data.viable ? "text-success" : "text-danger"}`}>
              {data.viable ? "✓ Viable" : "✕ Not Viable"}
            </div>
            <p className="text-sm">{data.summary}</p>
          </div>

          {/* Alerts */}
          {(data.alerts ?? []).length > 0 && (
            <div className="flex flex-col gap-2">
              {(data.alerts as AnyObj[]).map((a, i) => (
                <div key={i} className={`glass-card p-3 border text-sm ${ALERT_STYLES[a.level] ?? ""}`}>
                  <span className={`font-semibold ${a.level === "critical" ? "text-danger" : "text-warning"}`}>
                    {a.level === "critical" ? "⚠ Critical: " : "⚡ Warning: "}
                  </span>
                  {a.message}
                </div>
              ))}
            </div>
          )}

          {/* KPI grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Break-even CAC", value: fmtUSD(data.breakEvenCAC ?? 0) },
              { label: "Target CAC", value: fmtUSD(data.targetCAC ?? 0) },
              { label: "Max CAC", value: fmtUSD(data.maxCAC ?? 0) },
              { label: "Revenue / Lead", value: fmtUSD(data.revenuePerLead ?? 0) },
              { label: "Leads Needed", value: String(data.leadsNeeded ?? 0) },
            ].map(({ label, value }) => (
              <div key={label} className="glass-card-elevated p-3 text-center">
                <div className="label-caps text-secondary mb-1">{label}</div>
                <div className="text-xl font-bold text-primary">{value}</div>
              </div>
            ))}
          </div>

          {/* Scenarios */}
          <div>
            <div className="label-caps text-secondary mb-2">Scenarios</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(data.scenarios as AnyObj[] ?? []).map((s) => (
                <div key={s.name} className="glass-card-elevated p-4">
                  <div className="font-semibold mb-2">{s.name}</div>
                  <div className="space-y-1 text-sm">
                    <Row label="Leads/mo" value={String(s.leadsPerMonth)} />
                    <Row label="CPL" value={fmtUSD(s.cpl)} />
                    <Row label="Closed deals" value={String(s.closedDeals)} />
                    <Row label="Revenue" value={fmtUSD(s.revenue)} />
                    <Row label="ROAS" value={`${s.roas}x`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget breakdown */}
          <div>
            <div className="label-caps text-secondary mb-2">Budget breakdown</div>
            <div className="flex flex-col gap-2">
              {(data.budgetBreakdown as AnyObj[] ?? []).map((b) => (
                <div key={b.channel} className="glass-card px-4 py-3 flex items-center gap-4">
                  <span className="font-semibold w-24 shrink-0">{b.channel}</span>
                  <span className="text-primary font-bold w-16">{b.pct}</span>
                  <span className="text-sm flex-1 text-secondary">{b.objective}</span>
                  <div className="text-right text-sm shrink-0">
                    <div className="font-medium">{fmtUSD(b.amount)}</div>
                    <div className="text-secondary text-xs">{b.expectedLeads} leads @ {fmtUSD(b.expectedCPL)} CPL</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Readiness checklist */}
          <div>
            <div className="label-caps text-secondary mb-2">Launch Readiness</div>
            <div className="flex flex-col gap-2">
              {(data.readinessChecks as AnyObj[] ?? []).map((c, i) => (
                <div key={i} className="glass-card px-4 py-3 flex items-start gap-3">
                  <span className={`font-bold text-base shrink-0 ${STATUS_STYLES[c.status] ?? "text-secondary"}`}>
                    {STATUS_ICON[c.status] ?? "·"}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{c.item}</div>
                    {c.note && <div className="text-xs text-secondary mt-0.5">{c.note}</div>}
                  </div>
                  <span className={`label-caps shrink-0 ${STATUS_STYLES[c.status] ?? "text-secondary"}`}>{c.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {(data.recommendations as string[] ?? []).length > 0 && (
            <div>
              <div className="label-caps text-secondary mb-2">Recommendations</div>
              <div className="glass-card p-4 flex flex-col gap-1">
                {(data.recommendations as string[]).map((r, i) => (
                  <div key={i} className="text-sm">→ {r}</div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-secondary">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
