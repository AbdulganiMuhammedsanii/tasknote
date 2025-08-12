"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, CheckSquare, Calendar, ListFilter } from "lucide-react"
import { useTasks } from "@/hooks/use-tasks"

export function Tasks() {
  const { tasks, addTask, updateTask } = useTasks()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    priority: "medium",
    dueDate: "",
    category: "Work",
  })

  const [filter, setFilter] = useState("all")

  const handleAddTask = async () => {
    if (!newTask.title) return
    await addTask({
      title: newTask.title,
      priority: newTask.priority,
      due_date: newTask.dueDate || null,
      category: newTask.category,
      completed: false,
    } as any)
    setNewTask({ title: "", priority: "medium", dueDate: "", category: "Work" })
    setIsDialogOpen(false)
  }

  const toggleTask = async (id: string, completed: boolean) => {
    await updateTask(id, { completed })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  const getFilteredTasks = (filterType: string) => {
    // Local date in YYYY-MM-DD to avoid UTC off-by-one issues
    const today = new Date().toLocaleDateString("en-CA")

    const sortByDue = (arr: typeof tasks) => {
      const today = new Date().toLocaleDateString("en-CA")
      return [...arr].sort((a, b) => {
        const aStr = a.due_date ? String(a.due_date).slice(0, 10) : null
        const bStr = b.due_date ? String(b.due_date).slice(0, 10) : null
        const aRank = aStr === null ? 2 : aStr >= today ? 0 : 1
        const bRank = bStr === null ? 2 : bStr >= today ? 0 : 1
        if (aRank !== bRank) return aRank - bRank
        if (aRank === 0) return (new Date(aStr!).getTime()) - (new Date(bStr!).getTime())
        if (aRank === 1) return (new Date(bStr!).getTime()) - (new Date(aStr!).getTime())
        return 0
      })
    }

    switch (filterType) {
      case "today":
        return sortByDue(tasks.filter((task) => (task.due_date || "").slice(0, 10) === today))
      case "upcoming":
        return sortByDue(tasks.filter((task) => (task.due_date || "") > today && !task.completed))
      case "completed":
        return sortByDue(tasks.filter((task) => task.completed))
      default:
        return sortByDue(tasks)
    }
  }

  type TaskType = ReturnType<typeof useTasks>["tasks"][number]
  const TaskList = ({ tasks }: { tasks: TaskType[] }) => (
    <div className="space-y-3">
      {tasks.map((task: TaskType) => (
        <Card key={String(task.id)} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(String(task.id), !task.completed)} />
              <div className="flex-1">
                <p className={`font-medium ${task.completed ? "line-through text-gray-500" : "text-gray-900"}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                    {task.priority}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {task.category}
                  </Badge>
                  {task.due_date && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No tasks found</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Organize and track your daily activities</p>
        </div>
        <div className="flex gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <ListFilter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Input
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Enter task title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={newTask.category}
                    onValueChange={(value) => setNewTask({ ...newTask, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Work">Work</SelectItem>
                      <SelectItem value="Personal">Personal</SelectItem>
                      <SelectItem value="Health">Health</SelectItem>
                      <SelectItem value="Learning">Learning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddTask} className="w-full">
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <TaskList tasks={getFilteredTasks("all")} />
        </TabsContent>

        <TabsContent value="today">
          <TaskList tasks={getFilteredTasks("today")} />
        </TabsContent>

        <TabsContent value="upcoming">
          <TaskList tasks={getFilteredTasks("upcoming")} />
        </TabsContent>

        <TabsContent value="completed">
          <TaskList tasks={getFilteredTasks("completed")} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
