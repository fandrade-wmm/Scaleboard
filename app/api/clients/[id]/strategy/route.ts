/**
 * GET  /api/clients/:id/strategy  — load saved strategy
 * POST /api/clients/:id/strategy  — generate + stream + save
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getClientRepo } from "@/lib/repo";
import { getAiClient } from "@/lib/ai";
import { getGuidelinesRepo } from "@/lib/guidelines";
import { requireApiPermission, jsonError } from "@/lib/api/guards";
import { AngleSchema, HookSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── helpers ────────────────────────────────────────────────────────────────

function safeJSON(raw: string): unknown | null {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function normalizeAngles(raw: unknown): unknown[] {
  if (!Array.isArray((raw as Record<string, unknown>)?.angles)) return [];
  return ((raw as Record<string, unknown>).angles as unknown[]);
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gate = await requireApiPermission("client.view");
  if ("error" in gate) return gate.error;
  const repo = getClientRepo();
  const { z } = await import("zod");
  const [angles, hooks, channels, lp, journey] = await Promise.all([
    repo.readArtifact(id, ["densification-pack", "angles.json"], z.array(z.any())).catch(() => null),
    repo.readArtifact(id, ["densification-pack", "hooks.json"], z.array(z.any())).catch(() => null),
    repo.readArtifact(id, ["densification-pack", "channels.json"], z.any()).catch(() => null),
    repo.readArtifact(id, ["densification-pack", "landing-page.json"], z.any()).catch(() => null),
    repo.readArtifact(id, ["densification-pack", "user-journey.json"], z.any()).catch(() => null),
  ]);
  return NextResponse.json({ angles, hooks, channels, lp, journey });
}

// ── POST ───────────────────────────────────────────────────────────────────

const RequestSchema = z.object({ includeJourney: z.boolean().default(true) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gate = await requireApiPermission("ai.invoke");
  if ("error" in gate) return gate.error;

  const rawBody = await req.json().catch(() => ({}));
  const body = RequestSchema.parse(rawBody);

  const client = await getClientRepo().getClient(id);
  const brief = await getClientRepo().getBrief(id);
  if (!brief) return jsonError("Brief not committed yet", 400);

  const { text: guidelinesContext } = await getGuidelinesRepo()
    .assembleGuidelinesContext(client.slug, "strategy")
    .catch(() => ({ text: "" }));

  let ai;
  try { ai = getAiClient(); }
  catch (err) { return jsonError(err instanceof Error ? err.message : "AI error", 503); }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(obj: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      }

      try {
        const briefText = `Client: ${client.name}\nVertical: ${client.vertical}\n\n`
          + `Offer: ${brief.frontmatter.offer}\n`
          + `ICP: ${brief.frontmatter.icp}\n`
          + `USP: ${brief.frontmatter.usp}\n`
          + `KPI: ${brief.frontmatter.kpi}\n`
          + `Budget: ${brief.frontmatter.budget}\n`
          + (brief.frontmatter.competitors.length
            ? `Competitors: ${brief.frontmatter.competitors.map(c => c.name).join(", ")}\n`
            : "")
          + `\n${brief.body}`;

        // ── BLOCK 1 + 2 run in parallel ───────────────────────────────
        send({ type: "phase", phase: "core", label: "Generating angles & hooks…" });

        const [coreResult, tacticsResult] = await Promise.allSettled([
          ai.generate({
            clientId: id, module: "strategy",
            prompt: `GENERATE BLOCK 1 ONLY (core strategy + angles). Be concise — max 8 angles.\n\n${briefText}`,
            guidelinesContext: guidelinesContext || undefined,
            maxTokens: 3500, temperature: 0.6,
          }),
          ai.generate({
            clientId: id, module: "strategy",
            prompt: `GENERATE BLOCK 2 ONLY (hooks, channels, LP). 3-4 hooks per angle max.\n\n${briefText}`,
            guidelinesContext: guidelinesContext || undefined,
            maxTokens: 3500, temperature: 0.6,
          }),
        ]);

        // Parse + save core
        let angles: unknown[] = [];
        let coreData: Record<string, unknown> = {};
        if (coreResult.status === "fulfilled") {
          const parsed = safeJSON(coreResult.value.text) as Record<string, unknown> | null;
          if (parsed) {
            coreData = parsed;
            angles = normalizeAngles(parsed);
            send({ type: "block", block: "core", data: parsed });
            // Save angles with stable UUIDs
            const { randomUUID } = await import("node:crypto");
            const now = new Date().toISOString();
            const normalizedAngles = angles.map((a: unknown) => {
              const angle = a as Record<string, unknown>;
              return { id: randomUUID(), title: String(angle.name ?? ""), beliefAttacked: String(angle.belief ?? ""), counterBelief: String(angle.counter ?? ""), emotionalDriver: String(angle.emotion ?? ""), proposition: String(angle.proposition ?? ""), status: "draft" as const, createdAt: now, updatedAt: now, ...angle };
            });
            await getClientRepo().writeArtifact(id, ["densification-pack", "angles.json"], normalizedAngles, z.array(z.any())).catch(() => null);
          }
        }

        // Parse + save tactics
        if (tacticsResult.status === "fulfilled") {
          const parsed = safeJSON(tacticsResult.value.text) as Record<string, unknown> | null;
          if (parsed) {
            send({ type: "block", block: "tactics", data: parsed });
            await Promise.all([
              getClientRepo().writeArtifact(id, ["densification-pack", "hooks.json"], Array.isArray(parsed.hooks) ? parsed.hooks : [], z.array(z.any())).catch(() => null),
              getClientRepo().writeArtifact(id, ["densification-pack", "channels.json"], parsed.channels ?? [], z.any()).catch(() => null),
              getClientRepo().writeArtifact(id, ["densification-pack", "landing-page.json"], parsed.lp ?? {}, z.any()).catch(() => null),
            ]);
          }
        }

        // ── BLOCK 3 — Journey (only when explicitly requested) ────────
        if (body.includeJourney === true && angles.length > 0) {
          send({ type: "phase", phase: "journey", label: "Mapping user journey…" });
          try {
            const journeyResult = await ai.generate({
              clientId: id, module: "strategy",
              prompt: `GENERATE BLOCK 3 ONLY (user journey map). Keep it to 5-6 stages max.\n\n${briefText}`,
              guidelinesContext: guidelinesContext || undefined,
              maxTokens: 2000, temperature: 0.5,
            });
            const journeyParsed = safeJSON(journeyResult.text) as Record<string, unknown> | null;
            if (journeyParsed) {
              send({ type: "block", block: "journey", data: journeyParsed });
              await getClientRepo().writeArtifact(id, ["densification-pack", "user-journey.json"], journeyParsed, z.any()).catch(() => null);
            }
          } catch {
            // Journey failure is non-fatal — blocks 1+2 data is already saved
          }
        }

        send({ type: "done" });
        void coreData; void randomId;
      } catch (err) {
        send({ type: "error", error: err instanceof Error ? err.message : String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
