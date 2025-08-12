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

  const body = await req.json()
  const public_token: string | undefined = body?.public_token
  if (!public_token) return NextResponse.json({ error: "Missing public_token" }, { status: 400 })

  const client = getPlaidClient()
  const resp = await client.itemPublicTokenExchange({ public_token })
  const access_token = resp.data.access_token
  const item_id = resp.data.item_id

  // Store in a server-side table (we will create it in SQL)
  const { error } = await supabase.from("bank_connections").upsert({
    user_id: user.id,
    provider: "plaid",
    item_id,
    access_token_encrypted: access_token, // For demo. In production, encrypt.
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}


