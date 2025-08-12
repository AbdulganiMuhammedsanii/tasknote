import { NextRequest, NextResponse } from "next/server"

// Plaid OAuth redirect target; Plaid will redirect back here
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const redirectTo = url.searchParams.get("redirect_url") || "/"

  // Preserve all query params (including oauth_state_id)
  const params = new URLSearchParams(url.search)
  params.delete("redirect_url")

  const dest = new URL(redirectTo, url.origin)
  dest.search = params.toString()
  return NextResponse.redirect(dest)
}


