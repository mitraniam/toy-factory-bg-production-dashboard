import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

const OBJECT_PATH = "3D/Objects/object_1.model";

function parseNumber(value: string) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`Invalid 3MF coordinate '${value}'.`);
  return number;
}

export function resizeThreeMfToHeight(input: Uint8Array, targetHeightMm: number) {
  if (!Number.isFinite(targetHeightMm) || targetHeightMm <= 0) {
    throw new Error("Invalid 3MF target height.");
  }

  const archive = unzipSync(input);
  const objectBytes = archive[OBJECT_PATH];
  if (!objectBytes) throw new Error(`3MF is missing ${OBJECT_PATH}.`);

  const xml = strFromU8(objectBytes);
  const vertexPattern = /<vertex\s+x="([^"]+)"\s+y="([^"]+)"\s+z="([^"]+)"\s*\/>/g;

  let match: RegExpExecArray | null;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let count = 0;

  while ((match = vertexPattern.exec(xml))) {
    const x = parseNumber(match[1]);
    const y = parseNumber(match[2]);
    const z = parseNumber(match[3]);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    count += 1;
  }

  if (!count || !Number.isFinite(minZ) || !Number.isFinite(maxZ)) {
    throw new Error("Could not read vertices from 3MF geometry.");
  }

  const currentHeightMm = maxZ - minZ;
  if (!(currentHeightMm > 0)) throw new Error("3MF geometry has zero height.");

  const scale = targetHeightMm / currentHeightMm;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const resizedXml = xml.replace(vertexPattern, (_whole, xs: string, ys: string, zs: string) => {
    const x = parseNumber(xs);
    const y = parseNumber(ys);
    const z = parseNumber(zs);
    const nx = centerX + (x - centerX) * scale;
    const ny = centerY + (y - centerY) * scale;
    const nz = minZ + (z - minZ) * scale;
    return `<vertex x="${nx.toFixed(6)}" y="${ny.toFixed(6)}" z="${nz.toFixed(6)}"/>`;
  });

  archive[OBJECT_PATH] = strToU8(resizedXml);
  const output = zipSync(archive, { level: 6 });

  return {
    bytes: output,
    currentHeightMm,
    targetHeightMm,
    scale,
    vertexCount: count,
  };
}
