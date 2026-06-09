const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
  lead: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lead', 
    required: function() { return this.type === 'call_followup'; } 
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledAt: { type: Date, required: true },
  status: { type: String, enum: ['upcoming', 'done', 'late', 'cancelled'], default: 'upcoming' },
  // FIX BUG-03: added type field so Tasks page "To-Do" tab works
  type: { type: String, enum: ['call_followup', 'todo'], default: 'call_followup' },
  note: { type: String, default: '' },
  title: { type: String, default: '' },       // for todo tasks
  priority: { type: String, enum: ['low', 'medium', 'high', ''], default: '' },
  completedAt: { type: Date },
}, { timestamps: true });

// Indexes for frequent query patterns
followUpSchema.index({ scheduledAt: 1 });
followUpSchema.index({ assignedTo: 1 });
followUpSchema.index({ status: 1 });
followUpSchema.index({ assignedTo: 1, status: 1 });
followUpSchema.index({ lead: 1 });

module.exports = mongoose.model('FollowUp', followUpSchema);
