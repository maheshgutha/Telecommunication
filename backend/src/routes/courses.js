const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');

// GET /api/courses - Get all active courses
router.get('/', protect, async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true }).sort({ name: 1 });
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/courses/all - Get all courses (including inactive ones, admin/super admin only)
router.get('/all', protect, authorize('admin', 'super admin'), async (req, res) => {
  try {
    const courses = await Course.find({}).sort({ name: 1 });
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/courses/:id - Get a single course
router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ course });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/courses - Create a course (admin/super admin only)
router.post('/', protect, authorize('admin', 'super admin'), async (req, res) => {
  try {
    const { name, cost, duration, description } = req.body;
    if (!name || cost === undefined) {
      return res.status(400).json({ message: 'Name and cost are required' });
    }
    const exists = await Course.findOne({ name });
    if (exists) return res.status(400).json({ message: 'Course with this name already exists' });

    const course = await Course.create({ name, cost, duration, description });
    res.status(201).json({ course });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/courses/:id - Update a course (admin/super admin only)
router.put('/:id', protect, authorize('admin', 'super admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ course });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/courses/:id - Delete a course (super admin only)
router.delete('/:id', protect, authorize('super admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
