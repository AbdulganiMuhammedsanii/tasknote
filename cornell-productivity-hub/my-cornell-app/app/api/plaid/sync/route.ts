import { NextResponse } from "next/server"
import { getPlaidClient } from "@/lib/plaid"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST() {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Fetch connection
  const { data: conn } = await supabase
    .from("bank_connections")
    .select("item_id, access_token_encrypted")
    .eq("user_id", user.id)
    .eq("provider", "plaid")
    .maybeSingle()
  if (!conn) return NextResponse.json({ error: "No bank connection" }, { status: 400 })

  const client = getPlaidClient()

  // Initial backfill: last 30 days
  const start = new Date()
  start.setDate(start.getDate() - 30)
  const end = new Date()

  const resp = await client.transactionsGet({
    access_token: conn.access_token_encrypted,
    start_date: start.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
    options: { count: 250, offset: 0 },
  })

  const txs = resp.data.transactions

  const rows = txs.map((t) => ({
    user_id: user.id,
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

  const { error } = await supabase.from("transactions").upsert(rows, { onConflict: "plaid_transaction_id" })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ imported: rows.length })
}


