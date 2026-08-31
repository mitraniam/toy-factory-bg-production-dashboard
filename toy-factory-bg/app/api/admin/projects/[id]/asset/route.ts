import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getProject } from "@/lib/projects";
import { fetchPrivateAsset } from "@/lib/storage";

export const dynamic = "force-dynamic";

type AssetKind = "glb" | "3mf";

const ASSETS: Record<AssetKind, { field: "glb_storage_path" | "three_mf_storage_path"; filename: string; contentType: string }> = {
  glb: { field: "glb_storage_path", filename: "model.glb", contentType: "model/gltf-binary" },
  "3mf": { field: "three_mf_storage_path", filename: "model.3mf", contentType: "model/3mf" },
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const kind = request.nextUrl.searchParams.get("kind") as AssetKind | null;
  if (!kind || !(kind in ASSETS)) {
    return NextResponse.json({ error: "Invalid asset kind" }, { status: 400 });
  }

  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const config = ASSETS[kind];
  const path = project[config.field];
  if (!path) return NextResponse.json({ error: "Asset is not archived yet" }, { status: 404 });

  try {
    const storageResponse = await fetchPrivateAsset(path);
    const bytes = await storageResponse.arrayBuffer();
    const contentType = storageResponse.headers.get("content-type") || config.contentType;
    const filename = `POPME-${project.shopify_order_name?.replace(/[^a-zA-Z0-9_-]/g, "") || project.id.slice(0, 8)}-${project.size_cm}cm.${kind}`;

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Admin asset download failed", { projectId: id, kind, error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not download asset" },
      { status: 502 }
    );
  }
}
