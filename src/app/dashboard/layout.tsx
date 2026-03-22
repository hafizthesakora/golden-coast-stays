import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import GuestSidebar from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/dashboard");
  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa]">
      <GuestSidebar />
      <div className="flex-1 overflow-y-auto pb-16 sm:pb-0">
        {children}
      </div>
    </div>
  );
}
