'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getListing, updateListing } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';

const LIFESTYLE_OPTS = [
  { id: 'pets', label: '🐾 Pet Friendly' },
  { id: 'smoking', label: '🚬 Smoking Allowed' },
  { id: 'nightOwl', label: '🦉 Night Owl' },
  { id: 'earlyRiser', label: '🌅 Early Riser' },
  { id: 'student', label: '📚 Student' },
  { id: 'professional', label: '💼 Working Professional' },
];

export default function EditListingPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [form, setForm] = useState({
    title: '', location: '', rentAmount: '', roomType: 'Single',
    availability: 'Available', description: '', contactInfo: '', imageUrl: '',
    lifestylePreferences: { pets: false, smoking: false, nightOwl: false, earlyRiser: false, student: false, professional: false },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getListing(id).then(data => {
      setForm({
        title: data.title || '',
        location: data.location || '',
        rentAmount: String(data.rentAmount || ''),
        roomType: data.roomType || 'Single',
        availability: data.availability || 'Available',
        description: data.description || '',
        contactInfo: data.contactInfo || '',
        imageUrl: data.imageUrl || '',
        lifestylePreferences: data.lifestylePreferences || { pets: false, smoking: false, nightOwl: false, earlyRiser: false, student: false, professional: false },
      });
      setLoading(false);
    }).catch(() => { toast.error('Failed to load listing'); setLoading(false); });
  }, [id]);

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
    setSaving(true);
    try {
      await updateListing(id, {
        title: form.title,
        location: form.location,
        rentAmount: Number(form.rentAmount),
        roomType: form.roomType,
        availability: form.availability,
        description: form.description,
        contactInfo: form.contactInfo,
        imageUrl: form.imageUrl,
        lifestylePreferences: form.lifestylePreferences,
      });
      toast.success('Listing updated successfully!');
      router.push('/my-listings');
    } catch { toast.error('Failed to update listing'); }
    finally { setSaving(false); }
  };

  if (!currentUser) return (
    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Login required</h2>
      <Link href="/login" style={{ padding: '12px 28px', borderRadius: 10, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontFamily: 'Syne' }}>Log In</Link>
    </div>
  );

  if (loading) return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
      {[120, 240, 180, 300].map((h, i) => <div key={i} className="skeleton" style={{ height: h, marginBottom: 20 }} />)}
    </div>
  );

  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-card)', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'DM Sans', outline: 'none', transition: 'border-color 0.15s' };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, fontFamily: 'Syne', textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
      <Link href="/my-listings" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
        <ArrowLeft size={14} /> Back
      </Link>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 6 }}>Edit Listing</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Update your listing details below.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: 28, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Listing details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input name="title" value={form.title} onChange={handleChange} required style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Location *</label>
                <input name="location" value={form.location} onChange={handleChange} required style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
              <div>
                <label style={labelStyle}>Rent ($/mo) *</label>
                <input name="rentAmount" type="number" value={form.rentAmount} onChange={handleChange} required min={0} style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Room Type</label>
                <select name="roomType" value={form.roomType} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {['Single', 'Shared', 'Studio', 'Apartment'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Availability</label>
                <select name="availability" value={form.availability} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option>Available</option><option>Soon</option><option>Not Available</option>
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Image URL</label>
              <input name="imageUrl" value={form.imageUrl} onChange={handleChange} style={inputStyle} placeholder="https://..."
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
            <div>
              <label style={labelStyle}>Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange as React.ChangeEventHandler<HTMLTextAreaElement>} required rows={5} style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
            <div>
              <label style={labelStyle}>Contact Info *</label>
              <input name="contactInfo" value={form.contactInfo} onChange={handleChange} required style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 28, marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Lifestyle preferences</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {LIFESTYLE_OPTS.map(({ id: optId, label }) => {
              const checked = form.lifestylePreferences[optId as keyof typeof form.lifestylePreferences];
              return (
                <label key={optId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--border)'}`, background: checked ? 'var(--accent-light)' : 'var(--bg-subtle)', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <input type="checkbox" name={optId} checked={checked} onChange={handleChange} style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: checked ? 'var(--accent)' : 'var(--text-secondary)' }}>{label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Link href="/my-listings" style={{ padding: '12px 24px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, fontWeight: 700, fontFamily: 'Syne', color: 'var(--text-primary)', background: 'var(--bg-card)' }}>Cancel</Link>
          <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 10, background: saving ? 'var(--border)' : 'var(--accent)', color: saving ? 'var(--text-muted)' : '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'Syne', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
            <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
