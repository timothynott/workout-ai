import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  const { email, password, name } = await request.json();

  const allowedEmails = (process.env.ALLOWED_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  if (!allowedEmails.includes(email)) {
    return NextResponse.json(
      { error: 'This email address is not authorised to create an account.' },
      { status: 403 }
    );
  }

  const { error } = await auth.signUp.email({ email, password, name });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
