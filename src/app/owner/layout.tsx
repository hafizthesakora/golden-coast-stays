import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import OwnerSidebar from "@/components/owner/Sidebar";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session as { user?: { role?: string } })?.user?.role;

  if (!session || (role !== "owner" && role !== "admin")) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa]">
      <OwnerSidebar />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
