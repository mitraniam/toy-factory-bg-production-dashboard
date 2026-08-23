const DEFAULT_BUCKET = "toy-assets";

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

export function projectAssetPath(projectId: string, filename: string) {
  return `${safePathPart(projectId)}/${safePathPart(filename)}`;
}

function toArrayBuffer(bytes: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (bytes instanceof ArrayBuffer) return bytes;
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function uploadBytes(path: string, bytes: ArrayBuffer | Uint8Array, contentType: string) {
  const { url, key, bucket } = storageConfig();
  const body = new Blob([toArrayBuffer(bytes)], { type: contentType });

  const upload = await fetch(`${url}/storage/v1/object/${encodeURIComponent(bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`, {
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
    throw new Error(`Could not archive asset to Supabase Storage (${upload.status})${responseBody ? `: ${responseBody}` : ""}`);
  }

  return path;
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

export async function createSignedAssetUrl(path: string, expiresIn = 3600) {
  const { url, key, bucket } = storageConfig();
  const response = await fetch(`${url}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`, {
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
