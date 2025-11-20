"use client";

import { useSession } from "@/app/providers/session-provider";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";

export default function OnboardingStep3() {
  const { supabase, user } = useSession();
  const router = useRouter();

  const finish = async () => {
    if (!user) return;

    await supabase
      .from("users")
      .update({ has_onboarded: true })
      .eq("id", user.id);

    router.push("/dashboard");
  };

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
      <h1 className="text-3xl font-semibold mb-4">You're all set!</h1>

        <p className="text-lg text-[var(--text-soft)]">
          You get <span className="text-[var(--accent-gold)] font-bold">20 credits</span> to
          start enhancing your property photos.
        </p>

        <button
          onClick={finish}
          className="btn-gold mt-8"
        >
          Go to Dashboard
        </button>
      </motion.div>
  );
}

