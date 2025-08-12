"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import type { Database } from "@/lib/supabase"

type Task = Database["public"]["Tables"]["tasks"]["Row"]
type NewTask = Database["public"]["Tables"]["tasks"]["Insert"]

export function useTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchTasks()
    } else {
      setTasks([])
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const fetchTasks = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("due_date", { ascending: true })

      if (error) throw error
      // Use local date to avoid UTC-induced off-by-one
      const todayStr = new Date().toLocaleDateString("en-CA")
      const sorted = (data || []).sort((a: any, b: any) => {
        const aStr = a.due_date ? String(a.due_date).slice(0, 10) : null
        const bStr = b.due_date ? String(b.due_date).slice(0, 10) : null

        const aRank = aStr === null ? 2 : aStr >= todayStr ? 0 : 1
        const bRank = bStr === null ? 2 : bStr >= todayStr ? 0 : 1
        if (aRank !== bRank) return aRank - bRank

        if (aRank === 0) {
          // future/today: ascending (soonest first)
          return (new Date(aStr!).getTime()) - (new Date(bStr!).getTime())
        }
        if (aRank === 1) {
          // past: descending (most recent first)
          return (new Date(bStr!).getTime()) - (new Date(aStr!).getTime())
        }
        return 0
      })
      setTasks(sorted)
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const addTask = async (task: Omit<NewTask, "user_id">) => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...task, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      setTasks((prev) => [data, ...prev])
      return data
    } catch (error) {
      console.error("Error adding task:", error)
      throw error
    }
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .update({ ...updates, updated_at: new Date().toISOString() as any })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      setTasks((prev) => prev.map((t) => (t.id === id ? data : t)))
      return data
    } catch (error) {
      console.error("Error updating task:", error)
      throw error
    }
  }

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id)
      if (error) throw error
      setTasks((prev) => prev.filter((t) => t.id !== id))
    } catch (error) {
      console.error("Error deleting task:", error)
      throw error
    }
  }

  return { tasks, loading, addTask, updateTask, deleteTask, refetch: fetchTasks }
}



