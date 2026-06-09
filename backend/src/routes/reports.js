const express = require('express');
const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const FollowUp = require('../models/FollowUp');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// GET /api/reports/leaderboard?period=day|week|month|year|all
// FIX BUG-02: added 'all' period support
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const now = new Date();
    let start = new Date(0); // default: beginning of time (for 'all')

    if (period === 'day') { start = new Date(); start.setHours(0, 0, 0, 0); }
    else if (period === 'week') { start = new Date(); start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0); }
    else if (period === 'month') { start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0); }
    else if (period === 'year') { start = new Date(); start.setMonth(0, 1); start.setHours(0, 0, 0, 0); }
    // 'all' keeps start = new Date(0)

    const stats = await Lead.aggregate([
      { $unwind: '$activities' },
      { $match: { 'activities.type': 'call', 'activities.createdAt': { $gte: start } } },
      {
        $group: {
          _id: '$activities.performedBy',
          totalCalls: { $sum: 1 },
          totalDuration: { $sum: '$activities.callDuration' },
          connectedCalls: { $sum: { $cond: [{ $eq: ['$activities.callStatus', 'connected'] }, 1, 0] } }
        }
      },
      { $sort: { totalCalls: -1 } }
    ]);

    // Efficient batch lookup instead of N+1
    const userIds = stats.map(s => s._id).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }).select('name email avatar role').lean();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const salesCounts = await Lead.aggregate([
      { $match: { status: 'Won', updatedAt: { $gte: start } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } }
    ]);
    const salesMap = {};
    salesCounts.forEach(s => { salesMap[s._id?.toString()] = s.count; });

    const populated = stats.map(s => ({
      ...s,
      user: userMap[s._id?.toString()] || null,
      sales: salesMap[s._id?.toString()] || 0
    })).filter(p => p.user);

    res.json({ leaderboard: populated, period, from: start });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/calls-summary
