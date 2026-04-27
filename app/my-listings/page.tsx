'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getMyListings, deleteListing, createHousehold, getHousehold, joinHousehold } from '@/lib/api';
import { Listing } from '@/lib/types';
import ListingCard from '@/components/ListingCard';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Plus, BookMarked, Users, Copy, CheckCircle, LogIn, Home, Hash } from 'lucide-react';

interface Household {
  _id: string; listingId: string; ownerEmail: string;
  listingTitle: string; joinCode: string; members: string[];
}

function HouseholdCard({ listing, userEmail }: { listing: Listing; userEmail: string }) {
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getHousehold(listing._id).then(h => { setHousehold(h); setLoading(false); }).catch(() => setLoading(false));
  }, [listing._id]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const h = await createHousehold({ listingId: listing._id, ownerEmail: userEmail, listingTitle: listing.title });
      setHousehold(h);
      toast.success('Household created! Share the code with your roommates.');
    } catch { toast.error('Failed to create household'); }
    finally { setCreating(false); }
  };

  const copyCode = () => {
    if (!household?.joinCode) return;
    navigator.clipboard.writeText(household.joinCode);
    setCopied(true);
    toast.success('Join code copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) return (
    <div style={{ marginTop: 12, padding: 20, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)' }}>
      <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 36, width: '60%' }} />
    </div>
  );

  return (
    <div style={{ marginTop: 14, padding: '18px 20px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg)', borderLeft: '3px solid var(--accent)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Home size={14} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: 12, fontFamily: 'Syne,serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--accent)' }}>Household</span>
      </div>

      {household ? (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
            Share this 6-character code with your roommates so they can join this household.
          </p>
          {/* Join code display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 26, fontWeight: 700, letterSpacing: '0.28em', color: 'var(--accent)', background: 'var(--accent-light)', padding: '12px 22px', borderRadius: 10, border: '2px dashed var(--accent)', userSelect: 'all' }}>
              {household.joinCode}
            </div>
            <button onClick={copyCode} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 9, border: '1.5px solid var(--border)', background: copied ? 'var(--success-light)' : 'var(--bg-card)', color: copied ? 'var(--success)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Syne,serif' }}>
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy code'}
            </button>
          </div>
          {/* Members */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={13} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {household.members.length} member{household.members.length !== 1 ? 's' : ''} · {household.members.join(', ')}
            </span>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
            Create a household for this listing to generate a join code. Share it with prospective roommates so they can join.
          </p>
          <button onClick={handleCreate} disabled={creating} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 9, background: creating ? 'var(--border)' : 'var(--accent)', color: creating ? 'var(--text-muted)' : '#fff', border: 'none', cursor: creating ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Syne,serif', transition: 'all 0.15s' }}>
            <Hash size={14} />
            {creating ? 'Creating…' : 'Create Household & Get Code'}
          </button>
        </div>
      )}
    </div>
  );
}

function JoinHouseholdModal({ userEmail, onClose }: { userEmail: string; onClose: () => void }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (code.trim().length < 5) return toast.error('Please enter a valid 6-character code');
    setLoading(true);
    try {
      const res = await joinHousehold(code, userEmail);
      if (res.error) throw new Error(res.error);
      toast.success('Successfully joined the household!');
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Invalid code — please check and try again');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: 36, width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-xl)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogIn size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>Join a Household</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Enter the 6-character code from your roommate</p>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontFamily: 'Syne,serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Join Code</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="E.g. AB3X7K"
            maxLength={6}
            style={{ width: '100%', padding: '14px 18px', borderRadius: 10, border: '2px solid var(--border)', background: 'var(--bg)', fontSize: 22, fontFamily: 'Courier New, monospace', fontWeight: 700, letterSpacing: '0.25em', color: 'var(--accent)', textAlign: 'center', outline: 'none', transition: 'border-color 0.15s', textTransform: 'uppercase' }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>Codes are 6 characters, case-insensitive.</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-subtle)', fontSize: 14, fontWeight: 600, fontFamily: 'Syne,serif', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleJoin} disabled={loading || code.length < 5} style={{ flex: 2, padding: '12px', borderRadius: 10, background: loading || code.length < 5 ? 'var(--border)' : 'var(--accent)', color: loading || code.length < 5 ? 'var(--text-muted)' : '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'Syne,serif', border: 'none', cursor: loading || code.length < 5 ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
            {loading ? 'Joining…' : 'Join Household'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyListingsPage() {
  const { currentUser } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    if (!currentUser?.email) { setLoading(false); return; }
    getMyListings(currentUser.email).then((all: Listing[]) => {
      setListings(all.filter((l: Listing) => (l.userEmail || l.ownerEmail) === currentUser.email));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [currentUser]);

  if (!currentUser) return (
    <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Login required</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>You need to be logged in to view your listings.</p>
      <Link href="/login" style={{ padding: '12px 28px', borderRadius: 10, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontFamily: 'Syne,serif' }}>Log In</Link>
    </div>
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    try { await deleteListing(id); setListings(l => l.filter(x => x._id !== id)); toast.success('Listing deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 6 }}>My Listings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {listings.length} listing{listings.length !== 1 ? 's' : ''} posted · manage your rooms below
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowJoin(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'Syne,serif', fontSize: 14, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}>
            <LogIn size={15} /> Join via Code
          </button>
          <Link href="/add-listing" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 20px', borderRadius: 10, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontFamily: 'Syne,serif', fontSize: 14, transition: 'background 0.15s' }}>
            <Plus size={15} /> New Listing
          </Link>
        </div>
      </div>

      {/* Info banner about household codes */}
      <div style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--accent-light)', border: '1px solid var(--accent)', marginBottom: 36, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Hash size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', fontFamily: 'Syne,serif', marginBottom: 4 }}>Household Join Codes</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Each listing can have a <strong>household</strong> with a unique 6-character join code. Share it with prospective roommates — they paste the code on this page to instantly join your room group. You can also join someone else's household using the <em>Join via Code</em> button above.
          </p>
        </div>
      </div>

      {/* Listings */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px,1fr))', gap: 28 }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 420 }} />)}
        </div>
      ) : listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)' }}>
          <BookMarked size={48} style={{ color: 'var(--border-strong)', marginBottom: 16 }} />
          <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>No listings yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>Post your first room to start finding roommates.</p>
          <Link href="/add-listing" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 10, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontFamily: 'Syne,serif' }}>
            <Plus size={16} /> Post a Listing
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {listings.map(l => (
            <div key={l._id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
              {/* Listing card rendered inline */}
              <ListingCard listing={l} showActions onDelete={handleDelete} />
              {/* Household section below each listing */}
              <HouseholdCard listing={l} userEmail={currentUser.email!} />
            </div>
          ))}
        </div>
      )}

      {/* Join modal */}
      {showJoin && <JoinHouseholdModal userEmail={currentUser.email!} onClose={() => setShowJoin(false)} />}
    </div>
  );
}
