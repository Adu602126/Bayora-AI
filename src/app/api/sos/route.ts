// ============================================================
// POST /api/sos  —  SafePath SOS Alert Dispatcher
// Team The Riser | BGI Hackathon 2026
//
// Callers:
//   - dispatchSOSAlert() in src/lib/riskScoring.ts
//   - Service worker background sync (SYNC_SOS_TAG)
//
// To activate real alerts, set env vars in .env.local:
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
//   BREVO_API_KEY, BREVO_ALERT_EMAIL
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE
//   FIREBASE_SERVICE_ACCOUNT  (JSON string)
//   MSG91_AUTH_KEY
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

// ── Types ─────────────────────────────────────────────────────────────────

export interface SOSPayload {
  userName:  string;
  location:  { lat: number; lng: number };
  contacts:  { name: string; phone: string }[];
  timestamp?: string;   // ISO string
  routeId?:  number;
  queuedAt?: string;    // set by SW background sync
}

interface AlertResult {
  name:   string;
  phone:  string;
  sent:   boolean;
  error?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

const MAX_BODY_BYTES    = 8_192;          // 8 KB — prevent oversized payloads
const MAX_USERNAME_LEN  = 80;
const MAX_CONTACTS      = 10;
const ALLOWED_ORIGINS   = [
  'http://localhost:3000',
  'https://safepath.indore.app',
  process.env.NEXT_PUBLIC_APP_URL,        // add your deployed URL here
].filter(Boolean) as string[];

// ── CORS helper ───────────────────────────────────────────────────────────

function corsHeaders(origin: string | null): HeadersInit {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-llow-Headers': 'Content-Type, Authorization',
  };
}

// ── Sanitize helper ───────────────────────────────────────────────────────

/**
 * Strip characters that could break SMS formatting or inject content.
 * Keeps letters, digits, spaces, common punctuation.
 */
function sanitize(input: string, maxLen: number): string {
  return input
    .replace(/[^\w\s\u0900-\u097F.,!?@()\-+]/g, '') // keep Devanagari + basic ASCII
    .trim()
    .slice(0, maxLen);
}

// ── Rate-limit store (in-memory, resets on cold start) ────────────────────
// For production replace with Redis / Upstash.

const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT   = 5;     // max requests per window per IP
const RATE_WINDOW  = 60_000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now   = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

