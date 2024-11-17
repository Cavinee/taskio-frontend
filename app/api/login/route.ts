import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import jwt from 'jsonwebtoken'

const uri = process.env.MONGODB_URI!
const JWT_SECRET = process.env.JWT_SECRET!

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local')
}

if (!JWT_SECRET) {
  throw new Error('Please add your JWT_SECRET to .env.local')
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const client = new MongoClient(uri)
    await client.connect()

    const db = client.db('userauth')
    const users = db.collection('users')

    const user = await users.findOne({ email })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isPasswordValid = password === user.password

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    await client.close()

    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    )

    return NextResponse.json({ 
      message: 'Login successful', 
      token,
      userId: user._id.toString()
    }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'An error occurred during login' }, { status: 500 })
  }
}
