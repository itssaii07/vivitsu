import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Vivitsu - AI Study Platform",
  description: "Build better study habits with AI personalization, social accountability, and streak tracking.",
  keywords: ["study", "AI", "learning", "productivity", "study rooms", "streaks"],
};

import SceneWrapper from "@/components/3d/SceneWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-black text-zinc-100 min-h-screen relative`}>
        <SceneWrapper />
        <div className="relative z-10 w-full h-full">
          <AuthProvider>
            {children}
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
