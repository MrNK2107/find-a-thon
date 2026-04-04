import { supabase } from '@/lib/supabaseClient';

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser(redirectTo = '/auth') {
  const user = await getCurrentUser();
  if (!user && typeof window !== 'undefined') {
    window.location.href = redirectTo;
  }
  return user;
}

export async function signOut() {
  await supabase.auth.signOut();
}
