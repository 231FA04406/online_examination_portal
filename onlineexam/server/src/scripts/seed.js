import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Exam from '../models/Exam.js'
import User from '../models/User.js'

// Load server/.env automatically (cwd = server)
dotenv.config()

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/onlineexam'

async function run() {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('Connected to MongoDB')

    // Ensure an admin exists (username: admin, password handled elsewhere)
    let admin = await User.findOne({ name: 'admin', role: 'admin' })
    if (!admin) {
      admin = await User.create({ name: 'admin', role: 'admin' })
      console.log('Seeded admin user: admin')
    }

    // Ensure a sample exam exists
    let exam = await Exam.findOne({ title: 'Sample MCQ Exam' })
    if (!exam) {
      exam = await Exam.create({
        title: 'Sample MCQ Exam',
        category: 'General',
        durationMin: 15,
        randomized: true,
        createdBy: admin._id,
        questions: [
          { type: 'mcq', q: '2 + 2 = ?', opts: ['3', '4', '5', '6'], answer: 1 },
          { type: 'mcq', q: 'Capital of India?', opts: ['Mumbai', 'Delhi', 'Kolkata', 'Chennai'], answer: 1 },
        ],
      })
      console.log('Seeded sample exam: Sample MCQ Exam')
    }

    console.log('Seeding complete.')
    await mongoose.disconnect()
    process.exit(0)
  } catch (e) {
    console.error('Seed error:', e.message)
    process.exit(1)
  }
}

run()
