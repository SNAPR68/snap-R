"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, User } from "lucide-react";

export default function OnboardingStep1() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    role: "",
  });

  const handleContinue = () => {
    if (!formData.fullName.trim()) {
      alert("Please enter your name");
      return;
    }
    localStorage.setItem("onboarding_data", JSON.stringify(formData));
    router.push("/onboarding/step2");
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
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to SnapR</h1>
        <p className="text-white/60">Let's get to know you better</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white/60 mb-2">Full Name *</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="John Smith"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#D4A017]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-2">Company Name</label>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="ABC Realty"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#D4A017]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-2">Your Role</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#D4A017]"
          >
            <option value="" className="bg-[#1A1A1A]">
              Select your role
            </option>
            <option value="agent" className="bg-[#1A1A1A]">
              Real Estate Agent
            </option>
            <option value="photographer" className="bg-[#1A1A1A]">
              Real Estate Photographer
            </option>
            <option value="broker" className="bg-[#1A1A1A]">
              Broker / Team Lead
            </option>
            <option value="property_manager" className="bg-[#1A1A1A]">
              Property Manager
            </option>
            <option value="other" className="bg-[#1A1A1A]">
              Other
            </option>
          </select>
        </div>

        <button
          onClick={handleContinue}
          className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black mt-6"
        >
          Continue
        </button>

        <p className="text-center text-white/40 text-sm mt-4">
          Already have an account?{" "}
          <a href="/auth/login" className="text-[#D4A017] hover:underline">
            Sign in
          </a>
        </p>
      </div>
      </motion.div>
  );
}

