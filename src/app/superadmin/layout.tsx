// src/app/superadmin/layout.tsx
"use client"

import AuthGuard from '@/components/auth/AuthGuard'

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard requiredRole="SUPERADMIN">
      <div className="min-h-screen w-full bg-gray-50">
        <main className="w-full p-4">{children}</main>
      </div>
    </AuthGuard>
  )
}
