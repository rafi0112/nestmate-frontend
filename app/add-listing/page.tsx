'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createListing } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Plus, ArrowLeft } from 'lucide-react';

const LIFESTYLE_OPTS = [
  { id: 'pets', label: '🐾 Pet Friendly' },
  { id: 'smoking', label: '🚬 Smoking Allowed' },
  { id: 'nightOwl', label: '🦉 Night Owl' },
  { id: 'earlyRiser', label: '🌅 Early Riser' },
  { id: 'student', label: '📚 Student' },
  { id: 'professional', label: '💼 Working Professional' },
];

export default function AddListingPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', location: '', rentAmount: '', roomType: 'Single',
    availability: 'Available', description: '', contactInfo: '', imageUrl: '',
    lifestylePreferences: { pets: false, smoking: false, nightOwl: false, earlyRiser: false, student: false, professional: false },
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nestmate_quiz_profile');
      if (!saved) return;
      const profile = JSON.parse(saved) as {
        suggestedRentAmount?: string;
        suggestedLifestylePreferences?: Partial<typeof form.lifestylePreferences>;
        suggestedDescription?: string;
      };

      setForm(prev => ({
        ...prev,
        rentAmount: prev.rentAmount || profile.suggestedRentAmount || '',
        description: prev.description || profile.suggestedDescription || '',
        lifestylePreferences: {
          ...prev.lifestylePreferences,
          ...(profile.suggestedLifestylePreferences || {}),
        },
      }));
    } catch {
      // ignore invalid saved quiz data
    }
  }, []);

  if (!currentUser) {
    return (
      <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Login required</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>You need to be logged in to post a listing.</p>
        <Link href="/login" style={{ padding: '12px 28px', borderRadius: 10, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontFamily: 'Times New Roman' }}>Log In</Link>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    if (name in form.lifestylePreferences) {
      setForm(f => ({ ...f, lifestylePreferences: { ...f.lifestylePreferences, [name]: checked } }));
    } else {
      setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.email) {
      toast.error('Your account email is missing. Please sign in again.');
      return;
    }
    setLoading(true);
    try {
      const data = {
        ...form,
        rentAmount: Number(form.rentAmount),
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email.split('@')[0],
        ownerEmail: currentUser.email,
        ownerName: currentUser.displayName || currentUser.email.split('@')[0],
        likes: [],
      };
      const res = await createListing(data);
      if (res.insertedId || res._id) {
        toast.success('Listing posted!');
        router.push('/my-listings');
      } else { toast.error('Failed to post listing'); }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
    finally { setLoading(false); }
  };

  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-card)', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'Times New Roman', outline: 'none', transition: 'border-color 0.15s' };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, fontFamily: 'Times New Roman', textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
      <Link href="/my-listings" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, transition: 'color 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
        <ArrowLeft size={14} /> Back to my listings
      </Link>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 6 }}>Post a Listing</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Find your ideal roommate by describing your space and lifestyle.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Poster info */}
        <div className="card" style={{ padding: 28, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>Your info</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input value={currentUser.displayName || ''} readOnly style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed' }} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input value={currentUser.email || ''} readOnly style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed' }} />
            </div>
          </div>
        </div>

        {/* Listing details */}
        <div className="card" style={{ padding: 28, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>Listing details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input name="title" value={form.title} onChange={handleChange} required placeholder="e.g., Looking for roommate in downtown LA" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Location *</label>
                <input name="location" value={form.location} onChange={handleChange} required placeholder="City, State" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
              <div>
                <label style={labelStyle}>Monthly Rent ($) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 15 }}>$</span>
                  <input name="rentAmount" type="number" value={form.rentAmount} onChange={handleChange} required min={0} placeholder="12000" style={{ ...inputStyle, paddingLeft: 28 }}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Room Type *</label>
                <select name="roomType" value={form.roomType} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {['Single', 'Shared', 'Studio', 'Apartment'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Availability *</label>
                <select name="availability" value={form.availability} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option>Available</option>
                  <option>Soon</option>
                  <option>Not Available</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Image URL (optional)</label>
              <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://example.com/room.jpg" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>

            <div>
              <label style={labelStyle}>Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange as React.ChangeEventHandler<HTMLTextAreaElement>} required rows={5}
                placeholder="Tell potential roommates about the space, neighborhood, your schedule, and what you're looking for..."
                style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>

            <div>
              <label style={labelStyle}>Contact Info *</label>
              <input name="contactInfo" value={form.contactInfo} onChange={handleChange} required placeholder="Phone number or preferred contact method" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Visible only to users who express interest</p>
            </div>
          </div>
        </div>

        {/* Lifestyle */}
        <div className="card" style={{ padding: 28, marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Lifestyle preferences</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Check all that apply to you and your space.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {LIFESTYLE_OPTS.map(({ id, label }) => {
              const checked = form.lifestylePreferences[id as keyof typeof form.lifestylePreferences];
              return (
                <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--border)'}`, background: checked ? 'var(--accent-light)' : 'var(--bg-subtle)', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <input type="checkbox" name={id} checked={checked} onChange={handleChange} style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: checked ? 'var(--accent)' : 'var(--text-secondary)' }}>{label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Link href="/my-listings" style={{ padding: '12px 24px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, fontWeight: 700, fontFamily: 'Times New Roman', color: 'var(--text-primary)', background: 'var(--bg-card)' }}>
            Cancel
          </Link>
          <button type="submit" disabled={loading}
            style={{ padding: '12px 32px', borderRadius: 10, background: loading ? 'var(--border)' : 'var(--accent)', color: loading ? 'var(--text-muted)' : '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'Times New Roman', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}>
            <Plus size={16} />
            {loading ? 'Posting...' : 'Post Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}