router.get('/calls-summary', protect, async (req, res) => {
  try {
    const matchQuery = req.user.role === 'caller' ? { 'activities.performedBy': req.user._id } : {};
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7);

    const [todayStats, weekStats, statusBreakdown] = await Promise.all([
      Lead.aggregate([
        { $unwind: '$activities' },
        { $match: { 'activities.type': 'call', 'activities.createdAt': { $gte: todayStart }, ...matchQuery } },
        { $group: { _id: null, count: { $sum: 1 }, duration: { $sum: '$activities.callDuration' }, connected: { $sum: { $cond: [{ $eq: ['$activities.callStatus', 'connected'] }, 1, 0] } } } }
      ]),
      Lead.aggregate([
        { $unwind: '$activities' },
        { $match: { 'activities.type': 'call', 'activities.createdAt': { $gte: weekStart }, ...matchQuery } },
        { $group: { _id: null, count: { $sum: 1 }, duration: { $sum: '$activities.callDuration' } } }
      ]),
      Lead.aggregate([
        { $match: req.user.role === 'caller' ? { assignedTo: req.user._id } : {} },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      today: todayStats[0] || { count: 0, duration: 0, connected: 0 },
      week: weekStats[0] || { count: 0, duration: 0 },
      statusBreakdown
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/calls-list
router.get('/calls-list', protect, async (req, res) => {
  try {
    const matchQuery = req.user.role === 'caller' ? { 'activities.performedBy': new mongoose.Types.ObjectId(req.user._id) } : {};
    
    const calls = await Lead.aggregate([
      { $unwind: '$activities' },
      { $match: { 'activities.type': 'call', ...matchQuery } },
      { $sort: { 'activities.createdAt': -1 } },
      { $limit: 100 },
      {
        $project: {
          leadName: '$name',
          leadPhone: '$phone',
          date: '$activities.createdAt',
          duration: '$activities.callDuration',
          status: '$activities.callStatus',
          summary: '$activities.description'
        }
      }
    ]);
    
    res.json({ calls });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/admin-analysis
router.get('/admin-analysis', protect, authorize('admin', 'super admin'), async (req, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    const startOfWeek = new Date(); startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(endOfWeek.getDate() + 6); endOfWeek.setHours(23, 59, 59, 999);
    const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);

    // Run independent aggregations in parallel
    const [
      outcomes,
      callersStats,
      allDbUsers,
      dailyVolume,
      unassignedCount,
      revenueWonResult,
      demosScheduledThisMonth,
      funnelStats,
      campaignStats,
      callersList,
      lastCalls,
      callsTodayStats,
      followupsToday,
      overdueFollowupsCount,
      upcomingDemos,
      staleLeadsCount,
      staleLeadsList,
      overdue24hFollowupsCount,
      detailedOverdueFollowups,
      peakHours,
      locationStats,
      sourceStats,
    ] = await Promise.all([
      Lead.aggregate([{ $unwind: '$activities' }, { $match: { 'activities.type': 'call' } }, { $group: { _id: '$activities.callStatus', count: { $sum: 1 } } }]),
      Lead.aggregate([{ $unwind: '$activities' }, { $match: { 'activities.type': 'call' } }, { $group: { _id: '$activities.performedBy', totalCalls: { $sum: 1 }, totalDuration: { $sum: '$activities.callDuration' }, connected: { $sum: { $cond: [{ $eq: ['$activities.callStatus', 'connected'] }, 1, 0] } } } }]),
      User.find({}).select('name email avatar role').lean(),
      Lead.aggregate([{ $unwind: '$activities' }, { $match: { 'activities.type': 'call', 'activities.createdAt': { $gte: sevenDaysAgo } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$activities.createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Lead.countDocuments({ assignedTo: null }),
      Lead.aggregate([{ $match: { status: 'Won', updatedAt: { $gte: startOfMonth } } }, { $lookup: { from: 'courses', localField: 'courseInterest', foreignField: '_id', as: 'course' } }, { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } }, { $group: { _id: null, total: { $sum: { $ifNull: ['$course.cost', '$budget'] } } } }]),
      Lead.countDocuments({ $or: [{ status: { $in: ['Demo Scheduled', 'Demo Done', 'Won'] }, demoScheduledDate: { $gte: startOfMonth, $lte: endOfMonth } }, { status: { $in: ['Demo Scheduled', 'Demo Done', 'Won'] }, demoScheduledDate: null, updatedAt: { $gte: startOfMonth, $lte: endOfMonth } }] }),
      Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Lead.aggregate([{ $group: { _id: '$campaign', totalLeads: { $sum: 1 }, called: { $sum: { $cond: [{ $gt: ['$totalCalls', 0] }, 1, 0] } }, won: { $sum: { $cond: [{ $eq: ['$status', 'Won'] }, 1, 0] } }, lost: { $sum: { $cond: [{ $eq: ['$status', 'Lost'] }, 1, 0] } } } }]),
      User.find({ role: 'caller' }).select('name email avatar phone').lean(),
      Lead.aggregate([{ $unwind: '$activities' }, { $match: { 'activities.type': 'call' } }, { $group: { _id: '$activities.performedBy', lastCall: { $max: '$activities.createdAt' } } }]),
      Lead.aggregate([{ $unwind: '$activities' }, { $match: { 'activities.type': 'call', 'activities.createdAt': { $gte: todayStart } } }, { $group: { _id: '$activities.performedBy', count: { $sum: 1 } } }]),
      FollowUp.aggregate([{ $match: { scheduledAt: { $gte: todayStart, $lte: endOfToday }, status: 'upcoming' } }, { $group: { _id: '$assignedTo', count: { $sum: 1 } } }]),
      FollowUp.countDocuments({ scheduledAt: { $lt: new Date() }, status: 'upcoming' }),
      Lead.find({ status: 'Demo Scheduled', demoScheduledDate: { $gte: todayStart, $lte: endOfWeek } }).populate('assignedTo', 'name avatar').select('name phone demoScheduledDate preferredCourses assignedTo').lean(),
      Lead.countDocuments({ status: { $nin: ['Won', 'Lost', 'Not interested'] }, $or: [{ lastCalledAt: null, createdAt: { $lt: threeDaysAgo } }, { lastCalledAt: { $lt: threeDaysAgo } }] }),
      Lead.find({ status: { $nin: ['Won', 'Lost', 'Not interested'] }, $or: [{ lastCalledAt: null, createdAt: { $lt: threeDaysAgo } }, { lastCalledAt: { $lt: threeDaysAgo } }] }).populate('assignedTo', 'name email').limit(25).lean(),
      FollowUp.countDocuments({ status: 'upcoming', scheduledAt: { $lt: twentyFourHoursAgo } }),
      FollowUp.find({ scheduledAt: { $lt: new Date() }, status: 'upcoming' }).populate('lead', 'name phone status').populate('assignedTo', 'name email avatar').sort({ scheduledAt: 1 }).lean(),
      Lead.aggregate([{ $unwind: '$activities' }, { $match: { 'activities.type': 'call' } }, { $project: { dayOfWeek: { $dayOfWeek: { date: '$activities.createdAt', timezone: 'Asia/Kolkata' } }, hour: { $hour: { date: '$activities.createdAt', timezone: 'Asia/Kolkata' } }, isConnected: { $cond: [{ $eq: ['$activities.callStatus', 'connected'] }, 1, 0] } } }, { $group: { _id: { dayOfWeek: '$dayOfWeek', hour: '$hour' }, totalCalls: { $sum: 1 }, connectedCalls: { $sum: '$isConnected' } } }]),
      Lead.aggregate([{ $match: { location: { $ne: '' } } }, { $group: { _id: '$location', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      Lead.aggregate([{ $match: { leadSource: { $ne: '' } } }, { $group: { _id: '$leadSource', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
    ]);

    // Build maps for efficient lookup
    const callerStatsMap = {};
    callersStats.forEach(c => { callerStatsMap[c._id?.toString()] = c; });
    const salesAgg = await Lead.aggregate([{ $match: { status: 'Won' } }, { $group: { _id: '$assignedTo', count: { $sum: 1 } } }]);
    const salesMap = {};
    salesAgg.forEach(s => { salesMap[s._id?.toString()] = s.count; });

    const populatedCallers = allDbUsers.map(user => {
      const match = callerStatsMap[user._id.toString()];
      return {
        _id: user._id,
        totalCalls: match?.totalCalls || 0,
        totalDuration: match?.totalDuration || 0,
        connected: match?.connected || 0,
        sales: salesMap[user._id.toString()] || 0,
        user
      };
    });

    const funnelStages = ['Fresh', 'Connected', 'Demo Scheduled', 'Demo Done', 'Won'];
    const funnelMap = {};
    funnelStats.forEach(f => { funnelMap[f._id] = f.count; });
    const conversionFunnel = funnelStages.map(stage => ({ stage, count: funnelMap[stage] || 0 }));

    // Campaign performance with batch lookup
    const campIds = campaignStats.map(c => c._id).filter(Boolean);
    const camps = await Campaign.find({ _id: { $in: campIds } }).select('name').lean();
    const campMap = {};
    camps.forEach(c => { campMap[c._id.toString()] = c.name; });
    const populatedCampaigns = campaignStats.map(c => ({
      ...c,
      name: c._id ? (campMap[c._id.toString()] || 'Unknown') : 'Unassigned'
    }));

    // Team live status
    const lastCallMap = {};
    lastCalls.forEach(l => { lastCallMap[l._id?.toString()] = l.lastCall; });
    const todayCallMap = {};
    callsTodayStats.forEach(t => { todayCallMap[t._id?.toString()] = t.count; });
    const teamStatus = callersList.map(caller => {
      const lastCallTime = lastCallMap[caller._id.toString()] || null;
      const isActive = lastCallTime && new Date(lastCallTime) >= thirtyMinsAgo;
      return {
        user: caller,
        callsToday: todayCallMap[caller._id.toString()] || 0,
        lastCallTime,
        isActive: !!isActive
      };
    });

    // Followup load with batch lookup
    const followupUserIds = followupsToday.map(f => f._id).filter(Boolean);
    const followupUsers = await User.find({ _id: { $in: followupUserIds } }).select('name email avatar').lean();
    const followupUserMap = {};
    followupUsers.forEach(u => { followupUserMap[u._id.toString()] = u; });
    const followupsLoad = followupsToday.map(f => ({
      user: followupUserMap[f._id?.toString()] || null,
      count: f.count
    })).filter(f => f.user);

    // Notifications
    const notifications = [];
    const [recentDemos, recentOverdue, recentAssigned] = await Promise.all([
      Lead.find({ status: 'Demo Scheduled', updatedAt: { $gte: twentyFourHoursAgo } }).populate('assignedTo', 'name').select('name demoScheduledDate assignedTo updatedAt').lean(),
      FollowUp.find({ scheduledAt: { $gte: twentyFourHoursAgo, $lt: new Date() }, status: 'upcoming' }).populate('lead', 'name').populate('assignedTo', 'name').lean(),
      Lead.find({ assignedTo: { $ne: null }, updatedAt: { $gte: twentyFourHoursAgo } }).populate('assignedTo', 'name').select('name assignedTo updatedAt').lean(),
    ]);
    recentDemos.forEach(d => notifications.push({ id: `demo-${d._id}`, type: 'demo', title: 'Demo Booked', message: `Demo for ${d.name} by ${d.assignedTo?.name || 'Unassigned'}`, time: d.updatedAt }));
    recentOverdue.forEach(f => notifications.push({ id: `overdue-${f._id}`, type: 'overdue', title: 'Follow-up Overdue', message: `Follow-up for ${f.lead?.name || 'Lead'} (${f.assignedTo?.name || 'Caller'}) is overdue`, time: f.scheduledAt }));
    recentAssigned.forEach(l => notifications.push({ id: `assigned-${l._id}`, type: 'assigned', title: 'Lead Assigned', message: `${l.name} assigned to ${l.assignedTo?.name}`, time: l.updatedAt }));
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    teamStatus.forEach(caller => {
      if (caller.callsToday > 0 && caller.lastCallTime && new Date(caller.lastCallTime) < twoHoursAgo) {
        notifications.push({ id: `idle-${caller.user._id}`, type: 'idle', title: 'Caller Idle Alert', message: `${caller.user.name} idle 2h+ (last call ${new Date(caller.lastCallTime).toLocaleTimeString()})`, time: new Date(caller.lastCallTime) });
      }
    });
    notifications.sort((a, b) => b.time - a.time);

    res.json({
      outcomes,
      callers: populatedCallers,
      dailyVolume,
      unassignedCount,
      revenueWon: revenueWonResult[0]?.total || 0,
      demosScheduledThisMonth,
      conversionFunnel,
      campaignPerformance: populatedCampaigns,
      teamStatus,
      followupsLoad,
      overdueFollowupsCount,
      upcomingDemos,
      staleLeadsCount,
      staleLeadsList,
      overdue24hFollowupsCount,
      detailedOverdueFollowups,
      peakHours,
      locationStats,
      sourceStats,
      notifications
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/user-analysis/:userId
router.get('/user-analysis/:userId', protect, authorize('admin', 'super admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('name email role phone avatar').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const matchQuery = { 'activities.performedBy': new mongoose.Types.ObjectId(userId) };
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [outcomes, stats, dailyVolume, recentActivities] = await Promise.all([
      Lead.aggregate([{ $unwind: '$activities' }, { $match: { 'activities.type': 'call', ...matchQuery } }, { $group: { _id: '$activities.callStatus', count: { $sum: 1 } } }]),
      Lead.aggregate([{ $unwind: '$activities' }, { $match: { 'activities.type': 'call', ...matchQuery } }, { $group: { _id: null, totalCalls: { $sum: 1 }, totalDuration: { $sum: '$activities.callDuration' }, connected: { $sum: { $cond: [{ $eq: ['$activities.callStatus', 'connected'] }, 1, 0] } } } }]),
      Lead.aggregate([{ $unwind: '$activities' }, { $match: { 'activities.type': 'call', 'activities.createdAt': { $gte: sevenDaysAgo }, ...matchQuery } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$activities.createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Lead.aggregate([{ $unwind: '$activities' }, { $match: matchQuery }, { $sort: { 'activities.createdAt': -1 } }, { $limit: 15 }, { $project: { leadId: '$_id', leadName: '$name', activity: '$activities' } }]),
    ]);

    const populatedActivities = recentActivities.map(act => ({ ...act, performer: { name: user.name, avatar: user.avatar } }));

    res.json({ user, stats: stats[0] || { totalCalls: 0, totalDuration: 0, connected: 0 }, outcomes, dailyVolume, recentActivities: populatedActivities });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
