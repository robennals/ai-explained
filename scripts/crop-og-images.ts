// Auto-crops whitespace from OG images, then re-pads them back to the
// original 2400x1260 (1200x630 logical) canvas so social platforms still
// receive the standard aspect ratio.
//
// Usage:
//   pnpm og:crop                   # crop all chapter PNGs in public/og/
//   pnpm og:crop -- attention.png  # crop a specific file
//
// Skips site.png — that one is a deliberately-positioned branded card.
//
// Strategy: sharp.trim() removes pixels matching the top-left corner up to
// a tolerance (so near-white anti-aliased edges still trim). We then extend
// the trimmed image back to the canvas with a margin, white background.

import sharp from "sharp";
import { readdir } from "node:fs/promises";
import path from "node:path";

const OG_DIR = path.resolve(process.cwd(), "public/og");
const CANVAS_WIDTH = 2400;
const CANVAS_HEIGHT = 1260;
const MARGIN = 32; // px of breathing room around content (in 2x pixels)
const TRIM_THRESHOLD = 12; // 0–255; how far from top-left pixel still counts as "background"
const SKIP = new Set(["site.png"]);

async function cropOne(file: string) {
  const inPath = path.join(OG_DIR, file);
  const original = sharp(inPath);
  const meta = await original.metadata();
  if (!meta.width || !meta.height) {
    console.warn(`  skipping ${file} — could not read dimensions`);
    return;
  }

  // Trim near-white borders. Buffer the result so we can read its size.
  const trimmed = await sharp(inPath)
    .trim({ threshold: TRIM_THRESHOLD })
    .toBuffer({ resolveWithObject: true });

  const { width: tw, height: th } = trimmed.info;
  if (!tw || !th) {
    console.warn(`  skipping ${file} — trim produced no content`);
    return;
  }

  // Scale the trimmed content to fill the canvas (minus a small margin),
  // preserving aspect ratio so nothing is cropped. Upscaling is fine —
  // sharp's lanczos3 default keeps it sharp enough for share-image use.
  const maxW = CANVAS_WIDTH - 2 * MARGIN;
  const maxH = CANVAS_HEIGHT - 2 * MARGIN;
  const scale = Math.min(maxW / tw, maxH / th);
  const targetW = Math.round(tw * scale);
  const targetH = Math.round(th * scale);

  const resized = await sharp(trimmed.data)
    .resize(targetW, targetH, { fit: "inside" })
    .toBuffer();

  // Center the resized content on a white 2400x1260 canvas.
  await sharp({
    create: {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([
      {
        input: resized,
        top: Math.round((CANVAS_HEIGHT - targetH) / 2),
        left: Math.round((CANVAS_WIDTH - targetW) / 2),
      },
    ])
    .png()
    .toFile(inPath);

  console.log(
    `  ${file}: trimmed ${meta.width}x${meta.height} → content ${tw}x${th} → fit ${targetW}x${targetH}`,
  );
}

async function main() {
  const onlyArgs = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  let files: string[];
  if (onlyArgs.length > 0) {
    files = onlyArgs.map((f) => path.basename(f));
  } else {
    const entries = await readdir(OG_DIR);
    files = entries.filter((f) => f.endsWith(".png") && !SKIP.has(f));
  }

  console.log(`Cropping ${files.length} OG image(s)…`);
  for (const file of files) {
    if (SKIP.has(file)) {
      console.log(`  skipping ${file} (branded card)`);
      continue;
    }
    await cropOne(file);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
