const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export function validateImageFile(
  file: Pick<File, "type" | "size">,
): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type))
    return "Choose a JPEG, PNG, or WebP image.";
  if (file.size > 10_000_000) return "Choose an image smaller than 10 MB.";
  return null;
}

export async function compressImage(
  file: File,
  maxDimension: number,
  maxBytes: number,
): Promise<string> {
  const validation = validateImageFile(file);
  if (validation) throw new Error(validation);
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    maxDimension / Math.max(bitmap.width, bitmap.height),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not prepare the image.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.84, 0.72, 0.6, 0.48]) {
    const result = canvas.toDataURL("image/jpeg", quality);
    if (Math.ceil(result.length * 0.75) <= maxBytes) return result;
  }
  throw new Error(
    "The compressed image is still too large. Choose a smaller photo.",
  );
}
