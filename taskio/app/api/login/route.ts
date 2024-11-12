import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI!

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local')
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const client = new MongoClient(uri)
    await client.connect()

    const db = client.db('userauth')
    const users = db.collection('users')

    // Find user by email
    const user = await users.findOne({ email })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check password
    const isPasswordValid = password == user.password ? true : false

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    await client.close()

    // In a real application, you would generate a JWT token here
    return NextResponse.json({ message: 'Login successful', userId: user._id }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'An error occurred during login' }, { status: 500 })
  }
}