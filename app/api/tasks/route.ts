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
  const taskId = request.nextUrl.searchParams.get('id')

  if (taskId) {
    const task = await db.collection('tasks').findOne({
      _id: new ObjectId(taskId),
      userID: new ObjectId(decoded.userId)
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found or unauthorized' }, { status: 404 })
    }

    const taskTags = await db.collection('taskTags').aggregate([
      { $match: { taskID: new ObjectId(taskId) } },
      { $lookup: {
          from: 'tags',
          localField: 'tagID',
          foreignField: '_id',
          as: 'tag'
      }},
      { $unwind: '$tag' },
      { $project: { _id: 0, tagName: '$tag.tagName' } }
    ]).toArray()

    const tags = taskTags.map(tt => tt.tagName)
    return NextResponse.json({ ...task, tags })
  } else {
    const tasks = await db.collection('tasks').find({ userID: new ObjectId(decoded.userId) }).sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ tasks })
  }
}

export async function POST(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const decoded = verifyToken(token)
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const { title, description, dueDate, priority, status, tags } = await request.json()

  const db = await connectToDatabase()
  const task = {
    userID: new ObjectId(decoded.userId),
    title,
    description,
    dueDate: new Date(dueDate),
    priority,
    status,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const result = await db.collection('tasks').insertOne(task)

  if (tags && tags.length > 0) {
    for (let tagName of tags) {
      let tag = await db.collection('tags').findOne({ tagName })
      if (!tag) {
        tag = { tagName }
        const tagResult = await db.collection('tags').insertOne(tag)
        tag._id = tagResult.insertedId
      }
      await db.collection('taskTags').insertOne({ tagID: tag._id, taskID: result.insertedId })
    }
  }

  return NextResponse.json({ message: 'Task created successfully', taskId: result.insertedId }, { status: 201 })
}

export async function PUT(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const decoded = verifyToken(token)
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const { id, title, description, dueDate, priority, status, tags } = await request.json()

  if (!id) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
  }

  const db = await connectToDatabase()
  
  const updateFields = {}
  if (title !== undefined) updateFields.title = title
  if (description !== undefined) updateFields.description = description
  if (dueDate !== undefined) updateFields.dueDate = new Date(dueDate)
  if (priority !== undefined) updateFields.priority = priority
  if (status !== undefined) updateFields.status = status
  updateFields.updatedAt = new Date()

  const result = await db.collection('tasks').findOneAndUpdate(
    { _id: new ObjectId(id), userID: new ObjectId(decoded.userId) },
    { $set: updateFields },
    { returnDocument: 'after' }
  )

  if (!result) {
    return NextResponse.json({ error: 'Task not found or unauthorized' }, { status: 404 })
  }

  if (tags !== undefined) {
    await db.collection('taskTags').deleteMany({ taskID: new ObjectId(id) })
    if (tags && tags.length > 0) {
      for (let tagName of tags) {
        let tag = await db.collection('tags').findOne({ tagName })
        if (!tag) {
          tag = { tagName }
          const tagResult = await db.collection('tags').insertOne(tag)
          tag._id = tagResult.insertedId
        }
        await db.collection('taskTags').insertOne({ tagID: tag._id, taskID: new ObjectId(id) })
      }
    }
  }

  return NextResponse.json({ message: 'Task updated successfully', task: result.value })
}

export async function DELETE(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const decoded = verifyToken(token)
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const { id } = await request.json()

  const db = await connectToDatabase()
  const result = await db.collection('tasks').deleteOne({
    _id: new ObjectId(id),
    userID: new ObjectId(decoded.userId)
  })

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'Task not found or unauthorized' }, { status: 404 })
  }

  await db.collection('taskTags').deleteMany({ taskID: new ObjectId(id) })

  return NextResponse.json({ message: 'Task deleted successfully' })
}