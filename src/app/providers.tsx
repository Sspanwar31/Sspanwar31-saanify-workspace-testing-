'use client'

import { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

// ✅ यह है हमारा नया Custom Auth Provider (NextAuth हटा दिया)
import AuthProvider from "@/providers/auth-provider"

export default function Providers({ children }: { children: ReactNode }) {
  return (
    // Theme Provider सबसे ऊपर रहेगा
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {/* ✅ SessionProvider हटाकर AuthProvider लगा दिया */}
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}
