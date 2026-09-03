import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

/**
 * Post-processes a Meshy multi-color 3MF so the printed figure is exactly the
 * ordered height. 3MF uses Z-up millimetres, so height = Z extent.
 *
 * The scaling is a plain vertex rewrite, which is only correct when the whole
 * geometry lives in ONE model part with NO placement transforms. Anything else
 * (several model parts, <components>, or a non-identity <item transform>)
 * would be scaled partially or not at all, producing a wrong-sized or
 * deformed print. Those files are rejected with an explicit error so the
 * operator scales them manually in the slicer instead of trusting the output.
 */

const MODEL_PART_PATTERN = /^3D\/.*\.model$/i;
const IDENTITY_TRANSFORM = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
const TRANSFORM_EPSILON = 1e-6;

/** Files already within this relative tolerance of the target are still rewritten, but logged as a no-op. */
export const HEIGHT_TOLERANCE = 0.02;

export class ThreeMfUnsupportedError extends Error {
  constructor(reason: string) {
    super(
      `3MF needs manual scaling in the slicer: ${reason}. Download the Meshy 3MF and set the height to the ordered size by hand.`
    );
    this.name = "ThreeMfUnsupportedError";
  }
}

function parseNumber(value: string) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`Invalid 3MF coordinate '${value}'.`);
  return number;
}

function findModelPart(archive: Record<string, Uint8Array>) {
  const parts = Object.keys(archive).filter((name) => MODEL_PART_PATTERN.test(name));
  if (parts.length === 0) throw new Error("3MF contains no 3D/*.model part.");
  if (parts.length > 1) {
    throw new ThreeMfUnsupportedError(`archive has ${parts.length} model parts (${parts.join(", ")})`);
  }
  return parts[0];
}

function isIdentityTransform(value: string) {
  const numbers = value.trim().split(/\s+/).map(Number);
  if (numbers.length !== 12 || numbers.some((n) => !Number.isFinite(n))) return false;
  return numbers.every((n, i) => Math.abs(n - IDENTITY_TRANSFORM[i]) < TRANSFORM_EPSILON);
}

function assertPlainGeometry(xml: string) {
  if (/<components?\b/i.test(xml)) {
    throw new ThreeMfUnsupportedError("model uses <components> (assembled objects)");
  }

  const transformPattern = /<(item|component)\b[^>]*\btransform="([^"]*)"/gi;
  let match: RegExpExecArray | null;
  while ((match = transformPattern.exec(xml))) {
    if (!isIdentityTransform(match[2])) {
      throw new ThreeMfUnsupportedError(`<${match[1]}> has a non-identity transform "${match[2]}"`);
    }
  }

  const objectCount = (xml.match(/<object\b/gi) || []).length;
  const meshCount = (xml.match(/<mesh\b/gi) || []).length;
  if (objectCount === 0 || meshCount === 0) throw new Error("3MF model part has no mesh geometry.");
  return { objectCount, meshCount };
}

export function resizeThreeMfToHeight(input: Uint8Array, targetHeightMm: number) {
  if (!Number.isFinite(targetHeightMm) || targetHeightMm <= 0) {
    throw new Error("Invalid 3MF target height.");
  }

  const archive = unzipSync(input);
  const objectPath = findModelPart(archive);
  const xml = strFromU8(archive[objectPath]);
  const { objectCount, meshCount } = assertPlainGeometry(xml);

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
  const alreadyCorrect = Math.abs(scale - 1) <= HEIGHT_TOLERANCE;
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

  archive[objectPath] = strToU8(resizedXml);
  const output = zipSync(archive, { level: 6 });

  return {
    bytes: output,
    objectPath,
    objectCount,
    meshCount,
    currentHeightMm,
    targetHeightMm,
    scale,
    alreadyCorrect,
    vertexCount: count,
  };
}
