'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { BookMarked, FileText, Home, House, LogOut, Menu, MessageSquare, Moon, PlusSquare, Search, Sun, Target, User, Users, X } from 'lucide-react';

const NAV = [
  { href: '/',             label: 'Home',        icon: Home },
  { href: '/browse',       label: 'Browse',      icon: Search },
  { href: '/compatibility',label: 'Match Quiz',  icon: Target },
  { href: '/agreement',    label: 'Agreement',   icon: FileText },
];

const WORKSPACE_NAV = [
  { href: '/household', label: 'Household', icon: House },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/add-listing', label: 'Post Room', icon: PlusSquare },
  { href: '/my-listings', label: 'My Listings', icon: BookMarked },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 6);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const initials = (currentUser?.displayName || currentUser?.email || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <nav className={scrolled ? 'nav-scrolled' : ''} style={{ background: scrolled ? 'color-mix(in srgb, var(--bg-card) 82%, transparent)' : 'var(--bg-card)', borderBottom: '1px solid var(--border)', boxShadow: scrolled ? 'var(--shadow-md)' : 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, backdropFilter: scrolled ? 'blur(18px)' : 'none', WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none', transition: 'background .18s ease, box-shadow .18s ease, backdrop-filter .18s ease' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 62, gap: 0 }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, marginRight: 28, flexShrink: 0, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, background: 'var(--accent)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: 'Times New Roman', fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Nest<span style={{ color: 'var(--accent)' }}>Mate</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }} className="nav-desktop">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 10px', borderRadius: 7,
                  fontSize: 13, fontFamily: 'Times New Roman', fontWeight: active ? 700 : 500,
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  background: active ? 'var(--accent-light)' : 'transparent',
                  transition: 'all 0.12s', whiteSpace: 'nowrap',
                  borderBottom: active ? `2px solid var(--accent)` : '2px solid transparent',
                }}
                onMouseEnter={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--bg-subtle)'; el.style.color = 'var(--text-primary)'; } }}
                onMouseLeave={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--text-secondary)'; } }}
              >
                <Icon size={13} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right controls */}
        <div className="nav-right-controls" style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>

          {/* Theme toggle */}
          <button onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            style={{ width: 32, height: 32, border: '1px solid var(--border)', borderRadius: 7, background: 'var(--bg-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'all 0.12s' }}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {currentUser ? (
            <>
              {/* Avatar + name chip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 10px 4px 5px', background: 'var(--bg-subtle)', borderRadius: 100, border: '1px solid var(--border)' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: 'Times New Roman', flexShrink: 0 }}>
                  {initials}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Times New Roman' }}>
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
              </div>
              <button onClick={logout} title="Log out" className="nav-desktop"
                style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', borderRadius: 7, background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--danger-light)'; (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}>
                <LogOut size={13} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 7 }} className="nav-desktop">
              <Link href="/login" style={{ padding: '6px 14px', borderRadius: 7, border: '1.5px solid var(--border)', fontSize: 13, fontWeight: 600, fontFamily: 'Times New Roman', color: 'var(--text-primary)', background: 'transparent', transition: 'all 0.12s' }}>
                Log In
              </Link>
              <Link href="/register" style={{ padding: '6px 14px', borderRadius: 7, background: 'var(--accent)', fontSize: 13, fontWeight: 700, fontFamily: 'Times New Roman', color: '#fff', transition: 'all 0.12s' }}>
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="nav-mobile-btn"
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
            style={{ width: 32, height: 32, border: '1px solid var(--border)', borderRadius: 7, background: 'var(--bg-subtle)', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            {open ? <X size={15} /> : <Menu size={15} />}
          </button>
        </div>
      </div>

      {open && <button aria-label="Close navigation backdrop" className="nav-mobile-backdrop" onClick={() => setOpen(false)} />}

      {/* Mobile menu drawer */}
      {open && (
        <div className="nav-mobile-drawer" style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderTop: '1px solid var(--border)', padding: '12px 20px 20px' }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 0', borderBottom: '1px solid var(--border)', fontSize: 15, color: active ? 'var(--accent)' : 'var(--text-primary)', fontWeight: active ? 700 : 500, fontFamily: 'Times New Roman' }}>
                <Icon size={15} style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }} />
                {label}
              </Link>
            );
          })}

          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'Times New Roman' }}>Workspace</span>
              {!currentUser && (
                <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '4px 8px', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  Login required
                </span>
              )}
            </div>
            {WORKSPACE_NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              const locked = !currentUser;
              const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '13px 0', borderBottom: '1px solid var(--border)', fontSize: 15, color: active ? 'var(--accent)' : 'var(--text-primary)', fontWeight: active ? 700 : 500, fontFamily: 'Times New Roman' };
              const content = (
                <>
                  <Icon size={15} style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }} />
                  <span style={{ filter: locked ? 'blur(4px)' : 'none', opacity: locked ? 0.55 : 1, transition: 'filter .12s ease, opacity .12s ease' }}>{label}</span>
                </>
              );

              if (locked) {
                return (
                  <div key={href} style={{ ...rowStyle, opacity: 0.72 }} aria-disabled>
                    {content}
                  </div>
                );
              }

              return (
                <Link key={href} href={href} onClick={() => setOpen(false)} style={rowStyle}>
                  {content}
                </Link>
              );
            })}
          </div>

          {!currentUser ? (
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Link href="/login" onClick={() => setOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '11px', border: '1.5px solid var(--border)', borderRadius: 9, fontWeight: 700, fontFamily: 'Times New Roman', fontSize: 14 }}>Log In</Link>
              <Link href="/register" onClick={() => setOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '11px', background: 'var(--accent)', borderRadius: 9, fontWeight: 700, fontFamily: 'Times New Roman', fontSize: 14, color: '#fff' }}>Sign Up</Link>
            </div>
          ) : (
            <button onClick={() => { logout(); setOpen(false); }} style={{ width: '100%', marginTop: 14, padding: '11px', border: '1px solid var(--border)', borderRadius: 9, background: 'var(--bg-subtle)', fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'Times New Roman', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <LogOut size={14} /> Log Out
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          nav.nav-scrolled {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
          .nav-right-controls { margin-left: auto !important; }
          .nav-mobile-drawer a,
          .nav-mobile-drawer div {
            -webkit-tap-highlight-color: transparent;
          }
          .nav-mobile-drawer {
            position: fixed;
            left: 0;
            right: 0;
            top: 62px;
            z-index: 210;
            border-bottom: 1px solid var(--border);
            box-shadow: var(--shadow-xl);
          }
          .nav-mobile-backdrop {
            position: fixed;
            inset: 62px 0 0 0;
            z-index: 205;
            border: 0;
            padding: 0;
            background: rgba(247, 245, 241, 0.14);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
          }
        }
        [data-theme='dark'] .nav-mobile-drawer {
          background: rgba(20, 18, 14, 0.74) !important;
        }
        [data-theme='dark'] .nav-mobile-backdrop {
          background: rgba(14, 13, 11, 0.2);
        }
      `}</style>
    </nav>
  );
}
