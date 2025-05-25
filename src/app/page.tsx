"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useGuest } from "@/context/GuestContext";

export default function LandingPage() {
  const { user, loading } = useUser();
  const { isGuest } = useGuest();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (user || isGuest)) {
      router.replace("/dashboard");
    }
  }, [user, isGuest, loading, router]);

  const handleSignIn = () => {
    router.push("/auth");
  };
  const handleGuest = () => {
    localStorage.setItem("isGuest", "true");
    router.replace("/dashboard");
  };

  return (
    <main className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center bg-green-900 overflow-auto" style={{ background: 'radial-gradient(ellipse at center, #26734d 60%, #14532d 100%)' }}>
      {/* Poker table vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.18) 60%, transparent 100%)' }} />
      <div className="max-w-lg w-full flex flex-col items-center gap-8 p-10 bg-green-800/90 rounded-full shadow-2xl border-8 border-yellow-400/80 relative z-10" style={{ boxShadow: '0 8px 32px 0 rgba(0,0,0,0.35)' }}>
        <div className="relative flex items-center gap-3 select-none w-full justify-center my-2" style={{ minHeight: '4.5rem' }}>
          {/* Gold pill banner behind the whole title row */}
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[410px] h-[4.2rem] md:w-[520px] md:h-[4.5rem] rounded-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 shadow-lg z-0 border-4 border-yellow-600" style={{ boxShadow: '0 2px 18px 0 #eab30899' }} />
          <span className="text-5xl font-extrabold text-red-600 drop-shadow-lg z-10">7<span className="text-2xl align-super">♥</span></span>
          <span className="mx-1 text-4xl font-extrabold text-yellow-900 drop-shadow-lg z-10" style={{ textShadow: '0 2px 8px #fff, 0 1px 0 #eab308' }}>/</span>
          <span className="text-5xl font-extrabold text-white drop-shadow-lg z-10">2<span className="text-2xl align-super text-black">♠</span></span>
          <span className="ml-2 text-3xl font-bold text-yellow-900 tracking-tight drop-shadow-lg z-10" style={{ textShadow: '0 2px 8px #fff, 0 1px 0 #eab308' }}>Seven Deuce</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-center text-yellow-100 drop-shadow">Track Your Poker Bankroll. Visualize Your Progress. Crush Your Goals.</h1>
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center gap-3">
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-400 shadow" />
            <span className="text-base text-yellow-100">Bankroll Tracking</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500 shadow" />
            <span className="text-base text-yellow-100">Session Analytics &amp; Visualizations</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-400 shadow" />
            <span className="text-base text-yellow-100">Mobile Friendly &amp; Fast</span>
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full mt-4">
          <button
            onClick={handleSignIn}
            className="w-full rounded-full bg-yellow-400/90 px-8 py-4 text-xl font-extrabold text-green-900 shadow-lg border-4 border-yellow-300 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-200 transition tracking-wider"
            style={{ letterSpacing: '0.08em' }}
          >
            Sign in with Google
          </button>
          <button
            onClick={handleGuest}
            className="w-full rounded-full bg-white/90 px-8 py-4 text-xl font-extrabold text-green-900 shadow-lg border-4 border-green-300 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-200 transition tracking-wider"
            style={{ letterSpacing: '0.08em' }}
          >
            Continue as Guest
          </button>
        </div>
      </div>
      <footer className="mt-12 text-xs text-yellow-200 drop-shadow">&copy; {new Date().getFullYear()} Seven Deuce. All rights reserved.</footer>
    </main>
  );
}
