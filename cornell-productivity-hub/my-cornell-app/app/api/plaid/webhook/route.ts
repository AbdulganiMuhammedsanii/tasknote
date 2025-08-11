import { NextRequest, NextResponse } from "next/server"
import { getPlaidClient } from "@/lib/plaid"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Basic webhook to refresh transactions. In production, verify Plaid signatures.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: true })

  // For simplicity, try to find all users with connections and resync. You can scope by item_id in body.item_id.
  const supabase = createRouteHandlerClient({ cookies })
  const { data: conns } = await supabase.from("bank_connections").select("user_id, item_id, access_token_encrypted")
  if (!conns?.length) return NextResponse.json({ ok: true })

  const client = getPlaidClient()

  for (const conn of conns) {
    try {
      const start = new Date()
      start.setDate(start.getDate() - 7)
      const end = new Date()
      const resp = await client.transactionsGet({
        access_token: conn.access_token_encrypted,
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
      })
      const txs = resp.data.transactions
      const rows = txs.map((t) => ({
        user_id: conn.user_id,
        account_id: t.account_id,
        plaid_transaction_id: t.transaction_id,
        name: t.name,
        merchant_name: t.merchant_name,
        amount: t.amount,
        iso_currency: t.iso_currency_code || "USD",
        date: t.date,
        category: t.category || [],
        pending: t.pending,
      }))
      await supabase.from("transactions").upsert(rows, { onConflict: "plaid_transaction_id" })
    } catch (e) {
      // ignore
    }
  }

  return NextResponse.json({ ok: true })
}



