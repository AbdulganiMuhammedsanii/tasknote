import { Configuration, PlaidApi, PlaidEnvironments } from "plaid"

export function getPlaidClient() {
  const env = process.env.PLAID_ENV || "sandbox"
  const clientId = process.env.PLAID_CLIENT_ID
  const secret = process.env.PLAID_SECRET

  if (!clientId || !secret) {
    throw new Error("Missing PLAID_CLIENT_ID or PLAID_SECRET env vars")
  }

  const config = new Configuration({
    basePath: PlaidEnvironments[env as keyof typeof PlaidEnvironments],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
      },
    },
  })

  return new PlaidApi(config)
}



