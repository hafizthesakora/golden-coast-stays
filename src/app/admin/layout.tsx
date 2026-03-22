import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/Sidebar";
import AdminAutoRefresh from "@/components/admin/AdminAutoRefresh";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || (session as { user?: { role?: string } }).user?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-[#f4f5f7]">
        <AdminAutoRefresh intervalMs={60_000} />
        {children}
      </main>
    </div>
  );
}
