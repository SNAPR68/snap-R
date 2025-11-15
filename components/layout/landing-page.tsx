import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-gradient-to-b from-gray-50 to-gray-200">
      <h1 className="text-5xl font-bold mb-6">
        Transform Real Estate Photos with <span className="text-blue-600">AI</span>
      </h1>
      <p className="text-lg text-gray-600 max-w-xl mb-6">
        SnapR enhances property photos automatically — sky replacement, HDR, declutter, 
        twilight mode, and premium editing powered by AI.
      </p>

      <Link href="/dashboard">
        <Button size="lg" className="px-10 py-6 text-lg">
          Go to Dashboard
        </Button>
      </Link>
    </div>
  );
}



