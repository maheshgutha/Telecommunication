// backend/src/services/fcm.js
const admin = require('firebase-admin');

let initialized = false;

function initFCM() {
  if (initialized) return;
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
      console.warn('⚠️  FCM disabled: FIREBASE_SERVICE_ACCOUNT env var not set');
      return;
    }
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    initialized = true;
    console.log('✅ Firebase Admin SDK initialized');
  } catch (err) {
    console.error('❌ FCM init error:', err.message);
  }
}

async function sendCallNotification(fcmToken, lead, callerName) {
  if (!initialized || !fcmToken) {
    console.log('FCM not ready or no token');
    return false;
  }
  try {
    const message = {
      token: fcmToken,
      notification: {
        title: `📞 Call Lead: ${lead.name}`,
        body: `${callerName} wants you to call ${lead.phone}`,
      },
      data: {
        type: 'INITIATE_CALL',
        leadId: lead._id.toString(),
        leadName: lead.name,
        leadPhone: lead.phone,
        initiatedBy: callerName,
        timestamp: Date.now().toString(),
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'call_notifications',
          priority: 'max',
          defaultSound: true,
          defaultVibrateTimings: true,
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
    };
    const response = await admin.messaging().send(message);
    console.log(`✅ FCM sent successfully. ID: ${response}`);
    return true;
  } catch (err) {
    console.error('❌ FCM send failed:', err.message);
    return false;
  }
}

module.exports = { initFCM, sendCallNotification };