// ── SafePath Offline AI Engine ───────────────────────────────────────────────
// Fully offline rule-based AI that analyzes situations and provides
// safety advice, emergency guidance, and smart suggestions.

export interface AIMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  suggestions?: string[];
  severity?: 'info' | 'warning' | 'danger' | 'success';
  timestamp: Date;
}

// ── Keyword Banks ─────────────────────────────────────────────────────────────
const KEYWORDS = {
  stalking: ['follow', 'following me', 'stalking', 'stalked', 'chasing', 'being followed', 'someone behind', 'watching me', 'man following'],
  harassment: ['harass', 'catcall', 'eve tease', 'teasing', 'inappropriate', 'uncomfortable', 'touched', 'grabbed', 'wolf whistle', 'staring'],
  danger: ['danger', 'dangerous', 'unsafe', 'threat', 'threatened', 'attack', 'attacked', 'assault', 'assaulted', 'violence', 'violent', 'help', 'scared', 'afraid', 'fear', 'emergency', 'sos', 'urgent'],
  lostAlone: ['lost', 'alone', 'dark', 'alone at night', 'stranded', 'stuck', 'no signal', 'no network', 'isolated', 'deserted', 'empty street', 'no one around'],
  nightTime: ['night', 'midnight', 'late night', 'late', 'dark road', 'dark area', 'after dark', '10pm', '11pm', '12am', '1am', '2am', '3am'],
  transport: ['auto', 'cab', 'taxi', 'rickshaw', 'uber', 'ola', 'bus', 'public transport', 'driver', 'route change', 'wrong route', 'detour'],
  accident: ['accident', 'crash', 'collision', 'injured', 'injury', 'hurt', 'bleeding', 'fell', 'fall'],
  home: ['home', 'reach home', 'safe', 'reached', 'safe now', 'all good', 'okay now', 'im fine', "i'm fine"],
  police: ['police', 'cops', 'call police', 'dial 100', 'report'],
  route: ['route', 'path', 'way', 'direction', 'navigate', 'shortest', 'safe route', 'safest'],
  guardian: ['guardian', 'share location', 'live location', 'contact', 'emergency contact', 'family', 'friend'],
  greeting: ['hi', 'hello', 'hey', 'hii', 'heyy', 'yo', 'sup', 'start', 'begin'],
  tip: ['tip', 'tips', 'advice', 'suggest', 'suggestion', 'how to', 'what should', 'what do', 'guide', 'help me'],
  vehicle: ['vehicle', 'car', 'bike', 'motorcycle', 'two-wheeler', 'suspicious car'],
  streetLight: ['no light', 'dark street', 'no lighting', 'poorly lit', 'unlit'],
  crowded: ['crowd', 'crowded', 'busy area', 'marketplace', 'mela', 'festival'],
  phone: ['battery low', 'low battery', 'phone dying', 'no charge', 'dead phone', 'power bank'],
};

type SituationKey = keyof typeof KEYWORDS;

// ── Detect situation from user message ───────────────────────────────────────
function detectSituation(msg: string): SituationKey[] {
  const lower = msg.toLowerCase();
  const matched: SituationKey[] = [];
  for (const [key, words] of Object.entries(KEYWORDS) as [SituationKey, string[]][]) {
    if (words.some(w => lower.includes(w))) {
      matched.push(key);
    }
  }
  return matched;
}

// ── Panic password detection ───────────────────────────────────────────────────
// User can type a secret word to silently trigger SOS
const PANIC_WORDS = ['pizza', 'order food', 'pizza please', 'send help', 'code red'];
export function isPanicPassword(msg: string): boolean {
  const lower = msg.toLowerCase().trim();
  return PANIC_WORDS.some(p => lower === p || lower.includes(p));
}

// ── Hindi detection ────────────────────────────────────────────────────────────
function isHindi(msg: string): boolean {
  const hindiWords = ['bachao', 'madad', 'namaste', 'karo', 'hun', 'raha', 'hai', 'raat', 'peeche', 'akela', 'akeli', 'dar'];
  const lower = msg.toLowerCase();
  return hindiWords.some(w => lower.includes(w));
}

// ── Response Database ─────────────────────────────────────────────────────────
interface BotResponse {
  text: string;
  suggestions: string[];
  severity: AIMessage['severity'];
}

