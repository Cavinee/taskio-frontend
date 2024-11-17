import { NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'

const uri = process.env.MONGODB_URI
const JWT_SECRET = process.env.JWT_SECRET

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local')
}

if (!JWT_SECRET) {
  throw new Error('Please add your JWT_SECRET to .env.local')
}

const client = new MongoClient(uri)

async function connectToDatabase() {
  await client.connect()
  return client.db('userauth')
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const decoded = verifyToken(token)
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const db = await connectToDatabase()
  const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({
    _id: user._id.toString(),
    username: user.username,
    email: user.email
  })
}