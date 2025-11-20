"use client";

import { useSession } from "@/app/providers/session-provider";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";

export default function OnboardingStep1() {
  const { user } = useSession();
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl text-center"
    >
      <Image 
        src="/snapr-logo.png" 
        width={200} 
        height={60} 
        alt="SnapR" 
        className="mx-auto mb-6"
        priority
      />
      <h1 className="text-4xl font-semibold mb-4">
        Welcome to <span className="text-[var(--accent-gold)] font-bold">SnapR</span>
      </h1>

        <p className="text-lg text-[var(--text-soft)]">
          The world's most premium AI photo enhancement platform for real estate
          professionals.
        </p>

        <p className="text-lg text-[var(--text-soft)] mt-2">
          Let's set up your profile to personalize your experience.
        </p>

        <button
          onClick={() => router.push("/onboarding/step2")}
          className="btn-gold mt-8"
        >
          Continue
        </button>
      </motion.div>
  );
}

