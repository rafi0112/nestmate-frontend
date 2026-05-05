'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { BarChart2, BookMarked, CheckCircle, Edit2, Heart, Home, LogOut, Mail, PlusCircle, Save, ShieldCheck, Sparkles, UserRound, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getHouseholdByMember, getListings } from '@/lib/api';
import { Listing } from '@/lib/types';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1.5px solid var(--border)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color .15s, box-shadow .15s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
  marginBottom: 7,
};

const chartColors = ['var(--accent)', 'var(--accent-2)', 'var(--success)', 'var(--gold)', 'var(--danger)'];

interface Household {
  _id: string;
  listingId?: string;
  listingTitle: string;
  joinCode: string;
  members?: string[];
  memberUids?: string[];
  monthlyFee?: number;
  ownerEmail?: string;
}

function getInitials(name?: string | null, email?: string | null) {
  return (name || email || 'U')
    .split(/[ @._-]+/)
    .filter(Boolean)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getHouseholdMembers(household: Household | null | undefined) {
  return household?.memberUids ?? household?.members ?? [];
}

function normalizeHouseholds(data: unknown): Household[] {
  if (Array.isArray(data)) return data as Household[];
  if (data && typeof data === 'object') return [data as Household];
  return [];
}

export default function ProfilePage() {
  const { currentUser, logout, updateProfile } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeHousehold, setActiveHousehold] = useState<Household | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setName(currentUser?.displayName || '');
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [currentUser?.displayName]);

  useEffect(() => {
    const email = currentUser?.email;
    if (!email) return;

    let mounted = true;
    getListings()
      .then(all => {
        if (!mounted) return;
        setListings(all.filter((listing: Listing) => listing.userEmail === email || listing.ownerEmail === email));
      })
      .catch(() => {
        if (mounted) toast.error('Could not load your listings');
      })
      .finally(() => {
        if (mounted) setLoadingListings(false);
      });

    return () => { mounted = false; };
  }, [currentUser?.email]);

  useEffect(() => {
    const email = currentUser?.email;
    if (!email) return;

    let mounted = true;
    getHouseholdByMember(email)
      .then(data => {
        if (!mounted) return;
        const households = normalizeHouseholds(data);
        const active = households.find(household => getHouseholdMembers(household).length > 1) || null;
        setActiveHousehold(active);
      })
      .catch(() => {
        if (mounted) setActiveHousehold(null);
      });

    return () => { mounted = false; };
  }, [currentUser?.email]);

  const profileStats = useMemo(() => {
    const totalLikes = listings.reduce((sum, listing) => sum + (listing.likes?.length || 0), 0);
    const available = listings.filter(listing => listing.availability === 'Available').length;
    const soon = listings.filter(listing => listing.availability === 'Soon').length;
    const hidden = listings.filter(listing => listing.visibility === 'hidden').length;
    return { totalLikes, available, soon, hidden };
  }, [listings]);

  const availabilityGraph = useMemo(() => {
    const groups = [
      { label: 'Available', value: profileStats.available, color: 'var(--success)' },
      { label: 'Soon', value: profileStats.soon, color: 'var(--accent-2)' },
      { label: 'Other', value: Math.max(listings.length - profileStats.available - profileStats.soon, 0), color: 'var(--gold)' },
    ];
    const max = Math.max(...groups.map(group => group.value), 1);
    return groups.map(group => ({ ...group, width: `${Math.max((group.value / max) * 100, group.value ? 16 : 4)}%` }));
  }, [listings.length, profileStats.available, profileStats.soon]);

  const engagementGraph = useMemo(() => {
    const topListings = [...listings]
      .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
      .slice(0, 5);
    const maxLikes = Math.max(...topListings.map(listing => listing.likes?.length || 0), 1);
    return topListings.map((listing, index) => ({
      id: listing._id,
      title: listing.title || 'Untitled listing',
      likes: listing.likes?.length || 0,
      color: chartColors[index % chartColors.length],
      height: `${Math.max(((listing.likes?.length || 0) / maxLikes) * 100, 10)}%`,
    }));
  }, [listings]);

  const recentListings = useMemo(() => {
    return [...listings]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
      .slice(0, 3);
  }, [listings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ displayName: name.trim() });
      toast.success('Profile updated');
      setEditing(false);
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div style={{ maxWidth: 520, margin: '100px auto', textAlign: 'center', padding: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: 18, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <UserRound size={32} />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}>Sign in to view your profile</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Manage your listings, room activity, and account details.</p>
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 28px', borderRadius: 10, background: 'var(--accent)', color: '#fff', fontWeight: 700 }}>
          Sign In
        </Link>
      </div>
    );
  }

  const initials = getInitials(currentUser.displayName, currentUser.email);
  const activeHouseholdMembers = getHouseholdMembers(activeHousehold);

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div>
          <div className="profile-kicker"><Sparkles size={14} /> Account dashboard</div>
          <h1>My Profile</h1>
          <p>Keep your roommate profile polished, track listing interest, and jump into your household tools.</p>
        </div>
        <div className="profile-hero-actions">
          <Link href="/add-listing"><PlusCircle size={16} /> Post Room</Link>
          <Link href="/my-listings"><BookMarked size={16} /> My Listings</Link>
        </div>
      </section>

      <div className="profile-layout">
        <aside className="profile-card">
          <div className="profile-avatar-wrap">
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt={currentUser.displayName || 'Profile'} className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar">{initials}</div>
            )}
            <span className="profile-status"><CheckCircle size={13} /> Active</span>
          </div>

          {editing ? (
            <div className="profile-edit-block">
              <label style={labelStyle}>Display Name</label>
              <input
                value={name}
                onChange={event => setName(event.target.value)}
                style={inputStyle}
                placeholder="Your name"
                onFocus={event => (event.target.style.borderColor = 'var(--accent)')}
                onBlur={event => (event.target.style.borderColor = 'var(--border)')}
              />
              <div className="profile-edit-actions">
                <button onClick={handleSave} disabled={saving}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => { setName(currentUser.displayName || ''); setEditing(false); }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="profile-identity">
              <h2>{currentUser.displayName || 'Anonymous'}</h2>
              <p><Mail size={14} /> {currentUser.email}</p>
              <button onClick={() => setEditing(true)}><Edit2 size={14} /> Edit profile</button>
            </div>
          )}

          <div className="profile-mini-stats">
            <div><BookMarked size={16} /><strong>{listings.length}</strong><span>Listings</span></div>
            <div><Heart size={16} /><strong>{profileStats.totalLikes}</strong><span>Likes</span></div>
          </div>

          <div className="profile-actions">
            <Link href="/household"><Home size={15} /> My Household</Link>
            <button onClick={logout}><LogOut size={15} /> Sign Out</button>
          </div>
        </aside>

        <main className="profile-main">
          <div className="profile-stat-grid">
            {[
              { label: 'Live listings', value: profileStats.available, icon: BookMarked, color: 'var(--success)' },
              { label: 'Total likes', value: profileStats.totalLikes, icon: Heart, color: 'var(--danger)' },
              { label: 'Coming soon', value: profileStats.soon, icon: BarChart2, color: 'var(--accent-2)' },
              { label: 'Profile status', value: 'Ready', icon: ShieldCheck, color: 'var(--accent)' },
            ].map(item => (
              <div className="profile-stat" key={item.label} style={{ ['--stat-color' as string]: item.color }}>
                <div><item.icon size={18} /></div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>

          <section className="profile-panel">
            <div className="profile-panel-head">
              <div>
                <h3>Listing Performance</h3>
                <p>Colorful snapshot from your current listings.</p>
              </div>
              <span>{loadingListings ? 'Syncing' : `${listings.length} listings`}</span>
            </div>

            <div className="profile-graph-grid">
              <div className="profile-bar-panel">
                <h4>Availability Mix</h4>
                {availabilityGraph.map(group => (
                  <div className="profile-horizontal-row" key={group.label}>
                    <div className="profile-row-label"><span>{group.label}</span><strong>{group.value}</strong></div>
                    <div className="profile-track">
                      <div style={{ width: group.width, background: group.color }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="profile-column-panel">
                <h4>Top Listing Likes</h4>
                <div className="profile-columns">
                  {engagementGraph.length > 0 ? engagementGraph.map(item => (
                    <Link href={`/listings/${item.id}`} className="profile-column" key={item.id} title={item.title}>
                      <span>{item.likes}</span>
                      <div style={{ height: item.height, background: item.color }} />
                      <small>{item.title}</small>
                    </Link>
                  )) : (
                    <div className="profile-empty-graph">No likes yet</div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="profile-panel">
            <div className="profile-panel-head">
              <div>
                <h3>Active Household</h3>
                <p>Your shared household appears here after another member joins.</p>
              </div>
              <Link href="/household">Open household</Link>
            </div>

            {activeHousehold ? (
              <Link href="/household" className="profile-household-card">
                <div className="profile-household-icon"><Users size={24} /></div>
                <div>
                  <div className="active-household-badge"><CheckCircle size={13} /> Active</div>
                  <h4>{activeHousehold.listingTitle || 'Household'}</h4>
                  <p>{activeHouseholdMembers.length} members joined</p>
                </div>
                <div className="profile-household-code">
                  <span>Join code</span>
                  <strong>{activeHousehold.joinCode}</strong>
                </div>
              </Link>
            ) : (
              <div className="profile-empty-state">
                <Users size={28} />
                <h4>No active household yet</h4>
                <p>A household becomes active when it has more than one member.</p>
                <Link href="/household">Open household hub</Link>
              </div>
            )}
          </section>

          {/* <section className="profile-panel">
            <div className="profile-panel-head">
              <div>
                <h3>Recent Listings</h3>
                <p>Your latest rooms and roommate posts.</p>
              </div>
              <Link href="/my-listings">View all</Link>
            </div>

            <div className="profile-listing-grid">
              {recentListings.length > 0 ? recentListings.map(listing => (
                <Link href={`/listings/${listing._id}`} className="profile-listing-card" key={listing._id}>
                  <div>
                    <span>{listing.availability || 'Listing'}</span>
                    <h4>{listing.title}</h4>
                    <p>{listing.location}</p>
                  </div>
                  <strong>৳{Number(listing.rentAmount || 0).toLocaleString()}</strong>
                </Link>
              )) : (
                <div className="profile-empty-state">
                  <BookMarked size={28} />
                  <h4>No listings yet</h4>
                  <p>Post a room to start collecting interest and analytics here.</p>
                  <Link href="/add-listing">Post your first room</Link>
                </div>
              )}
            </div>
          </section> */}
        </main>
      </div>

      <style>{`
        .profile-page {
          max-width: 1180px;
          margin: 0 auto;
          padding: 36px 24px 80px;
        }

        .profile-hero {
          min-height: 210px;
          border-radius: 24px;
          padding: clamp(24px, 4vw, 40px);
          margin-bottom: 24px;
          color: #fff;
          background:
            linear-gradient(135deg, rgba(15, 53, 84, .98), rgba(17, 122, 101, .88)),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, .2), transparent 28%);
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }

        .profile-kicker {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,.14);
          border: 1px solid rgba(255,255,255,.24);
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .08em;
          margin-bottom: 14px;
        }

        .profile-hero h1 {
          color: #fff;
          font-size: clamp(32px, 7vw, 54px);
          font-weight: 900;
          margin-bottom: 8px;
        }

        .profile-hero p {
          max-width: 560px;
          color: rgba(255,255,255,.82);
          font-size: 15px;
        }

        .profile-hero-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .profile-hero-actions a,
        .profile-actions a,
        .profile-actions button,
        .profile-edit-actions button,
        .profile-identity button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 12px;
          font-weight: 800;
          border: 0;
          cursor: pointer;
          transition: transform .15s, box-shadow .15s, background .15s;
        }

        .profile-hero-actions a {
          padding: 11px 16px;
          background: rgba(255,255,255,.16);
          border: 1px solid rgba(255,255,255,.26);
          color: #fff;
          backdrop-filter: blur(10px);
        }

        .profile-hero-actions a:hover,
        .profile-actions a:hover,
        .profile-actions button:hover,
        .profile-edit-actions button:hover,
        .profile-identity button:hover,
        .profile-listing-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .profile-layout {
          display: grid;
          grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
          gap: 24px;
          align-items: start;
        }

        .profile-card,
        .profile-panel,
        .profile-stat {
          background: var(--bg-card);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
        }

        .profile-card {
          position: sticky;
          top: 86px;
          border-radius: 22px;
          padding: 28px;
          text-align: center;
        }

        .profile-avatar-wrap {
          position: relative;
          width: 116px;
          margin: 0 auto 22px;
        }

        .profile-avatar,
        .profile-avatar-img {
          width: 112px;
          height: 112px;
          border-radius: 30px;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: 900;
          box-shadow: 0 18px 36px rgba(15, 53, 84, .24);
          object-fit: cover;
        }

        .profile-status {
          position: absolute;
          right: -12px;
          bottom: -8px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          border-radius: 999px;
          background: var(--success-light);
          color: var(--success);
          border: 1px solid var(--success);
          font-size: 11px;
          font-weight: 800;
        }

        .profile-identity h2 {
          font-size: 24px;
          margin-bottom: 6px;
        }

        .profile-identity p {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          color: var(--text-muted);
          font-size: 13px;
          margin-bottom: 18px;
          word-break: break-word;
        }

        .profile-identity button {
          padding: 10px 16px;
          background: var(--bg-subtle);
          color: var(--text-primary);
          border: 1.5px solid var(--border);
          margin-bottom: 20px;
        }

        .profile-edit-block {
          text-align: left;
          margin-bottom: 20px;
        }

        .profile-edit-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 12px;
        }

        .profile-edit-actions button {
          padding: 11px;
          background: var(--bg-subtle);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }

        .profile-edit-actions button:first-child {
          background: var(--accent);
          color: #fff;
          border-color: var(--accent);
        }

        .profile-mini-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin: 22px 0;
        }

        .profile-mini-stats div {
          padding: 14px 10px;
          background: var(--bg-subtle);
          border: 1px solid var(--border);
          border-radius: 14px;
        }

        .profile-mini-stats svg {
          color: var(--accent);
          margin-bottom: 5px;
        }

        .profile-mini-stats strong {
          display: block;
          font-size: 22px;
        }

        .profile-mini-stats span {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: .06em;
          font-weight: 800;
        }

        .profile-actions {
          display: grid;
          gap: 10px;
        }

        .profile-actions a,
        .profile-actions button {
          padding: 12px;
          border: 1.5px solid var(--border);
          background: var(--bg-subtle);
          color: var(--text-primary);
        }

        .profile-actions a:first-child {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
        }

        .profile-actions button {
          color: var(--danger);
        }

        .profile-main {
          display: grid;
          gap: 20px;
          min-width: 0;
        }

        .profile-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .profile-stat {
          border-radius: 18px;
          padding: 18px;
          border-left: 4px solid var(--stat-color);
          transition: transform .15s, box-shadow .15s;
        }

        .profile-stat:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .profile-stat div {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: color-mix(in srgb, var(--stat-color) 14%, var(--bg-card));
          color: var(--stat-color);
          margin-bottom: 16px;
        }

        .profile-stat span {
          display: block;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .06em;
          margin-bottom: 4px;
        }

        .profile-stat strong {
          font-size: 24px;
          color: var(--text-primary);
        }

        .profile-panel {
          border-radius: 22px;
          padding: clamp(18px, 3vw, 24px);
        }

        .profile-panel-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 22px;
        }

        .profile-panel-head h3 {
          font-size: 20px;
          margin-bottom: 4px;
        }

        .profile-panel-head p {
          color: var(--text-secondary);
          font-size: 13px;
        }

        .profile-panel-head span,
        .profile-panel-head a {
          flex-shrink: 0;
          padding: 7px 11px;
          border-radius: 999px;
          background: var(--accent-light);
          color: var(--accent);
          font-size: 12px;
          font-weight: 800;
        }

        .profile-graph-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(260px, .9fr);
          gap: 20px;
        }

        .profile-bar-panel,
        .profile-column-panel {
          min-width: 0;
          border-radius: 18px;
          background: var(--bg-subtle);
          border: 1px solid var(--border);
          padding: 18px;
        }

        .profile-bar-panel h4,
        .profile-column-panel h4 {
          font-size: 14px;
          margin-bottom: 16px;
          color: var(--text-primary);
        }

        .profile-horizontal-row {
          margin-bottom: 16px;
        }

        .profile-row-label {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 7px;
          font-weight: 800;
        }

        .profile-track {
          height: 12px;
          overflow: hidden;
          border-radius: 999px;
          background: var(--bg-card);
          border: 1px solid var(--border);
        }

        .profile-track div {
          height: 100%;
          border-radius: inherit;
          transition: width .4s ease;
        }

        .profile-columns {
          height: 210px;
          display: flex;
          align-items: end;
          gap: 12px;
          overflow: hidden;
        }

        .profile-column {
          flex: 1;
          min-width: 42px;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: end;
          gap: 8px;
          color: var(--text-secondary);
        }

        .profile-column span {
          font-weight: 900;
          font-size: 13px;
          color: var(--text-primary);
        }

        .profile-column div {
          width: 100%;
          max-width: 54px;
          min-height: 10px;
          border-radius: 12px 12px 5px 5px;
          box-shadow: var(--shadow-xs);
        }

        .profile-column small {
          width: 100%;
          min-height: 30px;
          color: var(--text-muted);
          font-size: 10px;
          line-height: 1.2;
          text-align: center;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .profile-empty-graph,
        .profile-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: var(--text-muted);
          border: 1px dashed var(--border-strong);
          border-radius: 16px;
          background: var(--bg-card);
        }

        .profile-empty-graph {
          width: 100%;
          height: 100%;
          min-height: 160px;
        }

        .profile-listing-grid {
          display: grid;
          gap: 12px;
        }

        .profile-household-card {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 16px;
          align-items: center;
          padding: 18px;
          border-radius: 18px;
          background: linear-gradient(135deg, var(--accent-light), var(--bg-subtle));
          border: 1.5px solid var(--accent);
          transition: transform .15s, box-shadow .15s;
        }

        .profile-household-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .profile-household-icon {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent);
          color: #fff;
          box-shadow: var(--shadow-sm);
        }

        .active-household-badge {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 999px;
          background: var(--success-light);
          color: var(--success);
          border: 1px solid var(--success);
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .06em;
          margin-bottom: 8px;
        }

        .profile-household-card h4 {
          font-size: 17px;
          margin-bottom: 3px;
        }

        .profile-household-card p {
          color: var(--text-secondary);
          font-size: 13px;
        }

        .profile-household-code {
          text-align: right;
          min-width: 112px;
        }

        .profile-household-code span {
          display: block;
          color: var(--text-muted);
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .08em;
          margin-bottom: 5px;
        }

        .profile-household-code strong {
          display: inline-block;
          padding: 8px 10px;
          border-radius: 10px;
          background: var(--bg-card);
          border: 1px dashed var(--accent);
          color: var(--accent);
          letter-spacing: .16em;
          font-family: Courier New, monospace;
        }

        .profile-listing-card {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          padding: 16px;
          border-radius: 16px;
          background: var(--bg-subtle);
          border: 1px solid var(--border);
          transition: transform .15s, box-shadow .15s, border-color .15s;
        }

        .profile-listing-card:hover {
          border-color: var(--accent);
        }

        .profile-listing-card span {
          display: inline-flex;
          padding: 4px 9px;
          border-radius: 999px;
          background: var(--accent-light);
          color: var(--accent);
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .06em;
          margin-bottom: 8px;
        }

        .profile-listing-card h4 {
          font-size: 15px;
          margin-bottom: 3px;
        }

        .profile-listing-card p {
          color: var(--text-muted);
          font-size: 12px;
        }

        .profile-listing-card strong {
          color: var(--accent);
          white-space: nowrap;
        }

        .profile-empty-state {
          padding: 34px 20px;
        }

        .profile-empty-state h4 {
          margin: 10px 0 4px;
        }

        .profile-empty-state p {
          max-width: 360px;
          margin-bottom: 16px;
        }

        .profile-empty-state a {
          padding: 10px 16px;
          border-radius: 10px;
          background: var(--accent);
          color: #fff;
          font-weight: 800;
        }

        @media (max-width: 980px) {
          .profile-hero {
            align-items: flex-start;
            flex-direction: column;
          }

          .profile-layout {
            grid-template-columns: 1fr;
          }

          .profile-card {
            position: static;
            display: grid;
            grid-template-columns: auto 1fr;
            text-align: left;
            gap: 20px;
            align-items: center;
          }

          .profile-avatar-wrap {
            margin: 0;
          }

          .profile-identity p {
            justify-content: flex-start;
          }

          .profile-mini-stats,
          .profile-actions,
          .profile-edit-block {
            grid-column: 1 / -1;
          }

          .profile-stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .profile-page {
            padding: 24px 14px 64px;
          }

          .profile-hero {
            border-radius: 18px;
          }

          .profile-card {
            display: block;
            text-align: center;
          }

          .profile-avatar-wrap {
            margin: 0 auto 22px;
          }

          .profile-identity p {
            justify-content: center;
          }

          .profile-stat-grid,
          .profile-graph-grid {
            grid-template-columns: 1fr;
          }

          .profile-panel-head,
          .profile-listing-card,
          .profile-household-card {
            flex-direction: column;
            align-items: flex-start;
          }

          .profile-household-card {
            display: flex;
          }

          .profile-household-code {
            text-align: left;
            min-width: 0;
          }

          .profile-columns {
            overflow-x: auto;
            padding-bottom: 4px;
          }

          .profile-column {
            min-width: 58px;
          }
        }

        @media (max-width: 440px) {
          .profile-hero-actions,
          .profile-hero-actions a,
          .profile-edit-actions {
            width: 100%;
          }

          .profile-hero-actions {
            flex-direction: column;
          }

          .profile-edit-actions,
          .profile-mini-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
