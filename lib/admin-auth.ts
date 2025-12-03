import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// List of admin emails
const ADMIN_EMAILS = [
  'rajesh@snap-r.com',
  // Add more admin emails here
];

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
    redirect('/auth/login?error=unauthorized');
  }

  return user;
}

export function isAdmin(email: string | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email);
}
