import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerComponentClient({
    cookies: () => cookieStore,
  });
}

export async function getSession() {
  const supabase = createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

export async function getUser() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function protect() {
  const supabase = createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session, force login
  if (!session) {
    redirect("/auth/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check onboarding
  const { data: profile } = await supabase
    .from("users")
    .select("has_onboarded")
    .eq("id", user.id)
    .single();

  if (!profile?.has_onboarded) {
    redirect("/onboarding");
  }

  return { session, user };
}

