import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-[var(--background)]">
      <Image 
        src="/snapr-logo.png" 
        width={200} 
        height={60} 
        alt="SnapR Logo" 
        className="mx-auto mb-8 drop-shadow-lg"
        priority
      />
      <h1 className="text-5xl font-bold mb-6 text-[var(--text-main)]">
        Transform Real Estate Photos with <span className="text-[var(--accent-gold)]">AI</span>
      </h1>
      <p className="text-lg text-[var(--text-soft)] max-w-xl mb-6">
        SnapR enhances property photos automatically — sky replacement, HDR, declutter, 
        twilight mode, and premium editing powered by AI.
      </p>

      <Link href="/dashboard">
        <button className="btn-gold px-10 py-6 text-lg">
          Go to Dashboard
        </button>
      </Link>
    </div>
  );
}



