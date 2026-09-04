const DEFAULT_BUCKET = "toy-assets";
const CHUNKED_PREFIX = "chunked:";
const SINGLE_UPLOAD_THRESHOLD = 24 * 1024 * 1024;
const CHUNK_SIZE = 5 * 1024 * 1024;
const CHUNK_CONCURRENCY = 4;

type ChunkManifest = {
  version: 1;
  type: "popme-chunked-asset";
  contentType: string;
  size: number;
  parts: Array<{ path: string; size: number }>;
};

class StorageUploadError extends Error {
  status: number;
  responseBody: string;

  constructor(status: number, responseBody: string) {
    super(`Could not archive asset to Supabase Storage (${status})${responseBody ? `: ${responseBody}` : ""}`);
    this.status = status;
    this.responseBody = responseBody;
  }
}

function storageConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;
  if (!url || !key) throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing on the server.");
  return { url, key, bucket };
}

function safePathPart(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function encodedObjectPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export function projectAssetPath(projectId: string, filename: string) {
  return `${safePathPart(projectId)}/${safePathPart(filename)}`;
}

export function isChunkedStoragePath(path?: string | null) {
  return Boolean(path?.startsWith(CHUNKED_PREFIX));
}

function toArrayBuffer(bytes: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (bytes instanceof ArrayBuffer) return bytes;
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function isEntityTooLarge(error: unknown) {
  return error instanceof StorageUploadError && /EntityTooLarge|Payload too large|maximum allowed size|"statusCode"\s*:\s*"?413"?/i.test(error.responseBody);
}

async function putObject(path: string, body: BodyInit, contentType: string) {
  const { url, key, bucket } = storageConfig();
  const upload = await fetch(`${url}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedObjectPath(path)}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body,
  });

  if (!upload.ok) {
    const responseBody = await upload.text().catch(() => "");
    throw new StorageUploadError(upload.status, responseBody);
  }
}

async function uploadChunked(path: string, bytes: Uint8Array, contentType: string) {
  const parts: ChunkManifest["parts"] = [];
  const jobs: Array<{ path: string; bytes: Uint8Array }> = [];

  for (let offset = 0, index = 0; offset < bytes.byteLength; offset += CHUNK_SIZE, index += 1) {
    const end = Math.min(offset + CHUNK_SIZE, bytes.byteLength);
    const partPath = `${path}.parts/${String(index).padStart(4, "0")}`;
    const partBytes = bytes.slice(offset, end);
    parts.push({ path: partPath, size: partBytes.byteLength });
    jobs.push({ path: partPath, bytes: partBytes });
  }

  for (let i = 0; i < jobs.length; i += CHUNK_CONCURRENCY) {
    const batch = jobs.slice(i, i + CHUNK_CONCURRENCY);
    await Promise.all(
      batch.map((job) =>
        putObject(job.path, new Blob([toArrayBuffer(job.bytes)], { type: "application/octet-stream" }), "application/octet-stream")
      )
    );
  }

  const manifest: ChunkManifest = {
    version: 1,
    type: "popme-chunked-asset",
    contentType,
    size: bytes.byteLength,
    parts,
  };
  const manifestPath = `${path}.manifest.json`;
  await putObject(manifestPath, JSON.stringify(manifest), "application/json");

  console.info("Archived oversized asset as chunks", {
    path,
    manifestPath,
    bytes: bytes.byteLength,
    parts: parts.length,
  });

  return `${CHUNKED_PREFIX}${manifestPath}`;
}

async function uploadBytes(path: string, bytes: ArrayBuffer | Uint8Array, contentType: string) {
  const array = new Uint8Array(toArrayBuffer(bytes));

  // Keep normal Storage objects for small files. Large Meshy GLB/3MF files can
  // exceed a Supabase bucket's per-object limit, so archive them as private
  // 5 MB chunks with a tiny manifest instead of failing the production flow.
  if (array.byteLength > SINGLE_UPLOAD_THRESHOLD) {
    return uploadChunked(path, array, contentType);
  }

  try {
    await putObject(path, new Blob([array.buffer], { type: contentType }), contentType);
    return path;
  } catch (error) {
    if (!isEntityTooLarge(error)) throw error;
    return uploadChunked(path, array, contentType);
  }
}

export async function archiveBytes(input: {
  projectId: string;
  bytes: ArrayBuffer | Uint8Array;
  filename: string;
  contentType?: string;
}) {
  const path = projectAssetPath(input.projectId, input.filename);
  return uploadBytes(path, input.bytes, input.contentType || "application/octet-stream");
}

export async function archiveRemoteAsset(input: {
  projectId: string;
  sourceUrl: string;
  filename: string;
  contentType?: string;
}) {
  const remote = await fetch(input.sourceUrl, { cache: "no-store" });
  if (!remote.ok) throw new Error(`Could not download asset (${remote.status}).`);

  const bytes = await remote.arrayBuffer();
  const contentType = input.contentType || remote.headers.get("content-type") || "application/octet-stream";
  const path = projectAssetPath(input.projectId, input.filename);
  return uploadBytes(path, bytes, contentType);
}

async function fetchPrivateObject(path: string) {
  const { url, key, bucket } = storageConfig();
  const response = await fetch(
    `${url}/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${encodedObjectPath(path)}`,
    {
      method: "GET",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const responseBody = await response.text().catch(() => "");
    throw new Error(
      `Could not read private asset from Supabase Storage (${response.status})${responseBody ? `: ${responseBody}` : ""}`
    );
  }

  return response;
}

function validManifest(value: unknown): value is ChunkManifest {
  if (!value || typeof value !== "object") return false;
  const item = value as ChunkManifest;
  return (
    item.version === 1 &&
    item.type === "popme-chunked-asset" &&
    typeof item.contentType === "string" &&
    Number.isFinite(item.size) &&
    Array.isArray(item.parts) &&
    item.parts.every((part) => typeof part?.path === "string" && Number.isFinite(part?.size))
  );
}

/**
 * Fetches a private Storage object server-to-server with the service role.
 * Chunked objects are reassembled as a streaming Response, so admin downloads
 * and temporary Meshy inputs still receive a normal GLB/3MF byte stream.
 */
export async function fetchPrivateAsset(path: string) {
  if (!isChunkedStoragePath(path)) return fetchPrivateObject(path);

  const manifestPath = path.slice(CHUNKED_PREFIX.length);
  const manifestResponse = await fetchPrivateObject(manifestPath);
  const manifest = await manifestResponse.json().catch(() => null);
  if (!validManifest(manifest)) throw new Error("Invalid chunked asset manifest.");

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (const part of manifest.parts) {
          const response = await fetchPrivateObject(part.path);
          if (!response.body) throw new Error(`Storage chunk has no body: ${part.path}`);
          const reader = response.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) controller.enqueue(value);
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": manifest.contentType || "application/octet-stream",
      "Content-Length": String(manifest.size),
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

async function deleteObjects(paths: string[]) {
  if (!paths.length) return;
  const { url, key, bucket } = storageConfig();
  const response = await fetch(`${url}/storage/v1/object/${encodeURIComponent(bucket)}`, {
    method: "DELETE",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefixes: paths }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Could not delete Storage objects (${response.status})${body ? `: ${body}` : ""}`);
  }
}

/**
 * Permanently deletes one archived asset, including every chunk of a chunked
 * upload. Missing objects are not an error — deletion must be idempotent so
 * retention runs and GDPR erasure requests can be repeated safely.
 */
export async function deleteArchivedAsset(path: string) {
  if (!isChunkedStoragePath(path)) {
    await deleteObjects([path]);
    return 1;
  }

  const manifestPath = path.slice(CHUNKED_PREFIX.length);
  let parts: ChunkManifest["parts"] = [];
  try {
    const manifestResponse = await fetchPrivateObject(manifestPath);
    const manifest = await manifestResponse.json().catch(() => null);
    if (validManifest(manifest)) parts = manifest.parts;
  } catch {
    // Manifest already gone; still try to remove it below.
  }

  await deleteObjects([...parts.map((part) => part.path), manifestPath]);
  return parts.length + 1;
}

export async function createSignedAssetUrl(path: string, expiresIn = 3600) {
  if (isChunkedStoragePath(path)) {
    throw new Error("Chunked assets require the temporary POPME asset proxy instead of a Supabase signed URL.");
  }

  const { url, key, bucket } = storageConfig();
  const response = await fetch(`${url}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodedObjectPath(path)}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn }),
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.signedURL) {
    throw new Error(body?.message || `Could not create signed asset URL (${response.status}).`);
  }
  return `${url}/storage/v1${body.signedURL}`;
}
