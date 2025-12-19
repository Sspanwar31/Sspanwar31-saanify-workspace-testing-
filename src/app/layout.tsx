import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import ErrorBoundary from "@/components/ErrorBoundary";
import Providers from "@/app/providers";
import { initializePerformanceFixes } from "@/lib/performance-fix";
import PerformanceFix from "@/components/PerformanceFix";

// Initialize performance fixes on client side
if (typeof window !== 'undefined') {
  initializePerformanceFixes();
}


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Effortless Society Management - Complete Society Management Solution",
  description: "Streamline society operations with member management, maintenance tracking, financial transparency, and community engagement - all in one powerful platform.",
  keywords: ["Society Management", "Community Living", "Member Management", "Maintenance Tracking", "Financial Management", "Resident Portal"],
  authors: [{ name: "Effortless Society Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Effortless Society Management",
    description: "Complete society management solution for modern communities",
    url: "https://effortless-society.com",
    siteName: "Effortless Society",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Effortless Society Management",
    description: "Complete society management solution for modern communities",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Immediate Performance API patch - runs before any React code
            (function() {
              if (typeof window !== 'undefined' && window.performance) {
                const originalMeasure = window.performance.measure;
                const originalMark = window.performance.mark;
                
                window.performance.measure = function(name, startMark, endMark) {
                  try {
                    return originalMeasure.call(this, name, startMark, endMark);
                  } catch (e) {
                    if (e.message && e.message.includes('negative time stamp')) {
                      console.warn('[Performance Fix] Early patch: Ignored measure "' + name + '" due to negative timestamp');
                      return undefined;
                    }
                    throw e;
                  }
                };
                
                window.performance.mark = function(name, options) {
                  try {
                    return originalMark.call(this, name, options);
                  } catch (e) {
                    console.warn('[Performance Fix] Early patch: Ignored mark "' + name + '"');
                    return undefined;
                  }
                };
              }
            })();
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <PerformanceFix />
        <Providers>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Toaster />
          <SonnerToaster />
        </Providers>
      </body>
    </html>
  );
}