function buildResponse(situations: SituationKey[], hour: number): BotResponse {
  const isNight = hour >= 21 || hour < 6;

  // Priority: danger > stalking > harassment > transport issues > general
  if (situations.includes('danger')) {
    return {
      text: "🚨 **Stay calm — you're not alone.** Here's what to do RIGHT NOW:\n\n1. **Move toward a public place** (shop, petrol pump, hospital)\n2. **Press SOS** in this app to alert your emergency contacts\n3. **Call 112** (national emergency) or **100** (police)\n4. Make noise — shout, use your phone speaker\n5. Share your live location via Guardian mode",
      suggestions: ['Activate SOS now', 'Call 112 emergency', 'Share live location', 'Find nearest safe place'],
      severity: 'danger',
    };
  }

  if (situations.includes('stalking')) {
    return {
      text: "⚠️ **If someone is following you:**\n\n• **Do NOT go home directly** — you don't want them knowing where you live\n• Enter a **busy shop or restaurant** and stay there\n• **Call someone** and stay on the line — pretend to talk loudly\n• If safe, take a photo/video of the person\n• **Change direction abruptly** — cross the road\n• Activate **Guardian Mode** so someone tracks you live\n• If threat escalates, call **100 (Police)**",
      suggestions: ['Enable Guardian mode', 'Call a contact', 'Find crowded place', 'Call Police 100'],
      severity: 'danger',
    };
  }

  if (situations.includes('harassment')) {
    return {
      text: "🛡️ **You don't have to tolerate this.** Here's how to respond:\n\n• **Assert yourself loudly** — 'Stop it! This is harassment!'\n• Attract attention from bystanders\n• **Move away** from the person immediately\n• Document it if safe (note time, location, description)\n• You can **file a complaint at the nearest police station** or via Dial 100\n• Reach out to a trusted guardian via the app",
      suggestions: ['Report the incident', 'Enable Guardian mode', 'Call 1091 (Women helpline)', 'Find safe place'],
      severity: 'warning',
    };
  }

  if (situations.includes('transport')) {
    return {
      text: "🚗 **Ride safety checklist:**\n\n• **Share the ride details** (driver name, vehicle number) with a contact\n• Enable **Guardian Mode** so your route is tracked live\n• If the driver takes an **unexpected route** — speak up immediately or ask them to stop at a busy area\n• Keep the emergency dial ready: **112**\n• Sit in the **back seat** for better visibility and exit options\n• Keep your phone charged and location sharing ON",
      suggestions: ['Share ride details', 'Enable live tracking', 'Check safe routes', 'Call emergency contact'],
      severity: 'warning',
    };
  }

  if (situations.includes('lostAlone')) {
    if (isNight) {
      return {
        text: "🌙 **Being alone at night in an unfamiliar area — let's fix this:**\n\n• **Stay in lit, visible areas** — avoid alleys and shortcuts\n• Turn on **location sharing** with a guardian RIGHT NOW\n• Call a trusted person and stay on the line\n• Look for 24/7 places: **petrol pumps, hospitals, police chowkis, dhabas**\n• Use the SafePath **Safe Route** feature to navigate\n• If you feel unsafe, **don't hesitate to call 112**",
        suggestions: ['Share live location', 'Find safe route', 'Call guardian', 'Locate nearest police'],
        severity: 'warning',
      };
    }
    return {
      text: "📍 **Feeling lost or alone? Here's what helps:**\n\n• Open the **Routes** page to find safe paths nearby\n• Enable **Guardian Mode** to share your live location\n• Look for landmarks and orient yourself\n• Stay on main roads with people around\n• Call a friend or family member to check in",
      suggestions: ['Find safe route', 'Enable live tracking', 'Share location with guardian'],
      severity: 'info',
    };
  }

  if (situations.includes('accident')) {
    return {
      text: "🩹 **In case of an accident:**\n\n• **Call 108** (Ambulance) immediately if someone is injured\n• Call **100** for police if needed\n• Do NOT move an injured person unless there's fire/water risk\n• Alert bystanders to help manage traffic\n• Share your exact location with emergency contacts via Guardian Mode\n• Stay calm and keep others calm",
      suggestions: ['Call 108 Ambulance', 'Call 100 Police', 'Share location', 'Activate SOS'],
      severity: 'danger',
    };
  }

  if (situations.includes('phone')) {
    return {
      text: "📱 **Low battery tips for safety:**\n\n• Enable **Guardian Mode NOW** before battery dies — your last location will be visible\n• Send your location to a trusted contact via WhatsApp/SMS\n• Switch to **Low Power Mode** to extend battery\n• Note down emergency numbers before the phone dies: 112, 100, 1091\n• Look for a shop/café to charge — most will help in emergencies",
      suggestions: ['Enable Guardian mode now', 'Send location via SMS', 'Activate SOS preset'],
      severity: 'warning',
    };
  }

  if (situations.includes('nightTime') || isNight) {
    return {
      text: `🌙 **Night safety tips for ${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}:**\n\n• Stick to **well-lit, busy roads** even if longer\n• Keep your phone charged and location sharing ON\n• Let someone know your **expected arrival time**\n• Avoid wearing earphones — stay alert to surroundings\n• Trust your instincts — if something feels off, **change direction**\n• Walk with **confidence** and purpose`,
      suggestions: ['Enable live tracking', 'Find lit safe routes', 'Set arrival alert'],
      severity: 'warning',
    };
  }

  if (situations.includes('home')) {
    return {
      text: "✅ **Great to hear you're safe!** A few good habits for next time:\n\n• Always let someone know when you leave and arrive\n• Keep Guardian Mode active during journeys\n• Share route with emergency contacts for late-night trips\n• Consider adding more trusted guardians in Settings\n\nStay safe! 💙",
      suggestions: ['Add guardians', 'Review safe routes', 'Check SOS contacts'],
      severity: 'success',
    };
  }

  if (situations.includes('route')) {
    return {
      text: "🗺️ **Safe route tips:**\n\n• Use the **Routes** section to compare paths by safety score\n• Prefer routes with higher CCTV coverage and patrols\n• Avoid isolated roads especially after dark\n• Community reports on the Home page show recent incidents by area\n• Always share your active route with a guardian",
      suggestions: ['View safe routes', 'Enable live tracking', 'Check community reports'],
      severity: 'info',
    };
  }

  if (situations.includes('guardian')) {
    return {
      text: "👁️ **Guardian Mode — your safety net:**\n\n• Go to **Guardian View** to share your live location\n• Select trusted contacts who'll track your journey in real-time\n• They'll be alerted automatically if you trigger SOS\n• You can set a journey time — they'll be notified if you don't arrive\n• Works best when set up BEFORE you travel",
      suggestions: ['Open Guardian mode', 'Add emergency contacts', 'Start live journey'],
      severity: 'info',
    };
  }

  if (situations.includes('tip')) {
    const tips = [
      "💡 **Share your live location** before every solo trip — it takes 5 seconds and can save your life.",
      "💡 **Trust your gut** — if a place or person feels wrong, leave without explanation.",
      "💡 **Have 3 emergency contacts** saved on speed dial. Save **112** and **100** as well.",
      "💡 **Avoid shortcuts through dark alleys** at night, even if they're faster.",
      "💡 **In a rideshare?** Share vehicle number + driver photo with someone before moving.",
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    return {
      text: randomTip + "\n\nAsk me anything like: 'I'm being followed', 'I feel unsafe at night', 'my ride changed route', or 'what should I do alone at night'.",
      suggestions: ['Being followed', 'Unsafe at night', 'Ride safety', 'I need help'],
      severity: 'info',
    };
  }

  if (situations.includes('greeting')) {
    return {
      text: "👋 **Hi! I'm Rio — your offline safety assistant.**\n\nI'm here 24/7 to help with safety situations. Tell me what's happening and I'll give you immediate, practical advice.\n\nYou can ask me things like:\n• 'I think someone is following me'\n• 'I'm alone at night and feel unsafe'\n• 'My cab driver changed the route'\n• 'Give me safety tips'",
      suggestions: ['I feel unsafe', 'Being followed', 'Night safety tips', 'My cab changed route'],
      severity: 'info',
    };
  }

  if (situations.includes('streetLight')) {
    return {
      text: "🔦 **Poorly lit area safety:**\n\n• Use your phone torch to stay visible\n• Prefer the **middle of the road** over dark sidewalks if it's safer\n• Move toward any lit shop, petrol pump, or populated area\n• Let someone know your location\n• SafePath community reports can help identify safer lit routes nearby",
      suggestions: ['Find lit safe routes', 'Share location', 'Report poor lighting'],
      severity: 'warning',
    };
  }

  if (situations.includes('police')) {
    return {
      text: "👮 **Police & emergency contacts:**\n\n• **112** — National Emergency (works even with no SIM balance)\n• **100** — Police\n• **108** — Ambulance\n• **1091** — Women's Helpline (24/7)\n• **181** — Women helpline (many states)\n• **1098** — Child helpline\n\nYou can also use SafePath SOS to alert your personal emergency contacts instantly.",
      suggestions: ['Call 112 now', 'Activate SOS', 'Share location'],
      severity: 'info',
    };
  }

  // ── Default fallback ──────────────────────────────────────────────────────
  const hour12 = hour % 12 || 12;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const timeRisk = hour >= 22 || hour < 5 ? 'HIGH' : hour >= 19 ? 'MODERATE' : 'LOW';
  const riskEmoji = timeRisk === 'HIGH' ? '🔴' : timeRisk === 'MODERATE' ? '🟡' : '🟢';

  return {
    text: `🤖 Current time risk: ${riskEmoji} **${timeRisk}** (${hour12}:00 ${ampm})\n\nI'm your offline safety assistant. Tell me your situation and I'll give you specific advice.\n\n**Examples:**\n• "I'm being followed"\n• "I'm alone at night"\n• "My cab changed route"\n• "I'm feeling unsafe"\n• "Give me safety tips"`,
    suggestions: ['I feel unsafe', 'Being followed', 'Night safety tips', 'Emergency numbers'],
    severity: 'info',
  };
}

// ── Main Offline AI function ───────────────────────────────────────────────────────────
export function getOfflineAIResponse(userMessage: string): AIMessage {
  // Panic password check — silently trigger SOS
  if (isPanicPassword(userMessage)) {
    return {
      id: Date.now().toString(),
      role: 'bot',
      text: '🔴 **Panic code received.** Silently alerting your emergency contacts now. Stay calm, act normal. Help is coming. 💙',
      suggestions: ['Stay calm', 'Move to public area', 'Keep phone on'],
      severity: 'danger',
      timestamp: new Date(),
    };
  }

  // Hindi response
  if (isHindi(userMessage)) {
    const situations = detectSituation(userMessage);
    const isDanger = situations.some(s => ['hindiDanger', 'hindiStalking', 'danger', 'stalking'].includes(s));
    if (isDanger) {
      return {
        id: Date.now().toString(),
        role: 'bot',
        text: '🚨 **Ghabraiye mat — Rio yahaan hai!**\n\nAbhi ye karein:\n• **Bheed wali jagah jaiye** — dukaan, hospital, petrol pump\n• **112 dial karein** (national emergency)\n• SafePath mein **SOS dabaaiye** — aapke contacts ko alert milega\n• Kisi se phone pe baat karte rahiye\n• **Guardian Mode on karein** — location share hogi',
        suggestions: ['SOS activate karein', '112 call karein', 'Location share karein'],
        severity: 'danger',
        timestamp: new Date(),
      };
    }
    return {
      id: Date.now().toString(),
      role: 'bot',
      text: '👮 **Namaste! Main Rio hun.**\n\nMain aapki safety mein madad karunga. Apni situation bataaiye:\n• "Koi peeche aa raha hai"\n• "Raat ko akeli hun"\n• "Cab driver route badal raha hai"\n• "Darr lag raha hai"',
      suggestions: ['Koi peeche hai', 'Raat ko akeli hun', 'Emergency numbers', 'I feel unsafe'],
      severity: 'info',
      timestamp: new Date(),
    };
  }

  const situations = detectSituation(userMessage);
  const hour = new Date().getHours();
  const response = buildResponse(situations, hour);

  return {
    id: Date.now().toString(),
    role: 'bot',
    text: response.text,
    suggestions: response.suggestions,
    severity: response.severity,
    timestamp: new Date(),
  };
}

// ── Hybrid AI function (Online + Offline Fallback) ───────────────────────────
export async function getHybridAIResponse(userMessage: string): Promise<AIMessage> {
  // 1. If navigator is defined and offline, skip API immediately
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return getOfflineAIResponse(userMessage);
  }

  // Also instantly fallback if it's a panic password (no latency allowed for emergencies)
  if (isPanicPassword(userMessage)) {
    return getOfflineAIResponse(userMessage);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4-second max wait

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage }),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) throw new Error("API Failed");
    
    const data = await response.json();
    return {
      id: Date.now().toString(),
      role: 'bot',
      text: data.reply,
      severity: data.severity || 'info',
      suggestions: data.suggestions || [],
      timestamp: new Date()
    };
  } catch (error) {
    console.warn("API unavailable or timed out. Falling back to offline bot.");
    return getOfflineAIResponse(userMessage);
  }
}

// ── Welcome message ───────────────────────────────────────────────────────────
export function getWelcomeMessage(): AIMessage {
  const hour = new Date().getHours();
  const isNight = hour >= 21 || hour < 6;
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return {
    id: 'welcome',
    role: 'bot',
    text: `${isNight ? '🌙' : '👋'} **${greeting}! I'm Rio 👮**\n\nI work completely **offline** and I'm here to help with safety situations, emergency guidance, and smart suggestions.\n\nDescribe your situation or tap a quick option below:`,
    suggestions: ['I feel unsafe', 'Being followed', 'Night safety tips', 'Emergency numbers'],
    severity: 'info',
    timestamp: new Date(),
  };
}
