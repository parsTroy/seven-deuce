import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from '@/context/UserContext';
import { GuestProvider } from '@/context/GuestContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Seven Deuce",
  description: "Seven Deuce - Poker Session Tracker. Track your poker sessions and analyze your results. The ultimate tool for poker players.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GuestProvider>
          <UserProvider>
            <main className="min-h-screen bg-gray-100">
              {/* <nav className="bg-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between h-16">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 flex items-center">
                        <span className="text-2xl font-extrabold text-red-600 select-none">7<span className="text-lg align-super">♥</span></span>
                        <span className="mx-1 text-xl font-extrabold text-gray-700 select-none">/</span>
                        <span className="text-2xl font-extrabold text-gray-900 select-none">2<span className="text-lg align-super text-black">♠</span></span>
                      </div>
                      <h1 className="text-xl font-bold text-gray-800 tracking-tight select-none">Seven Deuce</h1>
                    </div>
                  </div>
                </div>
              </nav> */}
              <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
          </UserProvider>
        </GuestProvider>
      </body>
    </html>
  );
}
