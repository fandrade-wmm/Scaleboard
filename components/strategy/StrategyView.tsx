"use client";

import { useState, useCallback } from "react";
import type { Client, Brief } from "@/lib/schemas";

const FUNNEL_COLOR: Record<string, string> = { TOF: "text-primary", MOF: "text-warning", BOF: "text-success" };
const RISK_COLOR: Record<string, string> = { LOW: "text-success", MED: "text-warning", HIGH: "text-danger" };
const PATTERN_COLOR: Record<string, string> = {
  contrarian: "bg-danger/10 text-danger", diagnosis: "bg-warning/10 text-warning",
  mechanism: "bg-primary/10 text-primary", "proof-first": "bg-success/10 text-success",
  identity: "bg-secondary/10 text-secondary", curiosity: "bg-orange-100 text-orange-600",
  "social-proof": "bg-success/10 text-success",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

interface Props {
  client: Client;
  brief: Brief | null;
  initialAngles: AnyObj[] | null;
  initialHooks: AnyObj[] | null;
  initialChannels: unknown;
  initialLp: unknown;
  initialJourney: unknown;
}

type Phase = "idle" | "generating" | "done" | "error";

export function StrategyView({ client, brief, initialAngles, initialHooks, initialChannels, initialLp, initialJourney }: Props) {
  const [phase, setPhase] = useState<Phase>(initialAngles ? "done" : "idle");
  const [status, setStatus] = useState("");
  const [angles, setAngles] = useState<AnyObj[]>(initialAngles ?? []);
  const [hooks, setHooks] = useState<AnyObj[]>(initialHooks ?? []);
  const [channels, setChannels] = useState<unknown>(initialChannels);
  const [lp, setLp] = useState<unknown>(initialLp);
  const [journey, setJourney] = useState<unknown>(initialJourney);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"angles" | "hooks" | "channels" | "lp" | "journey">("angles");
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    setPhase("generating");
    setError(null);
    setAngles([]); setHooks([]); setChannels(null); setLp(null); setJourney(null);

    let gotData = false;
    try {
      const res = await fetch(`/api/clients/${client.id}/strategy`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ includeJourney: true }),
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? `HTTP ${res.status}`);
        setPhase("error");
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
          try {
            const evt = JSON.parse(line.slice(6)) as AnyObj;
            if (evt.type === "phase") setStatus(String(evt.label ?? ""));
            if (evt.type === "block" && evt.block === "core") {
              const a = Array.isArray(evt.data?.angles) ? evt.data.angles : [];
              setAngles(a);
              if (a.length > 0) gotData = true;
            }
            if (evt.type === "block" && evt.block === "tactics") {
              setHooks(Array.isArray(evt.data?.hooks) ? evt.data.hooks : []);
              setChannels(evt.data?.channels ?? null);
              setLp(evt.data?.lp ?? null);
              // ✅ Show results immediately when tactics arrive — don't wait for journey
              gotData = true;
              setPhase("done");
            }
            if (evt.type === "block" && evt.block === "journey") setJourney(evt.data);
            if (evt.type === "done") setPhase("done");
            if (evt.type === "error") { setError(String(evt.error)); setPhase("error"); }
          } catch { /* skip malformed chunk */ }
        }
      }
      // ✅ Fallback: stream closed without explicit done — show whatever arrived
      if (gotData) setPhase("done");
    } catch (err) {
      if (gotData) setPhase("done"); // keep showing results even if stream broke
      else { setError(err instanceof Error ? err.message : String(err)); setPhase("error"); }
    }
  }, [client.id]);

  function copyAll() {
    const text = JSON.stringify({ angles, hooks, channels, lp, journey }, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const hasPack = angles.length > 0;
  const TABS = [
    { key: "angles", label: `Angles (${angles.length})` },
    { key: "hooks", label: `Hooks (${hooks.length})` },
    { key: "channels", label: "Channels" },
    { key: "lp", label: "Landing Page" },
    { key: "journey", label: "Journey" },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="label-caps text-secondary mb-1">{client.vertical}</div>
          <h1 className="text-2xl font-bold">{client.name} — Strategy</h1>
          {brief && (
            <p className="text-sm text-secondary mt-1 max-w-2xl">
              {brief.frontmatter.offer}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {hasPack && (
            <button onClick={copyAll} className="glass-card px-3 py-2 text-sm hover:bg-glass-elevated">
              {copied ? "✓ Copied" : "Copy JSON"}
            </button>
          )}
          <button
            onClick={generate}
            disabled={phase === "generating" || !brief}
            className="bg-primary text-white font-medium px-4 py-2 rounded-md-token text-sm disabled:opacity-50 hover:opacity-90"
          >
            {phase === "generating" ? "Generating…" : hasPack ? "Regenerate" : "Generate Strategy"}
          </button>
        </div>
      </div>

      {!brief && (
        <div className="glass-card p-6 text-center text-secondary text-sm">
          Complete onboarding and commit a brief first.
        </div>
      )}

      {phase === "generating" && (
        <div className="glass-card p-4 flex items-center gap-3 text-sm text-secondary">
          <span className="inline-block w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          {status || "Running parallel generation…"}
        </div>
      )}

      {error && (
        <div className="glass-card p-4 text-sm text-danger">{error}</div>
      )}

      {hasPack && (
        <>
          {/* Tab bar */}
          <div className="flex gap-1 flex-wrap">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 rounded-sm-token text-sm transition ${
                  activeTab === key ? "bg-primary text-white" : "glass-card text-secondary hover:text-text"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Angles */}
          {activeTab === "angles" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {angles.map((a, i) => (
                <div key={a.id ?? i} className="glass-card-elevated p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{a.name ?? a.title ?? `Angle ${i + 1}`}</span>
                    <div className="flex gap-1">
                      <span className={`label-caps ${FUNNEL_COLOR[a.funnel] ?? "text-secondary"}`}>{a.funnel}</span>
                      <span className={`label-caps ${RISK_COLOR[a.risk] ?? "text-secondary"}`}>{a.risk}</span>
                    </div>
                  </div>
                  <div className="text-xs text-secondary space-y-0.5">
                    <div><span className="text-text font-medium">Belief: </span>{a.belief}</div>
                    <div><span className="text-text font-medium">Counter: </span>{a.counter}</div>
                    <div><span className="text-text font-medium">Emotion: </span>{a.emotion}</div>
                  </div>
                  <p className="text-sm text-text mt-1">{a.proposition}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(a.formats ?? []).map((f: string) => (
                      <span key={f} className="label-caps glass-card px-2 py-0.5 text-secondary">{f}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hooks */}
          {activeTab === "hooks" && (
            <div className="flex flex-col gap-2">
              {hooks.map((h, i) => (
                <div key={i} className="glass-card px-4 py-3 flex items-start gap-3">
                  <span className={`label-caps px-2 py-0.5 rounded-sm-token shrink-0 ${PATTERN_COLOR[h.pattern] ?? "bg-glass-surface text-secondary"}`}>
                    {h.pattern}
                  </span>
                  <span className="text-sm flex-1">{h.text}</span>
                  <span className="label-caps text-secondary shrink-0">{h.format}</span>
                </div>
              ))}
            </div>
          )}

          {/* Channels */}
          {activeTab === "channels" && channels && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Array.isArray(channels) ? channels : []).map((ch: AnyObj, i: number) => (
                <div key={i} className="glass-card-elevated p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{ch.name}</span>
                    <span className="text-xl font-bold text-primary">{ch.pct}</span>
                  </div>
                  <div className="text-sm text-secondary">{ch.objective}</div>
                  <div className="text-xs text-secondary mt-2">KPI: {ch.kpi}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(ch.formats ?? []).map((f: string) => (
                      <span key={f} className="label-caps glass-card px-2 py-0.5 text-secondary">{f}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LP */}
          {activeTab === "lp" && lp && (
            <div className="flex flex-col gap-4">
              <div className="glass-card-elevated p-4">
                <div className="label-caps text-secondary mb-1">Hero</div>
                <div className="font-bold text-lg">{(lp as AnyObj).hero}</div>
                <div className="text-secondary text-sm mt-1">{(lp as AnyObj).sub}</div>
              </div>
              {((lp as AnyObj).sections ?? []).map((s: AnyObj, i: number) => (
                <div key={i} className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="label-caps bg-primary/10 text-primary px-2 py-0.5 rounded-sm-token">#{s.n}</span>
                    <span className="font-semibold text-sm">{s.name}</span>
                  </div>
                  <div className="font-medium">{s.headline}</div>
                  <div className="text-sm text-secondary mt-1">{s.copy}</div>
                  {s.cta && <div className="text-sm text-primary mt-1">→ {s.cta}</div>}
                  {s.objection && <div className="text-xs text-secondary italic mt-1">Objection: {s.objection}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Journey */}
          {activeTab === "journey" && journey && (
            <div className="flex flex-col gap-3">
              {((journey as AnyObj).stages ?? []).map((s: AnyObj, i: number) => (
                <div key={i} className="glass-card p-4 flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{s.name}</span>
                      <span className="label-caps glass-card px-2 py-0.5 text-secondary">{s.type}</span>
                      <span className="label-caps glass-card px-2 py-0.5 text-secondary">{s.channel}</span>
                      <span className={`label-caps ${RISK_COLOR[s.drop] ?? "text-secondary"}`}>drop: {s.drop}</span>
                    </div>
                    <div className="text-sm text-secondary italic">&ldquo;{s.thought}&rdquo;</div>
                    <div className="text-sm mt-1">{s.message}</div>
                    {s.cta && <div className="text-sm text-primary mt-1">→ {s.cta}</div>}
                    {(s.friction ?? []).length > 0 && (
                      <div className="text-xs text-danger mt-1">⚠ {(s.friction as string[]).join(" · ")}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
