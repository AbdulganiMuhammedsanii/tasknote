"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type RunResponse = {
  status: "running" | "needs_ack" | "completed" | "error"
  sessionId?: string
  message?: string
  safetyChecks?: { id: string; code: string; message: string }[]
  lastScreenshotBase64?: string
  logs?: string[]
}

export function Order() {
  const [prompt, setPrompt] = useState("")
  const [startUrl, setStartUrl] = useState("https://bing.com")
  const [allowDomains, setAllowDomains] = useState("amazon.com, bestbuy.com")
  const [ackHighImpact, setAckHighImpact] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [lastResp, setLastResp] = useState<RunResponse | null>(null)
  const [ackIds, setAckIds] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const run = async (withAck = false) => {
    if (!ackHighImpact) {
      alert("Please acknowledge the risks before proceeding.")
      return
    }
    setBusy(true)
    setLastResp(null)
    try {
      const res = await fetch("/api/order/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          startUrl,
          allowDomains: allowDomains
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean),
          sessionId: withAck ? sessionId : null,
          acknowledgedSafetyIds: withAck ? ackIds : [],
        }),
      })
      const json: RunResponse = await res.json()
      setLastResp(json)
      if (json.sessionId) setSessionId(json.sessionId)
      if (json.status === "needs_ack" && json.safetyChecks) {
        setAckIds(json.safetyChecks.map((s) => s.id))
      } else {
        setAckIds([])
      }
    } catch (e: any) {
      setLastResp({ status: "error", message: e?.message || "Request failed" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Order assistant (beta)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This uses OpenAI Computer Use to browse and act in a sandboxed browser. Keep a human in the loop.
            Do not use for high-stakes automation. You must approve sensitive actions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Task</label>
              <Textarea placeholder="e.g., Find the best price for Apple AirPods Pro and purchase them." value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start URL</label>
              <Input placeholder="https://bing.com" value={startUrl} onChange={(e) => setStartUrl(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Allowed domains (comma-separated)</label>
              <Input placeholder="amazon.com, bestbuy.com" value={allowDomains} onChange={(e) => setAllowDomains(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input id="ack" type="checkbox" checked={ackHighImpact} onChange={(e) => setAckHighImpact(e.target.checked)} />
            <label htmlFor="ack" className="text-sm text-gray-700">
              I understand the risks and will supervise actions, especially on sensitive pages.
            </label>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => run(false)} disabled={busy || !prompt}>
              {busy ? "Running..." : sessionId ? "Restart" : "Start"}
            </Button>
            {lastResp?.status === "needs_ack" && (
              <Button variant="secondary" onClick={() => run(true)} disabled={busy}>
                Acknowledge and Continue
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {lastResp && (
        <Card>
          <CardHeader>
            <CardTitle>Run status: {lastResp.status}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastResp.message && <div className="text-sm text-gray-700">{lastResp.message}</div>}
            {lastResp.safetyChecks && lastResp.safetyChecks.length > 0 && (
              <div className="text-sm">
                <div className="font-medium mb-2">Pending safety checks</div>
                <ul className="list-disc pl-5 space-y-1">
                  {lastResp.safetyChecks.map((s) => (
                    <li key={s.id}>
                      <span className="font-mono text-xs">{s.code}</span>: {s.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {lastResp.lastScreenshotBase64 && (
              <div>
                <div className="text-sm font-medium mb-1">Latest screenshot</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="screenshot"
                  src={`data:image/png;base64,${lastResp.lastScreenshotBase64}`}
                  style={{ width: 512, border: "1px solid #e5e7eb" }}
                />
              </div>
            )}
            {lastResp.logs && lastResp.logs.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-1">Logs</div>
                <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-auto max-h-64">{lastResp.logs.join("\n")}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}


