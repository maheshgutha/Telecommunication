const express = require('express');
const Campaign = require('../models/Campaign');
const Lead = require('../models/Lead');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// GET /api/campaigns
router.get('/', protect, async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate('assignedCallers', 'name avatar')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    // Attach lead counts
    const campaignsWithStats = await Promise.all(campaigns.map(async (c) => {
      const stats = await Lead.aggregate([
        { $match: { campaign: c._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      const totalLeads = stats.reduce((a, b) => a + b.count, 0);
      const activeLeads = stats.find(s => s._id === 'Fresh')?.count || 0;
      const newLeads = stats.find(s => s._id === 'Fresh')?.count || 0;
      return { ...c.toObject(), totalLeads, activeLeads, newLeads, statusBreakdown: stats };
    }));
    res.json({ campaigns: campaignsWithStats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/campaigns/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('assignedCallers', 'name avatar email');
    if (!campaign) return res.status(404).json({ message: 'Not found' });

    const statusBreakdown = await Lead.aggregate([
      { $match: { campaign: campaign._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const lostReasons = await Lead.aggregate([
      { $match: { campaign: campaign._id, status: { $in: ['Not interested', 'Lost'] } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const callStats = await Lead.aggregate([
      { $match: { campaign: campaign._id } },
      { $unwind: '$activities' },
      { $match: { 'activities.type': 'call' } },
      { $group: { _id: '$activities.callStatus', count: { $sum: 1 } } }
    ]);
    res.json({ campaign: { ...campaign.toObject(), statusBreakdown, lostReasons, callStats } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/campaigns
router.post('/', protect, authorize('admin', 'super admin'), async (req, res) => {
  try {
    const campaign = await Campaign.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ campaign });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/campaigns/:id
router.put('/:id', protect, authorize('admin', 'super admin'), async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ campaign });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
