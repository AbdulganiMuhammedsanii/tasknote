import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  // Prefer Authorization header (Bearer) since Supabase JS stores session client-side
  const authHeader = req.headers.get("authorization") || ""
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (bearer) {
    return NextResponse.json({ access_token: bearer })
  }

  // Fallback to cookie if present (some setups still use auth cookies)
  const token = cookies().get("sb-access-token")?.value || null
  return NextResponse.json({ access_token: token })
}