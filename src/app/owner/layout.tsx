import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import OwnerShell from "@/components/owner/OwnerShell";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session as { user?: { role?: string } })?.user?.role;

  if (!session || (role !== "owner" && role !== "admin")) {
    redirect("/dashboard");
  }

  return (
    <OwnerShell>
      {children}
    </OwnerShell>
  );
}
