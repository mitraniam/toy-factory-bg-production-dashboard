import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/admin/logout-button";
import { SyncAllButton } from "@/components/admin/admin-actions";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getIntegrationChecks } from "@/lib/integrations";
import { listProjects, PROJECT_STATUSES, ProjectStatus } from "@/lib/projects";
import { STATUS_META } from "@/lib/status";

export const dynamic = "force-dynamic";

function shortId(id: string) { return id.slice(0, 8).toUpperCase(); }
function date(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("bg-BG", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Sofia" }).format(new Date(value));
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const params = await searchParams;
  const rawStatus = typeof params.status === "string" ? params.status : "";
  const status = PROJECT_STATUSES.includes(rawStatus as ProjectStatus) ? (rawStatus as ProjectStatus) : undefined;
  const q = typeof params.q === "string" ? params.q : "";
  const projects = await listProjects({ status, q, limit: 150 });
  const allForStats = status || q ? await listProjects({ limit: 250 }) : projects;
  const checks = getIntegrationChecks();

  const stats = {
    paid: allForStats.filter((p) => Boolean(p.paid_at)).length,
    ai: allForStats.filter((p) => ["PAID_BUILD_STARTING", "3D_GENERATING", "PRINT_FILE_GENERATING"].includes(p.status)).length,
    ready: allForStats.filter((p) => p.status === "READY_FOR_PRINT").length,
    production: allForStats.filter((p) => ["PRINTING", "PRINTED", "PACKED"].includes(p.status)).length,
  };

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div><Link href="/admin/dashboard" className="admin-brand">TF / OPS</Link><span>Production</span></div>
        <div className="admin-topbar-actions"><SyncAllButton /><LogoutButton /></div>
      </header>

      <section className="admin-page-heading">
        <div><p className="admin-kicker">OPERATIONS</p><h1>Поръчки и производство</h1><p>Shopify плащане → Meshy 3D → 3MF → печат → изпращане.</p></div>
        <div className="integration-strip">
          {checks.map((item) => <div className={`integration-pill ${item.ok ? "ok" : "missing"}`} key={item.name}><span></span><strong>{item.name}</strong><small>{item.ok ? "connected" : "missing"}</small></div>)}
        </div>
      </section>

      <section className="admin-stats-grid">
        <div><span>Paid projects</span><strong>{stats.paid}</strong></div>
        <div><span>AI processing</span><strong>{stats.ai}</strong></div>
        <div><span>Ready for print</span><strong>{stats.ready}</strong></div>
        <div><span>In production</span><strong>{stats.production}</strong></div>
      </section>

      <section className="admin-table-card">
        <form className="admin-filters">
          <input name="q" defaultValue={q} placeholder="Order, client, email or Project ID" />
          <select name="status" defaultValue={status || ""}>
            <option value="">Всички статуси</option>
            {PROJECT_STATUSES.map((item) => <option key={item} value={item}>{STATUS_META[item].label}</option>)}
          </select>
          <button className="admin-button secondary">Filter</button>
          {(q || status) && <Link className="admin-clear-link" href="/admin/dashboard">Clear</Link>}
        </form>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Project</th><th>Shopify</th><th>Client</th><th>Size</th><th>Status</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td><strong>TF-{shortId(project.id)}</strong><small>{project.id}</small></td>
                  <td><strong>{project.shopify_order_name || "Not paid"}</strong><small>{project.paid_at ? `Paid ${date(project.paid_at)}` : "Awaiting checkout/payment"}</small></td>
                  <td><strong>{project.customer_name || "—"}</strong><small>{project.customer_email || project.shipping_city || "—"}</small></td>
                  <td><strong>{project.size_cm} cm</strong><small>€{Number(project.price_eur).toFixed(2)}</small></td>
                  <td><span className={`status-chip ${STATUS_META[project.status].tone}`}>{STATUS_META[project.status].label}</span>{project.last_error && <small className="table-error">Needs attention</small>}</td>
                  <td>{date(project.created_at)}</td>
                  <td><Link className="admin-open-link" href={`/admin/projects/${project.id}`}>Open →</Link></td>
                </tr>
              ))}
              {!projects.length && <tr><td colSpan={7} className="admin-empty">Няма проекти по този филтър.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
