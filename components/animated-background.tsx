"use client";

import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#111111] to-[#0a0a0a]" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(212, 160, 23, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212, 160, 23, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Main camera lens container */}
      <div className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px]">
        
        {/* Outer gold ring with black border */}
        <div className="absolute inset-0 rounded-full border-[3px] border-black">
          <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-[#D4A017] via-[#FFD700] to-[#B8860B] p-[4px]">
            {/* Very thin black gap - the lens ring */}
            <div className="w-full h-full rounded-full bg-black p-[6px]">
              {/* Inner area where logo sits - fills almost all space */}
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] flex items-center justify-center relative overflow-hidden">
                
                {/* Subtle lens reflection */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
                
                {/* SnapR Logo - MUCH BIGGER, fills 92% of the inner circle */}
                <motion.img
                  src="/snapr-logo.png"
                  alt="SnapR"
                  className="w-[92%] h-[92%] object-contain relative z-10 drop-shadow-2xl"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Camera 1 - Top Left */}
        <motion.div
          className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6"
          animate={{
            y: [0, -10, 0],
            rotate: [-5, 5, -5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="relative">
            {/* Camera body */}
            <div className="w-16 h-12 sm:w-20 sm:h-14 bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-lg shadow-xl border border-[#D4A017]/30">
              {/* Lens */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#D4A017] to-[#B8860B] p-[2px]">
                <div className="w-full h-full rounded-full bg-[#111] flex items-center justify-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#D4A017]/50" />
                </div>
              </div>
              {/* Flash */}
              <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#D4A017]" />
              {/* Viewfinder */}
              <div className="absolute -top-1 right-2 w-3 h-2 bg-[#333] rounded-sm" />
            </div>
            {/* Gold glow */}
            <div className="absolute inset-0 rounded-lg bg-[#D4A017]/20 blur-md -z-10" />
          </div>
        </motion.div>

        {/* Floating Camera 2 - Bottom Right */}
        <motion.div
          className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6"
          animate={{
            y: [0, 10, 0],
            rotate: [5, -5, 5],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        >
          <div className="relative">
            {/* Camera body */}
            <div className="w-14 h-10 sm:w-18 sm:h-12 bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-lg shadow-xl border border-[#D4A017]/30">
              {/* Lens */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#D4A017] to-[#B8860B] p-[2px]">
                <div className="w-full h-full rounded-full bg-[#111] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#D4A017]/50" />
                </div>
              </div>
              {/* Flash */}
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
            </div>
            {/* Gold glow */}
            <div className="absolute inset-0 rounded-lg bg-[#D4A017]/20 blur-md -z-10" />
          </div>
        </motion.div>

        {/* Ambient gold glow behind main circle */}
        <div className="absolute inset-0 rounded-full bg-[#D4A017]/10 blur-3xl -z-10 scale-110" />
        
        {/* Pulsing ring effect */}
        <motion.div
          className="absolute inset-0 rounded-full border border-[#D4A017]/20"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  );
}