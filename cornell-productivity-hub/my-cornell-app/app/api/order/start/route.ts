export const runtime = "nodejs"
export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { chromium } from "playwright"

type StartBody = {
  prompt: string
  startUrl?: string
  allowDomains?: string[]
  sessionId?: string | null
  acknowledgedSafetyIds?: string[]
}

type SafetyCheck = { id: string; code: string; message: string }

function isAllowed(url: string, allow: string[] | undefined): boolean {
  if (!allow || allow.length === 0) return true
  try {
    const host = new URL(url).hostname.replace(/^www\./, "")
    return allow.some((d) => host.endsWith(d.replace(/^www\./, "")))
  } catch {
    return true
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as StartBody
  if (!body?.prompt) return NextResponse.json({ status: "error", message: "Missing prompt" }, { status: 400 })

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ status: "error", message: "Missing OPENAI_API_KEY" }, { status: 500 })
  }

  const startUrl = body.startUrl || "https://bing.com"
  const allow = body.allowDomains || []

  const browser = await chromium.launch({
    headless: false,
    chromiumSandbox: true,
    args: ["--disable-extensions", "--disable-file-system"],
  })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1024, height: 768 })
  const logs: string[] = []

  try {
    await page.goto(startUrl)
    await page.waitForTimeout(500)

    const screenshotBase64 = async () => {
      const buf = await page.screenshot({ fullPage: false })
      return Buffer.from(buf).toString("base64")
    }

    const firstImage = await screenshotBase64()
    const first = await openai.responses.create({
      model: "computer-use-preview",
      tools: [
        {
          type: "computer_use_preview",
          display_width: 1024,
          display_height: 768,
          environment: "browser",
        },
      ],
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: body.prompt },
            { type: "input_image", image_url: `data:image/png;base64,${firstImage}`, detail: "auto" },
          ],
        },
      ],
      reasoning: { summary: "concise" },
      truncation: "auto",
    })

    let response = first
    let steps = 0
    let lastScreenshot = firstImage

    const handleAction = async (action: any) => {
      const t = action?.type
      if (t === "click") {
        const { x, y, button = "left" } = action
        logs.push(`click (${x},${y}) ${button}`)
        await page.mouse.click(x, y, { button })
      } else if (t === "scroll") {
        const { x, y, scrollX, scrollY } = action
        logs.push(`scroll at (${x},${y}) by (${scrollX},${scrollY})`)
        await page.mouse.move(x, y)
        await page.evaluate((args) => window.scrollBy(args.dx, args.dy), { dx: scrollX as number, dy: scrollY as number })
      } else if (t === "keypress") {
        const { keys } = action
        for (const k of keys) {
          logs.push(`keypress ${k}`)
          if (k.toLowerCase().includes("enter")) await page.keyboard.press("Enter")
          else if (k.toLowerCase().includes("space")) await page.keyboard.press(" ")
          else await page.keyboard.press(k)
        }
      } else if (t === "type") {
        const { text } = action
        logs.push(`type '${text?.slice(0, 80)}'`)
        await page.keyboard.type(text)
      } else if (t === "wait") {
        logs.push("wait")
        await page.waitForTimeout(1500)
      } else if (t === "screenshot") {
        logs.push("screenshot")
      } else {
        logs.push(`unhandled action ${t}`)
      }
    }

    while (steps < 10) {
      steps++
      const calls = (response.output as any[]).filter((i) => i.type === "computer_call")
      const safety = (response.output as any[])
        .flatMap((i) => (i.type === "computer_call" ? i.pending_safety_checks || [] : [])) as SafetyCheck[]

      if (safety && safety.length > 0 && (!body.acknowledgedSafetyIds || body.acknowledgedSafetyIds.length === 0)) {
        const shot = await screenshotBase64()
        await browser.close()
        return NextResponse.json({
          status: "needs_ack",
          sessionId: response.id,
          safetyChecks: safety,
          lastScreenshotBase64: shot,
          logs,
        })
      }

      if (calls.length === 0) {
        const shot = await screenshotBase64()
        await browser.close()
        return NextResponse.json({ status: "completed", sessionId: response.id, lastScreenshotBase64: shot, logs })
      }

      // Execute the first call
      const computerCall = calls[0]
      const action = computerCall.action

      // Domain allowlist check
      const cur = page.url()
      if (!isAllowed(cur || startUrl, allow)) {
        const shot = await screenshotBase64()
        await browser.close()
        return NextResponse.json({ status: "error", message: `Blocked domain: ${cur}`, lastScreenshotBase64: shot, logs })
      }

      await handleAction(action)
      await page.waitForTimeout(1000)
      lastScreenshot = await screenshotBase64()

      const ack = (response.output as any[])
        .flatMap((i) => (i.type === "computer_call" ? i.pending_safety_checks || [] : []))
        .filter((s: SafetyCheck) => body.acknowledgedSafetyIds?.includes(s.id))

      const nextResp = await openai.responses.create({
        model: "computer-use-preview",
        previous_response_id: response.id,
        tools: [
          {
            type: "computer_use_preview",
            display_width: 1024,
            display_height: 768,
            environment: "browser",
          },
        ],
        input: [
          {
            call_id: computerCall.call_id,
            type: "computer_call_output",
            output: { type: "computer_screenshot", image_url: `data:image/png;base64,${lastScreenshot}` },
            acknowledged_safety_checks: ack,
            current_url: page.url(),
          } as any,
        ],
        truncation: "auto",
      })
      response = nextResp
    }

    await browser.close()
    return NextResponse.json({ status: "completed", sessionId: response.id, lastScreenshotBase64: lastScreenshot, logs })
  } catch (e: any) {
    try {
      await browser.close()
    } catch { }
    return NextResponse.json({ status: "error", message: e?.message || "Failed" }, { status: 500 })
  }
}


