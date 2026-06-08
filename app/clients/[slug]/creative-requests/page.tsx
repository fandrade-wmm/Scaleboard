import { notFound } from "next/navigation";
import { getClientRepo, ClientNotFoundError } from "@/lib/repo";
import { CreativeRequestView } from "@/components/creative-request/CreativeRequestView";
import { z } from "zod";

export default async function CreativeRequestsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const client = await getClientRepo().getClient(slug);
    const brief = await getClientRepo().getBrief(client.id);
    const angles = await getClientRepo()
      .readArtifact(client.id, ["densification-pack", "angles.json"], z.array(z.any()))
      .catch(() => null);
    const savedList = await getClientRepo().listArtifacts(client.id, "creative-requests").catch(() => []);
    return (
      <main className="p-6 max-w-6xl mx-auto">
        <CreativeRequestView
          client={client}
          brief={brief}
          angles={(angles as Record<string, unknown>[] | null) ?? []}
          savedList={savedList}
        />
      </main>
    );
  } catch (err) {
    if (err instanceof ClientNotFoundError) notFound();
    throw err;
  }
}
