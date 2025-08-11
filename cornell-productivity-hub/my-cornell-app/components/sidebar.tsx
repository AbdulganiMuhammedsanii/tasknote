"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth/auth-provider"
import { LayoutDashboard, Target, CheckSquare, FileText, Settings, Calendar, LogOut, DollarSign } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface SidebarProps {
  activeView: string
  setActiveView: (view: string) => void
}

export function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const { user, signOut } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      const email = user.email ?? ""
      const meta: any = (user as any).user_metadata || {}
      const fallbackNameFromEmail = email ? email.split("@")[0] : ""
      const googleAvatar = meta.avatar_url || meta.picture || null

      // Try profiles table first for canonical values
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle()

      setAvatarUrl(data?.avatar_url || googleAvatar || null)
      setDisplayName(
        (data?.full_name as string | null) || (meta.full_name as string | null) || (meta.name as string | null) || fallbackNameFromEmail
      )
    }

    loadProfile()
  }, [user])

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "goals", label: "Goals", icon: Target },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "notes", label: "Notes", icon: FileText },
    { id: "spending", label: "Spending", icon: DollarSign },
  ]

  const getInitials = (email: string) => {
    const name = email.split("@")[0]
    return name.slice(0, 2).toUpperCase()
  }

  const [fullName, setFullName] = useState<string | null>(null)

  useEffect(() => {
    const loadName = async () => {
      if (!user) return
      const meta: any = (user as any).user_metadata || {}
      const emailName = user.email ? user.email.split("@")[0] : null
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      setFullName((data?.full_name as string | null) || meta.full_name || meta.name || emailName)
    }
    loadName()
  }, [user])

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={displayName ?? "Cornell User"} />
            ) : (
              <AvatarFallback className="bg-red-600 text-white">
                {user?.email ? getInitials(user.email) : "CU"}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h2 className="font-semibold text-gray-900">{fullName || "Cornell User"}</h2>
            <p className="text-sm text-gray-500">Cornell Student</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={activeView === item.id ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 h-11"
                onClick={() => setActiveView(item.id)}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Button>
            )
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </div>
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
