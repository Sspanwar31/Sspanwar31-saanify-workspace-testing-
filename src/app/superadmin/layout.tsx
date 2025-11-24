"use client";

import AuthGuard from "@/components/auth/AuthGuard";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="SUPERADMIN">
      {children}
    </AuthGuard>
  );
}
