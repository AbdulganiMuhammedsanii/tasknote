"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useDating } from "@/hooks/use-dating"
import { Heart, Trash2, Calendar } from "lucide-react"

export function Dating() {
  const { entries, addEntry, updateEntry, deleteEntry } = useDating()
  const [person, setPerson] = useState("")
  const [note, setNote] = useState("")
  const [date, setDate] = useState("")

  const groups = useMemo(() => {
    const map: Record<string, typeof entries> = {}
    for (const e of entries) {
      const key = e.person_name
      if (!map[key]) map[key] = [] as any
      map[key].push(e)
    }
    return map
  }, [entries])

  const handleAdd = async () => {
    if (!person) return
    await addEntry(person, note || undefined, date || undefined)
    setPerson("")
    setNote("")
    setDate("")
  }

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dating</h1>
          <p className="text-gray-600 mt-1">Track people and notes grouped by person</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input placeholder="Person's name" value={person} onChange={(e) => setPerson(e.target.value)} />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="md:col-span-3">
            <Textarea placeholder="Notes" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <Button onClick={handleAdd} className="gap-2">
              <Heart className="h-4 w-4" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {Object.keys(groups).map((name) => (
          <Card key={name} className="hover:shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-600" /> {name}
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {groups[name].map((e) => (
                <div key={e.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {e.event_date ? new Date(e.event_date).toLocaleDateString() : "No date"}
                    </p>
                    <p className="whitespace-pre-wrap text-gray-800">{e.note}</p>
                  </div>
                  <div className="shrink-0">
                    <Button variant="ghost" onClick={() => deleteEntry(e.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {groups[name].length === 0 && <div className="py-4 text-gray-500">No notes yet.</div>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


