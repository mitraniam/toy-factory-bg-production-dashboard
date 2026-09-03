import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProjectActions } from "@/components/admin/admin-actions";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getProject } from "@/lib/projects";
import { STATUS_META } from "@/lib/status";

export const dynamic = "force-dynamic";

function date(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("bg-BG", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Sofia" }).format(new Date(value));
}
function shortId(id: string) { return id.slice(0, 8).toUpperCase(); }
function modelLabel(value?: string | null) { return (value || "pop").toUpperCase(); }

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  const meta = STATUS_META[project.status];
  const model = modelLabel(project.model_kind);

  const canRecoverGlb = Boolean(project.glb_storage_path || project.resize_task_id || project.build_task_id || project.glb_url);
  const hasArchivedThreeMf = Boolean(project.three_mf_storage_path);
  const canRegenerateThreeMf = Boolean(!hasArchivedThreeMf && canRecoverGlb && project.status !== "PRINT_FILE_GENERATING");
  const glbLink = canRecoverGlb ? `/api/admin/projects/${project.id}/asset?kind=glb` : null;
  const threeMfLink = hasArchivedThreeMf ? `/api/admin/projects/${project.id}/asset?kind=3mf` : null;
  const previewLink = `/api/admin/projects/${project.id}/preview`;

  return (
    <main className="admin-shell project-shell">
      <div className="project-back"><Link href="/admin/dashboard">← Всички поръчки</Link></div>
      <section className="project-title-row">
        <div>
          <p className="admin-kicker">PROJECT TF-{shortId(project.id)}</p>
          <h1>{project.shopify_order_name || "Unpaid project"}</h1>
          <p>{project.customer_name || "Клиентът ще се появи след orders/paid"} · <strong>{model}</strong> · {project.size_cm} cm · €{Number(project.price_eur).toFixed(2)}</p>
        </div>
        <span className={`status-chip big ${meta.tone}`}>{meta.label}</span>
      </section>

      {project.last_error && <section className="project-alert"><strong>Needs attention</strong><p>{project.last_error}</p></section>}

      <section className="project-grid">
        <div className="project-card preview-card">
          <div className="project-card-head"><span>Approved preview</span><small>Meshy {model} prototype</small></div>
          <img src={previewLink} alt={`Approved ${model} figure preview`} />
          <p className="file-note">При стар проект preview-то се възстановява от Meshy при първо отваряне и после се пази в private Supabase Storage.</p>
        </div>

        <div className="project-card">
          <div className="project-card-head"><span>Production files</span><small>Private permanent archive</small></div>
          <div className="file-list">
            <div><div><strong>GLB 3D model</strong><small>{project.glb_storage_path ? "Archived in Supabase Storage" : project.resize_task_id || project.build_task_id || "Build not started"}</small></div>{glbLink ? <a href={glbLink}>Download GLB ↓</a> : <span>Not ready</span>}</div>
            <div><div><strong>Multi-color 3MF</strong><small>{hasArchivedThreeMf ? "Archived in Supabase Storage" : project.status === "PRINT_FILE_GENERATING" ? "Regenerating in Meshy…" : "Legacy file not archived"}</small></div>{threeMfLink ? <a href={threeMfLink}>Download 3MF ↓</a> : project.status === "PRINT_FILE_GENERATING" ? <span>Generating…</span> : <span>Regenerate required</span>}</div>
          </div>
          <p className="file-note">Старите Meshy 3MF линкове могат да изтекат и да върнат 403. Ако няма архивиран 3MF, използвай Regenerate expired 3MF в Production control.</p>
        </div>

        <div className="project-card details-card">
          <div className="project-card-head"><span>Order details</span><small>Shopify + project data</small></div>
          <dl>
            <div><dt>Project ID</dt><dd>{project.id}</dd></div>
            <div><dt>Model</dt><dd><strong>{model}</strong></dd></div>
            <div><dt>Size</dt><dd>{project.size_cm} cm</dd></div>
            <div><dt>Shopify order</dt><dd>{project.shopify_order_name || "—"}</dd></div>
            <div><dt>Customer</dt><dd>{project.customer_name || "—"}</dd></div>
            <div><dt>Email</dt><dd>{project.customer_email || "—"}</dd></div>
            <div><dt>Shipping city</dt><dd>{project.shipping_city || "—"}</dd></div>
            <div><dt>Paid</dt><dd>{date(project.paid_at)}</dd></div>
            <div><dt>Created</dt><dd>{date(project.created_at)}</dd></div>
            <div><dt>Updated</dt><dd>{date(project.updated_at)}</dd></div>
          </dl>
        </div>

        <div className="project-card actions-card">
          <div className="project-card-head"><span>Production control</span><small>Internal only</small></div>
          <ProjectActions
            projectId={project.id}
            status={project.status}
            notes={project.production_notes}
            trackingNumber={project.tracking_number}
            trackingCompany={project.tracking_company}
            fulfillmentId={project.shopify_fulfillment_id}
            canRegenerateThreeMf={canRegenerateThreeMf}
          />
        </div>
      </section>
    </main>
  );
}
