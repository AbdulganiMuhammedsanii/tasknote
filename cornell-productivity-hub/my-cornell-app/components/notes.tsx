"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, FileText, Search, Edit, Trash2, Tag } from "lucide-react"
import { useNotes } from "@/hooks/use-notes"

export function Notes() {
  const { notes, addNote, updateNote, deleteNote } = useNotes()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    category: "Personal",
    tags: "",
  })

  const categories = ["Personal", "Work", "Ideas", "Learning", "Health", "Quick"]

  const handleSaveNote = async () => {
    if (!newNote.title && !newNote.content) return
    const tags = newNote.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    if (editingNote) {
      await updateNote(editingNote.id, {
        title: newNote.title,
        content: newNote.content,
        category: newNote.category,
        tags,
      } as any)
    } else {
      await addNote({ title: newNote.title || "Untitled", content: newNote.content || "", category: newNote.category, tags })
    }

    setNewNote({ title: "", content: "", category: "Personal", tags: "" })
    setEditingNote(null)
    setIsDialogOpen(false)
  }

  const handleEditNote = (note: any) => {
    setEditingNote(note)
    setNewNote({
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags.join(", "),
    })
    setIsDialogOpen(true)
  }

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id)
  }

  const filteredNotes = useMemo(() => notes.filter((note) => {
    const matchesSearch =
      (note.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.content || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.tags || []).some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = selectedCategory === "all" || note.category === selectedCategory

    return matchesSearch && matchesCategory
  }), [notes, searchTerm, selectedCategory])

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
          <p className="text-gray-600 mt-1">Capture your thoughts and ideas</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) {
              setEditingNote(null)
              setNewNote({ title: "", content: "", category: "Personal", tags: "" })
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingNote ? "Edit Note" : "Create New Note"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="Note title"
                  className="text-lg font-medium"
                />
              </div>
              <div>
                <Textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Write your note here..."
                  className="min-h-[200px] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Select
                    value={newNote.category}
                    onValueChange={(value) => setNewNote({ ...newNote, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    value={newNote.tags}
                    onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                    placeholder="Tags (comma separated)"
                  />
                </div>
              </div>
              <Button onClick={handleSaveNote} className="w-full">
                {editingNote ? "Update Note" : "Create Note"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes..."
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map((note) => (
          <Card key={note.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg line-clamp-1">{note.title}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditNote(note)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteNote(note.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Badge variant="outline" className="w-fit">
                {note.category}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-sm line-clamp-4 whitespace-pre-wrap">{note.content}</p>

              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {note.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="text-xs text-gray-500 pt-2 border-t">
                <p>Created: {note.created_at ? new Date(note.created_at).toLocaleDateString() : ""}</p>
                {note.updated_at && note.updated_at !== note.created_at && (
                  <p>Updated: {new Date(note.updated_at).toLocaleDateString()}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No notes found</p>
          <p className="text-sm">Try adjusting your search or create a new note</p>
        </div>
      )}
    </div>
  )
}
