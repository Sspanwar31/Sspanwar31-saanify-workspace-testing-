// src/app/super-admin/layout.tsx
"use client"

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      <main className="w-full p-4">{children}</main>
    </div>
  )
}
