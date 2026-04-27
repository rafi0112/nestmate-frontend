'use client';
import { useState } from 'react';
import { FileText, Download, Copy, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface AgreementData {
  address: string;
  startDate: string;
  monthlyRent: string;
  securityDeposit: string;
  roommates: string;
  primaryTenant: string;
  quietHoursStart: string;
  quietHoursEnd: string;
  guestPolicy: string;
  cleaningSchedule: string;
  utilitiesSplit: string;
  petPolicy: string;
  smokingPolicy: string;
  commonAreas: string;
  noticeToLeave: string;
  additionalRules: string;
}

function generateAgreement(data: AgreementData): string {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return `
ROOMMATE AGREEMENT

Date: ${today}
Property Address: ${data.address || '[Address]'}

PARTIES
This Roommate Agreement ("Agreement") is entered into between the following roommates (collectively referred to as "Roommates"):
${data.roommates || '[Names of all roommates]'}

Primary Lease Holder: ${data.primaryTenant || '[Name]'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. TERM
This Agreement begins on ${data.startDate || '[Start Date]'} and continues month-to-month unless otherwise terminated per the conditions below.

2. FINANCIAL OBLIGATIONS
• Monthly Rent: $${data.monthlyRent || '[Amount]'} total
• Security Deposit Contribution: $${data.securityDeposit || '[Amount]'} per person
• Utilities Split: ${data.utilitiesSplit || 'Split equally among all roommates'}
• Rent is due on the 1st of each month. Late payments incur a $50 fee after 5 days.

3. QUIET HOURS
Quiet hours are from ${data.quietHoursStart || '10:00 PM'} to ${data.quietHoursEnd || '8:00 AM'} on weekdays, and ${data.quietHoursStart || '11:00 PM'} to ${data.quietHoursEnd || '9:00 AM'} on weekends.
During quiet hours: no loud music, TV at low volume, no parties, phone calls in bedrooms only.

4. GUESTS & OVERNIGHT VISITORS
${data.guestPolicy || 'Guests may stay for no more than 3 consecutive nights and no more than 6 nights per month without prior agreement from all roommates. Extended stays require written consent.'}

5. CLEANING RESPONSIBILITIES
${data.cleaningSchedule || 'Common areas (kitchen, bathroom, living room) to be cleaned weekly on a rotating schedule. Each roommate is responsible for cleaning up immediately after personal use.'}

6. PET POLICY
${data.petPolicy || 'No pets allowed without written consent from all roommates and landlord approval.'}

7. SMOKING POLICY
${data.smokingPolicy || 'No smoking inside the property. Outdoor smoking must be at least 15 feet from any window or door.'}

8. COMMON AREA USAGE
${data.commonAreas || 'All common areas (kitchen, living room, bathrooms) are shared equally. Personal items should not occupy shared spaces. Kitchen appliances may be shared with mutual consent.'}

9. NOTICE TO VACATE
Any roommate wishing to vacate must provide ${data.noticeToLeave || '30 days'} written notice to all other roommates. The departing roommate is responsible for finding an approved replacement or covering their share of rent during the transition.

10. ADDITIONAL RULES
${data.additionalRules || 'N/A'}

11. DISPUTE RESOLUTION
Roommates agree to attempt to resolve disputes through direct, respectful conversation first. If unresolved after 7 days, parties agree to seek mediation before pursuing legal action.

12. AMENDMENTS
This Agreement may be amended at any time with written consent of all roommates.

13. ACKNOWLEDGMENT
By signing below, each roommate acknowledges they have read, understood, and agree to the terms of this Agreement.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SIGNATURES

________________________          ________________________
Name:                              Date:

________________________          ________________________
Name:                              Date:

________________________          ________________________
Name:                              Date:

________________________          ________________________
Name:                              Date:

NOTE: This is a personal agreement between roommates and is separate from the primary lease. All parties should retain a signed copy. Consider having this notarized for added legal protection.
`.trim();
}

export default function AgreementPage() {
  const [form, setForm] = useState<AgreementData>({
    address: '', startDate: '', monthlyRent: '', securityDeposit: '',
    roommates: '', primaryTenant: '', quietHoursStart: '10:00 PM', quietHoursEnd: '8:00 AM',
    guestPolicy: '', cleaningSchedule: '', utilitiesSplit: '', petPolicy: '',
    smokingPolicy: '', commonAreas: '', noticeToLeave: '30 days', additionalRules: '',
  });
  const [preview, setPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const agreement = generateAgreement(form);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(agreement);
    setCopied(true);
    toast.success('Agreement copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  const downloadTxt = () => {
    const blob = new Blob([agreement], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'roommate-agreement.txt'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Agreement downloaded!');
  };

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-card)', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'DM Sans', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, fontFamily: 'Syne', textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 };
  const taStyle = { ...inputStyle, resize: 'vertical' as const, minHeight: 80 };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: 100, fontSize: 12, fontWeight: 700, fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
          <FileText size={12} /> Free tool
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Roommate Agreement Generator</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 600, lineHeight: 1.6 }}>
          A written roommate agreement prevents 90% of conflicts. Fill in the details below, preview, and download your custom agreement instantly — no lawyer needed.
        </p>
      </div>

      {/* Why this matters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
        {[
          { icon: '🛡️', title: 'Prevent conflicts', desc: 'Clear expectations from day one' },
          { icon: '💰', title: 'Protect finances', desc: 'Defines who owes what, when' },
          { icon: '⚖️', title: 'Legal reference', desc: 'Useful if disputes arise' },
          { icon: '🤝', title: 'Build trust', desc: 'Shows you\'re a responsible tenant' },
        ].map(({ icon, title, desc }) => (
          <div key={title} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 24 }}>{icon}</span>
            <div><p style={{ fontWeight: 700, fontSize: 14, fontFamily: 'Syne', marginBottom: 2 }}>{title}</p><p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{desc}</p></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: preview ? '1fr 1fr' : '1fr', gap: 28 }}>
        {/* Form */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Fill in details</h2>
            <button onClick={() => setPreview(!preview)}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid var(--border)', background: preview ? 'var(--accent-light)' : 'var(--bg-subtle)', color: preview ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, fontFamily: 'Syne', cursor: 'pointer' }}>
              {preview ? 'Hide preview' : 'Show preview'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Basic info */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>🏠 Property & Parties</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label style={labelStyle}>Property Address</label><input name="address" value={form.address} onChange={handleChange} placeholder="123 Main St, Apt 4B, New York, NY 10001" style={inputStyle} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={labelStyle}>Move-in Date</label><input name="startDate" type="date" value={form.startDate} onChange={handleChange} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Notice to Leave</label>
                    <select name="noticeToLeave" value={form.noticeToLeave} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {['14 days', '30 days', '60 days'].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div><label style={labelStyle}>All Roommate Names (one per line)</label><textarea name="roommates" value={form.roommates} onChange={handleChange} placeholder="Jane Smith&#10;John Doe&#10;..." style={taStyle} rows={3} /></div>
                <div><label style={labelStyle}>Primary Lease Holder</label><input name="primaryTenant" value={form.primaryTenant} onChange={handleChange} placeholder="Name of person on the lease" style={inputStyle} /></div>
              </div>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>💰 Finances</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Total Monthly Rent ($)</label><input name="monthlyRent" value={form.monthlyRent} onChange={handleChange} placeholder="2400" style={inputStyle} type="number" /></div>
                <div><label style={labelStyle}>Security Deposit per Person ($)</label><input name="securityDeposit" value={form.securityDeposit} onChange={handleChange} placeholder="800" style={inputStyle} type="number" /></div>
              </div>
              <div style={{ marginTop: 12 }}><label style={labelStyle}>Utilities Split</label><textarea name="utilitiesSplit" value={form.utilitiesSplit} onChange={handleChange} placeholder="e.g., Electric split 50/50, internet split equally, water included in rent" style={taStyle} rows={2} /></div>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>🏘️ House Rules</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={labelStyle}>Quiet Hours Start</label>
                    <select name="quietHoursStart" value={form.quietHoursStart} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {['9:00 PM', '10:00 PM', '10:30 PM', '11:00 PM', 'Midnight'].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div><label style={labelStyle}>Quiet Hours End</label>
                    <select name="quietHoursEnd" value={form.quietHoursEnd} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {['7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '10:00 AM'].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div><label style={labelStyle}>Guest Policy</label><textarea name="guestPolicy" value={form.guestPolicy} onChange={handleChange} placeholder="e.g., Guests can stay up to 3 consecutive nights..." style={taStyle} rows={2} /></div>
                <div><label style={labelStyle}>Cleaning Schedule</label><textarea name="cleaningSchedule" value={form.cleaningSchedule} onChange={handleChange} placeholder="e.g., Kitchen cleaned weekly, rotating bathroom duty..." style={taStyle} rows={2} /></div>
                <div><label style={labelStyle}>Pet Policy</label><textarea name="petPolicy" value={form.petPolicy} onChange={handleChange} placeholder="e.g., No pets allowed / Dogs allowed with deposit..." style={taStyle} rows={2} /></div>
                <div><label style={labelStyle}>Smoking Policy</label><textarea name="smokingPolicy" value={form.smokingPolicy} onChange={handleChange} placeholder="e.g., No smoking inside / Outdoor only..." style={taStyle} rows={2} /></div>
                <div><label style={labelStyle}>Additional Rules</label><textarea name="additionalRules" value={form.additionalRules} onChange={handleChange} placeholder="Anything else important to your household..." style={taStyle} rows={3} /></div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            <button onClick={copyToClipboard}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-card)', fontSize: 14, fontWeight: 700, fontFamily: 'Syne', color: 'var(--text-primary)', cursor: 'pointer' }}>
              {copied ? <CheckCircle size={15} style={{ color: 'var(--success)' }} /> : <Copy size={15} />}
              {copied ? 'Copied!' : 'Copy text'}
            </button>
            <button onClick={downloadTxt}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'Syne', border: 'none', cursor: 'pointer' }}>
              <Download size={15} /> Download .txt
            </button>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16, lineHeight: 1.5 }}>
            ⚠️ This is a template for personal use between roommates. It is not a substitute for legal advice. Consult a local attorney if you need legally binding documentation.
          </p>
        </div>

        {/* Preview */}
        {preview && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Preview</h2>
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '32px 36px', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.8, color: '#1a1612', whiteSpace: 'pre-wrap', overflowY: 'auto', maxHeight: 800, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              {agreement}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
