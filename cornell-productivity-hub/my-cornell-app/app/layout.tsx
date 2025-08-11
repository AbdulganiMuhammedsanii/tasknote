import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/app/globals.css"
import { AuthProvider } from "@/components/auth/auth-provider"
import { PomodoroProvider } from "@/components/pomodoro/pomodoro-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Cornell Productivity Hub",
  description: "Personal notes and task management for Cornell students",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <PomodoroProvider>{children}</PomodoroProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
