import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { getPlaidClient } from "@/lib/plaid"
import { Products } from "plaid"

// Convenience endpoint to seed a Plaid sandbox connection for the current user
export async function POST(req: NextRequest) {
  // Resolve user via cookie or Authorization header
  const cookieStore = cookies()
  const supabaseCookie = createRouteHandlerClient({ cookies: () => cookieStore })
  const { data: cookieData } = await supabaseCookie.auth.getUser()
  let user = cookieData.user

  if (!user) {
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (token) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (supabaseUrl && supabaseAnonKey) {
        const supabaseHeader = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        })
        const { data } = await supabaseHeader.auth.getUser()
        user = data.user
      }
    }
  }

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const client = getPlaidClient()

  // Create a sandbox public token for a test institution and exchange it
  const sandboxPublic = await client.sandboxPublicTokenCreate({
    institution_id: "ins_109508", // First Platypus Credit Union (test)
    initial_products: [Products.Transactions],
    options: {
      webhook: process.env.PLAID_WEBHOOK_URL || undefined,
    },
  })

  const public_token = sandboxPublic.data.public_token
  const exchange = await client.itemPublicTokenExchange({ public_token })

  const access_token = exchange.data.access_token
  const item_id = exchange.data.item_id

  const { error } = await supabaseCookie.from("bank_connections").upsert(
    {
      user_id: user.id,
      provider: "plaid",
      item_id,
      access_token_encrypted: access_token, // TODO: encrypt for production
    },
    { onConflict: "user_id,provider" }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, item_id })
}


