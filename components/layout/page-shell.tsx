import { Navbar } from "@/components/ui/navbar";

export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-8">{children}</main>
    </div>
  );
}



