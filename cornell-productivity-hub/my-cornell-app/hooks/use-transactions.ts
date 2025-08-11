"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"

export type Transaction = {
  id: string
  user_id: string
  account_id: string
  plaid_transaction_id: string
  name: string | null
  merchant_name: string | null
  amount: number
  iso_currency: string | null
  date: string
  category: string[] | null
  pending: boolean | null
  created_at: string
}

export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setTransactions([])
      setLoading(false)
      return
    }
    fetchTransactions()
  }, [user?.id])

  const fetchTransactions = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(200)
    if (!error && data) setTransactions(data as any)
    setLoading(false)
  }

  return { transactions, loading, refetch: fetchTransactions }
}



