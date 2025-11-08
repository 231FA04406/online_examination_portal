import mongoose from 'mongoose'

const answerSchema = new mongoose.Schema({
  qid: String,
  value: mongoose.Schema.Types.Mixed,
})

const reviewSchema = new mongoose.Schema({
  qid: String,
  score: { type: Number, default: 0 },
  comment: { type: String },
})

const submissionSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [answerSchema],
    score: { type: Number, default: 0 },
    scoreAuto: { type: Number, default: 0 },
    scoreManual: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: { type: String, enum: ['submitted', 'evaluated', 'pending'], default: 'submitted' },
    reviews: [reviewSchema],
    tabSwitches: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.model('Submission', submissionSchema)
