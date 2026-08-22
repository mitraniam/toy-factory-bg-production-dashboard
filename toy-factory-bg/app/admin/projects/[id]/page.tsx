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

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  const meta = STATUS_META[project.status];

  return (
    <main className="admin-shell project-shell">
      <div className="project-back"><Link href="/admin/dashboard">← Всички поръчки</Link></div>
      <section className="project-title-row">
        <div><p className="admin-kicker">PROJECT TF-{shortId(project.id)}</p><h1>{project.shopify_order_name || "Unpaid project"}</h1><p>{project.customer_name || "Клиентът ще се появи след orders/paid"} · {project.size_cm} cm · €{Number(project.price_eur).toFixed(2)}</p></div>
        <span className={`status-chip big ${meta.tone}`}>{meta.label}</span>
      </section>

      {project.last_error && <section className="project-alert"><strong>Needs attention</strong><p>{project.last_error}</p></section>}

      <section className="project-grid">
        <div className="project-card preview-card">
          <div className="project-card-head"><span>Approved preview</span><small>Meshy prototype</small></div>
          {/* External Meshy asset URL; Next/Image is intentionally avoided. */}
          <img src={project.preview_url} alt="Approved vinyl figure preview" />
        </div>

        <div className="project-card">
          <div className="project-card-head"><span>Production files</span><small>Generated after payment</small></div>
          <div className="file-list">
            <div><div><strong>GLB 3D model</strong><small>{project.build_task_id || "Build not started"}</small></div>{project.glb_url ? <a href={project.glb_url} target="_blank" rel="noreferrer">Open GLB ↗</a> : <span>Not ready</span>}</div>
            <div><div><strong>Multi-color 3MF</strong><small>{project.print_task_id || "Print task not started"}</small></div>{project.three_mf_url ? <a href={project.three_mf_url} target="_blank" rel="noreferrer">Download 3MF ↗</a> : <span>Not ready</span>}</div>
          </div>
          <p className="file-note">Meshy asset links can be time-limited. If a link expires, press “Check Meshy status” to refresh the latest task output URL.</p>
        </div>

        <div className="project-card details-card">
          <div className="project-card-head"><span>Order details</span><small>Shopify + project data</small></div>
          <dl>
            <div><dt>Project ID</dt><dd>{project.id}</dd></div>
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
          <ProjectActions projectId={project.id} status={project.status} notes={project.production_notes} trackingNumber={project.tracking_number} />
        </div>
      </section>
    </main>
  );
}
