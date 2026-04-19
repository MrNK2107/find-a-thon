import { signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export async function getCurrentUser() {
  return auth.currentUser;
}

export async function requireUser(redirectTo = '/auth') {
  const user = await getCurrentUser();
  if (!user && typeof window !== 'undefined') {
    window.location.href = redirectTo;
  }
  return user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}
