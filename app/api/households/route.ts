import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://roommate-server-lime.vercel.app';

// Generate a 6-char alphanumeric join code
function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// GET /api/households?listingId=...  — get household for a listing
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get('listingId');
  if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 });

  try {
    const res = await fetch(`${API_BASE}/groups?listingId=${listingId}`, { cache: 'no-store' });
    if (!res.ok) return NextResponse.json(null);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(null);
  }
}

// POST /api/households — create a household with a join code for a listing
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { listingId, ownerUid, ownerEmail, ownerName, listingTitle, monthlyFee } = body;

    const joinCode = generateJoinCode();
    const payload = {
      name: listingTitle,
      listingId,
      listingTitle,
      monthlyFee: monthlyFee || 0,
      ownerUid: ownerUid || ownerEmail,
      ownerEmail,
      ownerName: ownerName || ownerEmail?.split('@')?.[0] || 'User',
      joinCode,
    };

    try {
      const res = await fetch(`${API_BASE}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
      return NextResponse.json({ error: 'Failed to create household' }, { status: res.status });
    } catch { /* backend unavailable */ }
    return NextResponse.json({ error: 'Failed to create household' }, { status: 500 });
  } catch {
    return NextResponse.json({ error: 'Failed to create household' }, { status: 500 });
  }
}
