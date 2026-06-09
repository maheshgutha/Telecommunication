const express = require('express');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { sendCallNotification } = require('../services/fcm');
const FollowUp = require('../models/FollowUp');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/leads/export — CSV export
router.get('/export', protect, async (req, res) => {
  try {
    const { status, campaign } = req.query;
    const query = {};
    if (status) query.status = status;
    if (campaign) query.campaign = campaign;

    if (req.user.role === 'caller') {
      query.assignedTo = req.user._id;
    }

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name')
      .populate('campaign', 'name')
      .populate('courseInterest', 'name')
      .lean();

    const headers = [
      'Name', 'Phone', 'Alternate Phone', 'Email', 'Status', 'Lead Source',
      'Location', 'Budget', 'Rating', 'Course Interest', 'Campaign',
      'Assigned To', 'Total Calls', 'Last Called', 'Created At'
    ];

    const rows = leads.map(l => [
      l.name,
      l.phone,
      l.alternatePhone || '',
      l.email || '',
      l.status,
      l.leadSource || '',
      l.location || '',
      l.budget || 0,
      l.rating || 0,
      l.courseInterest?.name || '',
      l.campaign?.name || '',
      l.assignedTo?.name || '',
      l.totalCalls || 0,
      l.lastCalledAt ? new Date(l.lastCalledAt).toLocaleString() : '',
      new Date(l.createdAt).toLocaleString()
    ]);

    const csvLines = [headers, ...rows].map(row =>
      row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    );
    const csv = csvLines.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="leads-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/leads — get leads (filtered by user role)
router.get('/', protect, async (req, res) => {
  try {
    const { status, source, search, campaign, page = 1, limit = 20, filter } = req.query;
    const query = {};

    if (req.user.role === 'caller') {
      if (filter === 'all') {
        // Show all leads in system (allows callers to browse)
      } else {
        query.assignedTo = req.user._id;
      }
    } else {
      if (filter === 'mine' || filter === 'assigned') {
        query.assignedTo = req.user._id;
      } else if (filter && filter !== 'all') {
        query.assignedTo = filter;
      }
    }

    if (status) query.status = status;
    if (source) query.leadSource = source;
    if (campaign) query.campaign = campaign;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email avatar')
      .populate('campaign', 'name')
      .populate('courseInterest')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ leads, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/leads/my-calls — today's calls for logged-in caller
router.get('/my-calls', protect, async (req, res) => {
  try {
    const leads = await Lead.find({ assignedTo: req.user._id })
      .populate('assignedTo', 'name avatar')
      .populate('campaign', 'name')
      .populate('courseInterest')
      .sort({ lastCalledAt: -1, createdAt: -1 })
      .limit(100);
    res.json({ leads });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/leads/stats — dashboard stats
router.get('/stats', protect, async (req, res) => {
  try {
    const matchQuery = req.user.role === 'caller' ? { assignedTo: req.user._id } : {};
    const statusCounts = await Lead.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const total = await Lead.countDocuments(matchQuery);
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayCalls = await Lead.aggregate([
      { $match: matchQuery },
      { $unwind: '$activities' },
      { $match: { 'activities.type': 'call', 'activities.createdAt': { $gte: todayStart } } },
      { $group: { _id: null, count: { $sum: 1 }, duration: { $sum: '$activities.callDuration' } } }
    ]);

    const globalStatusStats = await Lead.aggregate([
      {
        $group: {
          _id: null,
          fresh: { $sum: { $cond: [{ $eq: ['$status', 'Fresh'] }, 1, 0] } },
          won: { $sum: { $cond: [{ $eq: ['$status', 'Won'] }, 1, 0] } },
          lost: { $sum: { $cond: [{ $eq: ['$status', 'Lost'] }, 1, 0] } },
          active: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Connected', 'Call Not Responding', 'Call Back Later', 'Demo Scheduled', 'Demo Done']] },
                1, 0
              ]
            }
          }
        }
      }
    ]);
    const globalCounts = globalStatusStats[0] || { fresh: 0, active: 0, won: 0, lost: 0 };

    const myStatusStats = await Lead.aggregate([
      { $match: { assignedTo: req.user._id } },
      {
        $group: {
          _id: null,
          fresh: { $sum: { $cond: [{ $eq: ['$status', 'Fresh'] }, 1, 0] } },
          won: { $sum: { $cond: [{ $eq: ['$status', 'Won'] }, 1, 0] } },
          lost: { $sum: { $cond: [{ $eq: ['$status', 'Lost'] }, 1, 0] } },
          active: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Connected', 'Call Not Responding', 'Call Back Later', 'Demo Scheduled', 'Demo Done']] },
                1, 0
              ]
            }
          }
        }
      }
    ]);
    const myCounts = myStatusStats[0] || { fresh: 0, active: 0, won: 0, lost: 0 };

    let extraStats = {};
    if (req.user.role === 'caller') {
      const overdueFollowupsCount = await FollowUp.countDocuments({
        assignedTo: req.user._id,
        status: 'upcoming',
        scheduledAt: { $lt: new Date() }
      });

      const callActivities = await Lead.aggregate([
        { $match: { assignedTo: req.user._id } },
        { $unwind: '$activities' },
        { $match: { 'activities.type': 'call', 'activities.performedBy': req.user._id } },
        { $project: { date: { $dateToString: { format: '%Y-%m-%d', date: '$activities.createdAt', timezone: 'Asia/Kolkata' } } } },
        { $group: { _id: '$date' } },
        { $sort: { _id: -1 } }
      ]);
      const dates = callActivities.map(c => c._id);

      let streak = 0;
      const tzOffset = 5.5 * 60 * 60 * 1000;
      const getLocalDateString = (d) => new Date(d.getTime() + tzOffset).toISOString().split('T')[0];
      let checkDate = new Date();
      let checkStr = getLocalDateString(checkDate);
      if (!dates.includes(checkStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
        checkStr = getLocalDateString(checkDate);
      }
      if (dates.includes(checkStr)) {
        while (dates.includes(checkStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
          checkStr = getLocalDateString(checkDate);
        }
      }

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const weeklyWins = await Lead.countDocuments({
        assignedTo: req.user._id,
        status: { $in: ['Won', 'Demo Scheduled'] },
        updatedAt: { $gte: startOfWeek }
      });

      const upcomingDemos = await Lead.find({
        assignedTo: req.user._id,
        status: 'Demo Scheduled',
        demoScheduledDate: { $gte: todayStart }
      }).select('name phone demoScheduledDate preferredCourses');

      const activeLeads = await Lead.find({
        assignedTo: req.user._id,
        status: { $nin: ['Won', 'Lost', 'Not interested'] }
      }).populate('campaign', 'name');

      const followups = await FollowUp.find({ assignedTo: req.user._id, status: 'upcoming' });
      const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
      const followupMap = {};
      followups.forEach(f => {
        // FIX: todo tasks have no lead — skip them to avoid f.lead.toString() crash
        if (!f.lead) return;
        const leadId = f.lead.toString();
        if (!followupMap[leadId] || f.scheduledAt < followupMap[leadId].scheduledAt) {
          followupMap[leadId] = f;
        }
      });

      const startMyDayQueue = activeLeads.map(lead => {
        const f = followupMap[lead._id.toString()];
        let score = 10;
        let queueReason = 'General Follow-up';
        if (f) {
          if (f.scheduledAt < todayStart) { score = 1; queueReason = 'Overdue Follow-up'; }
          else if (f.scheduledAt <= todayEnd) { score = 2; queueReason = 'Scheduled for Today'; }
        } else if (lead.status === 'Call Back Later') { score = 4; queueReason = 'Callback Required'; }
        else if (lead.status === 'Fresh') { score = 5; queueReason = 'Fresh Lead'; }
        return { lead, score, queueReason };
      });
      startMyDayQueue.sort((a, b) => a.score - b.score);

      const leaderboard = await Lead.aggregate([
        { $unwind: '$activities' },
        { $match: { 'activities.type': 'call', 'activities.createdAt': { $gte: startOfWeek } } },
        { $group: { _id: '$activities.performedBy', totalCalls: { $sum: 1 } } },
        { $sort: { totalCalls: -1 } }
      ]);
      const rankIndex = leaderboard.findIndex(item => item._id && item._id.toString() === req.user._id.toString());
      const myRank = rankIndex !== -1 ? rankIndex + 1 : leaderboard.length + 1;
      const topCallerCalls = leaderboard[0]?.totalCalls || 0;

      extraStats = {
        overdueFollowupsCount,
        streak,
        weeklyWins,
        upcomingDemos,
        startMyDayQueue,
        myRank,
        totalCallers: leaderboard.length,
        topCallerCalls,
      };
    }

    res.json({
      statusCounts,
      total,
      todayCalls: todayCalls[0] || { count: 0, duration: 0 },
      fresh: globalCounts.fresh,
      active: globalCounts.active,
      won: globalCounts.won,
      lost: globalCounts.lost,
      myFresh: myCounts.fresh,
      myActive: myCounts.active,
      myWon: myCounts.won,
      myLost: myCounts.lost,
      ...extraStats
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/leads — create lead
router.post('/', protect, async (req, res) => {
  try {
    // FIX: Convert empty strings to undefined for ObjectId fields (prevents BSONError)
    const body = { ...req.body };
    if (!body.courseInterest || body.courseInterest === '') body.courseInterest = undefined;
    if (!body.campaign || body.campaign === '') body.campaign = undefined;
    if (!body.assignedTo || body.assignedTo === '') body.assignedTo = undefined;
    if (Array.isArray(body.courseInterest)) body.courseInterest = body.courseInterest[0] || undefined;
    const lead = await Lead.create({
      ...body,
      assignedTo: body.assignedTo || req.user._id,
    });
    await lead.populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'campaign', select: 'name' },
      { path: 'courseInterest' }
    ]);
    res.status(201).json({ lead });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/leads/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('campaign', 'name')
      .populate('courseInterest')
      .populate('activities.performedBy', 'name avatar');
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/leads/:id — FIX BUG-08: ownership guard for callers
router.put('/:id', protect, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    // Callers can only edit leads assigned to them
    if (req.user.role === 'caller' && lead.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update leads assigned to you' });
    }

    // FIX BUG-01: normalize courseInterest
    const body = { ...req.body };
    if (Array.isArray(body.courseInterest)) {
      body.courseInterest = body.courseInterest[0] || undefined;
    }

    const updated = await Lead.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true })
      .populate('assignedTo', 'name email avatar')
      .populate('campaign', 'name')
      .populate('courseInterest');

    if (req.body.assignedTo) {
      await FollowUp.updateMany(
        { lead: lead._id, status: 'upcoming' },
        { assignedTo: req.body.assignedTo }
      );
    }

    res.json({ lead: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/leads/:id/call — log a call
router.post('/:id/call', protect, async (req, res) => {
  try {
    const { duration, callStatus, note } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const activity = {
      type: 'call',
      description: note || '',
      callDuration: duration || 0,
      callStatus: callStatus || 'connected',
      performedBy: req.user._id,
    };
    lead.activities.unshift(activity);
    lead.totalCalls += 1;
    lead.totalCallDuration += duration || 0;
    lead.lastCalledAt = new Date();

    if (callStatus === 'connected' && duration > 0) lead.status = 'Connected';
    else if (callStatus === 'no_answer') lead.status = 'Call Not Responding';

    await lead.save();
    await lead.populate('activities.performedBy', 'name avatar');
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/leads/:id/note
router.post('/:id/note', protect, async (req, res) => {
  try {
    const { note, type } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    lead.activities.unshift({
      type: type || 'note',
      description: note,
      performedBy: req.user._id,
    });
    await lead.save();
    await lead.populate('activities.performedBy', 'name avatar');
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/leads/:id/status
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    const prevStatus = lead.status;
    lead.status = status;
    lead.activities.unshift({
      type: 'status_change',
      description: `Status changed from ${prevStatus} to ${status}`,
      performedBy: req.user._id,
    });
    await lead.save();
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/leads/:id
router.delete('/:id', protect, authorize('super admin'), async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/leads/:id/initiate-call
// Sends push notification to caller's mobile app — available to ALL roles
// Admin sends to assigned caller; caller sends to themselves
router.post('/:id/initiate-call', protect, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assignedTo', 'name email fcmToken');
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    let caller;
    if (req.user.role === 'caller') {
      // Caller sends notification to themselves
      caller = await User.findById(req.user._id).select('name email fcmToken');
    } else {
      // Admin: send to specified caller or assigned caller
      if (req.body.callerId && req.body.callerId !== lead.assignedTo?._id?.toString()) {
        caller = await User.findById(req.body.callerId).select('name email fcmToken');
      } else {
        caller = lead.assignedTo;
      }
    }

    if (!caller) return res.status(400).json({ message: 'No caller assigned. Please assign a caller first.' });
    if (!caller.fcmToken) return res.status(400).json({
      message: `Caller ${caller.name} has not logged in to the mobile app yet. Please open the app and login first.`,
      callerName: caller.name,
      hasToken: false,
    });

    const sent = await sendCallNotification(caller.fcmToken, lead, req.user.name);
    lead.activities.unshift({
      type: 'note',
      description: `📞 Call initiated by ${req.user.name} → notification sent to ${caller.name}`,
      performedBy: req.user._id,
    });
    await lead.save();

    res.json({
      success: sent,
      message: sent
        ? `✅ Call notification sent to ${caller.name}'s phone`
        : `⚠️ Notification failed. ${caller.name} can call manually from the app`,
      callerName: caller.name,
      leadName: lead.name,
      leadPhone: lead.phone,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;