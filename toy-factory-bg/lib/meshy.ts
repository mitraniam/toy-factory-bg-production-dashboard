const VINYL_BASE_URL = "https://api.meshy.ai/openapi/creative-lab/vinyl-figure/v1";
const RESIZE_BASE_URL = "https://api.meshy.ai/openapi/v1/resize";
const PRINT_BASE_URL = "https://api.meshy.ai/openapi/v1/print/multi-color";

export type MeshyStage = "prototype" | "build";

export type MeshyTask = {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "EXPIRED" | "CANCELED" | string;
  progress?: number;
  task_error?: { message?: string } | null;
  image_urls?: string[];
  thumbnail_url?: string;
  model_urls?: { glb?: string; obj?: string; mtl?: string; "3mf"?: string };
};

function getApiKey() {
  const key = process.env.MESHY_API_KEY;
  if (!key) throw new Error("MESHY_API_KEY is missing on the server.");
  return key;
}

async function meshyFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.message || body?.detail || body?.error || `Meshy request failed with ${response.status}`;
    throw new Error(String(message));
  }
  return body;
}

export async function createPrototype(imageUrlOrDataUri: string): Promise<string> {
  const data = await meshyFetch(`${VINYL_BASE_URL}/prototype`, {
    method: "POST",
    body: JSON.stringify({ image_url: imageUrlOrDataUri }),
  });
  if (!data?.result) throw new Error("Meshy did not return a prototype task id.");
  return data.result;
}

export async function createBuild(prototypeTaskId: string): Promise<string> {
  const data = await meshyFetch(`${VINYL_BASE_URL}/build`, {
    method: "POST",
    body: JSON.stringify({ input_task_id: prototypeTaskId }),
  });
  if (!data?.result) throw new Error("Meshy did not return a build task id.");
  return data.result;
}

export async function getTask(stage: MeshyStage, id: string): Promise<MeshyTask> {
  if (stage !== "prototype" && stage !== "build") throw new Error("Invalid Meshy stage.");
  return meshyFetch(`${VINYL_BASE_URL}/${stage}/${encodeURIComponent(id)}`);
}

export async function createResize(modelUrl: string, heightCm: number): Promise<string> {
  if (!Number.isFinite(heightCm) || heightCm <= 0) throw new Error("Invalid production height.");
  const data = await meshyFetch(RESIZE_BASE_URL, {
    method: "POST",
    body: JSON.stringify({
      model_url: modelUrl,
      resize_height: heightCm / 100,
      origin_at: "bottom",
    }),
  });
  if (!data?.result) throw new Error("Meshy did not return a resize task id.");
  return data.result;
}

export async function getResize(id: string): Promise<MeshyTask> {
  return meshyFetch(`${RESIZE_BASE_URL}/${encodeURIComponent(id)}`);
}

export async function createMultiColorPrint(modelUrl: string): Promise<string> {
  const parsed = Number(process.env.MESHY_PRINT_MAX_COLORS || "8");
  const maxColors = Number.isFinite(parsed) ? Math.min(Math.max(Math.round(parsed), 1), 16) : 8;
  const data = await meshyFetch(PRINT_BASE_URL, {
    method: "POST",
    body: JSON.stringify({ model_url: modelUrl, max_colors: maxColors, style: "cartoon" }),
  });
  if (!data?.result) throw new Error("Meshy did not return a multi-color print task id.");
  return data.result;
}

export async function getMultiColorPrint(id: string): Promise<MeshyTask> {
  return meshyFetch(`${PRINT_BASE_URL}/${encodeURIComponent(id)}`);
}
