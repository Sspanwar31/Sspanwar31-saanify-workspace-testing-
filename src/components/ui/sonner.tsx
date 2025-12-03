"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      closeButton
      expand={false}
      position="top-center"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          "--success-text": "white",
          "--error-bg": "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
          "--error-text": "white",
          "--info-bg": "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          "--info-text": "white",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
