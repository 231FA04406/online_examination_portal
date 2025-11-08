import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ['mcq', 'code', 'short'], required: true },
  q: { type: String },
  prompt: { type: String },
  opts: [{ type: String }],
  answer: { type: Number },
})

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, enum: ['General', 'Technical'], required: true },
    durationMin: { type: Number, required: true },
    questions: [questionSchema],
    randomized: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Legacy single code (mapped to loginCode for backwards compatibility)
    code: { type: String, unique: true, index: true, sparse: true },
    // New: separate codes
    loginCode: { type: String, unique: true, index: true, sparse: true },
    resumeCode: { type: String, unique: true, index: true, sparse: true },
    examType: { type: String, enum: ['normal', 'resume', 'reexam'], default: 'normal', index: true },
  },
  { timestamps: true }
)

export default mongoose.model('Exam', examSchema)
