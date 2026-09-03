"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { MANUAL_PRODUCTION_STATUSES, STATUS_META } from "@/lib/status";
import { ProjectStatus } from "@/lib/projects";

async function postJson(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`);
  return data;
}

export function SyncAllButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      await postJson("/api/admin/sync");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-inline-action">
      <button className="admin-button secondary" onClick={run} disabled={busy}>
        {busy ? "Синхронизирам…" : "Sync Meshy now"}
      </button>
      {error && <span className="admin-inline-error">{error}</span>}
    </div>
  );
}

export function ProjectActions({
  projectId,
  status,
  notes,
  trackingNumber,
  trackingCompany,
  fulfillmentId,
  canRegenerateThreeMf = false,
}: {
  projectId: string;
  status: ProjectStatus;
  notes?: string | null;
  trackingNumber?: string | null;
  trackingCompany?: string | null;
  fulfillmentId?: string | null;
  canRegenerateThreeMf?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>(
    MANUAL_PRODUCTION_STATUSES.includes(status) ? status : "READY_FOR_PRINT"
  );

  async function action(kind: "sync" | "retry" | "regenerate-3mf") {
    setBusy(kind);
    setError("");
    try {
      await postJson(`/api/admin/projects/${projectId}/${kind}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : `${kind} failed`);
    } finally {
      setBusy(null);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("save");
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    try {
      const data = await postJson(`/api/admin/projects/${projectId}/status`, {
        status: selectedStatus,
        productionNotes: String(form.get("productionNotes") || ""),
        trackingNumber: String(form.get("trackingNumber") || ""),
        trackingCompany: String(form.get("trackingCompany") || ""),
      });
      if (data?.fulfillment?.note) {
        if (data.fulfillment.created) setNotice(data.fulfillment.note);
        else setError(data.fulfillment.note);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="project-actions-stack">
      <div className="admin-action-row">
        <button className="admin-button secondary" onClick={() => action("sync")} disabled={Boolean(busy)}>
          {busy === "sync" ? "Checking…" : "Check Meshy status"}
        </button>
        {(status === "BUILD_FAILED" || status === "PRINT_FILE_FAILED") && (
          <button className="admin-button danger-outline" onClick={() => action("retry")} disabled={Boolean(busy)}>
            {busy === "retry" ? "Retrying…" : "Retry failed step"}
          </button>
        )}
        {canRegenerateThreeMf && (
          <button className="admin-button danger-outline" onClick={() => action("regenerate-3mf")} disabled={Boolean(busy)}>
            {busy === "regenerate-3mf" ? "Starting 3MF…" : "Regenerate expired 3MF"}
          </button>
        )}
      </div>

      {canRegenerateThreeMf && (
        <p className="file-note">Legacy 3MF линкът е изтекъл. Regenerate expired 3MF стартира нов Meshy multi-color print task и използва Meshy credits.</p>
      )}

      <form className="production-form" onSubmit={save}>
        <label>
          Production status
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as ProjectStatus)}>
            {MANUAL_PRODUCTION_STATUSES.map((item) => (
              <option value={item} key={item}>{STATUS_META[item].label}</option>
            ))}
          </select>
        </label>
        <label>
          Tracking number
          <input name="trackingNumber" defaultValue={trackingNumber || ""} placeholder="Задължителен при SHIPPED" />
        </label>
        <label>
          Куриер
          <input name="trackingCompany" defaultValue={trackingCompany || ""} placeholder="Econt / Speedy" />
        </label>
        <label className="full-span">
          Production notes
          <textarea name="productionNotes" defaultValue={notes || ""} rows={4} placeholder="Printer, color notes, defects, packing notes…" />
        </label>
        <button className="admin-button primary" disabled={Boolean(busy)}>
          {busy === "save" ? "Saving…" : "Save production update"}
        </button>
      </form>
      {fulfillmentId && <p className="file-note">Shopify fulfillment: {fulfillmentId} — клиентът е уведомен с tracking.</p>}
      {notice && <p className="file-note">{notice}</p>}
      {error && <div className="admin-error-box">{error}</div>}
    </div>
  );
}
