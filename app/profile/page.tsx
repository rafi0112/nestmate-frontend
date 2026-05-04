'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getListings } from '@/lib/api';
import { Listing } from '@/lib/types';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { User, Mail, Edit2, Save, BarChart2, Heart, BookMarked, Star, CheckCircle } from 'lucide-react';

const inp: React.CSSProperties = { width:'100%', padding:'10px 13px', borderRadius:9, border:'1.5px solid var(--border)', background:'var(--bg)', color:'var(--text-primary)', fontFamily:'Times New Roman', fontSize:14, outline:'none', transition:'border-color .15s' };
const lbl: React.CSSProperties = { display:'block', fontSize:11, fontFamily:'Times New Roman', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:7 };

export default function ProfilePage() {
  const { currentUser, logout, updateProfile } = useAuth();
  const [listings, setListings]   = useState<Listing[]>([]);
  const [editing, setEditing]     = useState(false);
  const [name, setName]           = useState('');
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.displayName || '');
    getListings().then(all => setListings(all.filter((l: Listing) => l.userEmail === currentUser.email))).catch(()=>{});
  }, [currentUser]);

  if (!currentUser) return (
    <div style={{ maxWidth:480, margin:'100px auto', textAlign:'center', padding:24 }}>
      <h2 style={{ fontSize:24, fontWeight:700, marginBottom:12 }}>Sign in to view your profile</h2>
      <Link href="/login" style={{ padding:'12px 28px', borderRadius:10, background:'var(--accent)', color:'#fff', fontWeight:700, fontFamily:'Times New Roman' }}>Sign In</Link>
    </div>
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ displayName: name });
      toast.success('Profile updated!');
      setEditing(false);
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const initials = (currentUser.displayName || currentUser.email || 'U').split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2);
  const totalLikes = listings.reduce((s,l)=>(s+(l.likes?.length||0)),0);

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'40px 24px 80px' }}>
      <h1 style={{ fontSize:30, fontWeight:700, marginBottom:32 }}>My Profile</h1>

      <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:24, alignItems:'start' }}>
        {/* Profile card */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:18, padding:'32px 28px', boxShadow:'var(--shadow-sm)', textAlign:'center' }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:800, color:'#fff', fontFamily:'Times New Roman', margin:'0 auto 20px' }}>
            {initials}
          </div>

          {editing ? (
            <div style={{ textAlign:'left', marginBottom:20 }}>
              <label style={lbl}>Display Name</label>
              <input value={name} onChange={e=>setName(e.target.value)} style={inp} placeholder="Your name"
                onFocus={e=>(e.target.style.borderColor='var(--accent)')} onBlur={e=>(e.target.style.borderColor='var(--border)')} />
              <div style={{ display:'flex', gap:8, marginTop:12 }}>
                <button onClick={handleSave} disabled={saving} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px', borderRadius:9, background:saving?'var(--border)':'var(--accent)', color:saving?'var(--text-muted)':'#fff', border:'none', cursor:saving?'not-allowed':'pointer', fontFamily:'Times New Roman', fontWeight:700, fontSize:13 }}>
                  <Save size={13}/>{saving?'Savingâ€¦':'Save'}
                </button>
                <button onClick={()=>setEditing(false)} style={{ flex:1, padding:'10px', borderRadius:9, border:'1px solid var(--border)', background:'var(--bg-subtle)', cursor:'pointer', fontFamily:'Times New Roman', fontWeight:700, fontSize:13, color:'var(--text-secondary)' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>{currentUser.displayName || 'Anonymous'}</h2>
              <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}><Mail size={13}/>{currentUser.email}</p>
              <button onClick={()=>setEditing(true)} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:9, border:'1.5px solid var(--border)', background:'var(--bg-subtle)', color:'var(--text-secondary)', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'Times New Roman', marginBottom:20 }}>
                <Edit2 size={13}/>Edit Name
              </button>
            </>
          )}

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
            {[
              { icon:BookMarked, label:'Listings',    val:listings.length.toString() },
              { icon:Heart,      label:'Total Likes', val:totalLikes.toString() },
            ].map(s=>(
              <div key={s.label} style={{ padding:'12px 8px', background:'var(--bg-subtle)', borderRadius:10, border:'1px solid var(--border)' }}>
                <s.icon size={14} style={{ color:'var(--accent)', marginBottom:4 }}/>
                <p style={{ fontSize:18, fontWeight:700, fontFamily:'Times New Roman', color:'var(--text-primary)' }}>{s.val}</p>
                <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'Times New Roman', textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</p>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <Link href="/my-listings" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'11px', borderRadius:10, background:'var(--accent)', color:'#fff', fontWeight:700, fontFamily:'Times New Roman', fontSize:14 }}>
              <BookMarked size={14}/> My Listings
            </Link>
            <Link href="/household" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'11px', borderRadius:10, border:'1.5px solid var(--border)', color:'var(--text-primary)', fontWeight:700, fontFamily:'Times New Roman', fontSize:14, background:'var(--bg-subtle)' }}>
              My Household
            </Link>
            <button onClick={logout} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'11px', borderRadius:10, border:'1px solid var(--border)', background:'transparent', color:'var(--danger)', fontWeight:700, fontFamily:'Times New Roman', fontSize:14, cursor:'pointer' }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* Activity */}
        <div>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'22px 24px', marginBottom:20, boxShadow:'var(--shadow-xs)' }}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16, fontFamily:'Times New Roman', display:'flex', alignItems:'center', gap:8 }}>
              <BarChart2 size={16} style={{ color:'var(--accent)' }}/> Account Overview
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
              {[
                { label:'Member Since',  val: 'Active',            color:'var(--success)' },
                { label:'Account Type',  val: 'Free',              color:'var(--accent)' },
                { label:'Profile Status',val: 'Complete',          color:'var(--accent-2)' },
              ].map(s=>(
                <div key={s.label} style={{ padding:'14px 16px', background:'var(--bg-subtle)', borderRadius:10, border:'1px solid var(--border)', borderLeft:`3px solid ${s.color}` }}>
                  <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'Times New Roman', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>{s.label}</p>
                  <p style={{ fontSize:15, fontWeight:700, color:s.color, fontFamily:'Times New Roman' }}>{s.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Firebase & MongoDB status
          <div style={{ background:'var(--success-light)', border:'1px solid var(--success)', borderRadius:14, padding:'20px 24px' }}>
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:8, color:'var(--success)', fontFamily:'Syne,serif', display:'flex', alignItems:'center', gap:8 }}>
              <CheckCircle size={15}/> Real Authentication & Database Active
            </h3>
            <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.65 }}>
              âœ… <strong>Firebase Authentication</strong> â€” Real email/password and Google Sign-In enabled<br/>
              âœ… <strong>MongoDB Atlas</strong> â€” All listings and data stored in real database<br/>
              âœ… <strong>No Mock Data</strong> â€” 100% production-ready with live data
            </p>
          </div> */}
        </div>
      </div>

      <style>{`@media(max-width:768px){div[style*="grid-template-columns: 340px"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
