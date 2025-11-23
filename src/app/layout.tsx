import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundaryClass } from "@/components/error-boundary-new";
import Providers from "@/app/providers";

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          <ErrorBoundaryClass>
            {children}
          </ErrorBoundaryClass>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}