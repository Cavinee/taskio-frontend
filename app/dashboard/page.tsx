'use client'

import React, { useState } from 'react'
import { Bell, Calendar as CalendarIcon, CheckCircle, Grid, Minus, Plus, User } from 'lucide-react'
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Task } from "../models/task"

export default function Dashboard() {
  const [focusTime, setFocusTime] = useState(25 * 60)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: "Breakfast", date: new Date(), completed: false },
    { id: 2, title: "Buy groceries", date: new Date(), completed: false },
    { id: 3, title: "Meeting with client", date: new Date(new Date().setDate(new Date().getDate() + 1)), completed: false },
    { id: 4, title: "Chest day and Cardio", date: new Date(new Date().setDate(new Date().getDate() + 1)), completed: false },
  ])

  const handleTask = (id: number) => {
    setTasks(prevTasks => prevTasks.map(task => task.id === id ? {...task, completed: !task.completed} : task))
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const todayTasks = tasks.filter(task => task.date.toDateString() === new Date().toDateString())
  const upcomingTasks = tasks.filter(task => task.date > new Date())
  const selectedDateTasks = selectedDate
    ? tasks.filter(task => task.date.toDateString() === selectedDate.toDateString())
    : []

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-6 h-6" />
          <span className="text-xl font-semibold">Task.io</span>
        </div>
        <nav className="flex space-x-6">
          <button className="flex flex-col items-center text-gray-400 hover:text-white">
            <Grid className="w-6 h-6" />
            <span className="text-xs">Dashboard</span>
          </button>
          <button className="flex flex-col items-center text-gray-400 hover:text-white">
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
        </nav>
        <button className="bg-gray-800 p-2 rounded-full">
          <User className="w-6 h-6" />
        </button>
      </header>

      <h1 className="text-3xl font-bold mb-6">Good Afternoon, Bob!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Today</h2>
            <ul className="space-y-4">
              {todayTasks.map(task => (
                <li key={task.id} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Checkbox className="mr-3 form-checkbox h-5 w-5 text-blue-600" checked={task.completed} onCheckedChange={() => handleTask(task.id)} />
                      {task.completed ? <span className="text-gray-400 line-through">{task.title}</span> : <span>{task.title}</span>}
                  </div>
                </li>
              ))}
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-4">Upcoming Task</h2>
            <ul className="space-y-4">
              {upcomingTasks.map((task, index) => (
                <li key={task.id} className="flex items-center">
                  <div className={`w-1 h-12 ${index % 2 === 0 ? 'bg-yellow-400' : 'bg-green-400'} mr-3`}></div>
                  <div>
                    <div className="font-semibold">{task.title}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Focus Timer</h2>
            <div className="flex justify-center items-center space-x-4">
              <button 
                className="bg-gray-700 rounded-full p-2"
                onClick={() => setFocusTime(prev => Math.max(0, prev - 60))}
              >
                <Minus className="w-6 h-6" />
              </button>
              <div className="text-6xl font-bold">{formatTime(focusTime)}</div>
              <button 
                className="bg-gray-700 rounded-full p-2"
                onClick={() => setFocusTime(prev => prev + 60)}
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
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
                hasTasks: (date) => tasks.some(task => task.date.toDateString() === date.toDateString())
              }}
              modifiersStyles={{
                hasTasks: { position: 'relative' }
              }}
              components={{
                DayContent: ({ date }) => (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {date.getDate()}
                    {tasks.some(task => task.date.toDateString() === date.toDateString()) && (
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
                      <li key={task.id} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Checkbox className="mr-3 form-checkbox h-5 w-5 text-blue-600" checked={task.completed} onCheckedChange={() => handleTask(task.id)} />
                          {task.completed ? <span className="text-gray-400 line-through">{task.title}</span> : <span className="text-white">{task.title}</span>}
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
