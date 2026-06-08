import { notFound } from "next/navigation";
import { getClientRepo, ClientNotFoundError } from "@/lib/repo";
import { StrategyView } from "@/components/strategy/StrategyView";

export default async function StrategyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const client = await getClientRepo().getClient(slug);
    const brief = await getClientRepo().getBrief(client.id);
    const { z } = await import("zod");
    const repo = getClientRepo();
    const [angles, hooks, channels, lp, journey] = await Promise.all([
      repo.readArtifact(client.id, ["densification-pack", "angles.json"], z.array(z.any())).catch(() => null),
      repo.readArtifact(client.id, ["densification-pack", "hooks.json"], z.array(z.any())).catch(() => null),
      repo.readArtifact(client.id, ["densification-pack", "channels.json"], z.any()).catch(() => null),
      repo.readArtifact(client.id, ["densification-pack", "landing-page.json"], z.any()).catch(() => null),
      repo.readArtifact(client.id, ["densification-pack", "user-journey.json"], z.any()).catch(() => null),
    ]);
    return (
      <main className="p-6 max-w-6xl mx-auto">
        <StrategyView
          client={client}
          brief={brief}
          initialAngles={angles as never[] | null}
          initialHooks={hooks as never[] | null}
          initialChannels={channels}
          initialLp={lp}
          initialJourney={journey}
        />
      </main>
    );
  } catch (err) {
    if (err instanceof ClientNotFoundError) notFound();
    throw err;
  }
}
