"use client";

export const runtime = "edge";

import PageShell from "@/components/layout/page-shell";
import { DashboardActionCard } from "@/components/ui/dashboard-action-card";
import { UploadCloud, Image, Building } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardActionCard
          label="Upload Photos"
          icon={<UploadCloud size={40} />}
          onClick={() => router.push("/upload")}
        />

        <DashboardActionCard
          label="View Listings"
          icon={<Building size={40} />}
          onClick={() => router.push("/listings")}
        />

        <DashboardActionCard
          label="Recent Jobs"
          icon={<Image size={40} />}
          onClick={() => router.push("/jobs")}
        />
      </div>
    </PageShell>
  );
}



