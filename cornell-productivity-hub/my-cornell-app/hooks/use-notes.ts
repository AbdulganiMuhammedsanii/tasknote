"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import type { Database } from "@/lib/supabase"

type Note = Database["public"]["Tables"]["notes"]["Row"]
type NewNote = Database["public"]["Tables"]["notes"]["Insert"]

export function useNotes() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchNotes()
    } else {
      setNotes([])
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const fetchNotes = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error("Error fetching notes:", error)
    } finally {
      setLoading(false)
    }
  }

  const addNote = async (note: Omit<NewNote, "user_id">) => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from("notes")
        .insert({ ...note, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      setNotes((prev) => [data, ...prev])
      return data
    } catch (error) {
      console.error("Error adding note:", error)
      throw error
    }
  }

  const updateNote = async (id: string, updates: Partial<Note>) => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .update({ ...updates, updated_at: new Date().toISOString() as any })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      setNotes((prev) => prev.map((n) => (n.id === id ? data : n)))
      return data
    } catch (error) {
      console.error("Error updating note:", error)
      throw error
    }
  }

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase.from("notes").delete().eq("id", id)
      if (error) throw error
      setNotes((prev) => prev.filter((n) => n.id !== id))
    } catch (error) {
      console.error("Error deleting note:", error)
      throw error
    }
  }

  return { notes, loading, addNote, updateNote, deleteNote, refetch: fetchNotes }
}



