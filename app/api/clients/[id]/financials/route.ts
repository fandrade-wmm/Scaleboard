import { NextResponse, type NextRequest } from "next/server";
import { getClientRepo } from "@/lib/repo";
import { getAiClient } from "@/lib/ai";
import { getGuidelinesRepo } from "@/lib/guidelines";
import { requireApiPermission, jsonError } from "@/lib/api/guards";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeJSON(raw: string): unknown | null {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireApiPermission("client.view");
  if ("error" in gate) return gate.error;
  const data = await getClientRepo().readArtifact(id, ["densification-pack", "financials.json"], z.any()).catch(() => null);
  return NextResponse.json(data);
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireApiPermission("ai.invoke");
  if ("error" in gate) return gate.error;

  const client = await getClientRepo().getClient(id);
  const brief = await getClientRepo().getBrief(id);
  if (!brief) return jsonError("Brief not committed yet", 400);

  const { text: guidelinesContext } = await getGuidelinesRepo()
    .assembleGuidelinesContext(client.slug, "financials")
    .catch(() => ({ text: "" }));

  let ai;
  try { ai = getAiClient(); }
  catch (err) { return jsonError(err instanceof Error ? err.message : "AI error", 503); }

  const prompt = `Generate a complete financial model for:

Client: ${client.name}
Vertical: ${client.vertical}
Offer: ${brief.frontmatter.offer}
ICP: ${brief.frontmatter.icp}
KPI: ${brief.frontmatter.kpi}
Budget: ${brief.frontmatter.budget}

${brief.body ? `Additional context:\n${brief.body.slice(0, 2000)}` : ""}

Be realistic. Flag any red flags. Use USD.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(obj: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      }
      try {
        const result = await ai.generate({
          clientId: id,
          module: "financials",
          prompt,
          guidelinesContext: guidelinesContext || undefined,
          maxTokens: 4000,
          temperature: 0.3,
        });
        const parsed = safeJSON(result.text);
        if (!parsed) { send({ type: "error", error: "Could not parse financials JSON" }); return; }
        await getClientRepo().writeArtifact(id, ["densification-pack", "financials.json"], parsed, z.any());
        send({ type: "done", data: parsed });
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
