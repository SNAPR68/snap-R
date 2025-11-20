import Navbar from "@/components/navbar";

export const dynamic = "force-dynamic";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {children}
      </main>
    </div>
  );
}

