"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { Goals } from "@/components/goals"
import { Tasks } from "@/components/tasks"
import { Notes } from "@/components/notes"
import { Spending } from "@/components/spending"
import { Jobs } from "@/components/jobs"
import { Dating } from "@/components/dating"

export function ProductivityApp() {
  const [activeView, setActiveView] = useState("dashboard")

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard />
      case "goals":
        return <Goals />
      case "tasks":
        return <Tasks />
      case "notes":
        return <Notes />
      case "spending":
        return <Spending />
      case "jobs":
        return <Jobs />
      case "dating":
        return <Dating />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed inset-y-0 left-0 w-64">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
      </div>
      <main className="ml-64 overflow-hidden">{renderView()}</main>
    </div>
  )
}
