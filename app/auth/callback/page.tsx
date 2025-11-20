"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function handleCallback() {
      try {
        // Wait for Supabase to handle the session from URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError.message);
          setLoading(false);
          return;
        }

        if (!session) {
          setError("No session found. Please try logging in again.");
          setLoading(false);
          return;
        }

        // Check if user has onboarded
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("has_onboarded")
          .eq("id", session.user.id)
          .single();

        if (profileError) {
          // User might not exist in users table yet, create it
          const { error: insertError } = await supabase
            .from("users")
            .insert({
              id: session.user.id,
              email: session.user.email,
              has_onboarded: false,
            });

          if (insertError && insertError.code !== "23505") {
            // Ignore duplicate key errors
            console.error("Error creating user profile:", insertError);
          }

          // Redirect to onboarding
          router.push("/onboarding");
          return;
        }

        // Redirect based on onboarding status
        if (!profile?.has_onboarded) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred during authentication");
        setLoading(false);
      }
    }

    handleCallback();
  }, [router, supabase]);

  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
        <div className="max-w-md w-full bg-[var(--surface)] shadow-card rounded-2xl p-8 border border-[var(--surface-soft)] text-center">
          <div className="bg-red-100 text-red-700 text-sm p-3 rounded-xl mb-4">
            {error}
          </div>
          <a
            href="/auth/login"
            className="btn-gold inline-block"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="max-w-md w-full bg-[var(--surface)] shadow-card rounded-2xl p-8 border border-[var(--surface-soft)] text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-gold)] mx-auto mb-4" />
        <p className="text-[var(--text-soft)]">Completing sign in...</p>
      </div>
    </div>
  );
}

