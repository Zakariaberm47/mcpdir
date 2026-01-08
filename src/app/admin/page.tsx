import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Shield } from "lucide-react";
import { AdminTabs } from "./components/admin-tabs";

export const metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await auth();
  const devBypass = process.env.NODE_ENV === "development" && process.env.DEV_ADMIN_BYPASS === "true";

  if (!devBypass && !session?.user?.isAdmin) {
    redirect("/");
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-cyan/10 text-cyan">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage validation queue, view history and stats
          </p>
        </div>
      </div>

      <AdminTabs />
    </main>
  );
}
