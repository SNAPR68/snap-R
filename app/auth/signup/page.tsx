"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="max-w-md w-full bg-[var(--surface)] shadow-card rounded-2xl p-8 border border-[var(--surface-soft)]">
        <Image 
          src="/snapr-logo.png" 
          width={200} 
          height={60} 
          alt="SnapR" 
          className="mx-auto mb-6"
          priority
        />
        <h1 className="text-2xl font-bold text-[var(--text-main)] text-center">Create account</h1>
        <p className="text-center text-[var(--text-soft)] mt-1 mb-6">Sign up to get started with SnapR</p>

        {error && (
          <div className="bg-red-100 text-red-700 text-sm p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="text-sm text-[var(--text-soft)]">Email</label>
            <input
              type="email"
              className="input mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm text-[var(--text-soft)]">Password</label>
            <input
              type="password"
              className="input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full"
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-soft)] mt-6">
          Already have an account?{" "}
          <a href="/auth/login" className="text-[var(--accent-gold)] font-medium hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}

