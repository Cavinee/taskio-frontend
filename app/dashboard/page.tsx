'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, CalendarIcon, CheckCircle, Grid, Minus, Plus, User, Loader2 } from 'lucide-react'
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

interface Task {
  _id: string
  title: string
  description?: string
  dueDate: string
  priority: string
  status: string
  tags?: string[]
}

interface UserData {
  _id: string
  username: string
  email: string
}

export default function Dashboard() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const response = await fetch('/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setUserData(data)
          fetchTasks()
        } else {
          throw new Error('Failed to fetch user data')
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        router.push('/login')
      }
    }

    fetchUserData()
  }, [router])

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks)
      } else {
        console.error("Failed to fetch tasks")
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTask = async (id: string) => {
    const taskToUpdate = tasks.find(task => task._id === id)
    if (!taskToUpdate) return

    const newStatus = taskToUpdate.status == 'Completed' ? 'To Do' : 'Completed'

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, status: newStatus })
      })

      if (response.ok) {
        setTasks(prevTasks => prevTasks.map(task => 
          task._id === id ? { ...task, status: newStatus } : task
        ))
      } else {
        console.error("Failed to update task")
      }
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const todayTasks = tasks.filter(task => new Date(task.dueDate).toDateString() === new Date().toDateString())
  const upcomingTasks = tasks.filter(task => new Date(task.dueDate) > new Date())
  const selectedDateTasks = selectedDate
    ? tasks.filter(task => new Date(task.dueDate).toDateString() === selectedDate.toDateString())
    : []

  const handleSignOut = () => {
    localStorage.removeItem('token')
    router.push('/login')
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
          <button className="flex flex-col items-center text-white">
            <Grid className="w-6 h-6" />
            <span className="text-xs">Dashboard</span>
          </button>
          <Link href="/tasks" className="flex flex-col items-center text-gray-400 hover:text-white">
            <CheckCircle className="w-6 h-6" />
            <span className="text-xs">Tasks</span>
          </Link>
          <button className="flex flex-col items-center text-gray-400 hover:text-white">
            <CalendarIcon className="w-6 h-6" />
            <span className="text-xs">Calendar</span>
          </button>
          <button className="flex flex-col items-center text-gray-400 hover:text-white">
            <Bell className="w-6 h-6" />
            <span className="text-xs">Reminder</span>
          </button>
        </nav>
        <Button variant="ghost" className="bg-gray-800 p-2 rounded-full" onClick={handleSignOut}>
          <User className="w-6 h-6" />
        </Button>
      </header>

      <h1 className="text-3xl font-bold mb-6">Good Afternoon, {userData?.username}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Today</h2>
            <ul className="space-y-4">
              {todayTasks.length == 0 ? <p className="text-gray-400">No tasks for today.</p> : 
              todayTasks.map((task, index)=> (
                <li key={task._id} className="flex items-center">
                  <div className={`w-1 h-12 ${index % 2 === 0 ? 'bg-yellow-400' : 'bg-green-400'} mr-3`}></div>
                  <div>
                    <div className="font-semibold">{task.title}</div>
                    <div className="text-sm text-gray-400">Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                  </div>
                </li>
              ))}
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-4">Upcoming Task</h2>
            <ul className="space-y-4">
              {upcomingTasks.length == 0 ? <p className="text-gray-400">There are no upcoming tasks.</p> : upcomingTasks.map((task, index) => (
                <li key={task._id} className="flex items-center">
                  <div className={`w-1 h-12 ${index % 2 === 0 ? 'bg-yellow-400' : 'bg-green-400'} mr-3`}></div>
                  <div>
                    <div className="font-semibold">{task.title}</div>
                    <div className="text-sm text-gray-400">Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Calendar</h2>
          <div className="flex flex-col">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border h-[285px] w-[250px] mb-5"
              modifiers={{
                hasTasks: (date) => tasks.some(task => new Date(task.dueDate).toDateString() === date.toDateString())
              }}
              modifiersStyles={{
                hasTasks: { position: 'relative' }
              }}
              components={{
                DayContent: ({ date }) => (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {date.getDate()}
                    {tasks.some(task => new Date(task.dueDate).toDateString() === date.toDateString()) && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                )
              }}
            />
            <Card className="bg-gray-800 w-full">
              <CardHeader>
                <CardTitle className="text-white">
                  Tasks for {selectedDate?.toDateString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDateTasks.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedDateTasks.map(task => (
                      <li key={task._id} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Checkbox 
                            className="mr-3 form-checkbox h-5 w-5 text-blue-600" 
                            checked={task.status == 'Completed'} 
                            onCheckedChange={() => handleTask(task._id)} 
                          />
                          {task.status === 'Completed' ? 
                            <span className="text-gray-400 line-through">{task.title}</span> : 
                            <span className="text-white">{task.title}</span>
                          }
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No tasks for this date.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}