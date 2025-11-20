export const dynamic = "force-dynamic";
import { protect } from "@/lib/auth/protect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import BillingClient from "./billing-client";

export default async function BillingPage() {
  const { user } = await protect();
  const supabase = createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("users")
    .select("credits, name")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-xl mx-auto space-y-6 md:space-y-10 px-4 md:px-0">
      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-semibold">Billing</h1>

      {/* Billing Card */}
      <div className="card p-4 md:p-8 shadow-card border border-[var(--surface-soft)] bg-[var(--surface)] rounded-2xl">
        <h2 className="text-2xl font-bold mb-2">
          SnapR Basic Plan
        </h2>

        <p className="text-[var(--text-soft)] mb-6">
          Unlimited listings · Fast AI enhancements · Priority processing
        </p>

        <div className="text-3xl md:text-4xl font-bold text-[var(--accent-gold)] mb-4 break-words">
          ₹299<span className="text-lg md:text-xl font-medium text-[var(--text-soft)]">/month</span>
        </div>

        {/* Credits */}
        <div className="mb-6">
          <p className="text-sm text-[var(--text-soft)] mb-1">Available Credits</p>
          <div className="px-4 py-2 rounded-xl bg-[var(--surface-soft)] inline-block">
            <span className="font-semibold text-lg">{profile?.credits ?? 0}</span>
          </div>
        </div>

        {/* Subscribe Button */}
        <BillingClient />
      </div>
    </div>
  );
}
