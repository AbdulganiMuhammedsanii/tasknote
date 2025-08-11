import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    await supabase.auth.exchangeCodeForSession(code)

    // After establishing a session, upsert the user's profile with metadata
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const email = user.email ?? ""
      const metadata = (user as any).user_metadata || {}
      const fullName = metadata.full_name || metadata.name || null
      const avatarUrl = metadata.avatar_url || metadata.picture || null

      await supabase.from("profiles").upsert(
        {
          id: user.id,
          email,
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
}
