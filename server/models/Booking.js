const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    proposer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    partner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skill: { type: String, required: true, trim: true, lowercase: true },
    start: { type: Date, required: true },
    durationMin: { type: Number, min: 15, max: 240, default: 60 },
    note: { type: String, default: '', maxlength: 200 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled', 'completed'],
      default: 'pending',
    },
    meetingLink: { type: String, default: '' },
  },
  { timestamps: true }
);

bookingSchema.index({ proposer: 1, start: 1 });
bookingSchema.index({ partner: 1, start: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
