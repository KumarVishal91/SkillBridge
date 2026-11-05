const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, lowercase: true },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
  },
  { _id: false }
);

const slotSchema = new mongoose.Schema(
  {
    day: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday
    start: { type: Number, min: 0, max: 24, required: true }, // hour, e.g. 18
    end: { type: Number, min: 0, max: 24, required: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    bio: { type: String, default: '', maxlength: 300 },
    teaches: [skillSchema],
    wants: [skillSchema],
    availability: [slotSchema],
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    completedSessions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.index({ 'teaches.name': 1 });
userSchema.index({ 'wants.name': 1 });

module.exports = mongoose.model('User', userSchema);
