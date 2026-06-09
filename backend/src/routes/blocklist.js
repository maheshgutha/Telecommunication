const express = require('express');
const Blocklist = require('../models/Blocklist');
const { protect } = require('../middleware/auth');
const router = express.Router();

// GET /api/blocklist
router.get('/', protect, async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { phone: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }
    const list = await Blocklist.find(query)
      .populate('blockedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ blocklist: list });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/blocklist
router.post('/', protect, async (req, res) => {
  try {
    const { phone, name, reason } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number is required' });
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) return res.status(400).json({ message: 'Invalid phone number' });

    const existing = await Blocklist.findOne({ phone: cleanPhone });
    if (existing) return res.status(400).json({ message: 'This number is already blocked' });

    const entry = await Blocklist.create({
      phone: cleanPhone,
      name: name || 'Anonymous',
      reason: reason || 'Spam Lead',
      blockedBy: req.user._id,
    });
    await entry.populate('blockedBy', 'name');
    res.status(201).json({ entry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/blocklist/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Blocklist.findByIdAndDelete(req.params.id);
    res.json({ message: 'Unblocked successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/blocklist/check/:phone — check if a phone is blocked (used on lead creation)
router.get('/check/:phone', protect, async (req, res) => {
  try {
    const phone = req.params.phone.replace(/[^0-9]/g, '');
    const entry = await Blocklist.findOne({ phone });
    res.json({ blocked: !!entry, entry: entry || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
