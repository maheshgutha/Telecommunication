const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const User = require('./backend/src/models/User');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const users = await User.find({}).select('name email role');
    console.log('Users in DB:');
    users.forEach(u => {
      console.log(`- ${u.name} (${u.email}) [${u.role}]`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

run();
