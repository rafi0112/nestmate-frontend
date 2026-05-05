'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Hash, Copy, CheckCircle, Users, ShoppingCart, CreditCard, Utensils,
  BarChart2, Plus, X, Wallet, Calendar,
  TrendingUp, AlertCircle, Check, UserPlus, Loader2, Home
} from 'lucide-react';
import {
  createNotification, getHouseholdByMember, getNotifications, createHousehold, joinHousehold,
  getHouseholds,
  getLedger, addLedgerEntry, deleteLedgerEntry,
  getMeals, upsertMeal,
  getPayments, createPayment,
} from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Household { _id: string; listingId: string; listingTitle: string; joinCode: string; members?: string[]; memberUids?: string[]; monthlyFee: number; ownerEmail: string; }
interface HouseholdNotification {
  _id?: string;
  householdId?: string;
  fromEmail?: string;
  toEmail?: string;
  type?: string;
  title?: string;
  message?: string;
  createdAt?: string;
}
interface LedgerEntry { _id: string; householdId: string; item: string; amount: number; date: string; paidBy: string; }
interface MealEntry   { _id: string; householdId: string; userEmail: string; date: string; meals: number; guests: number; }
interface Payment     { _id: string; householdId: string; fromEmail: string; toEmail: string; amount: number; note: string; date: string; }

const TABS = [
  { id:'ledger',   label:'Meal Ledger',        icon: ShoppingCart },
  { id:'dues',     label:'Dues & Payments',    icon: CreditCard },
  { id:'meals',    label:'Daily Meals',         icon: Utensils },
  { id:'snapshot', label:'Fair-Share Snapshot', icon: BarChart2 },
];

