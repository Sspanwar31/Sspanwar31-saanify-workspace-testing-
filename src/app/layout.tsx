import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import ErrorBoundary from "@/components/ErrorBoundary";
import Providers from "@/app/providers";
import ConsoleFilterManager from "@/components/ConsoleFilterManager";
import { ConsoleFilterPanel } from "@/components/ConsoleFilterPanel";

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                'use strict';
                if (typeof window === 'undefined') return;
                const originalConsole = {
                  log: window.console.log,
                  warn: window.console.warn,
                  error: window.console.error,
                  info: window.console.info,
                  debug: window.console.debug
                };
                const config = {
                  enabled: true,
                  filters: ['mcp data', 'metadata: {…}', '{metadata: {…}}', 'CbxGpD3N.js', 'chrome-extension', 'moz-extension']
                };
                function shouldFilter(message) {
                  if (!config.enabled) return false;
                  return config.filters.some(filter => {
                    try {
                      return message.toLowerCase().includes(filter.toLowerCase());
                    } catch (e) {
                      return false;
                    }
                  });
                }
                function getMessage(args) {
                  return args.map(arg => {
                    if (typeof arg === 'string') return arg;
                    if (typeof arg === 'object') {
                      try {
                        return JSON.stringify(arg);
                      } catch (e) {
                        return '[Object]';
                      }
                    }
                    return String(arg);
                  }).join(' ');
                }
                window.console.log = function(...args) {
                  const message = getMessage(args);
                  if (shouldFilter(message)) return;
                  return originalConsole.log.apply(window.console, args);
                };
                window.console.warn = function(...args) {
                  const message = getMessage(args);
                  if (shouldFilter(message)) return;
                  return originalConsole.warn.apply(window.console, args);
                };
                window.console.error = function(...args) {
                  const message = getMessage(args);
                  if (shouldFilter(message)) return;
                  return originalConsole.error.apply(window.console, args);
                };
                window.console.info = function(...args) {
                  const message = getMessage(args);
                  if (shouldFilter(message)) return;
                  return originalConsole.info.apply(window.console, args);
                };
                window.console.debug = function(...args) {
                  const message = getMessage(args);
                  if (shouldFilter(message)) return;
                  return originalConsole.debug.apply(window.console, args);
                };
                window.consoleFilter = {
                  toggle: () => {
                    config.enabled = !config.enabled;
                  },
                  enable: () => {
                    config.enabled = true;
                  },
                  disable: () => {
                    config.enabled = false;
                  },
                  isEnabled: () => config.enabled
                };
              })();
            `
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          <ErrorBoundary>
            <ConsoleFilterManager />
            {children}
            <ConsoleFilterPanel />
          </ErrorBoundary>
          <Toaster />
          <SonnerToaster />
        </Providers>
      </body>
    </html>
  );
}