// ── POST handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const ip     = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // ── Rate limiting ───────────────────────────────────────────────────────
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before sending another SOS alert.' },
      { status: 429, headers: { 'Retry-After': '60', ...corsHeaders(origin) } }
    );
  }

  // ── Body size guard ─────────────────────────────────────────────────────
  const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: 'Request body too large.' },
      { status: 413, headers: corsHeaders(origin) }
    );
  }

  try {
    const payload: SOSPayload = await req.json();
    const { location, contacts, timestamp, routeId } = payload;

    // ── Validate contacts ────────────────────────────────────────────────
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: 'Contacts must be a non-empty array.' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    // Basic contact validation
    for (const contact of contacts) {
      if (!contact?.name || !contact?.phone) {
        return NextResponse.json(
          { error: 'Each contact must have name and phone.' },
          { status: 400, headers: corsHeaders(origin) }
        );
      }
    }

    // ── Validate location ────────────────────────────────────────────────
    if (!location) {
      return NextResponse.json(
        { error: 'Missing required field: location.' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    if (typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return NextResponse.json(
        { error: 'Invalid location: lat and lng must be numbers.' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    // ── Sanitize userName ────────────────────────────────────────────────
    const rawName  = typeof payload.userName === 'string' ? payload.userName : 'User';
    const userName = sanitize(rawName, MAX_USERNAME_LEN) || 'User';

    // Limit number of contacts (prevent abuse)
    const limitedContacts = contacts.slice(0, MAX_CONTACTS);

    // ── Build SMS message ───────────────────────────────────────────────
    // FIX: use actual newlines in template literal (not escaped \n)
    // FIX: gender-neutral wording
    const mapsLink    = `https://maps.google.com/?q=${location.lat},${location.lng}`;
    const eventTime   = new Date(timestamp ?? Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const smsMessage  = [
      `🚨 SOS Alert from ${userName}!`,
      `📍 Location: ${mapsLink}`,
      `⏰ Time: ${eventTime}`,
      routeId ? `🗺️ Route: #${routeId}` : '',
      ``,
      `Sent via SafePath Indore. Respond immediately.`,
    ].filter(line => line !== undefined).join('\n');

    console.log('[SOS API] Dispatching alert...');
    console.log('[SOS API] User:',     userName);
    console.log('[SOS API] Location:', mapsLink);
    console.log('[SOS API] Contacts:', limitedContacts.map(c => `${c.name} (${c.phone})`).join(', '));

    // ── OMNICHANNEL SOS DISPATCH (Concurrent) ───────────────────────────────
    // We run Telegram and Brevo concurrently to ensure maximum speed and reliability.
    // If one fails, it does not delay or block the other.
    const dispatchPromises: Promise<any>[] = [];

    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      const tgText = `🚨 *SOS Alert from ${userName}!*\n\n📍 [View Location on Map](${mapsLink})\n⏰ Time: ${eventTime}\n${routeId ? `🗺️ Route: #${routeId}\n` : ''}\n_Sent via SafePath Indore. Respond immediately._`;
      
      const tgPromise = fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: tgText,
          parse_mode: 'Markdown',
          disable_web_page_preview: false,
        })
      }).then(res => {
        if (!res.ok) throw new Error(`Telegram returned ${res.status}`);
        console.log('[SOS API] ✓ Telegram Alert Sent');
      }).catch(err => console.error('[SOS API] ✗ Telegram Failed:', err));
      
      dispatchPromises.push(tgPromise);
    }

    if (process.env.BREVO_API_KEY && process.env.BREVO_ALERT_EMAIL) {
      const brevoHtml = `
        <div style="font-family: sans-serif; padding: 20px; border: 2px solid red; border-radius: 10px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: red;">🚨 URGENT: SOS ALERT</h2>
          <p><strong>${userName}</strong> has triggered an emergency alert!</p>
          <p><strong>Time:</strong> ${eventTime}</p>
          ${routeId ? `<p><strong>Route ID:</strong> ${routeId}</p>` : ''}
          <a href="${mapsLink}" style="display: inline-block; padding: 12px 20px; background: red; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">View Live Location</a>
          <hr style="margin-top: 25px; border: none; border-top: 1px solid #eee;" />
          <p style="color: #666; font-size: 12px;">This is an automated emergency dispatch from SafePath Indore.</p>
        </div>
      `;
      // Brevo requires the sender email to be verified on their dashboard.
      const senderEmail = process.env.BREVO_SENDER_EMAIL || 'alerts@safepath.indore.app';
      
      const brevoPromise = fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'SafePath SOS', email: senderEmail },
          to: [{ email: process.env.BREVO_ALERT_EMAIL, name: 'Emergency Contact' }],
          subject: `🚨 SOS Alert from ${userName}!`,
          htmlContent: brevoHtml
        })
      }).then(res => {
        if (!res.ok) throw new Error(`Brevo returned ${res.status}`);
        console.log('[SOS API] ✓ Brevo Email Sent');
      }).catch(err => console.error('[SOS API] ✗ Brevo Failed:', err));
      
      dispatchPromises.push(brevoPromise);
    }

    // Wait for all external API calls to complete concurrently
    if (dispatchPromises.length > 0) {
      await Promise.allSettled(dispatchPromises);
    }

    // ── Send SMS alerts ──────────────────────────────────────────────────
    const results: AlertResult[] = [];

    for (const contact of limitedContacts) {
      try {
        // ── OPTION A: Twilio SMS ────────────────────────────────────
        // Uncomment + npm install twilio
        //
        // const twilio = require('twilio');
        // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        // await client.messages.create({
        //   body: smsMessage,
        //   from: process.env.TWILIO_PHONE,
        //   to:   contact.phone,
        // });

        // ── OPTION B: Firebase Cloud Messaging ─────────────────────
        // Requires firebase-admin + FCM token stored per contact in Firestore
        //
        // const admin = require('firebase-admin');
        // if (!admin.apps.length) {
        //   admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)) });
        // }
        // const fcmToken = await getContactFCMToken(contact.phone); // implement in firebase.ts
        // await admin.messaging().send({
        //   token: fcmToken,
        //   notification: { title: '🚨 SOS Alert', body: smsMessage },
        //   data: { lat: String(location.lat), lng: String(location.lng) },
        // });

        // ── OPTION C: MSG91 (India-native, cheaper) ─────────────────
        // npm install msg91
        //
        // const msg91 = require('msg91');
        // msg91.initialize({ authkey: process.env.MSG91_AUTH_KEY });
        // await msg91.sendSMS({
        //   to:      contact.phone.replace('+91', ''),
        //   message: smsMessage,
        //   sender:  'SFPTH',
        // });

        // ── SIMULATION (delete this block once a real provider is added) ──
        await new Promise(r => setTimeout(r, 80));
        console.log(`[SOS API] ✓ Simulated → ${contact.name} (${contact.phone})\nMsg: ${smsMessage.substring(0, 20)}...`);
        results.push({ name: contact.name, phone: contact.phone, sent: true });

      } catch (err) {
        console.error(`[SOS API] ✗ Failed → ${contact.name}:`, err);
        results.push({ name: contact.name, phone: contact.phone, sent: false, error: String(err) });
      }
    }

    // FIX: cache .filter().length so we don't compute it twice
    const sentCount = results.filter(r => r.sent).length;
    const allSent   = sentCount === results.length;

    return NextResponse.json(
      {
        ok:      allSent,
        sent:    sentCount,
        total:   results.length,
        results,
        message: allSent
          ? `SOS alerts dispatched to ${results.length} contact${results.length !== 1 ? 's' : ''}`
          : `Partial dispatch: ${sentCount}/${results.length} contacts reached`,
      },
      { status: allSent ? 200 : 207, headers: corsHeaders(origin) } // 207 Multi-Status on partial
    );

  } catch (err) {
    console.error('[SOS API] Unhandled error:', err);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

// ── OPTIONS preflight (for CORS) ─────────────────────────────────────────

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

// ── GET health check (safe version) ─────────────────────────────────────
// FIX: no longer exposes env var names or provider configuration details

export async function GET() {
  const hasProvider =
    !!process.env.TWILIO_ACCOUNT_SID ||
    !!process.env.FIREBASE_SERVICE_ACCOUNT ||
    !!process.env.MSG91_AUTH_KEY;

  return NextResponse.json({
    status:    'ok',
    service:   'SafePath SOS API',
    version:   '2.0.0',
    mode:      hasProvider ? 'live' : 'simulation',
    rateLimit: `${RATE_LIMIT} requests / minute per IP`,
  });
}
