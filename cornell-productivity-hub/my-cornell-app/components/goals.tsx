"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Target, Calendar, Edit, Trash2 } from "lucide-react"
import { useGoals } from "@/hooks/use-goals"

export function Goals() {
  const { goals, addGoal, updateGoal, deleteGoal } = useGoals()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    deadline: "",
    category: "",
    priority: "medium",
  })

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.deadline || !newGoal.category) return
    addGoal({
      title: newGoal.title,
      description: newGoal.description,
      deadline: newGoal.deadline,
      category: newGoal.category,
      priority: newGoal.priority,
      progress: 0,
    } as any)
    setNewGoal({ title: "", description: "", deadline: "", category: "", priority: "medium" })
    setIsDialogOpen(false)
  }

  const updateProgress = (id: string, newProgress: number) => {
    updateGoal(id, { progress: newProgress } as any)
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

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Goals</h1>
          <p className="text-gray-600 mt-1">Track your progress and achieve your dreams</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="Enter your goal"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  placeholder="Describe your goal in detail"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                    placeholder="e.g., Learning, Health"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newGoal.priority}
                    onValueChange={(value) => setNewGoal({ ...newGoal, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                />
              </div>
              <Button onClick={handleAddGoal} className="w-full">
                Create Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <Card key={goal.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{goal.title}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteGoal(String(goal.id))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Badge variant={getPriorityColor(goal.priority)}>{goal.priority}</Badge>
                <Badge variant="outline">{goal.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-sm">{goal.description}</p>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-gray-500">{goal.progress}%</span>
                </div>
                <Progress value={goal.progress} className="h-2" />
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                Due: {new Date(goal.deadline).toLocaleDateString()}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateProgress(String(goal.id), Math.min(100, goal.progress + 10))}
                  className="flex-1"
                >
                  +10%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateProgress(String(goal.id), Math.min(100, goal.progress + 25))}
                  className="flex-1"
                >
                  +25%
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
