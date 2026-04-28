'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Listing } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { updateListing } from '@/lib/api';
import ListingCard from './ListingCard';
import { MapPin, Banknote, Calendar, Bed, Heart, Mail, Phone, User, Share2, Bookmark, Flag, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props { listing: Listing; similar: Listing[]; }

const lifestyleLabels: Record<string, { icon: string; label: string }> = {
  pets: { icon: '🐾', label: 'Pet Friendly' },
  smoking: { icon: '🚬', label: 'Smoking Allowed' },
  nightOwl: { icon: '🦉', label: 'Night Owl' },
  earlyRiser: { icon: '🌅', label: 'Early Riser' },
  student: { icon: '📚', label: 'Student Preferred' },
  professional: { icon: '💼', label: 'Professional Preferred' },
};

export default function ListingDetailClient({ listing, similar }: Props) {
  const { currentUser } = useAuth();
  const [likes, setLikes] = useState<string[]>(listing.likes || []);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasLiked = currentUser?.email ? likes.includes(currentUser.email) : false;
  const isOwner = currentUser?.email === listing.userEmail;
  const contactVisible = hasLiked || isOwner;

  const handleLike = async () => {
    if (!currentUser) return toast.error('Log in to show interest!');
    if (isOwner) return toast.error('You cannot like your own listing');
    setLoading(true);
    try {
      const res = await updateListing(listing._id, { userEmail: currentUser.email, action: hasLiked ? 'unlike' : 'like' });
      if (res.likes) {
        setLikes(res.likes);
        toast.success(hasLiked ? 'Removed from interests' : "You're interested! Contact info unlocked 🔓");
      }
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: listing.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  const tags = Object.entries(listing.lifestylePreferences || {})
    .map(([k, v]) => ({ ...lifestyleLabels[k], key: k, active: v }))
    .filter(t => t.label);

  const availColor = listing.availability === 'Available' ? 'var(--success)' : listing.availability === 'Not Available' ? '#dc2626' : 'var(--accent-2)';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: 'var(--text-muted)' }}>
        <Link href="/" style={{ color: 'var(--text-muted)', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>Home</Link>
        <ChevronRight size={12} />
        <Link href="/browse" style={{ color: 'var(--text-muted)', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>Browse</Link>
        <ChevronRight size={12} />
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{listing.title}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
        {/* Main content */}
        <div>
          {/* Hero image */}
          <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 28, position: 'relative', aspectRatio: '16/7', background: 'var(--bg-subtle)' }}>
            <img
              src={listing.imageUrl || `https://picsum.photos/seed/${listing._id}/1200/500`}
              alt={listing.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/room/1200/500`; }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)' }} />
            <div style={{ position: 'absolute', bottom: 24, left: 28 }}>
              <span style={{ padding: '5px 14px', borderRadius: 100, background: availColor, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'Syne' }}>
                {listing.availability}
              </span>
            </div>
            <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 8 }}>
              <button onClick={handleShare} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                <Share2 size={16} color="var(--text-primary)" />
              </button>
              <button onClick={() => setSaved(!saved)} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                <Bookmark size={16} color={saved ? 'var(--accent)' : 'var(--text-primary)'} fill={saved ? 'var(--accent)' : 'none'} />
              </button>
            </div>
          </div>

          {/* Title + meta */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, flex: 1 }}>{listing.title}</h1>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Flag size={14} color="var(--text-muted)" />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 16 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, color: 'var(--text-secondary)' }}>
                <MapPin size={15} style={{ color: 'var(--accent)' }} /> {listing.location}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 18, fontWeight: 800, fontFamily: 'Syne', color: 'var(--text-primary)' }}>
                <Banknote size={16} style={{ color: 'var(--accent)' }} /> {Number(listing.rentAmount).toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 2 }}>/mo</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-secondary)' }}>
                <Bed size={15} style={{ color: 'var(--accent-2)' }} /> {listing.roomType}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-secondary)' }}>
                <Heart size={14} style={{ color: 'var(--accent)' }} /> {likes.length} interested
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="card" style={{ padding: 28, marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>About this listing</h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
              {listing.description || 'No description provided.'}
            </p>
          </div>

          {/* Lifestyle preferences */}
          <div className="card" style={{ padding: 28, marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Lifestyle preferences</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {tags.map(({ key, icon, label, active }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: active ? 'var(--accent-light)' : 'var(--bg-subtle)', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`, opacity: active ? 1 : 0.6 }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: active ? 'var(--accent)' : 'var(--text-secondary)' }}>{label}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{active ? 'Yes' : 'No'}</p>
                  </div>
                  {active
                    ? <CheckCircle size={14} style={{ color: 'var(--success)', marginLeft: 'auto' }} />
                    : <XCircle size={14} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Similar listings (moved below sidebar for mobile ordering) */}
        </div>

        {/* Similar listings (desktop placement) */}
        {similar.length > 0 && (
          <div className="similar-desktop" style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Similar listings nearby</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {similar.map(l => <ListingCard key={l._id} listing={l} />)}
            </div>
          </div>
        )}

        {/* Sidebar */}
        <div style={{ position: 'sticky', top: 84 }}>
          {/* Poster card */}
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'Syne', flexShrink: 0 }}>
                {(listing.userName || listing.userEmail || 'U')[0].toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, fontFamily: 'Syne' }}>{listing.userName || 'Anonymous'}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Posted this listing</p>
              </div>
            </div>

            {/* Like / interest button */}
            <button
              onClick={handleLike}
              disabled={loading || isOwner}
              style={{
                width: '100%', padding: '14px', borderRadius: 12,
                background: hasLiked ? 'var(--success-light)' : isOwner ? 'var(--bg-subtle)' : 'var(--accent)',
                color: hasLiked ? 'var(--success)' : isOwner ? 'var(--text-muted)' : '#fff',
                border: 'none', fontSize: 15, fontWeight: 700, fontFamily: 'Syne',
                cursor: isOwner ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.15s', marginBottom: 12
              }}>
              <Heart size={16} fill={hasLiked ? 'currentColor' : 'none'} />
              {isOwner ? "Your listing" : hasLiked ? "You're interested ✓" : loading ? 'Processing...' : "I'm Interested"}
            </button>

            {/* Contact info — unlocks after like */}
            <div style={{ padding: 16, borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 12 }}>
                Contact Info {!contactVisible && '🔒'}
              </p>
              {contactVisible ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <a href={`mailto:${listing.userEmail}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                    <Mail size={14} style={{ color: 'var(--accent-2)' }} /> {listing.userEmail}
                  </a>
                  {listing.contactInfo && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-primary)' }}>
                      <Phone size={14} style={{ color: 'var(--success)' }} /> {listing.contactInfo}
                    </div>
                  )}
                  <Link
                    href={`/messages?to=${encodeURIComponent(listing.userEmail || '')}&listingId=${encodeURIComponent(listing._id)}&listingTitle=${encodeURIComponent(listing.title)}&ownerName=${encodeURIComponent(listing.userName || listing.userEmail || 'Owner')}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 10, background: 'var(--accent-2)', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'Syne' }}>
                    <Mail size={15} /> Send Message
                  </Link>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Click "I'm Interested" to unlock the poster's contact information.
                </p>
              )}
            </div>
          </div>

          {/* Quick summary */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Syne', marginBottom: 16, color: 'var(--text-secondary)' }}>Quick Summary</h3>
            {[
              { icon: Banknote, label: 'Monthly Rent', value: `৳${Number(listing.rentAmount).toLocaleString()}` },
              { icon: Bed, label: 'Room Type', value: listing.roomType },
              { icon: MapPin, label: 'Location', value: listing.location },
              { icon: Calendar, label: 'Availability', value: listing.availability },
              { icon: User, label: 'Posted By', value: listing.userName || 'Anonymous' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                  <Icon size={13} style={{ color: 'var(--accent)' }} /> {label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>

          {isOwner && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <Link href={`/edit-listing/${listing._id}`} style={{ flex: 1, textAlign: 'center', padding: '12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, fontWeight: 700, fontFamily: 'Syne', color: 'var(--text-primary)', background: 'var(--bg-card)' }}>
                Edit Listing
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Similar listings (mobile placement) */}
      {similar.length > 0 && (
        <div className="similar-mobile" style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Similar listings nearby</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {similar.map(l => <ListingCard key={l._id} listing={l} />)}
          </div>
        </div>
      )}

      <style>{`
        .similar-mobile { display: none; }
        .similar-desktop { display: block; }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 340px"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="position: sticky"] {
            position: static !important;
          }
          .similar-desktop { display: none !important; }
          .similar-mobile { display: block !important; }
        }
      `}</style>
    </div>
  );
}
