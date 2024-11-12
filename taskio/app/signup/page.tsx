"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Calendar as CalendarIcon, CheckCircle, Grid, Minus, Plus, User } from 'lucide-react'

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),

  email: z.string()
  .min(2, {
    message: "Email must be at least 2 characters.",
  })
  .email({
    message : "Invalid email address"
  }),

  password: z.string()
})

export default function ProfileForm() {
const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: ""
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        router.push('/pages/login')
      } else {
        const data = await response.json()
        setError(data.error || 'An error occurred during signup')
      }
    } catch (error) {
      setError('An error occurred during signup')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-6 h-6" />
          <span className="text-xl font-semibold">Task.io</span>
        </div>
        <button className="bg-gray-800 p-2 rounded-full">
          <User className="w-6 h-6" />
        </button>
      </header>
      <div className="bg-gray-900 text-white flex items-center justify-center flex-grow mx-80">
        <Card className="bg-gray-800 w-full">
          <CardHeader>
            <CardTitle className="text-white text-xl">
              <h2>Sign Up</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-lg flex items-center justify-center min-w-max">
              <div className="flex-1 max-w-md">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-lg">Username</FormLabel>
                          <FormControl className="h-[45px]">
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage className=""/>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-lg">Email</FormLabel>
                          <FormControl className="h-[45px]">
                            <Input placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage className=""/>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-lg">Password</FormLabel>
                          <FormControl className="h-[45px]">
                            <Input placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage className=""/>
                        </FormItem>
                      )}
                    />
                    <Button variant={"secondary"} type="submit">Sign Up</Button>
                  </form>
                </Form>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
