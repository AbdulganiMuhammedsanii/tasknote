"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import type { Database } from "@/lib/supabase"

type Entry = Database["public"]["Tables"]["dating_entries"]["Row"]
type NewEntry = Database["public"]["Tables"]["dating_entries"]["Insert"]

export function useDating() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchEntries()
    else setLoading(false)
  }, [user?.id])

  const fetchEntries = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from("dating_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("event_date", { ascending: false })
    if (!error && data) setEntries(data)
    setLoading(false)
  }

  const addEntry = async (person_name: string, note?: string, event_date?: string | null) => {
    if (!user) return
    const { data, error } = await supabase
      .from("dating_entries")
      .insert({ user_id: user.id, person_name, note: note || null, event_date: event_date || null })
      .select()
      .single()
    if (error) throw error
    setEntries((prev) => [data, ...prev])
  }

  const updateEntry = async (id: string, updates: Partial<Entry>) => {
    const { data, error } = await supabase
      .from("dating_entries")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    setEntries((prev) => prev.map((e) => (e.id === id ? data : e)))
  }

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("dating_entries").delete().eq("id", id)
    if (error) throw error
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  return { entries, loading, addEntry, updateEntry, deleteEntry, refetch: fetchEntries }
}


