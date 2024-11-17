'use server'

import dbConnect from '../lib/mongodb';
import Task from '../lib/models/task';
import Tag from '../lib/models/tag';
import { ObjectId } from 'mongodb';

export async function getTasks(userId: string, status?: string, tags?: string[]) {
  await dbConnect();
  try {
    let query: any = { userID: new ObjectId(userId) };
    if (status && status !== 'all') {
      query.status = status;
    }
    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }
    const tasks = await Task.find(query).sort({ createdAt: -1 });
    return tasks;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw new Error('Failed to fetch tasks. Please ensure the user ID is valid.');
  }
}

export async function getAllTags(userId: string) {
  await dbConnect();
  try {
    const tasks = await Task.find({ userID: new ObjectId(userId) });
    const tags = new Set();
    tasks.forEach(task => {
      if (task.tags) {
        task.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw new Error('Failed to fetch tags.');
  }
}