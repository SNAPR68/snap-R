"use client";

import React, { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function AuthButtons() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendMagicLink(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setStatus("Error: " + error.message);
      else setStatus("Magic link sent — check your email.");
    } catch (err: any) {
      setStatus("Unexpected error: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    setStatus(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setStatus("OAuth error: " + error.message);
    } catch (err: any) {
      setStatus("Unexpected error: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <form onSubmit={sendMagicLink} className="flex gap-2 items-center">
        <input
          aria-label="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email for magic link"
          type="email"
          className="input h-8 text-sm min-w-[160px] md:min-w-[180px]"
          disabled={loading}
        />
        <button
          onClick={() => sendMagicLink()}
          type="button"
          disabled={loading || !email}
          className="btn-gold h-8 px-3 text-sm whitespace-nowrap"
        >
          {loading ? "Sending…" : "Magic Link"}
        </button>
      </form>

      <button
        onClick={signInWithGoogle}
        disabled={loading}
        className="h-8 px-3 rounded-lg border border-[var(--surface-soft)] bg-[var(--surface)] hover:bg-[var(--surface-soft)] transition flex items-center gap-2 text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Image
          src="/google-icon.svg"
          alt="Google"
          width={16}
          height={16}
          className="object-contain"
        />
        <span className="font-semibold">Google</span>
      </button>

      {status && (
        <div className="text-xs md:text-sm text-[var(--text-soft)] max-w-[200px] truncate">
          {status}
        </div>
      )}
    </div>
  );
}

