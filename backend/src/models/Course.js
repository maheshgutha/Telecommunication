const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  cost: { type: Number, required: true },
  duration: { type: String, default: '' }, // e.g. "6 Months", "3 Months"
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
