'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, User, Users, CheckCircle } from 'lucide-react';

const BENEFITS = [
  'Post listings for free',
  'Contact info unlocks on mutual interest',
  'Filter by lifestyle & budget',
  'Connect with verified roommates',
];

export default function RegisterPage() {
  const { register, signInGoogle } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = form.password.length >= 8 ? (form.password.match(/[A-Z]/) && form.password.match(/[0-9]/) ? 'strong' : 'medium') : form.password.length > 0 ? 'weak' : '';
  const strengthColor = strength === 'strong' ? 'var(--success)' : strength === 'medium' ? '#f59e0b' : '#ef4444';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.email, form.password, form.name);
      toast.success('Account created! Welcome to NestMate 🎉');
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    try {
      await signInGoogle();
      toast.success('Welcome to NestMate!');
      router.push('/');
    } catch { toast.error('Google sign-in failed'); }
  };

  const inputStyle = { width: '100%', padding: '12px 14px 12px 42px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg)', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'DM Sans', outline: 'none', transition: 'border-color 0.15s' };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, fontFamily: 'Syne', textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* Left panel - benefits */}
      <div style={{ flex: '0 0 420px', background: 'linear-gradient(160deg, var(--accent) 0%, #ff9060 100%)', padding: '60px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} className="register-panel">
        <div style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
          <Users size={26} color="#fff" />
        </div>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 16, lineHeight: 1.1 }}>
          Find your perfect roommate
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 1.65, marginBottom: 40 }}>
          Join thousands of people who found their ideal living situation through NestMate.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {BENEFITS.map(b => (
            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle size={18} color="rgba(255,255,255,0.9)" fill="rgba(255,255,255,0.2)" />
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15 }}>{b}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 60, padding: 24, background: 'rgba(255,255,255,0.15)', borderRadius: 16, backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="testimonial" style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)' }} />
            <div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Jessica M.</p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Found a roommate in 48 hours</p>
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 1.6, fontStyle: 'italic' }}>
            "Moved to a new city knowing nobody. NestMate matched me with someone who works the same hours and loves cooking. We split a beautiful apartment and save $800/month!"
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 6 }}>Create account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 32 }}>It's free — always.</p>

          {/* Google */}
          <button onClick={handleGoogle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '13px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-card)', fontSize: 14, fontWeight: 600, fontFamily: 'Syne', color: 'var(--text-primary)', cursor: 'pointer', marginBottom: 24, transition: 'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>or with email</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Your full name" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="you@example.com" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="At least 6 characters" style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {strength && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--border)' }}>
                    <div style={{ height: '100%', borderRadius: 2, width: strength === 'strong' ? '100%' : strength === 'medium' ? '60%' : '25%', background: strengthColor, transition: 'all 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 11, color: strengthColor, fontWeight: 600, textTransform: 'capitalize' }}>{strength}</span>
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required placeholder="Repeat your password" style={{ ...inputStyle, borderColor: form.confirm && form.confirm !== form.password ? '#ef4444' : form.confirm && form.confirm === form.password ? 'var(--success)' : 'var(--border)' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = form.confirm && form.confirm !== form.password ? '#ef4444' : form.confirm === form.password ? 'var(--success)' : 'var(--border)')} />
              </div>
              {form.confirm && form.confirm !== form.password && (
                <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>Passwords don't match</p>
              )}
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              By creating an account you agree to our{' '}
              <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Terms of Service</span> and{' '}
              <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Privacy Policy</span>.
            </p>

            <button type="submit" disabled={loading}
              style={{ padding: '13px', borderRadius: 10, background: loading ? 'var(--border-strong)' : 'var(--accent)', color: loading ? 'var(--text-muted)' : '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'Syne', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 700 }}>Log in</Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .register-panel { display: none !important; } }
      `}</style>
    </div>
  );
}
