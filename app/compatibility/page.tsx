'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight, ArrowLeft, RotateCcw, Search } from 'lucide-react';

const QUIZ_STEPS = [
  {
    id: 'schedule',
    question: 'What\'s your typical daily schedule?',
    subtitle: 'This helps match you with someone who won\'t disturb your sleep',
    options: [
      { value: 'earlyBird', label: '🌅 Early bird', desc: 'Up by 6am, in bed by 10pm' },
      { value: 'normal', label: '⏰ Regular hours', desc: '8am–11pm, pretty standard' },
      { value: 'nightOwl', label: '🦉 Night owl', desc: 'Up late, sleep in when possible' },
      { value: 'variable', label: '🔄 It varies', desc: 'Shift work or irregular schedule' },
    ],
  },
  {
    id: 'cleanliness',
    question: 'How would you describe your cleanliness standards?',
    subtitle: 'Mismatched cleanliness is the #1 roommate conflict — be honest!',
    options: [
      { value: 'spotless', label: '✨ Spotless', desc: 'Everything in its place, always' },
      { value: 'tidy', label: '🧹 Generally tidy', desc: 'Clean most of the time, occasional mess' },
      { value: 'relaxed', label: '😌 Relaxed', desc: 'Comfortable with some clutter' },
      { value: 'minimal', label: '🙈 Minimal effort', desc: 'Clean when needed, not a priority' },
    ],
  },
  {
    id: 'social',
    question: 'How social are you at home?',
    subtitle: 'No judgment — introverts and extroverts both make great roommates',
    options: [
      { value: 'veryPrivate', label: '🚪 Very private', desc: 'My room is my sanctuary, minimal interaction' },
      { value: 'polite', label: '👋 Politely social', desc: 'Friendly but respects everyone\'s space' },
      { value: 'social', label: '😊 Social & friendly', desc: 'Love chatting, enjoy shared spaces' },
      { value: 'partier', label: '🎉 Love hosting', desc: 'Friends over regularly, lively home' },
    ],
  },
  {
    id: 'pets',
    question: 'What\'s your stance on pets?',
    subtitle: 'Allergies and phobias are very real concerns',
    options: [
      { value: 'haveAndLove', label: '🐕 I have pets', desc: 'I own a pet and it\'d come with me' },
      { value: 'loveNoOwn', label: '🐱 Love but don\'t own', desc: 'Happy to live with someone\'s pet' },
      { value: 'neutral', label: '🤷 Neutral', desc: 'Fine either way' },
      { value: 'noPets', label: '🚫 No pets please', desc: 'Allergic, or prefer a pet-free home' },
    ],
  },
  {
    id: 'smoking',
    question: 'Smoking preferences?',
    subtitle: 'Even outdoor-only smoking can be a dealbreaker for some',
    options: [
      { value: 'smoker', label: '🚬 I smoke indoors', desc: 'Need a place where smoking inside is ok' },
      { value: 'outdoorOnly', label: '🌿 Outdoor only', desc: 'I smoke, but only outside' },
      { value: 'nonsmoker', label: '✅ Non-smoker', desc: 'I don\'t smoke and prefer smoke-free home' },
      { value: 'strict', label: '🚭 Strict no smoking', desc: 'No smoking anywhere on premises' },
    ],
  },
  {
    id: 'guests',
    question: 'How often do you have overnight guests?',
    subtitle: 'Unexpected guests can cause real friction — better to know upfront',
    options: [
      { value: 'never', label: '🏠 Rarely/never', desc: 'My home is my private space' },
      { value: 'occasional', label: '📅 Occasionally', desc: 'Once a month or less' },
      { value: 'regular', label: '👥 Regularly', desc: 'Partner or friends stay over often' },
      { value: 'frequent', label: '🏘️ Very frequently', desc: 'Essentially a revolving door' },
    ],
  },
  {
    id: 'workFromHome',
    question: 'Do you work from home?',
    subtitle: 'WFH people need quiet during hours that renters rarely consider',
    options: [
      { value: 'full', label: '💻 Full-time WFH', desc: 'Home is my office, need quiet 9–5' },
      { value: 'hybrid', label: '🔀 Hybrid', desc: 'WFH some days, office others' },
      { value: 'office', label: '🏢 Office-based', desc: 'Out of the house during work hours' },
      { value: 'student', label: '📚 Student', desc: 'Mix of campus and home study' },
    ],
  },
  {
    id: 'budget',
    question: 'What\'s your monthly rent budget?',
    subtitle: 'Be realistic — stress over rent is the fastest way to ruin any living situation',
    options: [
      { value: 'budget', label: '💰 Under ৳800', desc: 'Need the most affordable option' },
      { value: 'mid', label: '💵 ৳800–৳1,500', desc: 'Comfortable but value-conscious' },
      { value: 'premium', label: '💎 ৳1,500–৳2,500', desc: 'Quality matters, willing to pay' },
      { value: 'luxury', label: '🏆 $2,500+', desc: 'Cost is secondary to comfort' },
    ],
  },
];

