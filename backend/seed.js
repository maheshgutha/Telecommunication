/**
 * AOTMS – Full Database Seed  (drop-in replacement for backend/seed.js)
 *
 * FIX: FollowUp schema has lead: required:true
 *      — todo tasks now use the first lead as a dummy reference
 *        OR we patch the schema inline before inserting.
 *      We patch inline so the schema file itself is untouched.
 *
 * Usage (from the backend/ folder):
 *   node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User            = require('./src/models/User');
const Lead            = require('./src/models/Lead');
const Campaign        = require('./src/models/Campaign');
const FollowUp        = require('./src/models/FollowUp');
const Course          = require('./src/models/Course');
const MessageTemplate = require('./src/models/MessageTemplate');
const Blocklist       = require('./src/models/Blocklist');
const connectDB       = require('./src/config/db');

// ── Patch FollowUp schema so lead is optional for todo tasks ──────────────────
// This only affects the in-process schema; the .js model file is NOT changed.
FollowUp.schema.path('lead').required(false);

// ─── helpers ──────────────────────────────────────────────────────────────────
const hrs    = (n) => new Date(Date.now() + n  * 3_600_000);
const days   = (n) => new Date(Date.now() + n  * 86_400_000);
const hrsAgo = (n) => new Date(Date.now() - n  * 3_600_000);

const seed = async () => {
  await connectDB();

  console.log('🧹  Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Lead.deleteMany({}),
    Campaign.deleteMany({}),
    FollowUp.deleteMany({}),
    Course.deleteMany({}),
    MessageTemplate.deleteMany({}),
    Blocklist.deleteMany({}),
  ]);

  // ── USERS ─────────────────────────────────────────────────────────────────
  const superAdmin = await User.create({
    name: 'Swathi Raguthu', email: 'swathiraguthu@gmail.com',
    password: 'Swathi@2005', role: 'super admin', phone: '919876543210', isActive: true,
  });
  const adminDemo = await User.create({
    name: 'Admin Demo', email: 'admin@aotms.com',
    password: 'admin123', role: 'admin', phone: '919876543211', isActive: true,
  });
  const c1 = await User.create({
    name: 'Mahesh Choudare', email: 'maheshchoudare21@gmail.com',
    password: 'Mahesh@2005', role: 'caller', phone: '919000000001', isActive: true,
  });
  const c2 = await User.create({
    name: 'Haseena Ahmed', email: 'haseena@aotms.com',
    password: 'caller123', role: 'caller', phone: '919000000002', isActive: true,
  });
  const c3 = await User.create({
    name: 'Ravi Shankar', email: 'ravi@aotms.com',
    password: 'caller123', role: 'caller', phone: '919000000003', isActive: true,
  });
  const c4 = await User.create({
    name: 'Poojitha Reddy', email: 'poojitha@aotms.com',
    password: 'caller123', role: 'caller', phone: '919000000004', isActive: true,
  });
  console.log('✅  6 Users created');

  // ── CAMPAIGNS ─────────────────────────────────────────────────────────────
  const camp1 = await Campaign.create({
    name: 'engg-clgs', description: 'Engineering College Leads', status: 'active',
    assignedCallers: [c1._id, c2._id, c3._id, c4._id], totalLeads: 15, createdBy: superAdmin._id,
  });
  const camp2 = await Campaign.create({
    name: 'mba-batch-2025', description: 'MBA Admissions 2025', status: 'active',
    assignedCallers: [c1._id, c3._id, c4._id], totalLeads: 7, createdBy: superAdmin._id,
  });
  const camp3 = await Campaign.create({
    name: 'bba-outreach', description: 'BBA Program Outreach', status: 'paused',
    assignedCallers: [c2._id, c4._id], totalLeads: 5, createdBy: adminDemo._id,
  });
  console.log('✅  3 Campaigns created');

  // ── COURSES ───────────────────────────────────────────────────────────────
  const courses = await Course.insertMany([
    { name: 'Full Stack Web Development', cost: 45000, duration: '6 Months', description: 'HTML, CSS, JS, React, Node, MongoDB', isActive: true },
    { name: 'Data Science & AI',           cost: 55000, duration: '6 Months', description: 'Python, ML, Deep Learning, Power BI',  isActive: true },
    { name: 'UI/UX Design',                cost: 35000, duration: '3 Months', description: 'Figma, wireframing, prototyping',        isActive: true },
    { name: 'Digital Marketing',           cost: 25000, duration: '3 Months', description: 'SEO, SEM, social media, analytics',     isActive: true },
    { name: 'Product Management',          cost: 40000, duration: '4 Months', description: 'Agile, roadmap, business strategy',     isActive: true },
  ]);
  const [crs1, crs2, crs3, crs4, crs5] = courses;
  console.log('✅  5 Courses created');

  // ── LEADS ─────────────────────────────────────────────────────────────────
  const makeActivity = (caller, type, desc, callDuration, callStatus, createdAt) => ({
    type, description: desc, callDuration: callDuration || 0,
    callStatus: callStatus || '', performedBy: caller, createdAt,
  });

  const leadsRaw = [
    // Campaign 1 – engg-clgs
    { name: 'Para Pranadeep',           phone: '916305468518', email: 'pranadeep@gmail.com',     status: 'Call Not Responding', leadSource: 'Facebook', preferredCourses: ['B.Tech'],   budget: 50000, location: 'Hyderabad',    assignedTo: c1._id, campaign: camp1._id, courseInterest: crs1._id, mode: 'Online',  rating: 2, isStarred: false },
    { name: 'Syed Abdul Ajees',         phone: '919912916365', email: 'ajees@gmail.com',         status: 'Demo Scheduled',      leadSource: 'Facebook', preferredCourses: ['MBA'],      budget: 60000, location: 'Vijayawada',   assignedTo: c1._id, campaign: camp1._id, courseInterest: crs5._id, mode: 'Hybrid',  rating: 4, isStarred: true  },
    { name: 'Thahir',                   phone: '919618620700', email: 'thahir@gmail.com',         status: 'Fresh',               leadSource: 'Facebook', preferredCourses: ['BBA'],      budget: 40000, location: 'Chennai',      assignedTo: c2._id, campaign: camp1._id, courseInterest: crs4._id, mode: 'Offline', rating: 0, isStarred: false },
    { name: 'Sanjay Kumar',             phone: '917264003651', email: 'sanjay@gmail.com',         status: 'Fresh',               leadSource: 'WhatsApp', preferredCourses: ['MCA'],      budget: 45000, location: 'Bangalore',    assignedTo: c2._id, campaign: camp1._id, courseInterest: crs2._id, mode: 'Online',  rating: 0, isStarred: false },
    { name: 'Sateesh Reddy',            phone: '919642250062', email: 'sateesh@gmail.com',        status: 'Fresh',               leadSource: 'Website',  preferredCourses: ['B.Tech'],   budget: 55000, location: 'Guntur',       assignedTo: c1._id, campaign: camp1._id, courseInterest: crs1._id, mode: 'Online',  rating: 1, isStarred: false },
    { name: 'Navuluri Ankitha',         phone: '919110700548', email: 'ankitha@gmail.com',        status: 'Call Back Later',     leadSource: 'Facebook', preferredCourses: ['MBA'],      budget: 65000, location: 'Hyderabad',    assignedTo: c3._id, campaign: camp1._id, courseInterest: crs5._id, mode: 'Hybrid',  rating: 3, isStarred: true  },
    { name: 'Athota Varunteja',         phone: '918500654680', email: 'varunteja@gmail.com',      status: 'Not interested',      leadSource: 'Facebook', preferredCourses: ['BBA'],      budget: 35000, location: 'Tirupati',     assignedTo: c1._id, campaign: camp1._id, courseInterest: crs3._id, mode: 'Offline', rating: 1, isStarred: false },
    { name: 'Jallela Annamaiah',        phone: '919642865520', email: 'annamaiah@gmail.com',      status: 'Call Not Responding', leadSource: 'Manual',   preferredCourses: ['B.Tech'],   budget: 50000, location: 'Kurnool',      assignedTo: c2._id, campaign: camp1._id, courseInterest: crs1._id, mode: 'Online',  rating: 2, isStarred: false },
    { name: 'Narne Ajay',               phone: '919392506567', email: 'ajay@gmail.com',           status: 'Not interested',      leadSource: 'Facebook', preferredCourses: ['MCA'],      budget: 42000, location: 'Nellore',      assignedTo: c3._id, campaign: camp1._id, courseInterest: crs2._id, mode: 'Online',  rating: 0, isStarred: false },
    { name: 'Mellempudi Vijaya Naga',   phone: '918897699676', email: 'vijayanaga@gmail.com',     status: 'Not interested',      leadSource: 'Website',  preferredCourses: ['B.Tech'],   budget: 48000, location: 'Vizag',        assignedTo: c1._id, campaign: camp1._id, courseInterest: crs1._id, mode: 'Hybrid',  rating: 1, isStarred: false },
    { name: 'Gundala Vamsi Krishna',    phone: '916281477638', email: 'vamsi@gmail.com',          status: 'Call Not Responding', leadSource: 'Facebook', preferredCourses: ['MBA'],      budget: 70000, location: 'Hyderabad',    assignedTo: c2._id, campaign: camp1._id, courseInterest: crs5._id, mode: 'Online',  rating: 2, isStarred: false },
    { name: 'Nambula Gopi Krishna',     phone: '919949396016', email: 'gopi@gmail.com',           status: 'Fresh',               leadSource: 'WhatsApp', preferredCourses: ['BBA'],      budget: 38000, location: 'Ongole',       assignedTo: c3._id, campaign: camp1._id, courseInterest: crs4._id, mode: 'Offline', rating: 0, isStarred: false },
    { name: 'Jalasuthram Durgabhavani', phone: '918885441234', email: 'durga@gmail.com',          status: 'Not interested',      leadSource: 'Facebook', preferredCourses: ['MBA'],      budget: 60000, location: 'Kakinada',     assignedTo: c1._id, campaign: camp1._id, courseInterest: crs5._id, mode: 'Hybrid',  rating: 1, isStarred: false },
    { name: 'Pinneboyina Ganesh',       phone: '917799001122', email: 'ganesh@gmail.com',         status: 'Not interested',      leadSource: 'Manual',   preferredCourses: ['M.Tech'],   budget: 55000, location: 'Rajahmundry',  assignedTo: c2._id, campaign: camp1._id, courseInterest: crs1._id, mode: 'Online',  rating: 0, isStarred: false },
    { name: 'Guttikonda Lokesh',        phone: '919123456780', email: 'lokesh@gmail.com',         status: 'Call Not Responding', leadSource: 'Facebook', preferredCourses: ['B.Tech'],   budget: 47000, location: 'Eluru',        assignedTo: c3._id, campaign: camp1._id, courseInterest: crs1._id, mode: 'Online',  rating: 2, isStarred: false },

    // Campaign 2 – mba-batch-2025
    { name: 'Ramya Krishnan',           phone: '918800112233', email: 'ramya@gmail.com',          status: 'Fresh',               leadSource: 'Facebook', preferredCourses: ['MBA'],      budget: 80000, location: 'Chennai',      assignedTo: c1._id, campaign: camp2._id, courseInterest: crs5._id, mode: 'Online',  rating: 1, isStarred: false },
    { name: 'Suresh Babu',              phone: '917700223344', email: 'suresh@gmail.com',         status: 'Connected',           leadSource: 'Website',  preferredCourses: ['MBA'],      budget: 75000, location: 'Hyderabad',    assignedTo: c1._id, campaign: camp2._id, courseInterest: crs5._id, mode: 'Hybrid',  rating: 3, isStarred: true  },
    { name: 'Priya Lakshmi',            phone: '916600334455', email: 'priya@gmail.com',          status: 'Demo Scheduled',      leadSource: 'WhatsApp', preferredCourses: ['MBA','BBA'],budget: 72000, location: 'Bangalore',    assignedTo: c3._id, campaign: camp2._id, courseInterest: crs5._id, mode: 'Hybrid',  rating: 4, isStarred: true  },
    { name: 'Kiran Reddy',              phone: '915500445566', email: 'kiran@gmail.com',          status: 'Call Back Later',     leadSource: 'Manual',   preferredCourses: ['MBA'],      budget: 68000, location: 'Vijayawada',   assignedTo: c3._id, campaign: camp2._id, courseInterest: crs5._id, mode: 'Online',  rating: 3, isStarred: false },
    { name: 'Anjali Sharma',            phone: '914400556677', email: 'anjali@gmail.com',         status: 'Won',                 leadSource: 'Facebook', preferredCourses: ['MBA'],      budget: 90000, location: 'Mumbai',       assignedTo: c1._id, campaign: camp2._id, courseInterest: crs5._id, mode: 'Online',  rating: 5, isStarred: true  },
    { name: 'Deepika Nair',             phone: '913311667788', email: 'deepika@gmail.com',        status: 'Demo Done',           leadSource: 'Facebook', preferredCourses: ['MBA'],      budget: 78000, location: 'Pune',         assignedTo: c4._id, campaign: camp2._id, courseInterest: crs5._id, mode: 'Hybrid',  rating: 4, isStarred: false },
    { name: 'Rohit Khanna',             phone: '912299887766', email: 'rohit@gmail.com',          status: 'Connected',           leadSource: 'Website',  preferredCourses: ['MBA'],      budget: 82000, location: 'Delhi',        assignedTo: c4._id, campaign: camp2._id, courseInterest: crs5._id, mode: 'Online',  rating: 3, isStarred: false },

    // Campaign 3 – bba-outreach
    { name: 'Vikram Rao',               phone: '913300667788', email: 'vikram@gmail.com',         status: 'Fresh',               leadSource: 'Facebook', preferredCourses: ['BBA'],      budget: 35000, location: 'Hyderabad',    assignedTo: c2._id, campaign: camp3._id, courseInterest: crs4._id, mode: 'Online',  rating: 0, isStarred: false },
    { name: 'Meena Kumari',             phone: '912200778899', email: 'meena@gmail.com',          status: 'Not interested',      leadSource: 'Website',  preferredCourses: ['BBA'],      budget: 32000, location: 'Tirupati',     assignedTo: c2._id, campaign: camp3._id, courseInterest: crs4._id, mode: 'Offline', rating: 0, isStarred: false },
    { name: 'Deepak Varma',             phone: '911100889900', email: 'deepak@gmail.com',         status: 'Connected',           leadSource: 'WhatsApp', preferredCourses: ['BBA'],      budget: 38000, location: 'Guntur',       assignedTo: c2._id, campaign: camp3._id, courseInterest: crs3._id, mode: 'Hybrid',  rating: 2, isStarred: false },
    { name: 'Swati Patel',              phone: '910099778866', email: 'swati@gmail.com',          status: 'Call Back Later',     leadSource: 'Facebook', preferredCourses: ['BBA'],      budget: 36000, location: 'Surat',        assignedTo: c4._id, campaign: camp3._id, courseInterest: crs4._id, mode: 'Online',  rating: 1, isStarred: false },
    { name: 'Harish Gupta',             phone: '919988776655', email: 'harish@gmail.com',         status: 'Fresh',               leadSource: 'Manual',   preferredCourses: ['BBA'],      budget: 33000, location: 'Jaipur',       assignedTo: c4._id, campaign: camp3._id, courseInterest: crs4._id, mode: 'Offline', rating: 0, isStarred: false },
  ];

  const callStatusCycle = ['connected','no_answer','connected','no_answer','busy'];
  const noteCycle = [
    'Interested in morning batch', 'Asked for brochure', 'Will call back after exam',
    'Needs scholarship info', 'Requested fee structure', 'Parent on call',
  ];

  const createdLeads = [];
  for (let i = 0; i < leadsRaw.length; i++) {
    const ld = leadsRaw[i];
    const hoursOffset = i * 1.8;
    const callDur = [0, 15, 45, 90, 180, 240, 320][i % 7];
    const callSt  = callStatusCycle[i % callStatusCycle.length];

    const activities = [
      makeActivity(ld.assignedTo, 'call', callDur > 0 ? '' : 'No answer', callDur, callSt, hrsAgo(hoursOffset)),
    ];
    if (i % 3 === 0) {
      activities.unshift(makeActivity(ld.assignedTo, 'note', noteCycle[i % noteCycle.length], 0, '', hrsAgo(hoursOffset - 0.4)));
    }
    if (i % 5 === 0 && i > 0) {
      activities.unshift(makeActivity(ld.assignedTo, 'status_change', `Status changed from Fresh to ${ld.status}`, 0, '', hrsAgo(hoursOffset - 0.8)));
    }

    const lead = await Lead.create({
      ...ld,
      activities,
      totalCalls: 1,
      totalCallDuration: callDur,
      lastCalledAt: hrsAgo(hoursOffset),
      lastQualification: ['Graduate', 'Post-Graduate', 'Under Graduate', ''][i % 4],
    });
    createdLeads.push(lead);
  }
  console.log(`✅  ${createdLeads.length} Leads created`);

  // ── FOLLOW-UPS ────────────────────────────────────────────────────────────
  // NOTE: lead is required:true in the schema for call_followup rows.
  //       todo rows have no lead — we patched the schema at the top of this file.
  const followUpsData = [
    // ── Call follow-ups (lead is required) ──────────────────────────────────
    { lead: createdLeads[1]._id,  assignedTo: c1._id, type: 'call_followup', scheduledAt: hrs(2),    status: 'upcoming', note: 'Follow up on demo interest',            priority: 'high'   },
    { lead: createdLeads[5]._id,  assignedTo: c3._id, type: 'call_followup', scheduledAt: hrs(4),    status: 'upcoming', note: 'Check if brochure was received',        priority: 'medium' },
    { lead: createdLeads[3]._id,  assignedTo: c2._id, type: 'call_followup', scheduledAt: hrs(-1),   status: 'upcoming', note: 'Overdue — call immediately',             priority: 'high'   },
    { lead: createdLeads[7]._id,  assignedTo: c2._id, type: 'call_followup', scheduledAt: hrs(24),   status: 'upcoming', note: 'Call tomorrow morning',                  priority: 'low'    },
    { lead: createdLeads[16]._id, assignedTo: c1._id, type: 'call_followup', scheduledAt: hrs(3),    status: 'upcoming', note: 'MBA batch discussion',                   priority: 'high'   },
    { lead: createdLeads[18]._id, assignedTo: c3._id, type: 'call_followup', scheduledAt: hrs(-0.5), status: 'upcoming', note: 'Demo scheduled — confirm attendance',    priority: 'high'   },
    { lead: createdLeads[10]._id, assignedTo: c2._id, type: 'call_followup', scheduledAt: hrs(6),    status: 'upcoming', note: 'Fee structure query pending',             priority: 'medium' },
    { lead: createdLeads[17]._id, assignedTo: c4._id, type: 'call_followup', scheduledAt: days(2),   status: 'upcoming', note: 'Scholarship options discussion',         priority: 'medium' },
    { lead: createdLeads[19]._id, assignedTo: c4._id, type: 'call_followup', scheduledAt: hrs(-2),   status: 'done',     note: 'Demo confirmed, fee paid',               priority: 'high',  completedAt: hrsAgo(1.5) },

    // ── To-Do tasks (no lead) ────────────────────────────────────────────────
    { assignedTo: c1._id, type: 'todo', title: 'Submit daily call report',   scheduledAt: hrs(1),   status: 'upcoming', note: 'Send to manager by 6 PM',           priority: 'medium' },
    { assignedTo: c2._id, type: 'todo', title: 'Update MBA lead database',    scheduledAt: hrs(2),   status: 'upcoming', note: 'Add new Facebook leads from today',  priority: 'low'    },
    { assignedTo: c3._id, type: 'todo', title: 'Send demo invites',           scheduledAt: hrs(-2),  status: 'upcoming', note: 'WhatsApp invite for weekend batch',  priority: 'high'   },
    { assignedTo: c1._id, type: 'todo', title: 'Prepare MBA pitch script',    scheduledAt: days(1),  status: 'upcoming', note: 'Update for new semester batch',      priority: 'medium' },
  ];

  for (const fu of followUpsData) {
    await FollowUp.create(fu);
  }
  console.log(`✅  ${followUpsData.length} Follow-ups / Tasks created`);

  // ── MESSAGE TEMPLATES ─────────────────────────────────────────────────────
  await MessageTemplate.insertMany([
    { type: 'whatsapp', shortcut: '/intro',      isShared: true,  createdBy: superAdmin._id,
      message: 'Hi {name} 👋, this is {caller} from AOTMS Edu. We saw your interest in *{course}*. Can we connect for a quick 5-min call today?' },
    { type: 'whatsapp', shortcut: '/brochure',   isShared: true,  createdBy: superAdmin._id,
      message: 'Hi {name}, as requested, here is the detailed brochure for {course}. Fee: ₹{fee}, Duration: {duration}. Let me know if you have any questions 😊' },
    { type: 'whatsapp', shortcut: '/demo',       isShared: true,  createdBy: adminDemo._id,
      message: 'Dear {name}, your *DEMO SESSION* is confirmed for {date} at {time}. Join link: {link}. Please be on time 🙏' },
    { type: 'whatsapp', shortcut: '/followup',   isShared: true,  createdBy: adminDemo._id,
      message: 'Hi {name}, just following up from our last call. Have you had a chance to discuss our offer with your family? We are here to help 😊' },
    { type: 'whatsapp', shortcut: '/notint',     isShared: false, createdBy: c1._id,
      message: 'Thank you for your time, {name}. We understand your decision. Feel free to reach us if you change your mind. Best wishes 🙏' },

    { type: 'sms', shortcut: '/sms-intro',       isShared: true,  createdBy: superAdmin._id,
      message: 'Hi {name}, AOTMS Edu here. We have an exciting offer on {course}. Reply YES to know more. -AOTMS' },
    { type: 'sms', shortcut: '/sms-demo',        isShared: true,  createdBy: superAdmin._id,
      message: 'AOTMS DEMO confirmed for {name} on {date} {time}. Login: {link}. -AOTMS Edu' },
    { type: 'sms', shortcut: '/sms-remind',      isShared: true,  createdBy: adminDemo._id,
      message: 'Hi {name}, reminder: Your follow-up call is at {time} today. -AOTMS Team' },

    { type: 'email', shortcut: '/email-welcome', isShared: true,  createdBy: superAdmin._id,
      message: 'Subject: Welcome to AOTMS Edu!\n\nDear {name},\n\nThank you for showing interest in {course}.\n\nBest regards,\nAOTMS Team' },
    { type: 'email', shortcut: '/email-proposal',isShared: false, createdBy: c1._id,
      message: 'Subject: Course Proposal – {course}\n\nDear {name},\n\nCourse: {course}\nDuration: {duration}\nFee: ₹{fee}\n\nRegards,\n{caller}' },
  ]);
  console.log('✅  10 Message Templates created');

  // ── BLOCKLIST ─────────────────────────────────────────────────────────────
  await Blocklist.insertMany([
    { phone: '919000111222', name: 'Spam Lead 1',  reason: 'Repeated abusive calls',      blockedBy: superAdmin._id },
    { phone: '919000222333', name: 'DNC Request',  reason: 'Requested Do Not Call',        blockedBy: superAdmin._id },
    { phone: '919000333444', name: 'Wrong Number', reason: 'Wrong number – unrelated biz', blockedBy: c1._id         },
    { phone: '919000444555', name: 'Competitor',   reason: 'Competitor posing as lead',    blockedBy: superAdmin._id },
  ]);
  console.log('✅  4 Blocklist entries created');

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  ✅   AOTMS SEED COMPLETE — ALL COLLECTIONS POPULATED');
  console.log('══════════════════════════════════════════════════════');
  console.log('\n  🔐  LOGIN CREDENTIALS\n');
  console.log('  Super Admin : swathiraguthu@gmail.com    / Swathi@2005');
  console.log('  Admin Demo  : admin@aotms.com            / admin123');
  console.log('  Caller 1    : maheshchoudare21@gmail.com / Mahesh@2005');
  console.log('  Caller 2    : haseena@aotms.com          / caller123');
  console.log('  Caller 3    : ravi@aotms.com             / caller123');
  console.log('  Caller 4    : poojitha@aotms.com         / caller123');
  console.log('\n  📦  DATA SEEDED');
  console.log(`  Users:             6  (1 super admin · 1 admin · 4 callers)`);
  console.log(`  Campaigns:         3`);
  console.log(`  Courses:           5`);
  console.log(`  Leads:             ${createdLeads.length}  (with activities & notes)`);
  console.log(`  Follow-ups/Tasks:  13  (8 call follow-ups + 4 to-do tasks + 1 done)`);
  console.log(`  Message Templates: 10  (WhatsApp · SMS · Email)`);
  console.log(`  Blocklist:          4`);
  console.log('══════════════════════════════════════════════════════\n');

  process.exit(0);
};

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });