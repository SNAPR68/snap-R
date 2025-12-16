export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BillingClient from "./billing-client";

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from("users")
    .select("credits, name, plan")
    .eq("id", user.id)
    .single();

  return <BillingClient profile={profile} />;
}
