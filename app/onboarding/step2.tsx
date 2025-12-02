"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ImageIcon, TrendingUp } from "lucide-react";

export default function OnboardingStep2() {
  const router = useRouter();
  const [listingsPerMonth, setListingsPerMonth] = useState("");
  const [photosPerListing, setPhotosPerListing] = useState("");

  useEffect(() => {
    const data = localStorage.getItem("onboarding_data");
    if (!data) {
      router.push("/onboarding");
    }
  }, [router]);

  const handleContinue = () => {
    const existingData = JSON.parse(localStorage.getItem("onboarding_data") || "{}");
    localStorage.setItem(
      "onboarding_data",
      JSON.stringify({
        ...existingData,
        listingsPerMonth,
        photosPerListing,
      }),
    );
    router.push("/onboarding/step3");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl w-full"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-black font-bold text-2xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] shadow-lg shadow-[#D4A017]/30 mx-auto mb-4">
          S
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Your Usage</h1>
        <p className="text-white/60">Help us recommend the right plan for you</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white/60 mb-2">How many listings do you handle per month?</label>
          <div className="relative">
            <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <select
              value={listingsPerMonth}
              onChange={(e) => setListingsPerMonth(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#D4A017] appearance-none"
            >
              <option value="" className="bg-[#1A1A1A]">
                Select
              </option>
              <option value="1-5" className="bg-[#1A1A1A]">
                1-5 listings
              </option>
              <option value="6-15" className="bg-[#1A1A1A]">
                6-15 listings
              </option>
              <option value="16-30" className="bg-[#1A1A1A]">
                16-30 listings
              </option>
              <option value="30+" className="bg-[#1A1A1A]">
                30+ listings
              </option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-2">Average photos per listing?</label>
          <div className="relative">
            <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <select
              value={photosPerListing}
              onChange={(e) => setPhotosPerListing(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#D4A017] appearance-none"
            >
              <option value="" className="bg-[#1A1A1A]">
                Select
              </option>
              <option value="1-10" className="bg-[#1A1A1A]">
                1-10 photos
              </option>
              <option value="11-25" className="bg-[#1A1A1A]">
                11-25 photos
              </option>
              <option value="26-50" className="bg-[#1A1A1A]">
                26-50 photos
              </option>
              <option value="50+" className="bg-[#1A1A1A]">
                50+ photos
              </option>
            </select>
          </div>
        </div>

        <button
          onClick={handleContinue}
          className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black mt-6"
        >
          See Pricing
        </button>

          <button
          onClick={() => router.back()}
          className="w-full py-3 rounded-xl font-semibold border border-white/20 text-white/60 hover:bg-white/5"
          >
          Back
          </button>
        </div>
      </motion.div>
  );
}

