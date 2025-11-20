export const dynamic = "force-dynamic";
"use client";

import { useSession } from "@/app/providers/session-provider";
import { useState } from "react";

export default function SettingsPage() {
  const { user, supabase } = useSession();
  const [name, setName] = useState(user?.user_metadata?.name || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const saveProfile = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("users")
      .update({ name })
      .eq("id", user.id);

    if (error) {
      setMessage("Failed to update. Please try again.");
    } else {
      setMessage("Profile saved successfully.");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 md:space-y-10 px-4 md:px-0">
      <h1 className="text-2xl md:text-3xl font-semibold">Settings</h1>

      <div className="card p-4 md:p-8 bg-[var(--surface)] border border-[var(--surface-soft)] rounded-2xl">
        {/* Email */}
        <div className="mb-6">
          <label className="block mb-2 text-sm text-[var(--text-soft)]">Email</label>
          <div className="px-4 py-3 bg-[var(--surface-soft)] rounded-xl text-[var(--text-main)]">
            {user?.email || "Loading..."}
          </div>
        </div>

        {/* Name */}
        <div className="mb-6">
          <label className="block mb-2 text-sm text-[var(--text-soft)]">Name</label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Save button */}
        <button
          className="btn-gold w-full"
          disabled={loading}
          onClick={saveProfile}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>

        {/* Status message */}
        {message && (
          <p className="mt-4 text-center text-sm text-[var(--text-soft)]">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
