import { NextRequest, NextResponse } from "next/server"
import { getPlaidClient } from "@/lib/plaid"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const {
    data: { user: cookieUser },
  } = await supabase.auth.getUser()
  let user = cookieUser
  if (!user) {
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (token) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (supabaseUrl && supabaseAnonKey) {
        const supabaseFromHeader = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        })
        const {
          data: { user: headerUser },
        } = await supabaseFromHeader.auth.getUser()
        user = headerUser ?? null
      }
    }
  }
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  console.log("blm", user);
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


