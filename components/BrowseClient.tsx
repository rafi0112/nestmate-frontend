'use client';
import { useState, useMemo } from 'react';
import { Listing } from '@/lib/types';
import ListingCard from './ListingCard';
import { Search, SlidersHorizontal, X, Grid3X3, List, LayoutGrid } from 'lucide-react';

interface Props { listings: Listing[]; initialQuery: string; }

const ROOM_TYPES = ['All', 'Single', 'Shared', 'Studio', 'Apartment'];
const AVAILABILITY = ['All', 'Available', 'Soon', 'Not Available'];
const SORT_OPTIONS = [
  { label: 'Newest first', value: 'new' },
  { label: 'Lowest rent', value: 'low' },
  { label: 'Highest rent', value: 'high' },
  { label: 'Most liked', value: 'liked' },
];
const LIFESTYLE_TAGS = [
  { key: 'pets', label: '🐾 Pet friendly' },
  { key: 'smoking', label: '🚬 Smoking ok' },
  { key: 'nightOwl', label: '🦉 Night owl' },
  { key: 'earlyRiser', label: '🌅 Early riser' },
  { key: 'student', label: '📚 Student' },
  { key: 'professional', label: '💼 Professional' },
];

export default function BrowseClient({ listings, initialQuery }: Props) {
  const [search, setSearch] = useState(initialQuery);
  const [roomType, setRoomType] = useState('All');
  const [availability, setAvailability] = useState('All');
  const [maxRent, setMaxRent] = useState(10000);
  const [sort, setSort] = useState('new');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const filtered = useMemo(() => {
    let r = listings.filter(l => {
      const q = search.toLowerCase();
      const matchSearch = !q || l.title?.toLowerCase().includes(q) || l.location?.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q);
      const matchRoom = roomType === 'All' || l.roomType === roomType;
      const matchAvail = availability === 'All' || l.availability === availability;
      const matchRent = Number(l.rentAmount) <= maxRent;
      const matchTags = selectedTags.length === 0 || selectedTags.every(tag => l.lifestylePreferences?.[tag as keyof typeof l.lifestylePreferences]);
      return matchSearch && matchRoom && matchAvail && matchRent && matchTags;
    });

    if (sort === 'low') r = [...r].sort((a, b) => Number(a.rentAmount) - Number(b.rentAmount));
    else if (sort === 'high') r = [...r].sort((a, b) => Number(b.rentAmount) - Number(a.rentAmount));
    else if (sort === 'liked') r = [...r].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));

    return r;
  }, [listings, search, roomType, availability, maxRent, selectedTags, sort]);

  const toggleTag = (k: string) =>
    setSelectedTags(t => t.includes(k) ? t.filter(x => x !== k) : [...t, k]);

  const activeFilters = [
    roomType !== 'All' ? roomType : null,
    availability !== 'All' ? availability : null,
    maxRent < 10000 ? `Under $${maxRent.toLocaleString()}` : null,
    ...selectedTags.map(t => LIFESTYLE_TAGS.find(l => l.key === t)?.label),
  ].filter(Boolean) as string[];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 6 }}>Browse Listings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
          {filtered.length} of {listings.length} listings
        </p>
      </div>

      {/* Search + controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search location, title, or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-card)', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'Times New Roman', outline: 'none' }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        <select value={sort} onChange={e => setSort(e.target.value)}
          style={{ padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-card)', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'Times New Roman', cursor: 'pointer', outline: 'none' }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <button onClick={() => setShowFilters(!showFilters)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 10, border: `1.5px solid ${showFilters ? 'var(--accent)' : 'var(--border)'}`, background: showFilters ? 'var(--accent-light)' : 'var(--bg-card)', color: showFilters ? 'var(--accent)' : 'var(--text-primary)', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'Times New Roman', transition: 'all 0.15s' }}>
          <SlidersHorizontal size={15} /> Filters {activeFilters.length > 0 && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 100, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{activeFilters.length}</span>}
        </button>

        <div style={{ display: 'flex', border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {[{ v: 'grid' as const, Icon: LayoutGrid }, { v: 'list' as const, Icon: List }].map(({ v, Icon }) => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: '12px 14px', background: view === v ? 'var(--accent-light)' : 'var(--bg-card)', color: view === v ? 'var(--accent)' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24 }}>
            {/* Room type */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Times New Roman', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 10 }}>Room Type</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ROOM_TYPES.map(t => (
                  <button key={t} onClick={() => setRoomType(t)}
                    style={{ padding: '6px 12px', borderRadius: 100, border: `1.5px solid ${roomType === t ? 'var(--accent)' : 'var(--border)'}`, background: roomType === t ? 'var(--accent-light)' : 'transparent', color: roomType === t ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Times New Roman', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 10 }}>Availability</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {AVAILABILITY.map(a => (
                  <button key={a} onClick={() => setAvailability(a)}
                    style={{ padding: '6px 12px', borderRadius: 100, border: `1.5px solid ${availability === a ? 'var(--accent)' : 'var(--border)'}`, background: availability === a ? 'var(--accent-light)' : 'transparent', color: availability === a ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s' }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Max rent */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 10 }}>
                Max Rent: <span style={{ color: 'var(--accent)' }}>৳{maxRent.toLocaleString()}</span>
              </p>
              <input type="range" min={300} max={10000} step={100} value={maxRent} onChange={e => setMaxRent(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                <span>৳300</span><span>৳10,000</span>
              </div>
            </div>

            {/* Lifestyle */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Times New Roman', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 10 }}>Lifestyle</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {LIFESTYLE_TAGS.map(({ key, label }) => (
                  <button key={key} onClick={() => toggleTag(key)}
                    style={{ padding: '6px 10px', borderRadius: 100, border: `1.5px solid ${selectedTags.includes(key) ? 'var(--accent)' : 'var(--border)'}`, background: selectedTags.includes(key) ? 'var(--accent-light)' : 'transparent', color: selectedTags.includes(key) ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active filter pills */}
      {activeFilters.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {activeFilters.map(f => (
            <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 100, background: 'var(--accent-light)', color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>
              {f}
            </span>
          ))}
          <button onClick={() => { setRoomType('All'); setAvailability('All'); setMaxRent(10000); setSelectedTags([]); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 100, background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', border: '1px solid var(--border)' }}>
            <X size={11} /> Clear all
          </button>
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>No listings found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div style={view === 'grid' ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 } : { display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(listing => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
