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

  const client = getPlaidClient()
  const redirectUri = process.env.PLAID_REDIRECT_URI
  const webhook = process.env.PLAID_WEBHOOK_URL

  const resp = await client.linkTokenCreate({
    user: { client_user_id: user.id },
    client_name: "Cornell Productivity Hub",
    products: ["transactions"],
    country_codes: ["US"],
    language: "en",
    redirect_uri: redirectUri,
    webhook: webhook,
  })

  return NextResponse.json({ link_token: resp.data.link_token })
}


