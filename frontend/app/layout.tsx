import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Sidebar from "@/components/sidebar";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Veridicus | Forensic Reasoning Engine",
  description: "Autonomous multimodal forensic analysis workstation",
};

import Providers from "@/components/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <ErrorBoundary>
          <Providers>
            <div className="flex min-h-screen bg-background text-foreground">
              <Sidebar />
              <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
