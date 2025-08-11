"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTransactions } from "@/hooks/use-transactions"
import { useAuth } from "@/components/auth/auth-provider"
import { usePlaidLink } from "react-plaid-link"
import { DollarSign, RefreshCw, Link as LinkIcon } from "lucide-react"

export function Spending() {
  const { user } = useAuth()
  const { transactions, loading, refetch } = useTransactions()
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [filter, setFilter] = useState("30")
  const [search, setSearch] = useState("")

  useEffect(() => {
    // Prepare link token on mount
    if (!user) return
    fetch("/api/plaid/create-link-token", { method: "POST", credentials: "include" })
      .then((r) => r.json())
      .then((d) => setLinkToken(d.link_token))
      .catch(() => { })
  }, [user?.id])

  const { open, ready } = usePlaidLink({
    token: linkToken || "",
    onSuccess: async (public_token) => {
      await fetch("/api/plaid/exchange-public-token", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token }),
      })
      await fetch("/api/plaid/sync", { method: "POST", credentials: "include" })
      refetch()
    },
  })

  const filtered = transactions.filter((t) => {
    const days = parseInt(filter, 10)
    const since = new Date()
    since.setDate(since.getDate() - days)
    const tDate = new Date(t.date)
    const inRange = tDate >= since
    const q = search.toLowerCase()
    const matches =
      (t.name || "").toLowerCase().includes(q) ||
      (t.merchant_name || "").toLowerCase().includes(q) ||
      (t.category || []).some((c) => c.toLowerCase().includes(q))
    return inRange && (q ? matches : true)
  })

  const total = filtered.reduce((sum, t) => sum + Number(t.amount || 0), 0)

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Spending</h1>
          <p className="text-gray-600 mt-1">Connect your bank and view recent purchases</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => open()} disabled={!ready || !linkToken} className="gap-2">
            <LinkIcon className="h-4 w-4" />
            {linkToken ? "Connect bank" : "Loading..."}
          </Button>
          <Button variant="outline" onClick={() => fetch("/api/plaid/sync", { method: "POST", credentials: "include" }).then(() => refetch())} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total (selected range)</p>
                <p className="text-2xl font-bold">${total.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <div className="md:col-span-2">
                <Input placeholder="Search merchant, name, category" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions {loading ? "(loading...)" : `(${filtered.length})`}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {filtered.map((t) => (
            <div key={t.id} className="py-3 flex items-center justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">{t.merchant_name || t.name || "Transaction"}</p>
                <p className="text-xs text-gray-500">
                  {new Date(t.date).toLocaleDateString()} • {(t.category || []).join(" · ")}
                </p>
              </div>
              <div className="text-right font-semibold">${Number(t.amount).toFixed(2)}</div>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="text-center text-gray-500 py-8">No transactions in this range.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