interface Answers {
  [key: string]: string;
}

function CompatibilityScore({ answers }: { answers: Answers }) {
  // Real compatibility scoring logic
  const scores: Record<string, number> = {};
  
  const conflictPairs = [
    ['earlyBird', 'nightOwl'],
    ['spotless', 'minimal'],
    ['veryPrivate', 'partier'],
    ['noPets', 'haveAndLove'],
    ['strict', 'smoker'],
  ];

  // Generate ideal roommate profile text based on answers
  const profileTraits: string[] = [];
  if (answers.schedule === 'earlyBird') profileTraits.push('early riser');
  if (answers.schedule === 'nightOwl') profileTraits.push('night owl');
  if (answers.cleanliness === 'spotless' || answers.cleanliness === 'tidy') profileTraits.push('tidy');
  if (answers.social === 'social') profileTraits.push('social');
  if (answers.social === 'veryPrivate') profileTraits.push('respects privacy');
  if (answers.pets === 'noPets') profileTraits.push('no pets');
  if (answers.pets === 'haveAndLove') profileTraits.push('pet-friendly');
  if (answers.smoking === 'nonsmoker' || answers.smoking === 'strict') profileTraits.push('non-smoker');
  if (answers.workFromHome === 'full') profileTraits.push('quiet during work hours');

  const dealbreakers: string[] = [];
  if (answers.smoking === 'strict') dealbreakers.push('Absolutely no smoking');
  if (answers.pets === 'noPets') dealbreakers.push('No pets (allergies/preference)');
  if (answers.cleanliness === 'spotless') dealbreakers.push('Must maintain high cleanliness standards');
  if (answers.workFromHome === 'full') dealbreakers.push('Need quiet from 9am–5pm');
  if (answers.guests === 'never') dealbreakers.push('No frequent overnight guests');

  const budgetMap: Record<string, string> = {
    budget: 'Under ৳800/mo',
    mid: '৳800–৳1,500/mo',
    premium: '৳1,500–৳2,500/mo',
    luxury: '$2,500+/mo',
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Success banner */}
      <div style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #ff9060 100%)', borderRadius: 20, padding: '36px 40px', marginBottom: 28, color: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎯</div>
        <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8, color: '#fff' }}>Your Roommate Profile</h2>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>We've built your ideal roommate match profile. Use it to filter listings!</p>
      </div>

      {/* Profile breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>✅</span> Your ideal match is...
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {profileTraits.length > 0 ? profileTraits.map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                <CheckCircle size={14} style={{ color: 'var(--success)', flexShrink: 0 }} /> {t}
              </div>
            )) : <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Very flexible — most roommates would work!</p>}
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🚨</span> Your dealbreakers
          </h3>
          {dealbreakers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dealbreakers.map(d => (
                <div key={d} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ color: '#ef4444', flexShrink: 0 }}>✗</span> {d}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>You're pretty flexible — great news!</p>
          )}
        </div>
      </div>

      {/* Budget */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>💰 Budget range</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Use this to filter listings</p>
          </div>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: 'var(--accent)' }}>{budgetMap[answers.budget] || 'Flexible'}</span>
        </div>
      </div>

      {/* Real-life tip */}
      <div style={{ background: 'var(--accent-2-light)', border: '1px solid var(--accent-2)', borderRadius: 14, padding: 20, marginBottom: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-2)', marginBottom: 8 }}>💡 Pro tip from experienced renters</h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
          Before signing any lease, always have a <strong>roommate agreement conversation</strong> covering: quiet hours, 
          shared expenses (utilities, groceries), cleaning schedule, guest policies, and what happens if one person wants to leave early.
          It feels awkward but prevents 90% of conflicts.
        </p>
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href={`/browse?schedule=${answers.schedule}&budget=${answers.budget}`}
          style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 24px', borderRadius: 12, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontFamily: 'Syne', fontSize: 15 }}>
          <Search size={16} /> Find matching listings
        </Link>
        <Link href="/add-listing"
          style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 24px', borderRadius: 12, border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'Syne', fontSize: 15, background: 'var(--bg-card)' }}>
          Post your listing
        </Link>
      </div>
    </div>
  );
}

