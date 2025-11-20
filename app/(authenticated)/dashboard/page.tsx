export const dynamic = "force-dynamic";
import { protect } from "@/lib/auth/protect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  UploadCloud,
  ImageIcon,
  Building,
} from "lucide-react";
import Image from "next/image";

export const revalidate = 60;

export default async function DashboardPage() {
  const { user } = await protect();
  const supabase = createSupabaseServerClient();

  // Fetch credits
  const { data: profile } = await supabase
    .from("users")
    .select("credits, name")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6 md:space-y-10">
      {/* Top Welcome Banner */}
      <section className="p-4 md:p-8 rounded-2xl bg-[var(--surface)] shadow-card border border-[var(--surface-soft)]">
        <div className="flex items-center gap-4 mb-4">
          <Image 
            src="/snapr-logo.png" 
            width={200} 
            height={60} 
            alt="SnapR Logo" 
            className="object-contain h-12 w-auto"
          />
          <h1 className="text-2xl md:text-3xl font-bold">
            Welcome back,
            <span className="text-[var(--accent-gold)]"> {profile?.name || "Agent"}</span>
          </h1>
        </div>

        <p className="text-[var(--text-soft)] text-sm md:text-base">
          Transform your real estate photos into stunning, high-converting visuals.
        </p>

        <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-[var(--surface-soft)]">
          <span className="font-semibold">Credits:</span>
          <span className="text-[var(--accent-gold)] font-bold">{profile?.credits ?? 0}</span>
        </div>
      </section>

      {/* Main Action Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Upload Photos */}
        <DashboardCard
          icon={<UploadCloud className="w-12 h-12 text-[var(--accent-gold)]" />}
          title="Upload Photos"
          description="Upload your property photos for enhancement."
          href="/upload"
        />

        {/* View Listings */}
        <DashboardCard
          icon={<Building className="w-12 h-12 text-[var(--accent-gold)]" />}
          title="Your Listings"
          description="Manage your enhanced property listings."
          href="/listings"
        />

        {/* Recent Jobs */}
        <DashboardCard
          icon={<ImageIcon className="w-12 h-12 text-[var(--accent-gold)]" />}
          title="Recent Jobs"
          description="Track ongoing and completed enhancements."
          href="/jobs"
        />
      </section>
    </div>
  );
}

// Dashboard Card Component
function DashboardCard({ 
  icon, 
  title, 
  description, 
  href 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  href: string; 
}) {
  return (
    <a
      href={href}
      className="card hover:shadow-gold transition block"
    >
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12">{icon}</div>
        <h3 className="text-lg md:text-xl font-semibold">{title}</h3>
        <p className="text-[var(--text-soft)] text-sm md:text-base">{description}</p>
      </div>
    </a>
  );
}
