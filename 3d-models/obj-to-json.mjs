#!/usr/bin/env node
/**
 * Convert OBJ + MTL to JSON model data for the Transform3D SVG renderer.
 * Usage: node obj-to-json.mjs chicken/Chicken_01.obj
 *        node obj-to-json.mjs shiba/model.obj --palette "c8946b,ffffff,272520,c8946b"
 * Output: writes a .json file with compact { label, v, f } format.
 */

import { readFileSync, writeFileSync } from "fs";
import { dirname, join, basename } from "path";

const args = process.argv.slice(2);
const objPath = args[0];
if (!objPath) {
  console.error("Usage: node obj-to-json.mjs <file.obj> [--palette 'hex,hex,hex,hex']");
  process.exit(1);
}

// Optional: --palette "topLeft,topRight,bottomLeft,bottomRight" for texture-mapped models
let palette = null;
const paletteIdx = args.indexOf("--palette");
if (paletteIdx >= 0 && args[paletteIdx + 1]) {
  const colors = args[paletteIdx + 1].split(",").map((c) => (c.startsWith("#") ? c : `#${c}`));
  if (colors.length === 4) {
    palette = colors; // [topLeft, topRight, bottomLeft, bottomRight]
    console.log("Using palette:", palette);
  }
}

const objDir = dirname(objPath);
const objText = readFileSync(objPath, "utf-8");

// --- Parse MTL ---
const mtlMatch = objText.match(/^mtllib\s+(.+)$/m);
const materials = {};
if (mtlMatch) {
  const mtlPath = join(objDir, mtlMatch[1].trim());
  try {
    const mtlText = readFileSync(mtlPath, "utf-8");
    let currentMtl = null;
    for (const line of mtlText.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("newmtl ")) {
        currentMtl = trimmed.slice(7).trim();
      } else if (trimmed.startsWith("Kd ") && currentMtl) {
        const parts = trimmed.slice(3).trim().split(/\s+/).map(Number);
        const r = Math.round(parts[0] * 255);
        const g = Math.round(parts[1] * 255);
        const b = Math.round(parts[2] * 255);
        materials[currentMtl] = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
      }
    }
  } catch (e) {
    console.warn("Could not read MTL file:", e.message);
  }
}

console.log("Materials:", materials);

// --- Parse OBJ ---
const vertices = [];
const uvs = [];
const faces = [];
let currentColor = "#888888";

function samplePalette(u, v) {
  // palette: [topLeft, topRight, bottomLeft, bottomRight]
  // UV: u=0..1 left..right, v=0..1 bottom..top
  // Image: row 0 = top, so v>0.5 = top of image
  const col = u >= 0.5 ? 1 : 0;
  const row = v >= 0.5 ? 0 : 1; // v>0.5 = top of image = row 0
  return palette[row * 2 + col];
}

for (const line of objText.split("\n")) {
  const trimmed = line.trim();
  if (trimmed.startsWith("v ") && !trimmed.startsWith("vt") && !trimmed.startsWith("vn")) {
    const parts = trimmed.slice(2).trim().split(/\s+/).map(Number);
    vertices.push(parts);
  } else if (trimmed.startsWith("vt ")) {
    const parts = trimmed.slice(3).trim().split(/\s+/).map(Number);
    uvs.push(parts);
  } else if (trimmed.startsWith("usemtl ")) {
    const mtlName = trimmed.slice(7).trim();
    currentColor = materials[mtlName] || `#${mtlName}`;
  } else if (trimmed.startsWith("f ")) {
    const tokens = trimmed.slice(2).trim().split(/\s+/);
    const vertIndices = [];
    const uvIndices = [];

    for (const token of tokens) {
      const parts = token.split("/");
      vertIndices.push(parseInt(parts[0], 10) - 1);
      if (parts[1]) uvIndices.push(parseInt(parts[1], 10) - 1);
    }

    // Determine face color
    let faceColor = currentColor;
    if (palette && uvIndices.length > 0) {
      // Average UVs to determine which palette region
      let avgU = 0, avgV = 0;
      for (const ui of uvIndices) {
        if (ui >= 0 && ui < uvs.length) {
          avgU += uvs[ui][0];
          avgV += uvs[ui][1];
        }
      }
      avgU /= uvIndices.length;
      avgV /= uvIndices.length;
      faceColor = samplePalette(avgU, avgV);
    }

    // Triangulate fan-style for faces with more than 3 vertices
    for (let i = 1; i < vertIndices.length - 1; i++) {
      faces.push({
        verts: [vertIndices[0], vertIndices[i], vertIndices[i + 1]],
        color: faceColor,
      });
    }
  }
}

console.log(`Parsed ${vertices.length} vertices, ${uvs.length} UVs, ${faces.length} triangles`);

// --- Normalize: center at origin, scale to fit in [-1, 1] ---
let minX = Infinity, minY = Infinity, minZ = Infinity;
let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

for (const [x, y, z] of vertices) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const cx = (minX + maxX) / 2;
const cy = (minY + maxY) / 2;
const cz = (minZ + maxZ) / 2;
const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
const scale = 2 / span;

const normVerts = vertices.map(([x, y, z]) => [
  +((x - cx) * scale).toFixed(4),
  +((y - cy) * scale).toFixed(4),
  +((z - cz) * scale).toFixed(4),
]);

console.log(`Bounds: x[${minX.toFixed(1)}, ${maxX.toFixed(1)}], y[${minY.toFixed(1)}, ${maxY.toFixed(1)}], z[${minZ.toFixed(1)}, ${maxZ.toFixed(1)}]`);
console.log(`Center: (${cx.toFixed(1)}, ${cy.toFixed(1)}, ${cz.toFixed(1)}), span: ${span.toFixed(1)}`);

// --- Output compact format ---
const output = {
  label: basename(objPath, ".obj").replace(/_\d+$/, "").replace(/^.*_/, ""),
  v: normVerts.map(v => v.map(n => +n.toFixed(3))),
  f: faces.map(f => ({ v: f.verts, c: f.color })),
};

const outPath = objPath.replace(/\.obj$/i, ".json");
writeFileSync(outPath, JSON.stringify(output));
console.log(`Wrote ${outPath} (${JSON.stringify(output).length} bytes)`);
