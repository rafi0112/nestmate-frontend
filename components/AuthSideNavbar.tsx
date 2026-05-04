'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { House, MessageSquare, PlusSquare, BookMarked, User, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const SIDE_NAV_ITEMS = [
  { href: '/household', label: 'Household', icon: House },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/add-listing', label: 'Post Room', icon: PlusSquare },
  { href: '/my-listings', label: 'My Listings', icon: BookMarked },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function AuthSideNavbar() {
  const { currentUser } = useAuth();
  const pathname = usePathname();
  const [pinned, setPinned] = useState(true);

  const expanded = pinned;

  useEffect(() => {
    const body = document.body;
    const className = 'has-auth-sidenav';
    const expandedClass = 'auth-sidenav-expanded';

    body.classList.remove(className, expandedClass);

    if (currentUser) {
      body.classList.add(className);
      if (expanded) body.classList.add(expandedClass);
    }

    return () => body.classList.remove(className, expandedClass);
  }, [currentUser, expanded]);

  if (!currentUser) return null;

  return (
    <>
      <aside
        className="auth-sidenav desktop"
        style={{ width: expanded ? 240 : 72 }}
      >
        <div className="sidenav-head">
          <button
            aria-label={pinned ? 'Collapse side navigation' : 'Expand side navigation'}
            title={pinned ? 'Collapse' : 'Expand'}
            onClick={() => setPinned((v) => !v)}
            className="sidenav-toggle"
          >
            <Menu size={18} />
          </button>
          <span className="sidenav-title" style={{ opacity: expanded ? 1 : 0 }}>
            Workspace
          </span>
        </div>

        <nav className="sidenav-links">
          {SIDE_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className={`sidenav-link ${active ? 'active' : ''} ${expanded ? 'expanded' : 'collapsed'}`} title={label} aria-label={label}>
                <Icon size={18} />
                <span className="sidenav-label" style={{ opacity: expanded ? 1 : 0, filter: expanded ? 'none' : 'blur(4px)' }}>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <style>{`
        .auth-sidenav {
          position: fixed;
          top: 62px;
          left: 0;
          bottom: 0;
          background: color-mix(in srgb, var(--bg-card) 88%, transparent);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-right: 1px solid var(--border);
          transition: width 0.22s ease, transform 0.22s ease;
          z-index: 180;
          overflow: hidden;
        }

        .auth-sidenav.desktop {
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-sm);
        }

        .sidenav-head {
          height: 56px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 12px;
          border-bottom: 1px solid var(--border);
        }

        .sidenav-toggle {
          width: 34px;
          height: 34px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--bg-subtle);
          color: var(--text-primary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }

        .sidenav-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
          white-space: nowrap;
          transition: opacity .16s ease;
        }

        .sidenav-links {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 10px;
        }

        .sidenav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-secondary);
          border-radius: 12px;
          padding: 10px;
          min-height: 42px;
          transition: background .14s ease, color .14s ease;
          white-space: nowrap;
        }

        .sidenav-link.collapsed {
          justify-content: center;
          gap: 0;
          padding: 10px 0;
        }

        .sidenav-link.collapsed svg {
          flex-shrink: 0;
        }

        .sidenav-link.collapsed .sidenav-label {
          display: none;
        }

        .sidenav-link:hover {
          background: var(--bg-subtle);
          color: var(--text-primary);
        }

        .sidenav-link.active {
          background: var(--accent-light);
          color: var(--accent);
          font-weight: 700;
        }

        .sidenav-label {
          font-size: 14px;
          transition: opacity .16s ease, filter .16s ease;
        }

        @media (max-width: 900px) {
          .auth-sidenav.desktop {
            display: none;
          }
        }
      `}</style>
    </>
  );
}