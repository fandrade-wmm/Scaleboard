import mammoth from "mammoth";

export type SupportedKind = "pdf" | "docx" | "text";

export interface ExtractedDoc {
  kind: SupportedKind;
  text: string;
  filename: string;
}

export class UnsupportedFileError extends Error {
  constructor(public readonly filename: string, public readonly mime: string) {
    super(`Unsupported file: ${filename} (${mime})`);
    this.name = "UnsupportedFileError";
  }
}

const PDF_EXT = /\.pdf$/i;
const DOCX_EXT = /\.docx$/i;
const DOC_EXT = /\.doc$/i; // legacy .doc not supported
const TXT_EXT = /\.(md|markdown|txt)$/i;

export function detectKind(filename: string, mime: string): SupportedKind {
  if (mime === "application/pdf" || PDF_EXT.test(filename)) return "pdf";
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    DOCX_EXT.test(filename)
  ) {
    return "docx";
  }
  if (mime.startsWith("text/") || TXT_EXT.test(filename)) return "text";
  if (DOC_EXT.test(filename)) {
    throw new UnsupportedFileError(
      filename,
      "legacy .doc — please save as .docx",
    );
  }
  throw new UnsupportedFileError(filename, mime || "unknown");
}

export async function extractFromBuffer(
  filename: string,
  mime: string,
  buffer: Buffer,
): Promise<ExtractedDoc> {
  const kind = detectKind(filename, mime);
  if (kind === "pdf") {
    // pdf-parse exports differently in CJS vs ESM — handle both
    const pdfMod = await import("pdf-parse");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse: (buf: Buffer) => Promise<{ text: string }> = (pdfMod as any).default ?? pdfMod;
    const result = await pdfParse(buffer);
    return { kind, filename, text: normalize(result.text) };
  }
  if (kind === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return { kind, filename, text: normalize(result.value) };
  }
  return { kind: "text", filename, text: normalize(buffer.toString("utf8")) };
}

function normalize(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
