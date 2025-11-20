"use client";

import { useState } from "react";
import { useSession } from "@/app/providers/session-provider";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";

export default function OnboardingStep2() {
  const { supabase, user } = useSession();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const router = useRouter();

  const saveProfile = async () => {
    if (!user) return;

    await supabase
      .from("users")
      .update({ name, avatar_url: avatar })
      .eq("id", user.id);

    router.push("/onboarding/step3");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl w-full"
    >
      <Image 
        src="/snapr-logo.png" 
        width={200} 
        height={60} 
        alt="SnapR" 
        className="mx-auto mb-6"
        priority
      />
      <h1 className="text-3xl font-semibold mb-6 text-center">
        Tell us about you
      </h1>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Your Name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Avatar URL (optional)"
            className="input"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
          />

          <button
            onClick={saveProfile}
            className="btn-gold mt-6"
          >
            Continue
          </button>
        </div>
      </motion.div>
  );
}

