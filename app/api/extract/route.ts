import { NextResponse, type NextRequest } from "next/server";
import { extractFromBuffer, UnsupportedFileError } from "@/lib/extract/extract-text";
import { requireApiPermission, jsonError } from "@/lib/api/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export async function POST(req: NextRequest) {
  const gate = await requireApiPermission("brief.edit");
  if ("error" in gate) return gate.error;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return jsonError("Missing 'file' upload", 400);
  if (file.size === 0) return jsonError("Empty file", 400);
  if (file.size > MAX_BYTES) return jsonError("File too large (max 15 MB)", 413);

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const extracted = await extractFromBuffer(file.name, file.type, buffer);
    return NextResponse.json(extracted);
  } catch (err) {
    if (err instanceof UnsupportedFileError) return jsonError(err.message, 415);
    return jsonError(err instanceof Error ? err.message : String(err), 500);
  }
}
