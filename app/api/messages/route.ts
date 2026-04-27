import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://roommate-server-lime.vercel.app';

// GET /api/messages?userEmail=...  — fetch all conversations for a user
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userEmail = searchParams.get('userEmail');
  if (!userEmail) return NextResponse.json({ error: 'userEmail required' }, { status: 400 });

  try {
    const res = await fetch(`${API_BASE}/messages?userEmail=${encodeURIComponent(userEmail)}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch messages' }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/messages — create or update a conversation with a new message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fromEmail, toEmail, listingId, listingTitle, text } = body;

    if (!fromEmail || !toEmail || !text) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const payload = {
      fromEmail,
      toEmail,
      listingId,
      listingTitle,
      text,
      timestamp: new Date().toISOString(),
    };

    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return NextResponse.json({ error: 'Failed to send message' }, { status: res.status });

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
