'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { X, AlertTriangle } from 'lucide-react'

interface Task {
  _id: string
  title: string
  description?: string
  dueDate: string
  priority: string
  status: string
  tags?: string[]
}

export default function FilterTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchTasks = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.status === 401) {
        localStorage.removeItem('token')
        router.push('/login')
        return
      }
      if (!response.ok) throw new Error('Failed to fetch tasks')
      const data = await response.json()
      setTasks(data.tasks)
      setError(null)
    } catch (err) {
      setError('Error fetching tasks. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const fetchTags = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch('/api/tags', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.status === 401) {
        localStorage.removeItem('token')
        router.push('/login')
        return
      }
      if (!response.ok) throw new Error('Failed to fetch tags')
      const data = await response.json()
      setAllTags(data.tags)
    } catch (err) {
      setError('Error fetching tags. Please try again.')
      console.error(err)
    }
  }, [router])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    } else {
      fetchTags()
      fetchTasks()
    }
  }, [router, fetchTags, fetchTasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const statusMatch = selectedStatus === 'all' || task.status === selectedStatus
      const tagsMatch = selectedTags.length === 0 || (task.tags && selectedTags.every(tag => task.tags?.includes(tag)))
      return statusMatch && tagsMatch
    })
  }, [tasks, selectedStatus, selectedTags])

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value)
  }

  const handleTagSelect = (tag: string) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
      return newTags
    })
  }

  const handleTagRemove = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag))
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Filter Tasks</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="mb-6 space-y-4">
        <div>
          <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Status
          </label>
          <Select onValueChange={handleStatusChange} value={selectedStatus}>
            <SelectTrigger id="status-select">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="To Do">To Do</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {tag}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={() => handleTagRemove(tag)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Button
                key={tag}
                variant={selectedTags.includes(tag) ? "secondary" : "outline"}
                size="sm"
                onClick={() => handleTagSelect(tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTasks.map((task) => (
          console.log('Task tags:', task.tags),
          <Card key={task._id}>
            <CardHeader>
              <CardTitle>{task.title}</CardTitle>
              <CardDescription>Due: {new Date(task.dueDate).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">{task.description}</p>
              <p className="mb-2">Priority: {task.priority}</p>
              <p className="mb-2">Status: {task.status}</p>
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => router.push(`/tasks/${task._id}`)}>View Details</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {filteredTasks.length === 0 && (
        <p className="text-center text-gray-500 mt-8">No tasks found matching the selected filters.</p>
      )}
    </div>
  )
}