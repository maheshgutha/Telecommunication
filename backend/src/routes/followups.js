const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const FollowUp = require('../models/FollowUp');
const Lead = require('../models/Lead');
const { protect } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/followups
router.get('/', protect, async (req, res) => {
  try {
    const { status, date, due: dueQuery, callerId, type, forMe: forMeQuery } = req.query;
    const query = {};

    // 1. assignedTo filtering (Me vs Team)
    const forMe = forMeQuery === 'true' || forMeQuery === true;
    if (forMe) {
      query.assignedTo = req.user._id;
    } else if (forMeQuery === 'false' || forMeQuery === false) {
      if (callerId && callerId !== 'all') {
        query.assignedTo = callerId;
      }
    } else {
      if (req.user.role === 'caller') {
        query.assignedTo = req.user._id;
      } else {
        if (callerId && callerId !== 'all') {
          query.assignedTo = callerId;
        }
      }
    }

    // 2. Type filtering
    if (type) {
      if (type === 'todo') query.type = 'todo';
      else if (type === 'call' || type === 'call_followup') query.type = 'call_followup';
    }

    // 3. Status filtering
    if (status) {
      const statuses = status.split(',').map(s => s.trim() === 'pending' ? 'upcoming' : s.trim());
      query.status = { $in: statuses };
    }

    // 4. Date / Due filtering
    const due = dueQuery || date;
    if (due) {
      if (due === 'today') {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setHours(23, 59, 59, 999);
        query.scheduledAt = { $gte: start, $lte: end };
      } else if (due === 'tomorrow') {
        const start = new Date(); start.setDate(start.getDate() + 1); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setDate(end.getDate() + 1); end.setHours(23, 59, 59, 999);
        query.scheduledAt = { $gte: start, $lte: end };
      } else if (due === 'this_week') {
        const start = new Date();
        const day = start.getDay();
        const startOfWeek = new Date(start);
        startOfWeek.setDate(start.getDate() - day);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        query.scheduledAt = { $gte: startOfWeek, $lte: endOfWeek };
      } else if (due === 'overdue') {
        query.scheduledAt = { $lt: new Date() };
      } else if (due === 'upcoming') {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        query.scheduledAt = { $gte: start };
      }
    }

    const followups = await FollowUp.find(query)
      .populate('lead', 'name phone status')
      .populate('assignedTo', 'name avatar')
      .sort({ scheduledAt: 1 });

    res.json({ followups });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/followups
router.post('/', protect, async (req, res) => {
  try {
    const followup = await FollowUp.create({
      ...req.body,
      assignedTo: req.body.assignedTo || req.user._id,
    });
    await followup.populate('lead', 'name phone status');
    res.status(201).json({ followup });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/followups/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.status === 'done' && !update.completedAt) {
      update.completedAt = new Date();
    }
    const followup = await FollowUp.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('lead', 'name phone status');
    if (!followup) return res.status(404).json({ message: 'Follow-up not found' });
    res.json({ followup });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/followups/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await FollowUp.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/followups/import
router.post('/import', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Excel/CSV file is empty' });
    }

    let created = 0;
    for (const row of rows) {
      try {
        const normalizedRow = {};
        Object.keys(row).forEach(k => {
          normalizedRow[k.trim().toLowerCase()] = row[k];
        });

        const note = normalizedRow.note || normalizedRow.description || normalizedRow.task || '';
        const scheduledAtStr = normalizedRow.date || normalizedRow.scheduledat || normalizedRow.due_date || normalizedRow.duedate;
        
        let scheduledAt = new Date();
        if (scheduledAtStr) {
          const parsedDate = new Date(scheduledAtStr);
          if (!isNaN(parsedDate.getTime())) {
            scheduledAt = parsedDate;
          }
        }
        
        const priority = (normalizedRow.priority || 'medium').trim().toLowerCase();
        const type = (normalizedRow.type || 'call_followup').trim().toLowerCase();
        
        let leadId = undefined;
        const leadPhone = normalizedRow.phone || normalizedRow.lead_phone;
        if (leadPhone) {
          const lead = await Lead.findOne({ phone: String(leadPhone).trim() });
          if (lead) leadId = lead._id;
        }

        let finalType = ['call_followup', 'todo'].includes(type) ? type : 'call_followup';
        if (finalType === 'call_followup' && !leadId) {
          finalType = 'todo';
        }

        await FollowUp.create({
          lead: leadId,
          note,
          scheduledAt,
          priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
          type: finalType,
          assignedTo: req.user._id
        });
        created++;
      } catch (rowError) {
        console.error('Error importing bulk row:', row, rowError);
      }
    }

    res.json({ message: 'Import completed successfully', count: created, total: rows.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
