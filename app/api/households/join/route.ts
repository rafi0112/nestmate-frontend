import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://backend-dnyccxg4d-rafis-projects-f8e93781.vercel.app';

// POST /api/households/join — join a household with a code
export async function POST(req: NextRequest) {
  try {
    const { joinCode, userEmail, userUid } = await req.json();
    if (!joinCode || (!userEmail && !userUid)) return NextResponse.json({ error: 'joinCode and userEmail required' }, { status: 400 });

    try {
      const res = await fetch(`${API_BASE}/groups/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: joinCode.toUpperCase().trim(), userEmail, userUid: userUid || userEmail }),
      });
      if (res.ok) return NextResponse.json(await res.json());
      return NextResponse.json({ error: 'Failed to join household' }, { status: res.status });
    } catch { /* fall through */ }
    return NextResponse.json({ error: 'Failed to join household' }, { status: 500 });
  } catch {
    return NextResponse.json({ error: 'Failed to join household' }, { status: 500 });
  }
}
