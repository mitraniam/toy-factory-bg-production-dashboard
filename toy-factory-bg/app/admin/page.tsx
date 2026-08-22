import { redirect } from "next/navigation";
import { AdminLogin } from "@/components/admin/admin-login";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (await isAdminAuthenticated()) redirect("/admin/dashboard");
  return (
    <main className="admin-login-shell">
      <AdminLogin />
    </main>
  );
}
