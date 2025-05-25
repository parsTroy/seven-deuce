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
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50 px-4">
      <div className="max-w-lg w-full flex flex-col items-center gap-8 p-8 bg-white/80 rounded-3xl shadow-xl border border-gray-100">
        <div className="flex items-center gap-3 select-none">
          <span className="text-4xl font-extrabold text-red-600">7<span className="text-2xl align-super">♥</span></span>
          <span className="mx-1 text-3xl font-extrabold text-gray-700">/</span>
          <span className="text-4xl font-extrabold text-gray-900">2<span className="text-2xl align-super text-black">♠</span></span>
          <span className="ml-2 text-3xl font-bold text-gray-900 tracking-tight">Seven Deuce</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-900">Track Your Poker Bankroll. Visualize Your Progress. Crush Your Goals.</h1>
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center gap-3">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-base text-gray-700">Bankroll Tracking</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-block w-3 h-3 rounded-full bg-orange-400" />
            <span className="text-base text-gray-700">Session Analytics &amp; Visualizations</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-block w-3 h-3 rounded-full bg-green-400" />
            <span className="text-base text-gray-700">Mobile Friendly &amp; Fast</span>
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full mt-4">
          <button
            onClick={handleSignIn}
            className="w-full rounded-xl bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          >
            Sign in with Google
          </button>
          <button
            onClick={handleGuest}
            className="w-full rounded-xl bg-gray-100 px-6 py-3 text-lg font-semibold text-gray-700 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
          >
            Continue as Guest
          </button>
        </div>
      </div>
      <footer className="mt-12 text-xs text-gray-400">&copy; {new Date().getFullYear()} Seven Deuce. All rights reserved.</footer>
    </main>
  );
}
