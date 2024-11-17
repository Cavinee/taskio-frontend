'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Bell, CalendarIcon, CheckCircle, Grid, User, Loader2, Tag, X, AlertTriangle } from 'lucide-react'

interface Task {
  _id: string
  title: string
  description?: string
  dueDate: string
  priority: string
  status: string
  tags?: string[]
}

export default function TaskManagerPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [allTags, setAllTags] = useState<string[]>([])
  const [isTagsDialogOpen, setIsTagsDialogOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const router = useRouter()

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }
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
    } catch (err) {
      setError('Error fetching tasks. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const fetchAllTags = useCallback(async () => {
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }
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
      fetchAllTags()
      fetchTasks()
    }
  }, [router, fetchAllTags, fetchTasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const statusMatch = selectedStatus === 'all' || task.status === selectedStatus
      const tagsMatch = selectedTags.length === 0 || (task.tags && selectedTags.every(tag => task.tags?.includes(tag)))
      return statusMatch && tagsMatch
    })
  }, [tasks, selectedStatus, selectedTags])

  const handleSignOut = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  const handleShowAllTags = () => {
    setIsTagsDialogOpen(true)
  }

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

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = event.target as HTMLFormElement
    const formData = new FormData(form)
    const taskData = Object.fromEntries(formData.entries())
    
    const tagInput = taskData.tags as string
    const newTags = tagInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
    taskData.tags = newTags

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      })
      if (!response.ok) {
        throw new Error('Failed to create task')
      }
      await fetchTasks()
      await fetchAllTags()
      form.reset()
    } catch (err) {
      setError('Error creating task. Please try again.')
      console.error(err)
    }
  }

  async function handleUpdateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingTask) return
    setError(null)
    const form = event.target as HTMLFormElement
    const formData = new FormData(form)
    const taskData = Object.fromEntries(formData.entries())
    
    const tagInput = taskData.tags as string
    const newTags = tagInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
    taskData.tags = newTags

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: editingTask._id, ...taskData })
      })
      if (!response.ok) {
        throw new Error('Failed to update task')
      }
      await fetchTasks()
      await fetchAllTags()
      setEditingTask(null)
      setIsDialogOpen(false)
    } catch (err) {
      setError('Error updating task. Please try again.')
      console.error(err)
    }
  }

  async function handleDeleteTask(id: string) {
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }
      const response = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      })
      if (!response.ok) {
        throw new Error('Failed to delete task')
      }
      await fetchTasks()
      await fetchAllTags()
    } catch (err) {
      setError('Error deleting task. Please try again.')
      console.error(err)
    }
  }

  async function handleEditTask(id: string) {
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }
      const response = await fetch(`/api/tasks?id=${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch task')
      }
      const task = await response.json()
      setEditingTask(task)
      setIsDialogOpen(true)
    } catch (err) {
      setError('Error fetching task details. Please try again.')
      console.error(err)
    }
  }

  async function handleToggleTaskStatus(id: string, currentStatus: string) {
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }
      const newStatus = currentStatus === 'Completed' ? 'To Do' : 'Completed'
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, status: newStatus })
      })
      if (!response.ok) {
        throw new Error('Failed to update task status')
      }
      setTasks(prevTasks => prevTasks.map(task => 
        task._id === id ? { ...task, status: newStatus } : task
      ))
    } catch (err) {
      setError('Error updating task status. Please try again.')
      console.error(err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-6 h-6" />
          <span className="text-xl font-semibold">Task.io</span>
        </div>
        <nav className="flex space-x-6">
          <Link href="/dashboard" className="flex flex-col items-center text-gray-400 hover:text-white">
            <Grid className="w-6 h-6" />
            <span className="text-xs">Dashboard</span>
          </Link>
          <button className="flex flex-col items-center text-white">
            <CheckCircle className="w-6 h-6" />
            <span className="text-xs">Tasks</span>
          </button>
          <button className="flex flex-col items-center text-gray-400 hover:text-white">
            <CalendarIcon className="w-6 h-6" />
            <span className="text-xs">Calendar</span>
          </button>
          <button className="flex flex-col items-center text-gray-400 hover:text-white">
            <Bell className="w-6 h-6" />
            <span className="text-xs">Reminder</span>
          </button>
          <button className="flex flex-col items-center text-gray-400 hover:text-white" onClick={handleShowAllTags}>
            <Tag className="w-6 h-6" />
            <span className="text-xs">All Tags</span>
          </button>
        </nav>
        <Button variant="ghost" className="bg-gray-800 p-2 rounded-full" onClick={handleSignOut}>
          <User className="w-6 h-6" />
        </Button>
      </header>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Task Manager</h1>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Card className="mb-8 bg-gray-800 text-white">
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <Input name="title" placeholder="Title" required />
              <Textarea name="description" placeholder="Description" />
              <Input 
                name="dueDate" 
                type="date" 
                className="[&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:hover:cursor-pointer"
              />
              <Select name="priority">
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
              <Select name="status">
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="To Do">To Do</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Input name="tags" placeholder="Tags (comma-separated)" />
              <Button variant="secondary" type="submit">Create Task</Button>
            </form>
          </CardContent>
        </Card>

        <div className="mb-6 space-y-4">
          <div>
            <label htmlFor="status-select" className="block text-sm font-medium text-gray-300 mb-1">
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
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Filter by Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2 text-black">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1 text-black"
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
                  variant={"secondary"}
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
            <Card key={task._id} className={`bg-gray-800 text-white ${task.status === 'Completed' ? 'opacity-70' : ''}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className={task.status === 'Completed' ? 'line-through' : ''}>{task.title}</span>
                  <Checkbox
                    checked={task.status === 'Completed'}
                    onCheckedChange={() => handleToggleTaskStatus(task._id, task.status)}
                  />
                </CardTitle>
                <CardDescription>Due: {new Date(task.dueDate).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>{task.description}</p>
                <p>Priority: {task.priority}</p>
                <p>Status: {task.status}</p>
                {task.tags && task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button onClick={() => handleEditTask(task._id)}>Edit</Button>
                <Button variant="destructive" onClick={() => handleDeleteTask(task._id)}>Delete</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {filteredTasks.length === 0 && (
          <p className="text-center text-gray-500 mt-8">No tasks found matching the selected filters.</p>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            {editingTask && (
              <form onSubmit={handleUpdateTask} className="space-y-4">
                <Input name="title" placeholder="Title" defaultValue={editingTask.title} required />
                <Textarea name="description" placeholder="Description" defaultValue={editingTask.description} />
                <Input 
                  name="dueDate" 
                  type="date" 
                  defaultValue={editingTask.dueDate.split('T')[0]}
                  className="[&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:hover:cursor-pointer"
                />
                <Select name="priority" defaultValue={editingTask.priority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
                <Select name="status" defaultValue={editingTask.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="To Do">To Do</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Input name="tags" placeholder="Tags (comma-separated)" defaultValue={editingTask.tags?.join(', ')} />
                <Button variant="secondary" type="submit">Update Task</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isTagsDialogOpen} onOpenChange={setIsTagsDialogOpen}>
          <DialogContent className="bg-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>All Tags</DialogTitle>
            </DialogHeader>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-sm rounded-full bg-zinc-700 text-zinc-200"
                >
                  {tag}
                </span>
              ))}
            </div>
            {allTags.length === 0 && (
              <p className="text-center text-gray-500 mt-4">No tags found.</p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}