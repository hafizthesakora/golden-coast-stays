import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import AdminAutoRefresh from "@/components/admin/AdminAutoRefresh";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || (session as { user?: { role?: string } }).user?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <AdminShell>
      <AdminAutoRefresh intervalMs={60_000} />
      {children}
    </AdminShell>
  );
}
