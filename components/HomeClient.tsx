'use client';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Listing } from '@/lib/types';
import ListingCard from './ListingCard';
import { Search, MapPin, TrendingUp, Zap, Users, ArrowRight, Star, CheckCircle, Home, MessageSquare, Hash } from 'lucide-react';
import { getReviews, createReview, getStats, getHouseholds } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Props { listings: Listing[]; }

interface MessReview {
  _id?: string; id?: string; authorName: string; authorEmail: string;
  houseName: string; text: string; rating: number; date: string;
}

interface DbStats {
  activeListings: number;
  totalUsers: number;
  totalHouseholds: number;
  totalReviews: number;
  citiesCovered: number;
  matchSatisfaction: number;
}

interface CollectionStat {
  name: string;
  storageSize?: number;
  dataSize?: number;
  count?: number;
  avgObjSize?: number;
  nindexes?: number;
  totalIndexSize?: number;
  error?: string;
}

const cities = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Cumilla'];

function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          onClick={() => onChange?.(i)}
          style={{
            background: 'none',
            border: 'none',
            cursor: onChange ? 'pointer' : 'default',
            padding: 1,
          }}
        >
          <Star size={16} fill={i <= rating ? '#d4ac0d' : 'none'} color={i <= rating ? '#d4ac0d' : '#ccc8c3'} />
        </button>
      ))}
    </div>
  );
}

