// ─── Base URL ─────────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL || 'https://roommate-server-lime.vercel.app';

// Helper: safe fetch with fallback
async function apiFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, { cache: 'no-store', ...init });
  if (!res.ok) throw new Error(`API ${res.status}: ${url}`);
  return res.json();
}

// ─── Listings ────────────────────────────────────────────────────────────────
export const getListings  = ()          => apiFetch(`${API}/roommate`);
export const getMyListings = (userEmail: string) =>
  apiFetch(`${API}/roommate?userEmail=${encodeURIComponent(userEmail)}`).catch(() => []);
export const getListing   = (id: string)=> apiFetch(`${API}/roommate/${id}`);
export const createListing = (data: Record<string, unknown>) =>
  apiFetch(`${API}/roommate`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) })
    .then((res) => {
      if (res?._id && !res?.insertedId) return { ...res, insertedId: res._id };
      return res;
    });
export const updateListing = (id: string, data: Record<string, unknown>) =>
  apiFetch(`${API}/roommate/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
export const deleteListing = (id: string) =>
  apiFetch(`${API}/roommate/${id}`, { method:'DELETE' });

// ─── Messages ────────────────────────────────────────────────────────────────
export const getConversations = (userEmail: string) =>
  apiFetch(`${API}/messages?userEmail=${encodeURIComponent(userEmail)}`);

export const sendMessage = (payload: {
  fromEmail: string; toEmail: string; listingId: string; listingTitle: string; text: string; fromName?: string;
}) => apiFetch(`${API}/messages`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });

export const markMessageRead = (id: string) =>
  apiFetch(`${API}/messages/${id}/read`, { method:'PATCH' });

// ─── Households / Groups ────────────────────────────────────────────────────
export const getHousehold = (listingId: string) =>
  apiFetch(`${API}/groups?listingId=${encodeURIComponent(listingId)}`);

export const getHouseholdByMember = (memberEmail: string) =>
  apiFetch(`${API}/groups?memberEmail=${encodeURIComponent(memberEmail)}`);

export const getAllHouseholdsForMember = (memberEmail: string) =>
  apiFetch(`${API}/groups?memberEmail=${encodeURIComponent(memberEmail)}`);

// Fetch all households
export const getHouseholds = () => apiFetch(`${API}/groups`);

export const createHousehold = (payload: {
  listingId?: string; ownerUid?: string; ownerEmail: string; ownerName?: string; listingTitle: string; monthlyFee?: number;
}) => {
  const joinCode = Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
  return apiFetch(`${API}/groups`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      name: payload.listingTitle,
      listingId: payload.listingId || '',
      listingTitle: payload.listingTitle,
      monthlyFee: payload.monthlyFee || 0,
      ownerUid: payload.ownerUid || payload.ownerEmail,
      ownerEmail: payload.ownerEmail,
      ownerName: payload.ownerName || payload.ownerEmail.split('@')[0],
      joinCode,
    }),
  });
};

export const updateHousehold = (id: string, data: { monthlyFee?: number; listingTitle?: string; name?: string; settings?: Record<string, unknown> }) =>
  apiFetch(`${API}/groups/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ...data, name: data.name || data.listingTitle }) });

export const joinHousehold = (joinCode: string, userEmail: string, userUid?: string) =>
  apiFetch(`${API}/groups/join`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ joinCode, userEmail, userUid: userUid || userEmail }) });

// ─── Notifications ─────────────────────────────────────────────────────────
export type NotificationPayload = {
  householdId?: string;
  fromEmail?: string;
  toEmail?: string;
  type: string;
  title: string;
  message: string;
  read?: boolean;
};

export const getNotifications = (filters: { userEmail?: string; householdId?: string; type?: string } = {}) => {
  const params = new URLSearchParams();
  if (filters.userEmail) params.set('userEmail', filters.userEmail);
  if (filters.householdId) params.set('householdId', filters.householdId);
  if (filters.type) params.set('type', filters.type);
  const q = params.toString();
  return apiFetch(`${API}/notifications${q ? `?${q}` : ''}`).catch(() => []);
};

export const createNotification = (payload: NotificationPayload) =>
  apiFetch(`${API}/notifications`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })
    .catch(() => null);

// ─── Ledger ──────────────────────────────────────────────────────────────────
export const getLedger = (householdId: string) =>
  apiFetch(`${API}/ledger?householdId=${householdId}`);

export const addLedgerEntry = (entry: {
  householdId: string; item: string; amount: number; date: string; paidBy: string;
}) => apiFetch(`${API}/ledger`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(entry) });

export const deleteLedgerEntry = (id: string) =>
  apiFetch(`${API}/ledger/${id}`, { method:'DELETE' });

// ─── Meals ───────────────────────────────────────────────────────────────────
export const getMeals = (householdId: string, userEmail?: string) => {
  const q = userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : '';
  return apiFetch(`${API}/meals?householdId=${householdId}${q}`);
};

export const upsertMeal = (entry: {
  householdId: string; userEmail: string; date: string; meals: number; guests: number;
}) => apiFetch(`${API}/meals`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(entry) });

// ─── Payments ────────────────────────────────────────────────────────────────
export const getPayments = (householdId: string) =>
  apiFetch(`${API}/payments?householdId=${householdId}`);

export const createPayment = (payment: {
  householdId: string; fromEmail: string; toEmail?: string; amount: number; note?: string;
}) => apiFetch(`${API}/payments`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payment) });

// ─── Room Chat ───────────────────────────────────────────────────────────────
export const getRoomChat = (householdId: string, since?: string) => {
  const q = since ? `&since=${encodeURIComponent(since)}` : '';
  return apiFetch(`${API}/room-chat?householdId=${householdId}${q}`);
};

export const sendRoomChat = (msg: {
  householdId: string; senderEmail: string; senderName: string; text: string; replyTo?: string;
}) => apiFetch(`${API}/room-chat`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(msg) });

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const getReviews = (limit = 30) =>
  apiFetch(`${API}/reviews?limit=${limit}`);

export const createReview = (review: {
  authorEmail: string; authorName: string; houseName: string; text: string; rating: number;
}) => apiFetch(`${API}/reviews`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(review) });

// ─── Stats ───────────────────────────────────────────────────────────────────
export const getStats = () =>
  apiFetch(`${API}/stats`);
