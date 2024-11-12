import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI!

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local')
}

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json()

    const client = new MongoClient(uri)
    await client.connect()

    const db = client.db('userauth')
    const users = db.collection('users')

    const existingUser = await users.findOne({ $or: [{ email }, { username }] })
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    const result = await users.insertOne({
      username,
      email,
      password,
    })

    await client.close()

    return NextResponse.json({ message: 'User created successfully', userId: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'An error occurred while creating the user' }, { status: 500 })
  }
}