export default function HomeClient({ listings }: Props) {
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [heroSlide, setHeroSlide] = useState(0);
  const [reviews, setReviews] = useState<MessReview[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ houseName: '', text: '', rating: 5 });
  const [stats, setStats] = useState<DbStats | null>(null);
  const [collections, setCollections] = useState<CollectionStat[]>([]);
  const [displayStats, setDisplayStats] = useState({
    activeListings: 0,
    totalUsers: 0,
    totalHouseholds: 0,
    totalReviews: 0,
    citiesCovered: 0,
    matchSatisfaction: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [households, setHouseholds] = useState<any[]>([]);

  const slides = [
    { headline: 'Find your perfect roommate', sub: 'Match by lifestyle, budget, and vibe — across Bangladesh.' },
    { headline: 'Safe, trusted profiles', sub: 'Every member verified. Secure contact. No spam.' },
    { headline: 'Split costs fairly', sub: 'Household ledger, meal tracking, and fair-share calculator built in.' },
  ];

  useEffect(() => {
    getReviews(30).then(setReviews).catch(() => {});
    getStats().then((data) => {
      setStats(data);
      if (Array.isArray(data?.collections)) setCollections(data.collections);
      setStatsLoading(false);
    }).catch(() => setStatsLoading(false));
    // fetch households to display alongside listings
    getHouseholds().then((h: any[]) => setHouseholds(h || [])).catch(() => setHouseholds([]));

    const t = setInterval(() => setHeroSlide((s) => (s + 1) % slides.length), 4500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!stats) return;

    const start = performance.now();
    const duration = 900;

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayStats({
        activeListings: Math.round(stats.activeListings * eased),
        totalUsers: Math.round(stats.totalUsers * eased),
        totalHouseholds: Math.round(stats.totalHouseholds * eased),
        totalReviews: Math.round(stats.totalReviews * eased),
        citiesCovered: Math.round(stats.citiesCovered * eased),
        matchSatisfaction: Math.round(stats.matchSatisfaction * eased),
      });

      if (progress < 1) requestAnimationFrame(animate);
    };

    const frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [stats]);

  const submitReview = async () => {
    if (!reviewForm.houseName.trim() || !reviewForm.text.trim()) return;
    if (!currentUser) return;

    try {
      const r = await createReview({
        authorEmail: currentUser.email || '',
        authorName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
        houseName: reviewForm.houseName.trim(),
        text: reviewForm.text.trim(),
        rating: reviewForm.rating,
      });
      setReviews((prev) => [r, ...prev]);
      setReviewForm({ houseName: '', text: '', rating: 5 });
      setShowReviewForm(false);
      toast.success('Review submitted!');
    } catch {
      toast.error('Could not submit review');
    }
  };

  const featured = listings.slice(0, 6);
  const filteredListings = search.trim()
    ? listings.filter((l) => l.title?.toLowerCase().includes(search.toLowerCase()) || l.location?.toLowerCase().includes(search.toLowerCase()))
    : featured;

  const slide = slides[heroSlide];
  const statCards = [
    { label: 'Active Listings', value: displayStats.activeListings, suffix: '+', icon: Home },
    { label: 'Total Users', value: displayStats.totalUsers, suffix: '+', icon: Users },
    { label: 'Total Households', value: displayStats.totalHouseholds, suffix: '+', icon: Home },
    { label: 'Match Satisfaction', value: displayStats.matchSatisfaction, suffix: '%', icon: Star },
  ];

  return (
    <div>
      <section style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: 'clamp(40px,10vw,80px) 16px clamp(40px,10vw,88px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: -120, right: -120, width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-light), transparent 70%)' }} />
          <div style={{ position: 'absolute', bottom: -100, left: -80, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-2-light), transparent 70%)' }} />
        </div>
        <div style={{ maxWidth: 780, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', gap: 6, padding: '6px 14px', background: 'var(--bg-subtle)', borderRadius: 100, marginBottom: 'clamp(20px,5vw,36px)', border: '1px solid var(--border)' }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroSlide(i)}
                style={{ width: i === heroSlide ? 22 : 8, height: 8, borderRadius: 100, background: i === heroSlide ? 'var(--accent)' : 'var(--border-strong)', border: 'none', cursor: 'pointer', transition: 'all .3s', padding: 0 }}
              />
            ))}
          </div>

          <h1 style={{ fontSize: 'clamp(28px,6vw,56px)', fontWeight: 800, lineHeight: 1.06, marginBottom: 'clamp(12px,3vw,20px)', letterSpacing: '-0.02em', transition: 'all .4s' }}>
            {slide.headline}
          </h1>
          <p style={{ fontSize: 'clamp(15px,4vw,19px)', color: 'var(--text-secondary)', marginBottom: 'clamp(24px,5vw,44px)', lineHeight: 1.55, fontFamily: "'Times New Roman', Times, serif" }}>{slide.sub}</p>

          <div style={{ display: 'flex', gap: 'clamp(6px,2vw,10px)', maxWidth: 580, margin: '0 auto clamp(20px,5vw,36px)', flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
              <Search size={17} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search city or listing title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (window.location.href = `/browse?q=${search}`)}
                style={{ width: '100%', padding: 'clamp(10px,2vw,14px) 16px clamp(10px,2vw,14px) 46px', borderRadius: 12, border: '2px solid var(--border)', background: 'var(--bg-card)', fontSize: 'clamp(13px,2vw,15px)', color: 'var(--text-primary)', fontFamily: "'Times New Roman', Times, serif", outline: 'none', transition: 'border-color .15s', boxSizing: 'border-box' }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
            <Link href={`/browse${search ? `?q=${search}` : ''}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 'clamp(10px,2vw,14px) clamp(16px,3vw,24px)', borderRadius: 12, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 'clamp(13px,2vw,15px)', whiteSpace: 'nowrap' }}>
              Search <ArrowRight size={15} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(6px,2vw,8px)', justifyContent: 'center' }}>
            <span style={{ fontSize: 'clamp(11px,2vw,13px)', color: 'var(--text-muted)', paddingTop: 5, marginRight: 'clamp(2px,1vw,4px)' }}>Popular:</span>
            {cities.map((city) => (
              <Link key={city} href={`/browse?q=${city}`}
                style={{ fontSize: 'clamp(11px,2vw,13px)', padding: '5px 12px', borderRadius: 100, border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-subtle)', transition: 'all .14s' }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--accent)'; el.style.color = 'var(--accent)'; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-secondary)'; }}>
                <MapPin size={10} style={{ display: 'inline', marginRight: 3 }} />{city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          {statCards.map(({ label, value, suffix, icon: Icon }) => (
            <div key={label} style={{ padding: 'clamp(18px,4vw,26px) clamp(12px,3vw,20px)', textAlign: 'center', borderRight: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
                <Icon size={14} style={{ color: 'var(--accent)' }} />
                <span style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 800, fontSize: 'clamp(18px,4vw,26px)', color: 'var(--text-primary)' }}>{statsLoading ? '0' : `${value}${suffix}`}</span>
              </div>
              <p style={{ fontSize: 'clamp(10px,2vw,12px)', color: 'var(--text-muted)', fontFamily: "'Times New Roman', Times, serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 18px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'clamp(11px,2vw,13px)', fontFamily: "'Times New Roman', Times, serif" }}>
          {statsLoading ? 'Loading live database metrics...' : `Based on ${displayStats.totalReviews} MongoDB reviews across ${displayStats.citiesCovered} cities.`}
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(40px,8vw,64px) 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'clamp(20px,5vw,36px)', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 100, fontSize: 'clamp(9px,2vw,11px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              <TrendingUp size={11} /> Live Listings
            </div>
            <h2 style={{ fontSize: 'clamp(18px,4vw,34px)', fontWeight: 800, marginBottom: 6, fontFamily: "'Times New Roman', Times, serif" }}>
              {listings.length > 0 ? `${listings.length} active listing${listings.length !== 1 ? 's' : ''}` : 'Latest listings'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(12px,2vw,14px)', fontFamily: "'Times New Roman', Times, serif" }}>Real data, updated in real time.</p>
          </div>
          <Link href="/browse" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 'clamp(12px,2vw,14px)', fontWeight: 700, color: 'var(--text-primary)', background: 'var(--bg-card)', transition: 'all .14s', whiteSpace: 'nowrap', fontFamily: "'Times New Roman', Times, serif" }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--accent)'; el.style.color = 'var(--accent)'; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-primary)'; }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'clamp(40px,8vw,80px) 16px', background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 'clamp(32px,10vw,44px)', marginBottom: 14 }}>🏠</div>
            <h3 style={{ fontSize: 'clamp(16px,4vw,20px)', fontWeight: 700, marginBottom: 8, fontFamily: "'Times New Roman', Times, serif" }}>No listings yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontFamily: "'Times New Roman', Times, serif" }}>Be the first to post!</p>
            <Link href="/add-listing" style={{ padding: '12px 28px', borderRadius: 10, background: 'var(--accent)', color: '#fff', fontWeight: 700, display: 'inline-block', fontFamily: "'Times New Roman', Times, serif" }}>Post a Listing</Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(clamp(260px,80vw,300px),1fr))', gap: 'clamp(16px,3vw,24px)' }}>
              {filteredListings.map((listing) => <ListingCard key={listing._id} listing={listing} />)}
            </div>

            {/* {households.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontFamily: "'Times New Roman', Times, serif", fontSize: 'clamp(16px,4vw,20px)', fontWeight: 800 }}>Households</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontFamily: "'Times New Roman', Times, serif" }}>{households.length} active household{households.length !== 1 ? 's' : ''}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(clamp(260px,80vw,300px),1fr))', gap: 'clamp(12px,3vw,18px)' }}>
                  {households.map((h) => (
                    <div key={h._id || h.joinCode} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--bg-card)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontWeight: 800, fontFamily: "'Times New Roman', Times, serif", fontSize: 16 }}>{h.name || h.listingTitle}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'Times New Roman', Times, serif" }}>{h.joinCode}</div>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 10, fontFamily: "'Times New Roman', Times, serif" }}>{h.ownerEmail}</div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text-muted)', fontSize: 13, fontFamily: "'Times New Roman', Times, serif" }}>
                        <div>Members: {Array.isArray(h.members) ? h.members.length : (h.memberIds?.length || 0)}</div>
                        <div>Monthly: {h.monthlyFee ? `৳${h.monthlyFee}` : '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )} */}
          </>
        )}
      </section>

      <section style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: 'clamp(40px,8vw,72px) 16px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'clamp(24px,5vw,40px)', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--gold-light)', color: 'var(--gold)', borderRadius: 100, fontSize: 'clamp(9px,2vw,11px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                <Star size={11} fill="var(--gold)" /> Mess Mate Reviews
              </div>
              <h2 style={{ fontSize: 'clamp(18px,4vw,34px)', fontWeight: 800, marginBottom: 6, fontFamily: "'Times New Roman', Times, serif" }}>What housemates say</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(12px,2vw,14px)', fontFamily: "'Times New Roman', Times, serif" }}>Honest reviews from real mess members across Bangladesh.</p>
            </div>
            {currentUser && (
              <button onClick={() => setShowReviewForm(!showReviewForm)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 10, background: showReviewForm ? 'var(--bg-subtle)' : 'var(--accent)', color: showReviewForm ? 'var(--text-primary)' : '#fff', border: showReviewForm ? '1.5px solid var(--border)' : 'none', fontSize: 'clamp(12px,2vw,14px)', fontWeight: 700, cursor: 'pointer', transition: 'all .14s', whiteSpace: 'nowrap', fontFamily: "'Times New Roman', Times, serif" }}>
                <MessageSquare size={14} /> {showReviewForm ? 'Cancel' : 'Write a Review'}
              </button>
            )}
          </div>

          {showReviewForm && currentUser && (
            <div style={{ background: 'var(--bg)', border: '1.5px solid var(--accent)', borderRadius: 16, padding: 'clamp(16px,3vw,24px) clamp(16px,3vw,28px)', marginBottom: 32, overflowX: 'auto' }}>
              <h3 style={{ fontSize: 'clamp(14px,2vw,16px)', fontWeight: 700, marginBottom: 18, color: 'var(--accent)', fontFamily: "'Times New Roman', Times, serif" }}>Your Mess Experience</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 16, alignItems: 'end' }}>
                <div style={{ minWidth: 0 }}>
                  <label style={{ display: 'block', fontSize: 'clamp(10px,2vw,11px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 7, fontFamily: "'Times New Roman', Times, serif" }}>Mess / House Name</label>
                  <input value={reviewForm.houseName} onChange={(e) => setReviewForm((f) => ({ ...f, houseName: e.target.value }))}
                    placeholder="e.g. Green Villa Mess, Mirpur-10"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1.5px solid var(--border)', background: 'var(--bg-card)', fontSize: 'clamp(12px,2vw,14px)', color: 'var(--text-primary)', fontFamily: "'Times New Roman', Times, serif", outline: 'none', boxSizing: 'border-box' }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')} onBlur={(e) => (e.target.style.borderColor = 'var(--border)')} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'clamp(10px,2vw,11px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 7, fontFamily: "'Times New Roman', Times, serif" }}>Rating</label>
                  <StarRating rating={reviewForm.rating} onChange={(r) => setReviewForm((f) => ({ ...f, rating: r }))} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 'clamp(10px,2vw,11px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 7, fontFamily: "'Times New Roman', Times, serif" }}>Your Review</label>
                <textarea value={reviewForm.text} onChange={(e) => setReviewForm((f) => ({ ...f, text: e.target.value }))} rows={4}
                  placeholder="Share your honest experience as a mess mate — food quality, cleanliness, members, management…"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 9, border: '1.5px solid var(--border)', background: 'var(--bg-card)', fontSize: 'clamp(12px,2vw,14px)', color: 'var(--text-primary)', fontFamily: "'Times New Roman', Times, serif", outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')} onBlur={(e) => (e.target.style.borderColor = 'var(--border)')} />
              </div>
              <button onClick={submitReview}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 24px', borderRadius: 10, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 'clamp(12px,2vw,14px)', border: 'none', cursor: 'pointer', fontFamily: "'Times New Roman', Times, serif" }}>
                <CheckCircle size={15} /> Submit Review
              </button>
            </div>
          )}

          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'clamp(20px,5vw,40px) 0', color: 'var(--text-muted)', fontSize: 'clamp(12px,2vw,14px)', fontFamily: "'Times New Roman', Times, serif" }}>
              <p style={{ fontSize: 'clamp(24px,8vw,32px)', marginBottom: 12 }}>✍️</p>
              <p>No reviews yet.{currentUser ? ' Be the first to share your mess experience!' : ' Sign in to write a review.'}</p>
              {!currentUser && <Link href="/login" style={{ display: 'inline-block', marginTop: 14, color: 'var(--accent)', fontWeight: 700, fontSize: 'clamp(12px,2vw,14px)' }}>Sign in →</Link>}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(clamp(260px,80vw,300px),1fr))', gap: 'clamp(16px,3vw,20px)' }}>
              {reviews.map((r) => (
                <div key={r._id || r.id || r.date} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 'clamp(16px,3vw,22px) clamp(16px,3vw,24px)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: "'Times New Roman', Times, serif", flexShrink: 0 }}>
                        {r.authorName[0]}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 'clamp(12px,2vw,14px)', fontFamily: "'Times New Roman', Times, serif", color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.authorName}</p>
                        <p style={{ fontSize: 'clamp(10px,2vw,11px)', color: 'var(--text-muted)' }}>{new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <StarRating rating={r.rating} />
                  </div>
                  <div style={{ padding: '8px 12px', background: 'var(--accent-light)', borderRadius: 7, marginBottom: 10 }}>
                    <p style={{ fontSize: 'clamp(10px,2vw,11px)', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Times New Roman', Times, serif" }}>
                      <Hash size={10} /> {r.houseName}
                    </p>
                  </div>
                  <p style={{ fontSize: 'clamp(12px,2vw,14px)', color: 'var(--text-secondary)', lineHeight: 1.65, fontStyle: 'italic', fontFamily: "'Times New Roman', Times, serif" }}>"{r.text}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(40px,8vw,72px) 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(32px,6vw,52px)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--accent-2-light)', color: 'var(--accent-2)', borderRadius: 100, fontSize: 'clamp(9px,2vw,11px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'clamp(8px,2vw,14px)', fontFamily: "'Times New Roman', Times, serif" }}>
            <Zap size={11} /> How it works
          </div>
          <h2 style={{ fontSize: 'clamp(20px,4vw,36px)', fontWeight: 800, fontFamily: "'Times New Roman', Times, serif" }}>Four steps to your perfect match</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(clamp(200px,80vw,230px),1fr))', gap: 'clamp(12px,2vw,20px)' }}>
          {[
            { step: '01', title: 'Create your profile', desc: 'Set lifestyle, budget, and preferences.', icon: Users },
            { step: '02', title: 'Browse & filter', desc: 'Search by city, price, room type, and tags.', icon: Search },
            { step: '03', title: 'Match & connect', desc: 'Like listings to unlock contact info.', icon: CheckCircle },
            { step: '04', title: 'Manage together', desc: 'Use the Household hub for meals, dues, and chat.', icon: Home },
          ].map(({ step, title, desc, icon: Icon }) => (
            <div key={step} style={{ padding: 'clamp(16px,3vw,26px)', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-card)', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ position: 'absolute', top: 10, right: 12, fontFamily: "'Times New Roman', Times, serif", fontSize: 'clamp(28px,8vw,44px)', fontWeight: 900, color: 'var(--border)', opacity: .5, lineHeight: 1 }}>{step}</div>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'clamp(12px,2vw,18px)' }}>
                <Icon size={19} style={{ color: 'var(--accent)' }} />
              </div>
              <h3 style={{ fontSize: 'clamp(14px,2vw,16px)', fontWeight: 700, marginBottom: 8, fontFamily: "'Times New Roman', Times, serif" }}>{title}</h3>
              <p style={{ fontSize: 'clamp(12px,2vw,13px)', color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: "'Times New Roman', Times, serif" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {!currentUser && (
        <section style={{ maxWidth: 1200, margin: '0 auto clamp(40px,8vw,80px)', padding: '0 16px' }}>
          <div style={{ background: 'linear-gradient(135deg,var(--accent) 0%,var(--accent-2) 100%)', borderRadius: 22, padding: 'clamp(32px,6vw,56px) clamp(20px,5vw,48px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />
            <div style={{ position: 'absolute', bottom: -60, left: -30, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
            <h2 style={{ fontSize: 'clamp(20px,4vw,38px)', fontWeight: 800, color: '#fff', marginBottom: 'clamp(6px,2vw,10px)', position: 'relative', fontFamily: "'Times New Roman', Times, serif" }}>Ready to find your roommate?</h2>
            <p style={{ color: 'rgba(255,255,255,.85)', fontSize: 'clamp(14px,2vw,17px)', marginBottom: 'clamp(20px,4vw,36px)', position: 'relative', fontFamily: "'Times New Roman', Times, serif" }}>Join thousands finding their perfect living situation across Bangladesh.</p>
            <div style={{ display: 'flex', gap: 'clamp(8px,2vw,12px)', justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
              <Link href="/register" style={{ padding: 'clamp(10px,2vw,14px) clamp(20px,4vw,32px)', borderRadius: 12, background: '#fff', color: 'var(--accent)', fontWeight: 800, fontSize: 'clamp(13px,2vw,15px)', fontFamily: "'Times New Roman', Times, serif", whiteSpace: 'nowrap' }}>Sign up free</Link>
              <Link href="/browse" style={{ padding: 'clamp(10px,2vw,14px) clamp(20px,4vw,32px)', borderRadius: 12, background: 'rgba(255,255,255,.15)', color: '#fff', fontWeight: 700, fontSize: 'clamp(13px,2vw,15px)', border: '1.5px solid rgba(255,255,255,.3)', fontFamily: "'Times New Roman', Times, serif" }}>Browse listings</Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
