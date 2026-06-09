const express = require('express');
const MessageTemplate = require('../models/MessageTemplate');
const { protect } = require('../middleware/auth');
const router = express.Router();

// GET /api/message-templates?type=whatsapp|sms|email
router.get('/', protect, async (req, res) => {
  try {
    const { type } = req.query;
    const query = {
      $or: [
        { createdBy: req.user._id },
        { isShared: true }
      ]
    };
    if (type) query.type = type.toLowerCase();

    const templates = await MessageTemplate.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/message-templates
router.post('/', protect, async (req, res) => {
  try {
    const { type, shortcut, message, isShared } = req.body;
    if (!type || !shortcut || !message) {
      return res.status(400).json({ message: 'type, shortcut and message are required' });
    }
    const template = await MessageTemplate.create({
      type: type.toLowerCase(),
      shortcut,
      message,
      isShared: isShared || false,
      createdBy: req.user._id,
    });
    await template.populate('createdBy', 'name');
    res.status(201).json({ template });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/message-templates/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const template = await MessageTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    if (template.createdBy.toString() !== req.user._id.toString() && req.user.role === 'caller') {
      return res.status(403).json({ message: 'Cannot edit another user\'s template' });
    }
    const updated = await MessageTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('createdBy', 'name');
    res.json({ template: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/message-templates/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const template = await MessageTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    if (template.createdBy.toString() !== req.user._id.toString() && req.user.role === 'caller') {
      return res.status(403).json({ message: 'Cannot delete another user\'s template' });
    }
    await MessageTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
