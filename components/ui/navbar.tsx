import Link from "next/link";

export function Navbar() {
  return (
    <nav className="h-16 border-b flex items-center px-6 justify-between bg-white">
      <Link href="/dashboard" className="font-bold text-xl">
        SnapR
      </Link>

      <div className="flex items-center gap-8">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/listings">Listings</Link>
        <Link href="/upload">Upload</Link>
        <Link href="/settings">Settings</Link>
      </div>
    </nav>
  );
}



