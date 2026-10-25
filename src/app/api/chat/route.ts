import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Empty message' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
      return NextResponse.json({ error: 'No API Key' }, { status: 503 });
    }

    // 8-second timeout — if Google is unreachable, fail fast so offline bot kicks in
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are Rio, a concise safety assistant for SafePath PWA.
Help users in dangerous/anxious situations. Keep responses SHORT and ACTIONABLE.
If the user is in danger, tell them to use the SOS button or call emergency services (112 or 100 in India).
Return ONLY valid JSON matching:
{"reply":"markdown text","suggestions":["3-4 quick actions"],"severity":"info"|"warning"|"danger"|"success"}
User message: ${message}`
              }]
            }],
            generationConfig: { responseMimeType: 'application/json' }
          }),
        }
      );
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      // Network error or timeout — let frontend use offline bot
      console.warn('[Chat API] Network error, falling back:', fetchErr?.message);
      return NextResponse.json({ error: 'Network unavailable' }, { status: 503 });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      console.warn('[Chat API] Gemini returned', response.status);
      return NextResponse.json({ error: 'Gemini API Error' }, { status: 503 });
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return NextResponse.json({ error: 'Empty Gemini response' }, { status: 503 });
    }

    const parsed = JSON.parse(candidateText);
    return NextResponse.json({
      reply: parsed.reply || 'Stay safe!',
      suggestions: parsed.suggestions || [],
      severity: parsed.severity || 'info',
    });

  } catch (error) {
    console.error('[Chat API] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 503 });
  }
}
