const mongoose = require('mongoose');

const blocklistSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true, trim: true },
  name: { type: String, default: 'Anonymous' },
  reason: { type: String, default: 'Spam Lead' },
  blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

blocklistSchema.index({ phone: 1 });

module.exports = mongoose.model('Blocklist', blocklistSchema);