function nameOf(email: string) {
  return email.split('@')[0].replace(/[._-]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
}
function todayStr() { return new Date().toISOString().split('T')[0]; }
function getHouseholdMembers(hh: Household | null | undefined) {
  return hh?.memberUids ?? hh?.members ?? [];
}

// Shared input style
const inp: React.CSSProperties = { width:'100%', padding:'10px 13px', borderRadius:9, border:'1.5px solid var(--border)', background:'var(--bg)', color:'var(--text-primary)', fontFamily:'Times New Roman', fontSize:14, outline:'none', transition:'border-color .15s' };
const lbl: React.CSSProperties = { display:'block', fontSize:11, fontFamily:'Times New Roman', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:7 };

function focusAcc(e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement>) { e.target.style.borderColor='var(--accent)'; }
function blurBorder(e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement>) { e.target.style.borderColor='var(--border)'; }

// ─── Meal Ledger ─────────────────────────────────────────────────────────────
function MealLedger({ hh, myEmail }: { hh: Household; myEmail: string }) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ item:'', amount:'', date:todayStr() });

  const load = useCallback(async () => {
    try { setEntries(await getLedger(hh._id)); } catch { toast.error('Could not load ledger'); }
    finally { setLoading(false); }
  }, [hh._id]);

  useEffect(() => { load(); }, [load]);

  const addEntry = async () => {
    if (!form.item.trim() || !form.amount) return toast.error('Fill item and amount');
    try {
      const e = await addLedgerEntry({ householdId:hh._id, item:form.item.trim(), amount:Number(form.amount), date:form.date, paidBy:myEmail });
      setEntries(prev => [e, ...prev]);
      setForm({ item:'', amount:'', date:todayStr() });
      setAdding(false);
      toast.success('Entry added');
    } catch { toast.error('Failed to add entry'); }
  };

  const removeEntry = async (id: string) => {
    try { await deleteLedgerEntry(id); setEntries(prev => prev.filter(e => e._id !== id)); toast.success('Removed'); }
    catch { toast.error('Could not delete'); }
  };

  const members = getHouseholdMembers(hh);
  const total = entries.reduce((s,e) => s+e.amount, 0);
  const perPerson = members.length > 0 ? total/members.length : 0;
  const thisWeek = entries.filter(e => (Date.now()-new Date(e.date).getTime()) < 7*86400000).reduce((s,e)=>s+e.amount,0);

  // Group by week label
  const byWeek: Record<string, LedgerEntry[]> = {};
  entries.forEach(e => {
    const d = new Date(e.date); const wk = `Week of ${new Date(d.setDate(d.getDate()-d.getDay())).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}`;
    if (!byWeek[wk]) byWeek[wk] = []; byWeek[wk].push(e);
  });

  return (
    <div>
      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22 }}>
        {[
          { l:'Total Market Spend',                         v:`৳${total.toLocaleString()}`,        c:'var(--accent)' },
          { l:`Per Person (${members.length} members)`,  v:`৳${perPerson.toFixed(0)}`,           c:'var(--accent-2)' },
          { l:'This Week',                                  v:`৳${thisWeek.toLocaleString()}`,      c:'var(--gold)' },
        ].map(c => (
          <div key={c.l} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px', boxShadow:'var(--shadow-xs)', borderLeft:`3px solid ${c.c}` }}>
            <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'Syne,serif', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>{c.l}</p>
            <p style={{ fontSize:22, fontWeight:700, color:c.c, fontFamily:'Times New Roman' }}>{c.v}</p>
          </div>
        ))}
      </div>

      {/* Add form */}
      {adding ? (
        <div style={{ background:'var(--accent-light)', border:'1.5px solid var(--accent)', borderRadius:12, padding:20, marginBottom:18 }}>
          <p style={{ fontFamily:'Times New Roman', fontWeight:700, fontSize:14, marginBottom:14, color:'var(--accent)' }}>New Market Entry</p>
          <div className="ledger-add-form" style={{ display:'grid', gridTemplateColumns:'1fr 120px 150px auto', gap:10, alignItems:'end' }}>
            <div>
              <label style={lbl}>Item / Description</label>
              <input value={form.item} onChange={e=>setForm(f=>({...f,item:e.target.value}))} placeholder="Rice, oil, vegetables…" style={inp} onFocus={focusAcc} onBlur={blurBorder} />
            </div>
            <div>
              <label style={lbl}>Amount (৳)</label>
              <input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0" style={inp} onFocus={focusAcc} onBlur={blurBorder} />
            </div>
            <div>
              <label style={lbl}>Date</label>
              <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inp} onFocus={focusAcc} onBlur={blurBorder} />
            </div>
            <div className="ledger-add-actions" style={{ display:'flex', gap:8, paddingBottom:1, flexWrap:'wrap' }}>
              <button onClick={addEntry} style={{ display:'flex', alignItems:'center', gap:5, padding:'10px 16px', borderRadius:9, background:'var(--accent)', color:'#fff', border:'none', cursor:'pointer', fontFamily:'Times New Roman', fontWeight:700, fontSize:13 }}><Check size={13}/>Add</button>
              <button onClick={()=>setAdding(false)} style={{ padding:'10px 12px', borderRadius:9, border:'1px solid var(--border)', background:'var(--bg-subtle)', cursor:'pointer', color:'var(--text-muted)' }}><X size={13}/></button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={()=>setAdding(true)} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:9, background:'var(--accent)', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'Times New Roman', marginBottom:18 }}>
          <Plus size={13}/> Add Market Entry
        </button>
      )}

      {/* Entries */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}><Loader2 size={28} style={{ color:'var(--accent)', animation:'spin 1s linear infinite' }}/></div>
      ) : Object.keys(byWeek).length===0 ? (
        <p style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)', fontSize:14, fontStyle:'italic' }}>No market entries yet.</p>
      ) : Object.entries(byWeek).map(([week, wEntries]) => (
        <div key={week} style={{ marginBottom:20 }}>
          <p style={{ fontSize:12, fontFamily:'Times New Roman', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
            <Calendar size={12}/>{week}
                <span style={{ marginLeft:'auto', color:'var(--accent)', fontSize:13, fontFamily:'Times New Roman', fontWeight:700 }}>৳{wEntries.reduce((s,e)=>s+e.amount,0).toLocaleString()}</span>
          </p>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            {wEntries.map((entry,i) => (
              <div key={entry._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:i<wEntries.length-1?'1px solid var(--border)':'none' }}>
                <ShoppingCart size={14} style={{ color:'var(--accent)', flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', marginBottom:2 }}>{entry.item}</p>
                  <p style={{ fontSize:11, color:'var(--text-muted)' }}>
                    {new Date(entry.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})} · Paid by {nameOf(entry.paidBy)}
                  </p>
                </div>
                <span style={{ fontFamily:'Times New Roman', fontWeight:700, fontSize:15, color:'var(--text-primary)' }}>৳{entry.amount.toLocaleString()}</span>
                <span style={{ fontSize:11, color:'var(--text-muted)' }}>÷{members.length} = ৳{(entry.amount/members.length).toFixed(0)}</span>
                {entry.paidBy===myEmail && (
                  <button onClick={()=>removeEntry(entry._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4, borderRadius:4 }}><X size={13}/></button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Dues & Payments ─────────────────────────────────────────────────────────
function DuesPayments({ hh, myEmail }: { hh: Household; myEmail: string }) {
  const [ledger,   setLedger]   = useState<LedgerEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paying,   setPaying]   = useState(false);

  useEffect(() => {
    getLedger(hh._id).then(setLedger).catch(()=>{});
    getPayments(hh._id).then(setPayments).catch(()=>{});
  }, [hh._id]);

  const marketTotal = ledger.reduce((s,e)=>s+e.amount, 0);
  const members = getHouseholdMembers(hh);
  const perPersonMarket = members.length>0 ? marketTotal/members.length : 0;
  const perPersonFee    = members.length>0 ? hh.monthlyFee/members.length : 0;
  const totalOwed       = perPersonFee + perPersonMarket;
  const myPaid          = payments.filter(p=>p.fromEmail===myEmail).reduce((s,p)=>s+p.amount, 0);
  const outstanding     = Math.max(0, totalOwed - myPaid);

  const handlePayNow = async () => {
    if (outstanding<=0) return toast.success('No outstanding dues!');
    setPaying(true);
    try {
      const p = await createPayment({ householdId:hh._id, fromEmail:myEmail, amount:outstanding, note:'Monthly dues payment' });
      setPayments(prev=>[p,...prev]);
      toast.success(`৳${outstanding.toFixed(0)} marked as paid!`);
    } catch { toast.error('Payment failed'); }
    finally { setPaying(false); }
  };

  const memberStats = members.map(m => ({
    email: m,
    paid: payments.filter(p=>p.fromEmail===m).reduce((s,p)=>s+p.amount,0),
  }));

  return (
    <div>
      {/* Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:14, marginBottom:24 }}>
        {[
          { l:'Room Fee / Person', v:`৳${perPersonFee.toFixed(0)}`,    sub:`৳${hh.monthlyFee.toLocaleString()} ÷ ${members.length}`, c:'var(--accent)' },
          { l:'Market Share',      v:`৳${perPersonMarket.toFixed(0)}`, sub:'your grocery portion',                                       c:'var(--accent-2)' },
          { l:'Total Owed',        v:`৳${totalOwed.toFixed(0)}`,       sub:'fee + market this month',                                    c:'var(--gold)' },
          { l:'You Paid',          v:`৳${myPaid.toFixed(0)}`,          sub:`${payments.filter(p=>p.fromEmail===myEmail).length} payment(s)`, c:'var(--success)' },
          { l:'Outstanding Due',   v:`৳${outstanding.toFixed(0)}`,     sub:outstanding>0?'tap Pay Now to settle':'✓ All clear!',         c:outstanding>0?'var(--danger)':'var(--success)' },
        ].map(c => (
          <div key={c.l} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px', borderLeft:`3px solid ${c.c}` }}>
            <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'Syne,serif', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>{c.l}</p>
            <p style={{ fontSize:22, fontWeight:700, color:c.c, fontFamily:'Times New Roman', marginBottom:3 }}>{c.v}</p>
            <p style={{ fontSize:11, color:'var(--text-muted)', fontStyle:'italic' }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Pay Now */}
      {outstanding>0 ? (
        <div style={{ background:'var(--danger-light)', border:'1.5px solid var(--danger)', borderRadius:12, padding:'18px 22px', marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <AlertCircle size={16} style={{ color:'var(--danger)' }}/>
              <p style={{ fontFamily:'Times New Roman', fontWeight:700, fontSize:15, color:'var(--danger)' }}>You owe ৳{outstanding.toFixed(0)}</p>
            </div>
            <p style={{ fontSize:13, color:'var(--text-secondary)' }}>Room fee + market share for this month</p>
          </div>
          <button onClick={handlePayNow} disabled={paying}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 26px', borderRadius:10, background:paying?'var(--border)':'var(--danger)', color:paying?'var(--text-muted)':'#fff', border:'none', fontFamily:'Times New Roman', fontWeight:700, fontSize:15, cursor:paying?'not-allowed':'pointer', transition:'all .15s' }}>
            <Wallet size={16}/>{paying?'Processing…':`Pay Now ৳${outstanding.toFixed(0)}`}
          </button>
        </div>
      ) : (
        <div style={{ background:'var(--success-light)', border:'1px solid var(--success)', borderRadius:12, padding:'14px 20px', marginBottom:24, display:'flex', alignItems:'center', gap:10 }}>
          <CheckCircle size={18} style={{ color:'var(--success)' }}/>
          <p style={{ fontSize:14, fontWeight:600, color:'var(--success)' }}>All dues settled — you're up to date!</p>
        </div>
      )}

      {/* All members */}
      <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14, fontFamily:'Times New Roman', color:'var(--text-secondary)' }}>All Members — Due This Month</h3>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', marginBottom:24 }}>
        {memberStats.map((m,i) => {
          const owes = Math.max(0, totalOwed - m.paid);
          return (
            <div key={m.email} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', borderBottom:i<memberStats.length-1?'1px solid var(--border)':'none' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:m.email===myEmail?'var(--accent)':'var(--bg-subtle)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:m.email===myEmail?'#fff':'var(--text-secondary)', fontFamily:'Times New Roman', flexShrink:0 }}>{nameOf(m.email)[0]}</div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{nameOf(m.email)}{m.email===myEmail?<span style={{ fontSize:11, color:'var(--accent)', fontStyle:'italic' }}> (you)</span>:''}</p>
                <p style={{ fontSize:11, color:'var(--text-muted)' }}>Paid: ৳{m.paid.toFixed(0)}</p>
              </div>
              <p style={{ fontSize:15, fontWeight:700, fontFamily:'Times New Roman', color:owes>0?'var(--danger)':'var(--success)' }}>{owes>0?`৳${owes.toFixed(0)} due`:'✓ Paid'}</p>
            </div>
          );
        })}
      </div>

      {/* Payment history */}
      {payments.length>0 && (
        <>
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14, fontFamily:'Times New Roman', color:'var(--text-secondary)' }}>Payment History</h3>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
            {payments.map((p,i) => (
              <div key={p._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 18px', borderBottom:i<payments.length-1?'1px solid var(--border)':'none' }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--success-light)', display:'flex', alignItems:'center', justifyContent:'center' }}><Check size={14} style={{ color:'var(--success)' }}/></div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:600 }}>{nameOf(p.fromEmail)} paid ৳{p.amount.toFixed(0)}</p>
                  <p style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(p.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})} · {p.note}</p>
                </div>
                <span style={{ padding:'3px 10px', borderRadius:100, fontSize:11, fontWeight:700, fontFamily:'Times New Roman', background:'var(--success-light)', color:'var(--success)' }}>Paid</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Daily Meals ─────────────────────────────────────────────────────────────
function DailyMeals({ hh, myEmail }: { hh: Household; myEmail: string }) {
  const [mealLog, setMealLog] = useState<MealEntry[]>([]);
  const [form, setForm] = useState({ meals:'3', guests:'0' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { getMeals(hh._id).then(setMealLog).catch(()=>{}); }, [hh._id]);

  const todayEntry = mealLog.find(m => m.date===todayStr() && m.userEmail===myEmail);

  const submitMeals = async () => {
    setSaving(true);
    try {
      const updated = await upsertMeal({ householdId:hh._id, userEmail:myEmail, date:todayStr(), meals:Number(form.meals), guests:Number(form.guests) });
      setMealLog(prev => {
        const idx = prev.findIndex(m=>m.date===todayStr()&&m.userEmail===myEmail);
        return idx>=0 ? prev.map((m,i)=>i===idx?updated:m) : [updated,...prev];
      });
      toast.success(`${Number(form.meals)+Number(form.guests)} meal units logged for today`);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const myLog = mealLog.filter(m=>m.userEmail===myEmail);

  return (
    <div>
      <div style={{ background:'var(--accent-light)', border:'1.5px solid var(--accent)', borderRadius:14, padding:'22px 24px', marginBottom:24 }}>
        <p style={{ fontFamily:'Times New Roman', fontWeight:700, fontSize:16, color:'var(--accent)', marginBottom:4 }}>Today's Meal Log</p>
        <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:20 }}>{new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
          {[
            { label:'My meals today', key:'meals' as const, desc:'0 = skipping · 3 = full day' },
            { label:'Guest meals',    key:'guests' as const, desc:'Extra meal units for your guests' },
          ].map(({ label, key, desc }) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <div style={{ display:'flex', gap:8 }}>
                {['0','1','2','3'].map(n => (
                  <button key={n} onClick={()=>setForm(f=>({...f,[key]:n}))}
                    style={{ flex:1, padding:'10px 0', borderRadius:9, border:`2px solid ${form[key]===n?'var(--accent)':'var(--border)'}`, background:form[key]===n?'var(--accent)':'var(--bg-card)', color:form[key]===n?'#fff':'var(--text-secondary)', fontFamily:'Times New Roman', fontWeight:700, fontSize:16, cursor:'pointer', transition:'all .12s' }}>
                    {n}
                  </button>
                ))}
              </div>
              <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:5, fontStyle:'italic' }}>{desc}</p>
            </div>
          ))}
        </div>

        <div style={{ background:'var(--bg-card)', borderRadius:10, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:12, border:'1px solid var(--border)' }}>
          <Utensils size={16} style={{ color:'var(--accent)' }}/>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{Number(form.meals)+Number(form.guests)} total meal units today</p>
            <p style={{ fontSize:12, color:'var(--text-muted)' }}>{form.meals} personal + {form.guests} guest</p>
          </div>
        </div>

        <button onClick={submitMeals} disabled={saving}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'11px 24px', borderRadius:10, background:saving?'var(--border)':'var(--accent)', color:saving?'var(--text-muted)':'#fff', border:'none', cursor:saving?'not-allowed':'pointer', fontFamily:'Times New Roman', fontWeight:700, fontSize:14 }}>
          {saving?<Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/>:<Check size={15}/>}
          {todayEntry?'Update Today':'Log Meals'}
        </button>
      </div>

      <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14, fontFamily:'Times New Roman', color:'var(--text-secondary)' }}>My Meal History</h3>
      {myLog.length===0 ? (
        <p style={{ textAlign:'center', padding:'30px 0', color:'var(--text-muted)', fontSize:14, fontStyle:'italic' }}>No meals logged yet.</p>
      ) : (
        <div className="meal-history-wrap" style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
          <div className="meal-history-header" style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', padding:'10px 18px', background:'var(--bg-subtle)', borderBottom:'1px solid var(--border)' }}>
            {['Date','My Meals','Guests','Total Units'].map(h=>(
              <p key={h} style={{ fontSize:11, fontFamily:'Times New Roman', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-muted)', textAlign:h!=='Date'?'center':'left' }}>{h}</p>
            ))}
          </div>
          {[...myLog].slice(0,14).map((m,i,arr)=>(
            <div key={m._id} className="meal-history-row" style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', padding:'12px 18px', borderBottom:i<arr.length-1?'1px solid var(--border)':'none', alignItems:'center' }}>
              <p className="meal-history-cell" data-label="Date" style={{ fontSize:13 }}>{new Date(m.date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}</p>
              <p className="meal-history-cell" data-label="My Meals" style={{ fontSize:14, fontWeight:700, color:'var(--accent)', fontFamily:'Times New Roman', textAlign:'center', width:90 }}>{m.meals}</p>
              <p className="meal-history-cell" data-label="Guests" style={{ fontSize:14, fontWeight:700, color:'var(--accent-2)', fontFamily:'Times New Roman', textAlign:'center', width:90 }}>{m.guests}</p>
              <p className="meal-history-cell" data-label="Total Units" style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', fontFamily:'Times New Roman', textAlign:'center', width:110 }}>{m.meals+m.guests}</p>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @media (max-width: 640px) {
          .meal-history-header {
            display: none !important;
          }
          .meal-history-row {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px 12px;
            padding: 14px 14px !important;
            align-items: start !important;
          }
          .meal-history-cell {
            width: auto !important;
            text-align: left !important;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
            font-size: 13px !important;
          }
          .meal-history-cell::before {
            content: attr(data-label);
            display: block;
            font-size: 10px;
            font-family: Syne,serif;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.07em;
            color: var(--text-muted);
          }
          .meal-history-cell:first-child {
            grid-column: 1 / -1;
          }
          .meal-history-cell:first-child::before {
            margin-bottom: 2px;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Fair-Share Snapshot ─────────────────────────────────────────────────────
function FairShareSnapshot({ hh, myEmail }: { hh: Household; myEmail: string }) {
  const [ledger,  setLedger]  = useState<LedgerEntry[]>([]);
  const [meals,   setMeals]   = useState<MealEntry[]>([]);

  useEffect(() => {
    getLedger(hh._id).then(setLedger).catch(()=>{});
    getMeals(hh._id).then(setMeals).catch(()=>{});
  }, [hh._id]);

  const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-30);
  const recentMeals = meals.filter(m=>new Date(m.date)>=cutoff);
  const today = todayStr();
  const todayMeals = meals.filter(m => m.date === today);
  const marketTotal = ledger.reduce((s,e)=>s+e.amount, 0);
  const totalAllUnits = recentMeals.reduce((s,m)=>s+m.meals+m.guests, 0);
  const myMeals = recentMeals.filter(m=>m.userEmail===myEmail);
  const myUnits = myMeals.reduce((s,m)=>s+m.meals+m.guests, 0);
  const mealShare = totalAllUnits>0 ? (myUnits/totalAllUnits)*marketTotal : 0;
  const members = getHouseholdMembers(hh);
  const perPersonFee = members.length > 0 ? hh.monthlyFee/members.length : 0;
  const totalDue = perPersonFee + mealShare;

  const todayByEmail = new Map(todayMeals.map(meal => [meal.userEmail, meal]));
  const todayBoard = members.map(member => {
    const meal = todayByEmail.get(member);
    return {
      email: member,
      meals: meal?.meals ?? 0,
      guests: meal?.guests ?? 0,
      total: (meal?.meals ?? 0) + (meal?.guests ?? 0),
      logged: Boolean(meal),
    };
  });

  const memberStats = members.map(m=>{
    const mMeals = recentMeals.filter(me=>me.userEmail===m);
    const units = mMeals.reduce((s,me)=>s+me.meals+me.guests, 0);
    const share = totalAllUnits>0 ? (units/totalAllUnits)*marketTotal : (members.length > 0 ? marketTotal/members.length : 0);
    return { email:m, units, share };
  });

  return (
    <div>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 22px', marginBottom:24, boxShadow:'var(--shadow-xs)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap', marginBottom:12 }}>
          <div>
        <p style={{ fontFamily:'Times New Roman', fontWeight:700, fontSize:16, color:'var(--accent)', marginBottom:4 }}>Today's Meal Board</p>
            <p style={{ fontSize:13, color:'var(--text-secondary)' }}>Everyone can see who logged meals for today.</p>
          </div>
          <span style={{ padding:'6px 10px', borderRadius:999, background:'var(--accent-light)', color:'var(--accent)', fontSize:11, fontFamily:'Times New Roman', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' }}>{new Date().toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}</span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <div style={{ minWidth:520, border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1.3fr .75fr .75fr .75fr .9fr', padding:'10px 14px', background:'var(--bg-subtle)', borderBottom:'1px solid var(--border)' }}>
              {['Member','Meals','Guests','Total','Status'].map(h=>(
                <p key={h} style={{ fontSize:11, fontFamily:'Times New Roman', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-muted)' }}>{h}</p>
              ))}
            </div>
            {todayBoard.length===0 ? (
              <div style={{ padding:'16px 14px', color:'var(--text-muted)', fontSize:13, fontStyle:'italic' }}>No household members found.</div>
            ) : todayBoard.map((row,i)=> (
              <div key={row.email} style={{ display:'grid', gridTemplateColumns:'1.3fr .75fr .75fr .75fr .9fr', gap:10, padding:'12px 14px', borderBottom:i<todayBoard.length-1?'1px solid var(--border)':'none', alignItems:'center', background:row.logged?'var(--accent-light)':'transparent' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                  <div style={{ width:30, height:30, borderRadius:'50%', background:row.logged?'var(--accent)':'var(--bg-subtle)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:row.logged?'#fff':'var(--text-secondary)', fontFamily:'Times New Roman', flexShrink:0 }}>{nameOf(row.email)[0]}</div>
                  <p style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nameOf(row.email)}{row.email===myEmail?' (you)':''}</p>
                </div>
                <p style={{ fontSize:14, fontWeight:700, color:'var(--accent)', fontFamily:'Times New Roman', textAlign:'center' }}>{row.meals}</p>
                <p style={{ fontSize:14, fontWeight:700, color:'var(--accent-2)', fontFamily:'Times New Roman', textAlign:'center' }}>{row.guests}</p>
                <p style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', fontFamily:'Times New Roman', textAlign:'center' }}>{row.total}</p>
                <p style={{ fontSize:12, fontWeight:700, color:row.logged?'var(--success)':'var(--text-muted)', textAlign:'right', fontFamily:'Times New Roman' }}>{row.logged?'Logged':'Pending'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'24px 26px', marginBottom:24, borderLeft:'4px solid var(--accent)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
          <TrendingUp size={18} style={{ color:'var(--accent)' }}/>
          <p style={{ fontFamily:'Times New Roman', fontWeight:700, fontSize:16, color:'var(--accent)' }}>Your Fair-Share Summary — Last 30 Days</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:14 }}>
          {[
            { l:'My Meal Units',  v:String(myUnits),             icon:Utensils,     c:'var(--accent)' },
            { l:'Total Units',    v:String(totalAllUnits),        icon:Users,        c:'var(--accent-2)' },
            { l:'My Meal Cost',   v:`৳${mealShare.toFixed(0)}`,  icon:ShoppingCart, c:'var(--gold)' },
            { l:'Room Fee Share', v:`৳${perPersonFee.toFixed(0)}`,icon:CreditCard,  c:'var(--success)' },
            { l:'Total I Owe',    v:`৳${totalDue.toFixed(0)}`,   icon:Wallet,       c:'var(--danger)' },
          ].map(c=>(
            <div key={c.l} style={{ background:'var(--bg-subtle)', borderRadius:10, padding:'14px 16px', border:'1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                <c.icon size={12} style={{ color:c.c }}/>
                <p style={{ fontSize:10, fontFamily:'Times New Roman', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-muted)' }}>{c.l}</p>
              </div>
              <p style={{ fontSize:20, fontWeight:700, color:c.c, fontFamily:'Times New Roman' }}>{c.v}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop:18, padding:'12px 16px', background:'var(--accent-light)', borderRadius:9, fontSize:12, color:'var(--accent)', lineHeight:1.6 }}>
          <strong>Formula:</strong> Total = Room fee (৳{hh.monthlyFee.toLocaleString()} ÷ {members.length} = ৳{perPersonFee.toFixed(0)}) + Meal cost (৳{marketTotal.toFixed(0)} × {myUnits}/{totalAllUnits||1} units = ৳{mealShare.toFixed(0)})
        </div>
      </div>

      <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14, fontFamily:'Times New Roman', color:'var(--text-secondary)' }}>Household Comparison</h3>
      <div className="household-compare-wrap" style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
        <div className="household-compare-header" style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto 1fr', padding:'10px 18px', background:'var(--bg-subtle)', borderBottom:'1px solid var(--border)', gap:12 }}>
          {['Member','Meal Units','Market Share','Total Due','Details'].map(h=>(
            <p key={h} style={{ fontSize:11, fontFamily:'Times New Roman', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-muted)', textAlign:h==='Member'?'left':h==='Details'?'left':'right' }}>{h}</p>
          ))}
        </div>
        {memberStats.map((m,i)=>(
          <div key={m.email} className="household-compare-row" style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto 1fr', padding:'13px 18px', borderBottom:i<memberStats.length-1?'1px solid var(--border)':'none', background:m.email===myEmail?'var(--accent-light)':'transparent', alignItems:'center', gap:12 }}>
            <div className="household-compare-cell" data-label="Member" style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
              <div style={{ width:30, height:30, borderRadius:'50%', background:m.email===myEmail?'var(--accent)':'var(--bg-subtle)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:m.email===myEmail?'#fff':'var(--text-secondary)', fontFamily:'Times New Roman' }}>{nameOf(m.email)[0]}</div>
              <p style={{ fontSize:14, fontWeight:m.email===myEmail?700:500, color:'var(--text-primary)' }}>{nameOf(m.email)}{m.email===myEmail?' (you)':''}</p>
            </div>
            <p className="household-compare-cell" data-label="Meal Units" style={{ fontSize:14, fontWeight:700, color:'var(--accent)', fontFamily:'Times New Roman', textAlign:'right', paddingRight:24, width:110 }}>{m.units}</p>
            <p className="household-compare-cell" data-label="Market Share" style={{ fontSize:14, fontWeight:700, color:'var(--accent-2)', fontFamily:'Times New Roman', textAlign:'right', paddingRight:24, width:120 }}>৳{m.share.toFixed(0)}</p>
            <p className="household-compare-cell" data-label="Total Due" style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', fontFamily:'Times New Roman', textAlign:'right', width:120 }}>৳{(perPersonFee+m.share).toFixed(0)}</p>
            <div className="household-compare-cell" data-label="Details" style={{ minWidth:0 }}>
              <p style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5, textAlign:'left' }}>
                Meal units and market share for the last 30 days.
              </p>
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @media (max-width: 640px) {
          .ledger-add-form {
            grid-template-columns: 1fr !important;
          }
          .ledger-add-actions {
            width: 100%;
          }
          .ledger-add-actions button {
            flex: 1 1 120px;
          }
          .household-compare-header {
            display: none !important;
          }
          .household-compare-row {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
            padding: 14px 14px !important;
            align-items: start !important;
          }
          .household-compare-cell {
            width: 100% !important;
            text-align: left !important;
            padding-right: 0 !important;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
          .household-compare-cell::before {
            content: attr(data-label);
            display: block;
            font-size: 10px;
            font-family: Syne,serif;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.07em;
            color: var(--text-muted);
          }
          .household-compare-cell p {
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HouseholdPage() {
  const { currentUser } = useAuth();
  const [hh, setHh] = useState<Household|null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ledger');
  const [copied, setCopied] = useState(false);
  const [joinModal, setJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinPreview, setJoinPreview] = useState<Household | null>(null);
  const [joinPreviewNotifications, setJoinPreviewNotifications] = useState<HouseholdNotification[]>([]);
  const [joinLookupLoading, setJoinLookupLoading] = useState(false);
  const [joinAgreementAccepted, setJoinAgreementAccepted] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ listingTitle:'', monthlyFee:'' });
  const [notifications, setNotifications] = useState<HouseholdNotification[]>([]);

  useEffect(() => {
    if (!currentUser?.email) { setLoading(false); return; }
    getHouseholdByMember(currentUser.email)
      .then(h => setHh(h))
      .catch(()=>setHh(null))
      .finally(()=>setLoading(false));
  }, [currentUser]);

  useEffect(() => {
    if (!hh?._id) {
      setNotifications([]);
      return;
    }
    getNotifications({ householdId: hh._id })
      .then(items => setNotifications(Array.isArray(items) ? items as HouseholdNotification[] : []))
      .catch(() => setNotifications([]));
  }, [hh?._id]);

  const handleCreate = async () => {
    if (!createForm.listingTitle.trim()) return toast.error('Enter a household name');
    setCreating(true);
    try {
      const h = await createHousehold({ listingId:'', ownerEmail:currentUser!.email!, listingTitle:createForm.listingTitle, monthlyFee:Number(createForm.monthlyFee)||0 });
      setHh(h);
      toast.success('Household created! Share the code with your roommates.');
    } catch { toast.error('Failed to create household'); }
    finally { setCreating(false); }
  };

  const handleJoin = async () => {
    if (!joinPreview) return toast.error('Review the household agreement first');
    if (!joinAgreementAccepted) return toast.error('Accept the agreement before joining');
    try {
      const h = await joinHousehold(joinCode, currentUser!.email!, currentUser?.uid, true);
      if (h.error) throw new Error(h.error);
      await createNotification({
        householdId: h._id,
        fromEmail: currentUser!.email!,
        toEmail: currentUser!.email!,
        type: 'agreement_signed',
        title: 'Agreement signed',
        message: `${currentUser.displayName || currentUser!.email!} accepted the household agreement.`,
      });
      setHh(h); setJoinModal(false);
      setJoinPreview(null);
      setJoinPreviewNotifications([]);
      setJoinAgreementAccepted(false);
      toast.success('Joined household!');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Invalid code'); }
  };

  const reviewJoinAgreement = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 5) return toast.error('Enter a valid 6-character code');
    setJoinLookupLoading(true);
    try {
      const households = await getHouseholds();
      const household = Array.isArray(households)
        ? households.find(item => (item?.joinCode || '').toUpperCase() === code)
        : null;

      if (!household) {
        setJoinPreview(null);
        setJoinPreviewNotifications([]);
        setJoinAgreementAccepted(false);
        toast.error('No household found for that code');
        return;
      }

      const typedHousehold = household as Household;
      setJoinPreview(typedHousehold);
      setJoinAgreementAccepted(false);

      const items = await getNotifications({ householdId: typedHousehold._id });
      setJoinPreviewNotifications(Array.isArray(items) ? items as HouseholdNotification[] : []);
    } catch {
      toast.error('Could not load the household agreement');
    } finally {
      setJoinLookupLoading(false);
    }
  };

  const copyCode = () => {
    if (!hh?.joinCode) return;
    navigator.clipboard.writeText(hh.joinCode);
    setCopied(true); toast.success('Join code copied!');
    setTimeout(()=>setCopied(false), 2500);
  };

  if (!currentUser) return (
    <div className="household-page" style={{ maxWidth:480, margin:'100px auto', textAlign:'center', padding:24 }}>
      <h2 style={{ fontSize:26, fontWeight:700, marginBottom:12 }}>Sign in to view your household</h2>
      <Link href="/login" style={{ padding:'12px 28px', borderRadius:10, background:'var(--accent)', color:'#fff', fontWeight:700, fontFamily:'Times New Roman' }}>Sign In</Link>
    </div>
  );

  if (loading) return (
    <div className="household-page" style={{ maxWidth:1100, margin:'40px auto', padding:'0 24px' }}>
      {[200,160,400].map((h,i)=><div key={i} className="skeleton" style={{ height:h, marginBottom:20 }}/>)}
    </div>
  );

  const members = getHouseholdMembers(hh);
  const signedMembers = Array.from(new Set(
    notifications
      .filter(item => item.type === 'agreement_signed')
      .map(item => item.fromEmail || item.toEmail)
      .filter((email): email is string => Boolean(email))
  ));
  const pendingAgreementMembers = members.filter(member => !signedMembers.includes(member));
  const myAgreementSigned = Boolean(currentUser?.email && signedMembers.includes(currentUser.email));
  const previewMembers = getHouseholdMembers(joinPreview);
  const previewSignedMembers = Array.from(new Set(
    joinPreviewNotifications
      .filter(item => item.type === 'agreement_signed')
      .map(item => item.fromEmail || item.toEmail)
      .filter((email): email is string => Boolean(email))
  ));

  // No household yet
  if (!hh) return (
    <div className="household-page" style={{ maxWidth:560, margin:'80px auto', padding:'0 24px' }}>
      <div className="household-panel household-empty-panel" style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, padding:'40px 36px', boxShadow:'var(--shadow-md)' }}>
        <div style={{ width:56, height:56, borderRadius:14, background:'var(--accent-light)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
          <Home size={26} style={{ color:'var(--accent)' }}/>
        </div>
        <h1 style={{ fontSize:28, fontWeight:700, marginBottom:8 }}>No Household Yet</h1>
        <p style={{ color:'var(--text-secondary)', marginBottom:32, lineHeight:1.6 }}>Create a new household for your room, or join an existing one using a 6-character code from your roommate.</p>

        <div className="household-panel household-create-panel" style={{ marginBottom:28, padding:'24px', background:'var(--bg-subtle)', borderRadius:14, border:'1px solid var(--border)' }}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16, fontFamily:'Times New Roman' }}>Create a Household</h3>
          <div style={{ marginBottom:12 }}>
            <label style={lbl}>Household / House Name</label>
            <input value={createForm.listingTitle} onChange={e=>setCreateForm(f=>({...f,listingTitle:e.target.value}))} placeholder="e.g. Green Villa — Mirpur 10" style={inp} onFocus={focusAcc} onBlur={blurBorder}/>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={lbl}>Monthly Rent (৳)</label>
            <input type="number" value={createForm.monthlyFee} onChange={e=>setCreateForm(f=>({...f,monthlyFee:e.target.value}))} placeholder="e.g. 18000" style={inp} onFocus={focusAcc} onBlur={blurBorder}/>
          </div>
          <button onClick={handleCreate} disabled={creating} style={{ width:'100%', padding:'12px', borderRadius:10, background:creating?'var(--border)':'var(--accent)', color:creating?'var(--text-muted)':'#fff', border:'none', cursor:creating?'not-allowed':'pointer', fontFamily:'Times New Roman', fontWeight:700, fontSize:15 }}>
            {creating?'Creating…':'Create Household'}
          </button>
        </div>

        <div style={{ textAlign:'center' }}>
          <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:12 }}>— or —</p>
          <button onClick={()=>{ setJoinModal(true); setJoinPreview(null); setJoinPreviewNotifications([]); setJoinAgreementAccepted(false); }} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 24px', borderRadius:10, border:'1.5px solid var(--border)', background:'var(--bg-subtle)', color:'var(--text-primary)', fontFamily:'Times New Roman', fontWeight:700, fontSize:14, cursor:'pointer' }}>
            <UserPlus size={15}/> Join with Code
          </button>
        </div>
      </div>

      {joinModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }} onClick={()=>setJoinModal(false)}>
          <div className="household-panel household-modal-panel" style={{ background:'var(--bg-card)', borderRadius:18, padding:36, width:'100%', maxWidth:720, boxShadow:'var(--shadow-xl)' }} onClick={e=>e.stopPropagation()}>
            <h2 style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Join a Household</h2>
            <p style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:22 }}>Look up the household, review the existing agreement, and accept the terms before joining.</p>
            <label style={lbl}>Join Code</label>
            <input value={joinCode} onChange={e=>{ setJoinCode(e.target.value.toUpperCase().slice(0,6)); setJoinPreview(null); setJoinPreviewNotifications([]); setJoinAgreementAccepted(false); }} placeholder="E.g. HH7K2P" maxLength={6}
              onKeyDown={e=>e.key==='Enter'&&reviewJoinAgreement()}
              style={{ ...inp, fontSize:24, fontFamily:'Courier New,monospace', fontWeight:700, letterSpacing:'0.25em', textAlign:'center', color:'var(--accent)', marginBottom:14, padding:'14px' }}
              onFocus={focusAcc} onBlur={blurBorder}/>
            <button onClick={reviewJoinAgreement} disabled={joinLookupLoading || joinCode.trim().length < 5} style={{ width:'100%', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px 16px', borderRadius:10, border:'none', background:joinLookupLoading || joinCode.trim().length < 5 ? 'var(--border)' : 'var(--accent)', color:joinLookupLoading || joinCode.trim().length < 5 ? 'var(--text-muted)' : '#fff', fontFamily:'Times New Roman', fontWeight:700, fontSize:14, cursor:joinLookupLoading || joinCode.trim().length < 5 ? 'not-allowed' : 'pointer', marginBottom:18 }}>
              {joinLookupLoading ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }} /> : <Check size={14} />}
              {joinPreview ? 'Refresh Agreement Preview' : 'Review Agreement'}
            </button>

            {joinPreview && (
              <div style={{ display:'grid', gap:16, marginBottom:20 }}>
                <div style={{ padding:16, borderRadius:14, border:'1px solid var(--border)', background:'var(--bg-subtle)' }}>
                  <p style={{ fontFamily:'Times New Roman', fontWeight:700, color:'var(--accent)', marginBottom:6 }}>Existing household agreement</p>
                  <p style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.6, marginBottom:10 }}>
                    By joining {joinPreview.listingTitle}, you agree to the current roommate agreement and household rules.
                  </p>
                  <div style={{ display:'grid', gap:8, marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:12, fontSize:13 }}><span style={{ color:'var(--text-muted)' }}>Members</span><strong>{previewMembers.length}</strong></div>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:12, fontSize:13 }}><span style={{ color:'var(--text-muted)' }}>Signed</span><strong>{previewSignedMembers.length}</strong></div>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:12, fontSize:13 }}><span style={{ color:'var(--text-muted)' }}>Pending</span><strong>{Math.max(0, previewMembers.length - previewSignedMembers.length)}</strong></div>
                  </div>
                  <div style={{ maxHeight:180, overflowY:'auto', padding:14, borderRadius:12, border:'1px solid var(--border)', background:'var(--bg-card)', fontSize:13, lineHeight:1.8, color:'var(--text-primary)', marginBottom:12 }}>
                    <p style={{ fontWeight:700, marginBottom:8 }}>Agreement terms</p>
                    <p style={{ marginBottom:8 }}>1. Respect shared spaces and keep common areas clean.</p>
                    <p style={{ marginBottom:8 }}>2. Pay your rent, utilities, and shared costs on time.</p>
                    <p style={{ marginBottom:8 }}>3. Keep noise, guests, and house rules aligned with the existing household agreement.</p>
                    <p style={{ marginBottom:8 }}>4. Any changes to the agreement must be accepted by the household.</p>
                    <p style={{ marginBottom:0 }}>5. By joining, you confirm that you have read and accept all terms and conditions.</p>
                  </div>
                  <div style={{ display:'grid', gap:8 }}>
                    {previewMembers.length > 0 && previewMembers.map(member => {
                      const signed = previewSignedMembers.includes(member);
                      return (
                        <div key={member} style={{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'center', padding:'10px 12px', borderRadius:10, border:`1px solid ${signed ? 'var(--success)' : 'var(--border)'}`, background:signed ? 'var(--success-light)' : 'var(--bg-card)' }}>
                          <span style={{ fontSize:13, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{member}</span>
                          <span style={{ fontSize:11, fontWeight:700, color:signed ? 'var(--success)' : 'var(--text-muted)' }}>{signed ? 'Signed' : 'Pending'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <label style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'14px 16px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg-card)', cursor:'pointer' }}>
                  <input type="checkbox" checked={joinAgreementAccepted} onChange={e=>setJoinAgreementAccepted(e.target.checked)} style={{ marginTop:3, accentColor:'var(--accent)' }} />
                  <span style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>
                    I accept all terms and conditions of this household agreement and understand that I cannot join without accepting it.
                  </span>
                </label>
              </div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setJoinModal(false)} style={{ flex:1, padding:'12px', borderRadius:10, border:'1.5px solid var(--border)', background:'var(--bg-subtle)', fontFamily:'Syne,serif', fontWeight:700, fontSize:14, cursor:'pointer', color:'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleJoin} disabled={!joinPreview || !joinAgreementAccepted} style={{ flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'12px', borderRadius:10, background:joinPreview && joinAgreementAccepted ? 'var(--accent)' : 'var(--border)', color:joinPreview && joinAgreementAccepted ? '#fff' : 'var(--text-muted)', border:'none', fontFamily:'Syne,serif', fontWeight:700, fontSize:14, cursor:joinPreview && joinAgreementAccepted ? 'pointer' : 'not-allowed' }}>
                <UserPlus size={14}/> Accept & Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="household-page" style={{ maxWidth:1100, margin:'0 auto', padding:'36px 24px 80px' }}>
      {/* Household header */}
      <div className="household-panel household-header-panel" style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:18, padding:'28px 32px', marginBottom:28, boxShadow:'var(--shadow-sm)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:20 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:42, height:42, borderRadius:12, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center' }}><Users size={20} color="#fff"/></div>
              <div>
                <p style={{ fontSize:11, fontFamily:'Times New Roman', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)' }}>Your Household</p>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                  <h1 style={{ fontSize:24, fontWeight:700, lineHeight:1.2 }}>{hh.listingTitle}</h1>
                  {members.length > 1 && (
                    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:999, background:'var(--success-light)', color:'var(--success)', border:'1px solid var(--success)', fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                      <CheckCircle size={13} /> Active
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:24, marginTop:10, flexWrap:'wrap' }}>
              {[
                { l:'Members',        v:String(members.length),              c:'var(--text-primary)' },
                { l:'Monthly Rent',   v:`৳${hh.monthlyFee.toLocaleString()}`,   c:'var(--accent)' },
                { l:'Per Person',     v:`৳${(members.length > 0 ? hh.monthlyFee/members.length : 0).toFixed(0)}`, c:'var(--accent-2)' },
              ].map(s=>(
                <div key={s.l}>
                  <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'Times New Roman', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em' }}>{s.l}</p>
                  <p style={{ fontSize:18, fontWeight:700, fontFamily:'Times New Roman', color:s.c }}>{s.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Join code */}
          <div className="household-panel household-code-panel" style={{ background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 24px', minWidth:240 }}>
            <p style={{ fontSize:11, fontFamily:'Times New Roman', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}><Hash size={12}/>Household Join Code</p>
            <div style={{ fontFamily:'Times New Roman', fontSize:30, fontWeight:700, letterSpacing:'0.28em', color:'var(--accent)', background:'var(--accent-light)', padding:'12px 20px', borderRadius:10, border:'2px dashed var(--accent)', textAlign:'center', marginBottom:10, userSelect:'all' }}>
              {hh.joinCode}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={copyCode} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'8px 0', borderRadius:9, border:'1.5px solid var(--border)', background:copied?'var(--success-light)':'var(--bg-card)', color:copied?'var(--success)':'var(--text-secondary)', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'Times New Roman' }}>
                {copied?<CheckCircle size={13}/>:<Copy size={13}/>}{copied?'Copied!':'Copy'}
              </button>
              <button onClick={()=>{ setJoinModal(true); setJoinPreview(null); setJoinPreviewNotifications([]); setJoinAgreementAccepted(false); }} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'8px 0', borderRadius:9, border:'1.5px solid var(--border)', background:'var(--bg-card)', color:'var(--text-secondary)', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'Times New Roman' }}>
                <UserPlus size={13}/>Join Another
              </button>
            </div>
          </div>
        </div>

        {hh && (
          <div style={{ marginTop:20, padding:'16px 18px', borderRadius:14, border:`1px solid ${pendingAgreementMembers.length > 0 ? 'var(--danger)' : 'var(--success)'}`, background: pendingAgreementMembers.length > 0 ? 'var(--danger-light)' : 'var(--success-light)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
            <div style={{ minWidth:0 }}>
              <p style={{ fontFamily:'Times New Roman', fontWeight:700, color: pendingAgreementMembers.length > 0 ? 'var(--danger)' : 'var(--success)', marginBottom:4 }}>Agreement signature reminder</p>
              <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>
                {pendingAgreementMembers.length > 0
                  ? `${pendingAgreementMembers.length} roommate(s) still need to sign the agreement. New roommates will see this reminder until they acknowledge it.`
                  : 'Everyone in this household has signed the agreement.'}
              </p>
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <Link href="/agreement" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 16px', borderRadius:10, border:'none', background:'var(--accent)', color:'#fff', fontFamily:'Times New Roman', fontWeight:700 }}>
                Open Agreement
              </Link>
              {myAgreementSigned ? (
                <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'10px 16px', borderRadius:10, border:'1px solid var(--success)', background:'var(--success-light)', color:'var(--success)', fontFamily:'Times New Roman', fontWeight:700 }}>
                  Signed by you
                </span>
              ) : (
                <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'10px 16px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-card)', color:'var(--text-muted)', fontFamily:'Times New Roman', fontWeight:700 }}>
                  Pending your signature
                </span>
              )}
            </div>
          </div>
        )}

        {/* Members list */}
        <div style={{ marginTop:20, paddingTop:18, borderTop:'1px solid var(--border)', display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <p style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'Times New Roman', fontWeight:700 }}>Members:</p>
          {members.map(m=>(
            <div key={m} style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 12px 5px 6px', background:m===currentUser.email?'var(--accent-light)':'var(--bg)', border:`1px solid ${m===currentUser.email?'var(--accent)':'var(--border)'}`, borderRadius:100 }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background:m===currentUser.email?'var(--accent)':'var(--bg-subtle)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:m===currentUser.email?'#fff':'var(--text-secondary)', fontFamily:'Times New Roman' }}>{nameOf(m)[0]}</div>
              <span style={{ fontSize:12, fontWeight:600, color:m===currentUser.email?'var(--accent)':'var(--text-secondary)' }}>{nameOf(m)}{m===currentUser.email?' (you)':''}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="household-panel household-tabs-panel" style={{ display:'flex', gap:4, marginBottom:24, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:5, overflowX:'auto' }}>
        {TABS.map(({id,label,icon:Icon})=>(
          <button key={id} onClick={()=>setActiveTab(id)}
            style={{ flex:'0 0 auto', display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:9, border:'none', cursor:'pointer', transition:'all .13s', fontFamily:'Times New Roman', fontSize:13, fontWeight:700, background:activeTab===id?'var(--accent)':'transparent', color:activeTab===id?'#fff':'var(--text-secondary)', whiteSpace:'nowrap' }}>
            <Icon size={14}/>{label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="household-panel household-content-panel" style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'24px 26px', boxShadow:'var(--shadow-sm)' }}>
        {activeTab==='ledger'   && <MealLedger       hh={hh} myEmail={currentUser.email!}/>}
        {activeTab==='dues'     && <DuesPayments     hh={hh} myEmail={currentUser.email!}/>}
        {activeTab==='meals'    && <DailyMeals       hh={hh} myEmail={currentUser.email!}/>}
        {activeTab==='snapshot' && <FairShareSnapshot hh={hh} myEmail={currentUser.email!}/>}
      </div>

      {/* Join modal */}
      {joinModal && (
        <div className="household-page" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }} onClick={()=>setJoinModal(false)}>
          <div className="household-panel household-modal-panel" style={{ background:'var(--bg-card)', borderRadius:18, padding:36, width:'100%', maxWidth:720, boxShadow:'var(--shadow-xl)' }} onClick={e=>e.stopPropagation()}>
            <h2 style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Join Another Household</h2>
            <p style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:22 }}>Look up the household, review the existing agreement, and accept the terms before joining.</p>
            <label style={lbl}>Join Code</label>
            <input value={joinCode} onChange={e=>{ setJoinCode(e.target.value.toUpperCase().slice(0,6)); setJoinPreview(null); setJoinPreviewNotifications([]); setJoinAgreementAccepted(false); }} placeholder="E.g. HH7K2P" maxLength={6} onKeyDown={e=>e.key==='Enter'&&reviewJoinAgreement()}
              style={{ ...inp, fontSize:24, fontFamily:'Courier New,monospace', fontWeight:700, letterSpacing:'0.25em', textAlign:'center', color:'var(--accent)', marginBottom:14, padding:'14px' }}
              onFocus={focusAcc} onBlur={blurBorder}/>
            <button onClick={reviewJoinAgreement} disabled={joinLookupLoading || joinCode.trim().length < 5} style={{ width:'100%', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px 16px', borderRadius:10, border:'none', background:joinLookupLoading || joinCode.trim().length < 5 ? 'var(--border)' : 'var(--accent)', color:joinLookupLoading || joinCode.trim().length < 5 ? 'var(--text-muted)' : '#fff', fontFamily:'Times New Roman', fontWeight:700, fontSize:14, cursor:joinLookupLoading || joinCode.trim().length < 5 ? 'not-allowed' : 'pointer', marginBottom:18 }}>
              {joinLookupLoading ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }} /> : <Check size={14} />}
              {joinPreview ? 'Refresh Agreement Preview' : 'Review Agreement'}
            </button>

            {joinPreview && (
              <div style={{ display:'grid', gap:16, marginBottom:20 }}>
                <div style={{ padding:16, borderRadius:14, border:'1px solid var(--border)', background:'var(--bg-subtle)' }}>
                  <p style={{ fontFamily:'Times New Roman', fontWeight:700, color:'var(--accent)', marginBottom:6 }}>Existing household agreement</p>
                  <p style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.6, marginBottom:10 }}>
                    By joining {joinPreview.listingTitle}, you agree to the current roommate agreement and household rules.
                  </p>
                  <div style={{ display:'grid', gap:8, marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:12, fontSize:13 }}><span style={{ color:'var(--text-muted)' }}>Members</span><strong>{previewMembers.length}</strong></div>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:12, fontSize:13 }}><span style={{ color:'var(--text-muted)' }}>Signed</span><strong>{previewSignedMembers.length}</strong></div>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:12, fontSize:13 }}><span style={{ color:'var(--text-muted)' }}>Pending</span><strong>{Math.max(0, previewMembers.length - previewSignedMembers.length)}</strong></div>
                  </div>
                  <div style={{ maxHeight:180, overflowY:'auto', padding:14, borderRadius:12, border:'1px solid var(--border)', background:'var(--bg-card)', fontSize:13, lineHeight:1.8, color:'var(--text-primary)', marginBottom:12 }}>
                    <p style={{ fontWeight:700, marginBottom:8 }}>Agreement terms</p>
                    <p style={{ marginBottom:8 }}>1. Respect shared spaces and keep common areas clean.</p>
                    <p style={{ marginBottom:8 }}>2. Pay your rent, utilities, and shared costs on time.</p>
                    <p style={{ marginBottom:8 }}>3. Keep noise, guests, and house rules aligned with the existing household agreement.</p>
                    <p style={{ marginBottom:8 }}>4. Any changes to the agreement must be accepted by the household.</p>
                    <p style={{ marginBottom:0 }}>5. By joining, you confirm that you have read and accept all terms and conditions.</p>
                  </div>
                  <div style={{ display:'grid', gap:8 }}>
                    {previewMembers.length > 0 && previewMembers.map(member => {
                      const signed = previewSignedMembers.includes(member);
                      return (
                        <div key={member} style={{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'center', padding:'10px 12px', borderRadius:10, border:`1px solid ${signed ? 'var(--success)' : 'var(--border)'}`, background:signed ? 'var(--success-light)' : 'var(--bg-card)' }}>
                          <span style={{ fontSize:13, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{member}</span>
                          <span style={{ fontSize:11, fontWeight:700, color:signed ? 'var(--success)' : 'var(--text-muted)' }}>{signed ? 'Signed' : 'Pending'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <label style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'14px 16px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg-card)', cursor:'pointer' }}>
                  <input type="checkbox" checked={joinAgreementAccepted} onChange={e=>setJoinAgreementAccepted(e.target.checked)} style={{ marginTop:3, accentColor:'var(--accent)' }} />
                  <span style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>
                    I accept all terms and conditions of this household agreement and understand that I cannot join without accepting it.
                  </span>
                </label>
              </div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setJoinModal(false)} style={{ flex:1, padding:'12px', borderRadius:10, border:'1.5px solid var(--border)', background:'var(--bg-subtle)', fontFamily:'Syne,serif', fontWeight:700, fontSize:14, cursor:'pointer', color:'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleJoin} disabled={!joinPreview || !joinAgreementAccepted} style={{ flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'12px', borderRadius:10, background:joinPreview && joinAgreementAccepted ? 'var(--accent)' : 'var(--border)', color:joinPreview && joinAgreementAccepted ? '#fff' : 'var(--text-muted)', border:'none', fontFamily:'Syne,serif', fontWeight:700, fontSize:14, cursor:joinPreview && joinAgreementAccepted ? 'pointer' : 'not-allowed' }}>
                <UserPlus size={14}/>Accept & Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
