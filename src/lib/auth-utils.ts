import { redirect } from 'next/navigation';
import { auth } from './auth';

export async function requireAuth() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }
  
  return session;
}

export async function requireNoAuth() {
  const session = await auth();
  
  if (session?.user) {
    redirect('/dashboard');
  }
}
