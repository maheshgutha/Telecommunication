const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// GET /api/users
router.get('/', protect, authorize('admin', 'super admin'), async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ name: 1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users
router.post('/', protect, authorize('admin', 'super admin'), async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });
    if (req.user.role === 'admin' && role !== 'caller')
      return res.status(403).json({ message: 'Admins can only create callers' });
    if (role === 'super admin')
      return res.status(403).json({ message: 'Cannot create super admins' });
    const user = await User.create({ name, email, password, role: role || 'caller', phone: phone || '' });
    res.status(201).json({ user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id
router.put('/:id', protect, authorize('admin', 'super admin'), async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    if (req.user.role === 'admin') {
      if (targetUser.role !== 'caller') return res.status(403).json({ message: 'Admins can only update callers' });
      if (req.body.role && req.body.role !== 'caller') return res.status(403).json({ message: 'Admins cannot change user roles' });
    }
    if (req.body.role === 'super admin' && targetUser.role !== 'super admin')
      return res.status(403).json({ message: 'Cannot promote users to super admin' });
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
    if (req.body.role && req.user.role === 'super admin') updates.role = req.body.role;
    if (req.body.password) {
      targetUser.password = req.body.password;
      if (req.body.name) targetUser.name = req.body.name;
      if (req.body.phone !== undefined) targetUser.phone = req.body.phone;
      if (req.body.isActive !== undefined) targetUser.isActive = req.body.isActive;
      if (req.body.role && req.user.role === 'super admin') targetUser.role = req.body.role;
      await targetUser.save();
      return res.json({ user: targetUser.toJSON() });
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', protect, authorize('super admin'), async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    if (targetUser.role === 'super admin') return res.status(403).json({ message: 'Super admins cannot be deleted' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/fcm-token — save FCM device token after mobile app login
// Called automatically by mobile app when user logs in
router.post('/fcm-token', protect, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return res.status(400).json({ message: 'FCM token required' });
    await User.findByIdAndUpdate(req.user._id, {
      fcmToken,
      fcmTokenUpdatedAt: new Date(),
    });
    console.log(`✅ FCM token saved for user: ${req.user.name}`);
    res.json({ message: 'FCM token saved successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;