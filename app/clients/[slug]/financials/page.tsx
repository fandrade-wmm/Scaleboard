import { notFound } from "next/navigation";
import { getClientRepo, ClientNotFoundError } from "@/lib/repo";
import { FinancialsView } from "@/components/financials/FinancialsView";
import { z } from "zod";

export default async function FinancialsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const client = await getClientRepo().getClient(slug);
    const brief = await getClientRepo().getBrief(client.id);
    const data = await getClientRepo()
      .readArtifact(client.id, ["densification-pack", "financials.json"], z.any())
      .catch(() => null);
    return (
      <main className="p-6 max-w-5xl mx-auto">
        <FinancialsView client={client} brief={brief} initialData={data} />
      </main>
    );
  } catch (err) {
    if (err instanceof ClientNotFoundError) notFound();
    throw err;
  }
}
