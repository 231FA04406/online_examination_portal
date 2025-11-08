import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    role: { type: String, enum: ['student', 'faculty', 'admin'], required: true },
    passwordHash: { type: String },
    regNo: { type: String, index: true, unique: true, sparse: true },
    phone: { type: String, index: true, sparse: true },
    department: { type: String },
    year: { type: String },
    section: { type: String },
    otpCode: { type: String },
    otpExpiresAt: { type: Date },
  },
  { timestamps: true }
)

userSchema.index({ role: 1 })

export default mongoose.model('User', userSchema)
