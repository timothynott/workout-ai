'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';

export async function signIn(_: unknown, formData: FormData) {
  const { error } = await auth.signIn.email({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });
  if (error) return { error: error.message };
  redirect('/');
}

export async function signUp(_: unknown, formData: FormData) {
  const email = formData.get('email') as string;

  // Only allowed emails may create an account.
  const allowedEmails = (process.env.ALLOWED_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  if (!allowedEmails.includes(email)) {
    return { error: 'This email address is not authorised to create an account.' };
  }

  const { error } = await auth.signUp.email({
    email,
    password: formData.get('password') as string,
    name: formData.get('name') as string,
  });
  if (error) return { error: error.message };
  redirect('/');
}
