import { NextRequest, NextResponse } from "next/server"

// Plaid OAuth redirect target; Plaid will redirect back here
export async function GET(req: NextRequest) {
  // Typically, you would just redirect back to the app page that opens Plaid Link,
  // Plaid Link will resume using the Link token in the browser.
  const url = new URL(req.url)
  const redirectTo = url.searchParams.get("redirect_url") || "/"
  return NextResponse.redirect(new URL(redirectTo, url.origin))
}