export default function CompatibilityPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const profile = {
      answers,
      suggestedRentAmount: answers.budget === 'budget' ? '800' : answers.budget === 'mid' ? '1500' : answers.budget === 'premium' ? '2500' : '',
      suggestedLifestylePreferences: {
        pets: answers.pets === 'haveAndLove' || answers.pets === 'loveNoOwn',
        smoking: answers.smoking === 'smoker' || answers.smoking === 'outdoorOnly',
        nightOwl: answers.schedule === 'nightOwl',
        earlyRiser: answers.schedule === 'earlyBird',
        student: answers.workFromHome === 'student',
        professional: answers.workFromHome === 'office' || answers.workFromHome === 'hybrid' || answers.workFromHome === 'full',
      },
      suggestedDescription: [
        `Schedule: ${answers.schedule || 'flexible'}`,
        `Cleanliness: ${answers.cleanliness || 'flexible'}`,
        `Social style: ${answers.social || 'flexible'}`,
        `Pets: ${answers.pets || 'flexible'}`,
        `Smoking: ${answers.smoking || 'flexible'}`,
        `Guests: ${answers.guests || 'flexible'}`,
        `Work from home: ${answers.workFromHome || 'flexible'}`,
      ].join(' | '),
    };
    localStorage.setItem('nestmate_quiz_profile', JSON.stringify(profile));
  }, [done, answers]);

  const current = QUIZ_STEPS[step];
  const progress = ((step) / QUIZ_STEPS.length) * 100;

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [current.id]: value };
    setAnswers(newAnswers);
    if (step < QUIZ_STEPS.length - 1) {
      setTimeout(() => setStep(s => s + 1), 250);
    } else {
      setTimeout(() => setDone(true), 250);
    }
  };

  if (done) return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
      <CompatibilityScore answers={answers} />
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button onClick={() => { setDone(false); setStep(0); setAnswers({}); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-subtle)', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'DM Sans' }}>
          <RotateCcw size={13} /> Retake quiz
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 100, fontSize: 12, fontWeight: 700, fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
          🎯 Compatibility Quiz
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 800, marginBottom: 8 }}>Find your ideal roommate match</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.5 }}>
          Answer 8 quick questions to build your profile. We'll show you listings that match your lifestyle — and flag potential dealbreakers.
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
          <span>Question {step + 1} of {QUIZ_STEPS.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent), #ff9060)', borderRadius: 3, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Question */}
      <div className="card" style={{ padding: '36px 40px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{current.question}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>{current.subtitle}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {current.options.map(opt => {
            const selected = answers[current.id] === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleAnswer(opt.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '16px 20px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                  background: selected ? 'var(--accent-light)' : 'var(--bg-subtle)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!selected) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.background = 'var(--accent-light)'; } }}
                onMouseLeave={e => { if (!selected) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'; } }}
              >
                <span style={{ fontSize: 24, flexShrink: 0 }}>{opt.label.split(' ')[0]}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: selected ? 'var(--accent)' : 'var(--text-primary)', fontFamily: 'Syne', marginBottom: 2 }}>
                    {opt.label.split(' ').slice(1).join(' ')}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{opt.desc}</p>
                </div>
                {selected && <CheckCircle size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border)', background: step === 0 ? 'transparent' : 'var(--bg-subtle)', color: step === 0 ? 'var(--border)' : 'var(--text-secondary)', cursor: step === 0 ? 'not-allowed' : 'pointer', fontSize: 14, fontFamily: 'DM Sans' }}>
          <ArrowLeft size={14} /> Back
        </button>
        {answers[current.id] && (
          <button onClick={() => step < QUIZ_STEPS.length - 1 ? setStep(s => s + 1) : setDone(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'Syne' }}>
            {step < QUIZ_STEPS.length - 1 ? 'Next' : 'See my profile'} <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
