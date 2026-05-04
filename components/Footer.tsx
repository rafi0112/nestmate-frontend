'use client';
import Link from 'next/link';
import { Users, Mail, Heart, ExternalLink, Share2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', paddingTop: 48, paddingBottom: 32, marginTop: 80 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} color="#fff" />
              </div>
              <span style={{ fontFamily: 'Times New Roman', fontWeight: 800, fontSize: 20, color: 'var(--text-primary)' }}>
                Nest<span style={{ color: 'var(--accent)' }}>Mate</span>
              </span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 220 }}>
              Find roommates who match your lifestyle, budget, and personality.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {[ExternalLink, Share2, Mail].map((Icon, i) => (
                <button key={i} style={{ width: 36, height: 36, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ fontFamily: 'Times New Roman', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 16 }}>Platform</h4>
            {[['/', 'Home'], ['/browse', 'Browse Listings'], ['/add-listing', 'Post a Listing'], ['/my-listings', 'My Listings']].map(([href, label]) => (
              <Link key={href} href={href} style={{ display: 'block', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                {label}
              </Link>
            ))}
          </div>

          <div>
            <h4 style={{ fontFamily: 'Times New Roman', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 16 }}>Account</h4>
            {[['/login', 'Log In'], ['/register', 'Sign Up'], ['/my-listings', 'My Profile']].map(([href, label]) => (
              <Link key={href} href={href} style={{ display: 'block', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                {label}
              </Link>
            ))}
          </div>

          <div>
            <h4 style={{ fontFamily: 'Times New Roman', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 16 }}>Stats</h4>
            {[['10K+', 'Active Listings'], ['50K+', 'Happy Roommates'], ['200+', 'Cities'], ['4.9★', 'Rating']].map(([num, label]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontFamily: 'Times New Roman', fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>{num}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
             NestMate © {new Date().getFullYear()}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Privacy · Terms · Cookies</p>
        </div>
      </div>
    </footer>
  );
}
