/**
 * Reads an image File and returns a compressed base64 data URL.
 * Resizes to maxDim (keeping aspect ratio) and encodes as JPEG to keep
 * localStorage usage low. Good for the love-album use case.
 */
export async function fileToCompressedDataUrl(
  file: File,
  maxDim = 1200,
  quality = 0.82,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Arquivo precisa ser uma imagem");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não suportado");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  // PNG for transparent, JPEG otherwise (much smaller)
  const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
  return canvas.toDataURL(mime, quality);
}

export function approxKbFromDataUrl(dataUrl: string): number {
  // base64 string ~= 4/3 the bytes
  const base64 = dataUrl.split(",")[1] || "";
  return Math.round((base64.length * 3) / 4 / 1024);
}
