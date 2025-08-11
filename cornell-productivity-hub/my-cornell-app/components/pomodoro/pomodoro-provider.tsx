"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"

type PomodoroState = {
  workMinutes: number
  breakMinutes: number
  isRunning: boolean
  isBreak: boolean
  secondsLeft: number
  lastUpdated: number | null
}

const defaultState: PomodoroState = {
  workMinutes: 25,
  breakMinutes: 5,
  isRunning: false,
  isBreak: false,
  secondsLeft: 25 * 60,
  lastUpdated: null,
}

type PomodoroContextType = PomodoroState & {
  setWorkMinutes: (m: number) => void
  setBreakMinutes: (m: number) => void
  toggle: () => void
  reset: () => void
  formatTime: (s: number) => string
}

const PomodoroContext = createContext<PomodoroContextType | null>(null)

const STORAGE_KEY = "pomodoroState"

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PomodoroState>(defaultState)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null
      if (raw) {
        const parsed = JSON.parse(raw) as PomodoroState
        // If previously running, fast-forward based on elapsed time
        if (parsed.lastUpdated && parsed.isRunning) {
          const now = Date.now()
          let elapsed = Math.floor((now - parsed.lastUpdated) / 1000)
          let secondsLeft = parsed.secondsLeft
          let isBreak = parsed.isBreak
          while (elapsed > 0) {
            if (elapsed < secondsLeft) {
              secondsLeft -= elapsed
              elapsed = 0
              break
            } else {
              elapsed -= secondsLeft
              // switch session
              isBreak = !isBreak
              secondsLeft = (isBreak ? parsed.breakMinutes : parsed.workMinutes) * 60
            }
          }
          setState({ ...parsed, secondsLeft, isBreak, lastUpdated: now })
        } else {
          setState(parsed)
        }
        return
      }
    } catch { }
    setState(defaultState)
  }, [])

  // Persist to localStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      }
    } catch { }
  }, [state])

  // Ticking
  useEffect(() => {
    if (!state.isRunning) return
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setState((prev) => {
        const now = Date.now()
        const last = prev.lastUpdated ?? now
        const elapsed = Math.max(1, Math.floor((now - last) / 1000))
        let remaining = prev.secondsLeft
        let isBreak = prev.isBreak
        let workMinutes = prev.workMinutes
        let breakMinutes = prev.breakMinutes
        let stillRunning = prev.isRunning

        let leftover = elapsed
        while (leftover > 0) {
          if (remaining > leftover) {
            remaining -= leftover
            leftover = 0
          } else {
            leftover -= remaining
            isBreak = !isBreak
            remaining = (isBreak ? breakMinutes : workMinutes) * 60
          }
        }

        return {
          ...prev,
          secondsLeft: remaining,
          isBreak,
          lastUpdated: now,
          isRunning: stillRunning,
        }
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state.isRunning, state.isBreak, state.workMinutes, state.breakMinutes])

  const setWorkMinutes = (m: number) =>
    setState((s) => {
      const minutes = Math.max(1, Math.min(180, Math.trunc(m)))
      // Only reset remaining if not running and currently in work session
      const adjust = !s.isRunning && !s.isBreak
      return { ...s, workMinutes: minutes, secondsLeft: adjust ? minutes * 60 : s.secondsLeft }
    })

  const setBreakMinutes = (m: number) =>
    setState((s) => {
      const minutes = Math.max(1, Math.min(60, Math.trunc(m)))
      const adjust = !s.isRunning && s.isBreak
      return { ...s, breakMinutes: minutes, secondsLeft: adjust ? minutes * 60 : s.secondsLeft }
    })

  const toggle = () =>
    setState((s) => ({ ...s, isRunning: !s.isRunning, lastUpdated: Date.now() }))

  const reset = () =>
    setState((s) => ({ ...s, isRunning: false, isBreak: false, secondsLeft: s.workMinutes * 60, lastUpdated: null }))

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  return (
    <PomodoroContext.Provider
      value={{ ...state, setWorkMinutes, setBreakMinutes, toggle, reset, formatTime }}
    >
      {children}
    </PomodoroContext.Provider>
  )
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext)
  if (!ctx) throw new Error("usePomodoro must be used within PomodoroProvider")
  return ctx
}


