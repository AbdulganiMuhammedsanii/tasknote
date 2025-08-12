import { NextRequest, NextResponse } from "next/server"
import { getPlaidClient } from "@/lib/plaid"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { CountryCode, Products } from "plaid"

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const {
    data: { user: cookieUser },
  } = await supabase.auth.getUser()

  console.log("session user:", cookieUser?.id)

  let user = cookieUser

  // Fallback: allow Bearer token in Authorization header
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

  const client = getPlaidClient()
  const redirectUri = process.env.PLAID_REDIRECT_URI
  const webhook = process.env.PLAID_WEBHOOK_URL

  const resp = await client.linkTokenCreate({
    user: { client_user_id: user.id },
    client_name: "Cornell Productivity Hub",
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: "en",
    redirect_uri: redirectUri || undefined,
    webhook: webhook || undefined,
  })

  return NextResponse.json({ link_token: resp.data.link_token })
}


