"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Target, CheckSquare, Clock, TrendingUp, Plus, Calendar, Play, Pause, RotateCcw } from "lucide-react"
import { useMemo, useState } from "react"
import { useNotes } from "@/hooks/use-notes"
import { useTasks } from "@/hooks/use-tasks"
import { useGoals } from "@/hooks/use-goals"
import { usePomodoro } from "@/components/pomodoro/pomodoro-provider"

export function Dashboard() {
  const [isQuickOpen, setIsQuickOpen] = useState(false)
  const [quickTitle, setQuickTitle] = useState("")
  const [quickContent, setQuickContent] = useState("")
  const { addNote } = useNotes()
  const { tasks } = useTasks()
  const { goals } = useGoals()
  const { workMinutes, breakMinutes, isRunning, isBreak, secondsLeft, setWorkMinutes, setBreakMinutes, toggle, reset, formatTime } = usePomodoro()

  const handleQuickAdd = async () => {
    if (!quickTitle && !quickContent) return
    await addNote({ title: quickTitle || "Untitled", content: quickContent || "", category: "Quick", tags: [] })
    setQuickTitle("")
    setQuickContent("")
    setIsQuickOpen(false)
  }
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], [])
  const todaysTasks = useMemo(
    () => tasks.filter((t) => (t.due_date || "").slice(0, 10) === todayStr),
    [tasks, todayStr]
  )
  const completedTasks = useMemo(() => todaysTasks.filter((t) => t.completed).length, [todaysTasks])
  const totalTasks = useMemo(() => todaysTasks.length, [todaysTasks])

  const activeGoals = useMemo(() => goals.filter((g) => (g.progress ?? 0) < 100).slice(0, 3), [goals])

  // Pomodoro logic is provided globally via PomodoroProvider

  return (
    <div className="p-10 space-y-8 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Good morning, John!</h1>
          <p className="text-gray-600 mt-1">Here's what's happening today</p>
        </div>
        <Dialog open={isQuickOpen} onOpenChange={setIsQuickOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Quick Add
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Quick Add Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Title" value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)} />
              <Textarea placeholder="Content" value={quickContent} onChange={(e) => setQuickContent(e.target.value)} />
              <Button className="w-full" onClick={handleQuickAdd}>Add</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Prominent Pomodoro */}
      <div className="w-full flex items-center justify-center">
        <Card className="w-full max-w-3xl shadow-sm border-gray-200">
          <CardContent className="p-10">
            <div className="text-center space-y-6">
              <p className="text-sm text-muted-foreground">Pomodoro</p>
              <div className="text-6xl font-bold tracking-tight">{formatTime(secondsLeft)}</div>
              <p className="text-sm text-muted-foreground">{isBreak ? "Break" : "Work"}</p>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div>
                  <p className="text-sm text-muted-foreground">Work (minutes)</p>
                  <Input type="number" min={1} max={180} value={workMinutes}
                    onChange={(e) => setWorkMinutes(Math.max(1, Math.min(180, Number(e.target.value) || 1)))} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Break (minutes)</p>
                  <Input type="number" min={1} max={60} value={breakMinutes}
                    onChange={(e) => setBreakMinutes(Math.max(1, Math.min(60, Number(e.target.value) || 1)))} />
                </div>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button onClick={toggle} className="gap-2">
                  {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isRunning ? "Pause" : "Start"}
                </Button>
                <Button variant="outline" onClick={reset} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasks Today</p>
                <p className="text-2xl font-bold">
                  {completedTasks}/{totalTasks}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Goals</p>
                <p className="text-2xl font-bold">{activeGoals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Productivity</p>
                <p className="text-2xl font-bold">{totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Today's Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaysTasks.map((task) => (
              <div key={String(task.id)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${task.completed ? "bg-green-500 border-green-500" : "border-gray-300"
                    }`}
                >
                  {task.completed && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${task.completed ? "line-through text-gray-500" : "text-gray-900"}`}>
                    {task.title}
                  </p>
                </div>
                <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>{task.priority}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Goal Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeGoals.map((goal) => (
              <div key={String(goal.id)} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{goal.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{goal.progress}%</span>
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(goal.deadline).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
                <Progress value={goal.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Bottom area no longer includes Pomodoro controls; primary controls are at top */}
      </div>
    </div>
  )
}
