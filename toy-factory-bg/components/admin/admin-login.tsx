"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: String(form.get("password") || "") }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data?.error || "Login failed");
      setBusy(false);
      return;
    }
    router.replace("/admin/dashboard");
    router.refresh();
  }

  return (
    <form className="admin-login-card" onSubmit={submit}>
      <div className="admin-login-mark">TF / OPS</div>
      <h1>Production dashboard</h1>
      <p>Вътрешен достъп до поръчки, 3D файлове и производствени статуси.</p>
      <label>
        Admin password
        <input name="password" type="password" autoComplete="current-password" required autoFocus />
      </label>
      <button className="admin-button primary" disabled={busy}>{busy ? "Влизане…" : "Вход"}</button>
      {error && <div className="admin-error-box">{error}</div>}
    </form>
  );
}
