"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingStep3Page() {
  const router = useRouter();
  const supabase = createClient();
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("onboarding_data");
    if (!data) {
      router.push("/onboarding");
    }
  }, [router]);

  const handleGoogleSignup = async () => {
    setLoading(true);
    const existingData = JSON.parse(localStorage.getItem("onboarding_data") || "{}");
    localStorage.setItem(
      "onboarding_data",
      JSON.stringify({
        ...existingData,
        selectedPlan,
      }),
    );

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?onboarding=true`,
      },
    });
  };

  const plans = [
    { id: "free", name: "Free Trial", price: 0, features: ["5 Free Credits", "All AI Tools", "No Credit Card Required"], free: true },
    { id: "starter", name: "Starter", price: 29, features: ["50 Credits/month", "All AI Tools", "Email Support"] },
    {
      id: "pro",
      name: "Pro Agent",
      price: 79,
      features: ["200 Credits/month", "All AI Tools", "Virtual Staging", "Priority Support"],
      popular: true,
    },
    { id: "brokerage", name: "Brokerage", price: 199, features: ["500 Credits/month", "All Pro features", "API Access", "Account Manager"] },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl w-full"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-black font-bold text-2xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] shadow-lg shadow-[#D4A017]/30 mx-auto mb-4">
          S
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Choose Your Plan</h1>
        <p className="text-white/60">Start with 5 free credits, upgrade anytime</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`relative p-6 rounded-2xl cursor-pointer transition-all ${
              selectedPlan === plan.id ? "bg-[#D4A017]/20 border-2 border-[#D4A017]" : "bg-white/5 border-2 border-transparent hover:border-white/20"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#FFD700] to-[#B8860B] text-[#0F0F0F]">
                RECOMMENDED
              </div>
            )}
            {(plan as any).free && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white">
                START HERE
              </div>
            )}
            <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
            <div className="mb-4">
              {plan.price === 0 ? (
                <span className="text-3xl font-bold text-[#D4A017]">Free</span>
              ) : (
                <>
                  <span className="text-3xl font-bold text-white">${plan.price}</span>
                  <span className="text-white/50">/mo</span>
                </>
              )}
            </div>
            <ul className="space-y-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-white/70 text-sm">
                  <Check className="w-4 h-4 text-[#D4A017]" /> {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-white/5 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-5 h-5 text-[#D4A017]" />
          <span className="text-white font-medium">Or Pay As You Go - $1.50/image</span>
        </div>
        <p className="text-white/50 text-sm">No subscription. Pay only for downloads.</p>
      </div>

      <button
        onClick={handleGoogleSignup}
        disabled={loading}
        className="w-full py-4 rounded-xl font-semibold bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black flex items-center justify-center gap-3 disabled:opacity-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {loading ? "Connecting..." : "Continue with Google"}
      </button>

      <p className="text-center text-white/40 text-sm mt-4">
        By continuing, you agree to our <a href="/terms" className="text-[#D4A017]">
          Terms
        </a>{" "}
        and{" "}
        <a href="/privacy" className="text-[#D4A017]">
          Privacy Policy
        </a>
      </p>

      <button
        onClick={() => router.back()}
        className="w-full py-3 rounded-xl border border-white/20 text-white/60 hover:bg-white/5 mt-4"
      >
        Back
      </button>
    </motion.div>
  );
}

