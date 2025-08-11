"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Login } from "@/components/auth/login"
import { ProductivityApp } from "@/components/productivity-app"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return <ProductivityApp />
}
