'use client';
import Link from 'next/link';
import { MapPin, Banknote, Heart, Bed, Calendar } from 'lucide-react';
import { Listing } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { updateListing } from '@/lib/api';

interface Props {
  listing: Listing;
  showActions?: boolean;
  onDelete?: (id: string) => void;
}

const lifestyleIcons: Record<string, string> = {
  pets: '🐾', smoking: '🚬', nightOwl: '🦉', earlyRiser: '🌅', student: '📚', professional: '💼'
};

export default function ListingCard({ listing, showActions, onDelete }: Props) {
  const { currentUser } = useAuth();
  const [likes, setLikes] = useState<string[]>(listing.likes || []);
  const hasLiked = currentUser?.email ? likes.includes(currentUser.email) : false;
  const isOwner = currentUser?.email === listing.userEmail;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentUser || isOwner) return;
    const action = hasLiked ? 'unlike' : 'like';
    const res = await updateListing(listing._id, { userEmail: currentUser.email, action });
    if (res.likes) setLikes(res.likes);
  };

  const tags = Object.entries(listing.lifestylePreferences || {})
    .filter(([, v]) => v)
    .map(([k]) => ({ key: k, icon: lifestyleIcons[k] || '✦', label: k.replace(/([A-Z])/g, ' $1') }));

  const availColor = listing.availability === 'Available' ? 'var(--success)' : listing.availability === 'Not Available' ? '#e53935' : 'var(--accent-2)';
  const availBg = listing.availability === 'Available' ? 'var(--success-light)' : listing.availability === 'Not Available' ? '#fff5f5' : 'var(--accent-2-light)';

  return (
    <div className="card card-lift" style={{ overflow: 'hidden', position: 'relative' }}>
      {/* Top strip */}
      <div style={{ height: 4, background: `linear-gradient(90deg, var(--accent), var(--accent-2))` }} />

      {/* Image area */}
      <div style={{ position: 'relative', height: 180, overflow: 'hidden', background: 'var(--bg-subtle)' }}>
        <img
          src={listing.imageUrl || `https://picsum.photos/seed/${listing._id}/600/300`}
          alt={listing.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
          onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${listing._id || 'default'}/600/300`; }}
          onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
        />
        {/* Availability badge */}
        <span style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, fontFamily: 'Times New Roman', color: availColor, background: availBg, backdropFilter: 'blur(8px)' }}>
          {listing.availability}
        </span>
        {/* Room type badge */}
        <span style={{ position: 'absolute', top: 12, left: 12, padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: 'rgba(0,0,0,0.5)', color: '#fff', backdropFilter: 'blur(4px)' }}>
          {listing.roomType}
        </span>
      </div>

      <div style={{ padding: '16px 20px 20px' }}>
        {/* Title */}
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {listing.title}
        </h3>

        {/* Meta */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
            <MapPin size={13} style={{ color: 'var(--accent)' }} /> {listing.location}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Times New Roman' }}>
            <Banknote size={13} style={{ color: 'var(--accent)' }} /> ৳{Number(listing.rentAmount).toLocaleString()}<span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)' }}>/mo</span>
          </span>
        </div>

        {/* Description */}
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {listing.description || 'No description provided.'}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {tags.slice(0, 4).map(t => (
              <span key={t.key} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 100, background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                {t.icon} {t.label}
              </span>
            ))}
            {tags.length > 4 && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 100, background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>+{tags.length - 4}</span>}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <button
            onClick={handleLike}
            disabled={!currentUser || isOwner}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 12px', borderRadius: 100,
              border: `1.5px solid ${hasLiked ? 'var(--accent)' : 'var(--border)'}`,
              background: hasLiked ? 'var(--accent-light)' : 'transparent',
              color: hasLiked ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 12, fontWeight: 500, cursor: currentUser && !isOwner ? 'pointer' : 'default',
              transition: 'all 0.15s'
            }}
          >
            <Heart size={13} fill={hasLiked ? 'currentColor' : 'none'} />
            {likes.length} {likes.length === 1 ? 'like' : 'likes'}
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            {showActions && isOwner && (
              <>
                <Link href={`/edit-listing/${listing._id}`} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, fontFamily: 'Times New Roman', color: 'var(--text-secondary)', background: 'var(--bg-subtle)' }}>
                  Edit
                </Link>
                <button onClick={() => onDelete?.(listing._id)} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #fee2e2', fontSize: 12, fontWeight: 600, fontFamily: 'Times New Roman', color: '#dc2626', background: '#fff5f5', cursor: 'pointer' }}>
                  Delete
                </button>
              </>
            )}
            <Link href={`/listings/${listing._id}`} style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'Times New Roman' }}>
              View →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
