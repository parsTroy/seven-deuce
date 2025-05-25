"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

const supabase = createClientComponentClient();

export default function AuthPage() {
  const router = useRouter();

  const handleGuest = () => {
    localStorage.setItem('isGuest', 'true');
    router.push('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 flex-col gap-6">
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={['google']}
        theme="light"
      />
      <button
        onClick={handleGuest}
        className="mt-4 px-6 py-3 rounded-xl bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors"
      >
        Try as Guest
      </button>
    </div>
  );
} 