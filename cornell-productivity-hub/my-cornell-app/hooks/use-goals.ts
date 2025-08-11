"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import type { Database } from "@/lib/supabase"

type Goal = Database["public"]["Tables"]["goals"]["Row"]
type NewGoal = Database["public"]["Tables"]["goals"]["Insert"]

export function useGoals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchGoals()
    }
  }, [user])

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setGoals(data || [])
    } catch (error) {
      console.error("Error fetching goals:", error)
    } finally {
      setLoading(false)
    }
  }

  const addGoal = async (goal: Omit<NewGoal, "user_id">) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("goals")
        .insert({ ...goal, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      setGoals([data, ...goals])
      return data
    } catch (error) {
      console.error("Error adding goal:", error)
      throw error
    }
  }

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    try {
      const { data, error } = await supabase
        .from("goals")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      setGoals(goals.map((goal) => (goal.id === id ? data : goal)))
      return data
    } catch (error) {
      console.error("Error updating goal:", error)
      throw error
    }
  }

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase.from("goals").delete().eq("id", id)

      if (error) throw error
      setGoals(goals.filter((goal) => goal.id !== id))
    } catch (error) {
      console.error("Error deleting goal:", error)
      throw error
    }
  }

  return {
    goals,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    refetch: fetchGoals,
  }
}
