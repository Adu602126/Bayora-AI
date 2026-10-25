import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const API_URL = 'http://localhost:3000/api/sos';

async function testOmnichannelSOS() {
  console.log('🚀 Initiating SafePath Omnichannel SOS Test...');
  console.log('--------------------------------------------------');
  
  // Quick sanity check of env variables
  const hasTg = !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
  const hasBrevo = !!(process.env.BREVO_API_KEY && process.env.BREVO_ALERT_EMAIL);
  
  console.log(`Telegram Configured: ${hasTg ? '✅ Yes' : '❌ No'}`);
  console.log(`Brevo Configured:    ${hasBrevo ? '✅ Yes' : '❌ No'}`);
  console.log('--------------------------------------------------');

  const payload = {
    userName: "Hackathon Judge (Test)",
    location: { lat: 22.7196, lng: 75.8577 }, // Indore coordinates
    contacts: [
      { name: "Emergency Response", phone: "+919876543210" }
    ],
    timestamp: new Date().toISOString(),
    routeId: 999
  };

  try {
    const startTime = Date.now();
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    const endTime = Date.now();

    console.log(`\n📡 HTTP Status: ${response.status}`);
    console.log(`⏱️  Response Time: ${endTime - startTime}ms`);
    console.log('\n📦 Server Response Data:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ TEST SUCCESSFUL: SOS API triggered correctly.');
      if (hasTg || hasBrevo) {
         console.log('👉 Please check your Telegram App and Email Inbox right now!');
      } else {
         console.log('⚠️ NOTE: API succeeded, but Telegram/Brevo tokens are missing in .env, so no actual messages were sent.');
      }
    } else {
      console.log('\n❌ TEST FAILED: The API returned an error.');
    }

  } catch (error) {
    console.error('\n💥 FATAL ERROR: Could not reach the local development server.');
    console.error('Make sure you have started your server with "npm run dev"!');
    console.error('Error Details:', error.message);
  }
}

testOmnichannelSOS();
