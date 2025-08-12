"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import type { Database } from "@/lib/supabase"

type Job = Database["public"]["Tables"]["jobs"]["Row"]
type NewJob = Database["public"]["Tables"]["jobs"]["Insert"]

export function useJobs() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchJobs()
    else setLoading(false)
  }, [user?.id])

  const fetchJobs = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    if (!error && data) setJobs(data)
    setLoading(false)
  }

  const addJob = async (company: string, status: string) => {
    if (!user) return
    const { data, error } = await supabase
      .from("jobs")
      .insert({ user_id: user.id, company, status })
      .select()
      .single()
    if (error) throw error
    setJobs((prev) => [data, ...prev])
  }

  const updateJob = async (id: string, updates: Partial<Job>) => {
    const { data, error } = await supabase.from("jobs").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id).select().single()
    if (error) throw error
    setJobs((prev) => prev.map((j) => (j.id === id ? data : j)))
  }

  const deleteJob = async (id: string) => {
    const { error } = await supabase.from("jobs").delete().eq("id", id)
    if (error) throw error
    setJobs((prev) => prev.filter((j) => j.id !== id))
  }

  return { jobs, loading, addJob, updateJob, deleteJob, refetch: fetchJobs }
}


