'use client';
import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Send, Search, ArrowLeft, Clock, CheckCheck, MessageSquare, RefreshCw, Wifi, WifiOff, Plus } from 'lucide-react';
import { getConversations, sendMessage as sendMessageApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface DBMessage {
  _id: string; fromEmail: string; toEmail: string;
  listingId: string; listingTitle: string; text: string;
  timestamp: string; read: boolean;
}
interface Conversation {
  id: string; otherEmail: string; otherName: string;
  listingId: string; listingTitle: string; messages: DBMessage[];
  lastMessage: string; lastTime: Date; unread: number;
}

function timeAgo(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return date.toLocaleDateString('en-GB', { day:'numeric', month:'short' });
}

function formatTime(d: Date | string): string {
  return new Date(d).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
}

function buildConversations(messages: DBMessage[], myEmail: string): Conversation[] {
  const map = new Map<string, Conversation>();
  for (const msg of messages) {
    const otherEmail = msg.fromEmail === myEmail ? msg.toEmail : msg.fromEmail;
    const key = `${msg.listingId}::${otherEmail}`;
    if (!map.has(key)) {
      map.set(key, {
        id: key, otherEmail,
        otherName: otherEmail.split('@')[0].replace(/[._]/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),
        listingId: msg.listingId, listingTitle: msg.listingTitle || 'Listing',
        messages: [], lastMessage: '', lastTime: new Date(msg.timestamp), unread: 0,
      });
    }
    const conv = map.get(key)!;
    conv.messages.push(msg);
    const t = new Date(msg.timestamp);
    if (t > conv.lastTime) { conv.lastTime = t; conv.lastMessage = msg.text; }
    if (!msg.read && msg.toEmail === myEmail) conv.unread++;
  }
  return [...map.values()].sort((a,b) => b.lastTime.getTime() - a.lastTime.getTime());
}

function buildDraftConversation(target: { toEmail: string; listingId: string; listingTitle: string; ownerName: string }) {
  const id = `draft::${target.toEmail}::${target.listingId}`;
  return {
    id,
    otherEmail: target.toEmail,
    otherName: target.ownerName,
    listingId: target.listingId,
    listingTitle: target.listingTitle,
    messages: [] as DBMessage[],
    lastMessage: 'New message',
    lastTime: new Date(0),
    unread: 0,
  } satisfies Conversation;
}

function MessagesPageContent() {
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string|null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<'list'|'chat'>('list');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date|null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const draftToEmail = searchParams.get('to') || '';
  const draftListingId = searchParams.get('listingId') || '';
  const draftListingTitle = searchParams.get('listingTitle') || 'Listing';
  const draftOwnerName = searchParams.get('ownerName') || draftToEmail.split('@')[0];
  const hasDraftTarget = Boolean(draftToEmail && draftListingId);

  const fetchConversations = useCallback(async (silent=false) => {
    if (!currentUser?.email) return;
    if (!silent) setLoading(true);
    try {
      const data: DBMessage[] = await getConversations(currentUser.email);
      const next = buildConversations(Array.isArray(data) ? data : [], currentUser.email);
      if (hasDraftTarget) {
        const draftId = `draft::${draftToEmail}::${draftListingId}`;
        const existingThread = next.find(conv => conv.otherEmail === draftToEmail && conv.listingId === draftListingId);
        if (existingThread) {
          if (!selected || selected === draftId) setSelected(existingThread.id);
        } else if (!next.some(conv => conv.id === draftId)) {
          next.unshift(buildDraftConversation({ toEmail: draftToEmail, listingId: draftListingId, listingTitle: draftListingTitle, ownerName: draftOwnerName }));
          if (!selected) setSelected(draftId);
        }
      }
      setConversations(next);
      setOnline(true); setLastFetch(new Date());
    } catch {
      setOnline(false);
      if (!silent) toast.error('Could not load messages');
    } finally { if (!silent) setLoading(false); }
  }, [currentUser, draftToEmail, draftListingId, draftListingTitle, draftOwnerName, hasDraftTarget, selected]);

  useEffect(() => {
    if (!hasDraftTarget || !currentUser?.email) return;
    const draftId = `draft::${draftToEmail}::${draftListingId}`;
    setSelected(prev => prev || draftId);
    setMobileView('chat');
  }, [currentUser, draftToEmail, draftListingId, hasDraftTarget]);

  useEffect(() => {
    fetchConversations();
    pollRef.current = setInterval(() => fetchConversations(true), 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchConversations]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selected || !currentUser?.email) return;
    const conv = conversations.find(c => c.id === selected);
    if (!conv) return;
    setSending(true);
    const text = newMessage.trim();
    setNewMessage('');
    const optimistic: DBMessage = {
      _id: `opt_${Date.now()}`, fromEmail: currentUser.email, toEmail: conv.otherEmail,
      listingId: conv.listingId, listingTitle: conv.listingTitle, text,
      timestamp: new Date().toISOString(), read: false,
    };
    setConversations(prev => prev.map(c => c.id !== selected ? c : { ...c, messages:[...c.messages, optimistic], lastMessage:text, lastTime:new Date() }));
    try {
      await sendMessageApi({ fromEmail:currentUser.email, toEmail:conv.otherEmail, listingId:conv.listingId, listingTitle:conv.listingTitle, text, fromName:currentUser.displayName || currentUser.email.split('@')[0] });
      setTimeout(() => fetchConversations(true), 600);
    } catch { toast.error('Failed to send message'); }
    finally { setSending(false); inputRef.current?.focus(); }
  };

  const selectConv = (id: string) => {
    setSelected(id); setMobileView('chat');
    setConversations(prev => prev.map(c => c.id!==id ? c : {...c, unread:0}));
  };

  if (!currentUser) return (
    <div style={{maxWidth:460,margin:'100px auto',textAlign:'center',padding:24}}>
      <div style={{width:72,height:72,borderRadius:'50%',background:'var(--bg-subtle)',border:'2px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
        <MessageSquare size={32} style={{color:'var(--text-muted)'}}/>
      </div>
      <h2 style={{fontSize:26,fontWeight:700,marginBottom:8}}>Sign in to view messages</h2>
      <p style={{color:'var(--text-secondary)',marginBottom:28,fontSize:15}}>Your conversations with potential roommates appear here.</p>
      <Link href="/login" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'12px 28px',borderRadius:10,background:'var(--accent)',color:'#fff',fontWeight:700,fontFamily:'Syne,serif',fontSize:15}}>Sign In</Link>
    </div>
  );

  const selectedConv = conversations.find(c => c.id===selected);
  const filtered = conversations.filter(c => !searchQuery || c.otherName.toLowerCase().includes(searchQuery.toLowerCase()) || c.listingTitle.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalUnread = conversations.reduce((s,c)=>s+c.unread,0);

  return (
    <div style={{maxWidth:1140,margin:'0 auto',padding:'36px 24px 60px'}}>
      {/* Header */}
      <div style={{marginBottom:28}}>
        <h1 style={{fontSize:30,fontWeight:700,marginBottom:6,display:'flex',alignItems:'center',gap:12}}>
          Messages
          {totalUnread>0 && <span style={{fontSize:13,background:'var(--accent)',color:'#fff',borderRadius:100,padding:'2px 10px',fontFamily:'Syne,serif'}}>{totalUnread} new</span>}
        </h1>
        <div style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'var(--text-secondary)'}}>
          {online ? <><Wifi size={13} style={{color:'var(--success)'}}/> Connected · syncing every 8s</>
                  : <><WifiOff size={13} style={{color:'var(--danger)'}}/><span style={{color:'var(--danger)'}}>Offline</span></>}
          {lastFetch && <span style={{color:'var(--border-strong)'}}>· {timeAgo(lastFetch)}</span>}
          <button onClick={()=>fetchConversations()} style={{background:'none',border:'none',cursor:'pointer',color:'var(--accent)',display:'flex',alignItems:'center',gap:4,fontSize:13,padding:'2px 6px',borderRadius:6,fontFamily:'Times New Roman,serif'}}>
            <RefreshCw size={12}/> Refresh
          </button>
        </div>
      </div>

      <div style={{display:'flex',height:650,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:18,overflow:'hidden',boxShadow:'var(--shadow-md)'}}>
        {/* Sidebar */}
        <div style={{width:300,flexShrink:0,borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',background:'var(--bg)'}} className={`msg-sidebar${mobileView==='chat'?' msg-hidden':''}`}>
          <div style={{padding:'16px 16px 12px',borderBottom:'1px solid var(--border)'}}>
            <p style={{fontSize:11,fontFamily:'Syne,serif',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10}}>Conversations</p>
            <div style={{position:'relative'}}>
              <Search size={13} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)'}}/>
              <input type="text" placeholder="Search…" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                style={{width:'100%',padding:'9px 12px 9px 34px',borderRadius:8,border:'1.5px solid var(--border)',background:'var(--bg-card)',fontSize:13,color:'var(--text-primary)',fontFamily:'Times New Roman,serif',outline:'none'}}
                onFocus={e=>(e.target.style.borderColor='var(--accent)')} onBlur={e=>(e.target.style.borderColor='var(--border)')}/>
            </div>
          </div>

          <div style={{flex:1,overflowY:'auto'}}>
            {loading ? (
              <div style={{padding:20,display:'flex',flexDirection:'column',gap:14}}>
                {[1,2,3].map(i=>(
                  <div key={i} style={{display:'flex',gap:10,alignItems:'center'}}>
                    <div className="skeleton" style={{width:42,height:42,borderRadius:'50%',flexShrink:0}}/>
                    <div style={{flex:1}}><div className="skeleton" style={{height:13,width:'60%',marginBottom:7}}/><div className="skeleton" style={{height:11,width:'85%'}}/></div>
                  </div>
                ))}
              </div>
            ) : filtered.length===0 ? (
              <div style={{padding:'40px 20px',textAlign:'center'}}>
                <MessageSquare size={34} style={{color:'var(--border-strong)',marginBottom:12}}/>
                <p style={{fontSize:14,fontWeight:600,color:'var(--text-secondary)',marginBottom:6}}>{searchQuery?'No matches':'No conversations yet'}</p>
                {!searchQuery && <Link href="/browse" style={{fontSize:13,color:'var(--accent)',fontWeight:600}}>Browse listings →</Link>}
              </div>
            ) : filtered.map(conv=>(
              <button key={conv.id} onClick={()=>selectConv(conv.id)}
                style={{width:'100%',padding:'13px 16px',textAlign:'left',background:selected===conv.id?'var(--accent-light)':'transparent',borderTop:'none',borderRight:'none',borderBottom:'1px solid var(--border)',borderLeft:`3px solid ${selected===conv.id?'var(--accent)':'transparent'}`,cursor:'pointer',transition:'background 0.12s',display:'flex',gap:11,alignItems:'flex-start'}}>
                <div style={{position:'relative',flexShrink:0}}>
                  <div style={{width:42,height:42,borderRadius:'50%',background:selected===conv.id?'var(--accent)':'var(--accent-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:selected===conv.id?'#fff':'var(--accent)',fontFamily:'Syne,serif'}}>
                    {conv.otherName[0]}
                  </div>
                  {conv.unread>0&&<span style={{position:'absolute',top:-3,right:-3,width:17,height:17,borderRadius:'50%',background:'var(--accent)',border:'2px solid var(--bg)',fontSize:9,fontWeight:700,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne,serif'}}>{conv.unread}</span>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:2}}>
                    <p style={{fontSize:14,fontWeight:conv.unread>0?700:600,color:'var(--text-primary)',fontFamily:'Syne,serif',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:130}}>{conv.otherName}</p>
                    <span style={{fontSize:10,color:'var(--text-muted)',flexShrink:0,marginLeft:6}}>{timeAgo(conv.lastTime)}</span>
                  </div>
                  <p style={{fontSize:11,color:'var(--accent)',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontStyle:'italic'}}>{conv.listingTitle}</p>
                  <p style={{fontSize:12,color:conv.unread>0?'var(--text-primary)':'var(--text-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:conv.unread>0?600:400}}>{conv.lastMessage||'—'}</p>
                </div>
              </button>
            ))}
          </div>

          <div style={{padding:'10px 16px',borderTop:'1px solid var(--border)',background:'var(--bg-subtle)'}}>
            <p style={{fontSize:11,color:'var(--text-muted)',fontStyle:'italic'}}>Like a listing to start a conversation.</p>
          </div>
        </div>

        {/* Chat */}
        <div style={{flex:1,display:'flex',flexDirection:'column'}} className={`msg-chat${mobileView==='list'&&!selected?' msg-hidden-mobile':''}`}>
          {!selectedConv ? (
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'var(--text-muted)',gap:14,padding:32,textAlign:'center'}}>
              <div style={{width:80,height:80,borderRadius:'50%',background:'var(--bg-subtle)',border:'2px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <MessageSquare size={36} style={{opacity:.3}}/>
              </div>
              <div>
                <p style={{fontSize:17,fontWeight:600,color:'var(--text-secondary)',marginBottom:6}}>Select a conversation</p>
                <p style={{fontSize:13}}>Your messages with roommates will appear here.</p>
              </div>
              <Link href="/browse" style={{marginTop:8,display:'inline-flex',alignItems:'center',gap:6,padding:'9px 18px',borderRadius:8,background:'var(--accent-light)',color:'var(--accent)',fontSize:13,fontWeight:700,fontFamily:'Syne,serif'}}>
                <Plus size={14}/> Find Roommates
              </Link>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12,background:'var(--bg-card)',flexShrink:0}}>
                <button onClick={()=>setMobileView('list')} className="msg-back-btn" style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',display:'none',padding:4,borderRadius:6}}>
                  <ArrowLeft size={18}/>
                </button>
                <div style={{width:40,height:40,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,color:'#fff',fontFamily:'Syne,serif',flexShrink:0}}>
                  {selectedConv.otherName[0]}
                </div>
                <div style={{flex:1}}>
                  <p style={{fontWeight:700,fontSize:15,fontFamily:'Syne,serif',color:'var(--text-primary)',marginBottom:1}}>{selectedConv.otherName}</p>
                  <p style={{fontSize:11,color:'var(--accent)',fontStyle:'italic'}}>re: {selectedConv.listingTitle}</p>
                </div>
                <Link href={`/listings/${selectedConv.listingId}`} style={{fontSize:12,padding:'6px 12px',borderRadius:7,border:'1px solid var(--border)',color:'var(--text-secondary)',background:'var(--bg-subtle)',fontFamily:'Syne,serif',fontWeight:600}}>
                  View listing →
                </Link>
              </div>

              {/* Safety banner */}
              <div style={{padding:'8px 20px',background:'var(--gold-light)',borderBottom:'1px solid var(--border)',flexShrink:0}}>
                <p style={{fontSize:11,color:'var(--gold)',lineHeight:1.4}}>⚠️ <strong>Safety tip:</strong> Meet in public first. Never share bank details over chat.</p>
              </div>

              {/* Messages area */}
              <div style={{flex:1,overflowY:'auto',padding:'20px 24px',display:'flex',flexDirection:'column',gap:14}}>
                {selectedConv.messages.length===0 && (
                  <div style={{textAlign:'center',padding:'30px 0',color:'var(--text-muted)',fontSize:13,fontStyle:'italic'}}>No messages yet — say hello!</div>
                )}
                {selectedConv.messages.map((msg,idx)=>{
                  const isMe = msg.fromEmail===currentUser.email;
                  const showDate = idx===0 || new Date(msg.timestamp).toDateString()!==new Date(selectedConv.messages[idx-1].timestamp).toDateString();
                  return (
                    <div key={msg._id}>
                      {showDate&&(
                        <div style={{textAlign:'center',margin:'6px 0 12px',display:'flex',alignItems:'center',gap:10}}>
                          <div style={{flex:1,height:1,background:'var(--border)'}}/>
                          <span style={{fontSize:11,color:'var(--text-muted)',padding:'0 10px',fontStyle:'italic'}}>
                            {new Date(msg.timestamp).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}
                          </span>
                          <div style={{flex:1,height:1,background:'var(--border)'}}/>
                        </div>
                      )}
                      <div style={{display:'flex',justifyContent:isMe?'flex-end':'flex-start',gap:8,alignItems:'flex-end'}}>
                        {!isMe&&(
                          <div style={{width:28,height:28,borderRadius:'50%',background:'var(--accent-light)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:12,fontWeight:700,color:'var(--accent)',fontFamily:'Syne,serif'}}>
                            {selectedConv.otherName[0]}
                          </div>
                        )}
                        <div style={{maxWidth:'68%'}}>
                          <div style={{padding:'10px 15px',lineHeight:1.55,fontSize:14,...(isMe?{background:'var(--accent)',color:'#fff',borderRadius:'18px 18px 4px 18px'}:{background:'var(--bg-subtle)',color:'var(--text-primary)',border:'1px solid var(--border)',borderRadius:'18px 18px 18px 4px'})}}>
                            {msg.text}
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:4,marginTop:4,justifyContent:isMe?'flex-end':'flex-start'}}>
                            <Clock size={9} style={{color:'var(--text-muted)'}}/>
                            <span style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>{formatTime(msg.timestamp)}</span>
                            {isMe&&<CheckCheck size={10} style={{color:msg.read?'var(--accent-2)':'var(--text-muted)'}}/>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef}/>
              </div>

              {/* Input */}
              <div style={{padding:'14px 20px',borderTop:'1px solid var(--border)',display:'flex',gap:10,background:'var(--bg-card)',flexShrink:0,alignItems:'center'}}>
                <input ref={inputRef} type="text" placeholder="Type a message and press Enter…"
                  value={newMessage} onChange={e=>setNewMessage(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();}}}
                  disabled={sending}
                  style={{flex:1,padding:'11px 18px',borderRadius:24,border:'1.5px solid var(--border)',background:'var(--bg)',fontSize:14,color:'var(--text-primary)',fontFamily:'Times New Roman,serif',outline:'none',transition:'border-color 0.15s'}}
                  onFocus={e=>(e.target.style.borderColor='var(--accent)')} onBlur={e=>(e.target.style.borderColor='var(--border)')}/>
                <button onClick={handleSend} disabled={!newMessage.trim()||sending}
                  style={{width:44,height:44,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',border:'none',cursor:!newMessage.trim()||sending?'not-allowed':'pointer',background:!newMessage.trim()||sending?'var(--border)':'var(--accent)',color:'#fff',transition:'all 0.15s'}}>
                  <Send size={16}/>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media(max-width:640px){
          .msg-sidebar{width:100%!important;}
          .msg-hidden{display:none!important;}
          .msg-back-btn{display:flex!important;}
          .msg-hidden-mobile{display:none!important;}
        }
      `}</style>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div style={{maxWidth:1140,margin:'0 auto',padding:'36px 24px 60px'}}>Loading messages...</div>}>
      <MessagesPageContent />
    </Suspense>
  );
}
