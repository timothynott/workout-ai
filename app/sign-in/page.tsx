'use client';

import { useActionState, useState } from 'react';
import { signIn, signUp } from './actions';

const initialState = { error: undefined as string | undefined };

export default function SignInPage() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [signInState, signInAction, signInPending] = useActionState(signIn, initialState);
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, initialState);

  const isSignIn = mode === 'sign-in';
  const error = isSignIn ? signInState?.error : signUpState?.error;
  const pending = isSignIn ? signInPending : signUpPending;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8">
        <h1 className="text-2xl font-semibold text-center">
          {isSignIn ? 'Sign in' : 'Create account'}
        </h1>

        <form action={isSignIn ? signInAction : signUpAction} className="space-y-4">
          {!isSignIn && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete={isSignIn ? 'current-password' : 'new-password'}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-black text-white rounded px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {pending ? '…' : isSignIn ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500">
          {isSignIn ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => setMode(isSignIn ? 'sign-up' : 'sign-in')}
            className="underline"
          >
            {isSignIn ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
