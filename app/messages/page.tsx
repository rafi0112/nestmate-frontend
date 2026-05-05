'use client';
import { Suspense, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Send, Search, ArrowLeft, Clock, CheckCheck, MessageSquare, RefreshCw, Wifi, WifiOff, Plus, Bell, Pin, X as XIcon } from 'lucide-react';
import { getConversations, sendMessage as sendMessageApi, getHousehold, joinHousehold, getHouseholdByMember, getRoomChat, sendRoomChat } from '@/lib/api';
import { socket } from '@/utils/socket';
import toast from 'react-hot-toast';

interface DBMessage {
  _id: string; fromEmail: string; toEmail: string;
  listingId: string; listingTitle: string; text: string;
  timestamp: string; read: boolean; seen?: boolean;
}
interface Conversation {
  id: string; otherEmail: string; otherName: string;
  listingId: string; listingTitle: string; messages: DBMessage[];
  lastMessage: string; lastTime: Date; unread: number;
}
interface ChatMsg {
  _id: string;
  householdId: string;
  senderEmail: string;
  senderName: string;
  text: string;
  timestamp: string;
  type?: string;
  isAnnouncement?: boolean;
  isPinned?: boolean;
  replyTo?: Record<string, unknown>;
}
interface Household {
  _id: string;
  listingId: string;
  listingTitle: string;
  joinCode: string;
  members?: string[];
  memberUids?: string[];
  monthlyFee: number;
  ownerEmail: string;
}

function getHouseholdMembers(household: Household | null | undefined) {
  return household?.memberUids ?? household?.members ?? [];
}

function getConversationKey(message: Pick<DBMessage, 'listingId' | 'fromEmail' | 'toEmail'>, myEmail: string) {
  const otherEmail = message.fromEmail === myEmail ? message.toEmail : message.fromEmail;
  return `${message.listingId}::${otherEmail}`;
}

function getMessageKey(message: DBMessage) {
  return message._id || `${message.listingId}::${message.fromEmail}::${message.toEmail}::${message.timestamp}::${message.text}`;
}

function mergeConversationMessages(prev: DBMessage[], next: DBMessage[]) {
  const byKey = new Map<string, DBMessage>();
  [...prev, ...next].forEach(message => {
    byKey.set(getMessageKey(message), message);
  });
  return [...byKey.values()].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
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
    // Count unseen messages (prioritize seen field if available, otherwise use read field)
    const isMsgUnseen = msg.seen !== undefined ? msg.seen === false : !msg.read;
    if (msg.toEmail === myEmail && isMsgUnseen) conv.unread++;
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

function getConversationsCacheKey(email: string) {
  return `nestmate:conversations:${email}`;
}

function readCachedConversations(email: string): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const cached = window.localStorage.getItem(getConversationsCacheKey(email));
    if (!cached) return [];
    const parsed = JSON.parse(cached) as Array<Omit<Conversation, 'lastTime'> & { lastTime: string }>;
    return parsed.map(conv => ({ ...conv, lastTime: new Date(conv.lastTime) }));
  } catch {
    return [];
  }
}

function writeCachedConversations(email: string, conversations: Conversation[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(getConversationsCacheKey(email), JSON.stringify(conversations));
  } catch {
    // Ignore storage quota/private mode failures; live network data is still the source of truth.
  }
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
  const conversationsFetchInFlightRef = useRef(false);
  const hydratedConversationCacheRef = useRef(false);
  const hasConversationsRef = useRef(false);
  const draftToEmail = searchParams.get('to') || '';
  const draftListingId = searchParams.get('listingId') || '';
  const draftListingTitle = searchParams.get('listingTitle') || 'Listing';
  const draftOwnerName = searchParams.get('ownerName') || draftToEmail.split('@')[0];
  const hasDraftTarget = Boolean(draftToEmail && draftListingId);
  const [householdForDraft, setHouseholdForDraft] = useState<Household|null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joining, setJoining] = useState(false);
  const selectedRef = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState<'messages'|'roomchat'>('messages');
  const [household, setHousehold] = useState<Household|null>(null);
  const [roomChatMessages, setRoomChatMessages] = useState<ChatMsg[]>([]);
  const [roomChatText, setRoomChatText] = useState('');
  const [roomChatSending, setRoomChatSending] = useState(false);
  const [announcements, setAnnouncements] = useState<ChatMsg[]>([]);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementSending, setAnnouncementSending] = useState(false);
  const draftInitializedRef = useRef(false);
  const conversationsInitializedRef = useRef(false);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    hasConversationsRef.current = conversations.length > 0;
  }, [conversations.length]);

  // Fetch household data
  useEffect(() => {
    const email = currentUser?.email;
    if (!email) return;
    let mounted = true;
    (async () => {
      try {
        const data = await getHouseholdByMember(email);
        if (!mounted) return;
        if (Array.isArray(data) && data.length > 0) setHousehold(data[0]);
        else if (data && typeof data === 'object') setHousehold(data);
      } catch { setHousehold(null); }
    })();
    return () => { mounted = false; };
  }, [currentUser?.email]);

  // Fetch room chat messages
  useEffect(() => {
    if (!household?._id) return;
    let mounted = true;
    const loadRoomChat = async () => {
      try {
        const msgs = await getRoomChat(household._id);
        if (!mounted) return;
        setRoomChatMessages(msgs || []);
        const pinned = (msgs || []).filter((m: ChatMsg) => m.isPinned);
        setAnnouncements(pinned);
      } catch { }
    };
    loadRoomChat();
    const interval = setInterval(loadRoomChat, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, [household?._id]);

  useEffect(() => {
    draftInitializedRef.current = false;
    conversationsInitializedRef.current = false;
    conversationsFetchInFlightRef.current = false;
    hydratedConversationCacheRef.current = false;
  }, [currentUser?.email, draftToEmail, draftListingId]);

  useEffect(() => {
    const email = currentUser?.email;
    if (!email) return;
    const timeout = window.setTimeout(() => {
      const cached = readCachedConversations(email);
      if (cached.length > 0) {
        hydratedConversationCacheRef.current = true;
        setConversations(cached);
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [currentUser?.email]);

  const fetchConversations = useCallback(async (silent=false) => {
    const email = currentUser?.email;
    if (!email || conversationsFetchInFlightRef.current) return;
    conversationsFetchInFlightRef.current = true;
    if (!silent) setLoading(true);
    try {
      const data: DBMessage[] = await getConversations(email);
      const next = buildConversations(Array.isArray(data) ? data : [], email);
      if (hasDraftTarget) {
        const draftId = `draft::${draftToEmail}::${draftListingId}`;
        const existingThread = next.find(conv => conv.otherEmail === draftToEmail && conv.listingId === draftListingId);
        if (existingThread) {
          if (!selectedRef.current || selectedRef.current === draftId) setSelected(existingThread.id);
        } else if (!next.some(conv => conv.id === draftId)) {
          next.unshift(buildDraftConversation({ toEmail: draftToEmail, listingId: draftListingId, listingTitle: draftListingTitle, ownerName: draftOwnerName }));
          if (!selectedRef.current) setSelected(draftId);
        }
      }
      setConversations(next);
      writeCachedConversations(email, next);
      setOnline(true); setLastFetch(new Date());
    } catch {
      setOnline(false);
      if (!silent) toast.error('Could not load messages');
    } finally {
      conversationsFetchInFlightRef.current = false;
      if (!silent) setLoading(false);
    }
  }, [currentUser?.email, draftToEmail, draftListingId, draftListingTitle, draftOwnerName, hasDraftTarget]);

  useEffect(() => {
    if (!hasDraftTarget || !currentUser?.email || draftInitializedRef.current) return;
    const draftId = `draft::${draftToEmail}::${draftListingId}`;
    setSelected(prev => prev || draftId);
    setMobileView('chat');
    draftInitializedRef.current = true;
  }, [hasDraftTarget, currentUser?.email, draftToEmail, draftListingId]);

  useEffect(() => {
    if (!conversationsInitializedRef.current) {
      fetchConversations(hydratedConversationCacheRef.current || hasConversationsRef.current);
      conversationsInitializedRef.current = true;
    }
    pollRef.current = setInterval(() => fetchConversations(true), 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchConversations]);

  useEffect(() => {
    const myEmail = currentUser?.email;
    if (!myEmail) return;

    const handleIncomingMessage = (message: DBMessage) => {
      if (!message?.listingId) return;

      setConversations(prev => {
        const conversationKey = getConversationKey(message, myEmail);
        const otherEmail = message.fromEmail === myEmail ? message.toEmail : message.fromEmail;
        const otherName = otherEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const existing = prev.find(conv => conv.id === conversationKey);
        // Count unseen messages
        const isMessageUnseen = message.toEmail === myEmail && message.seen === false;
        const nextUnread = isMessageUnseen && selectedRef.current !== conversationKey
          ? (existing?.unread || 0) + 1
          : existing?.unread || 0;

        if (!existing) {
          return [{
            id: conversationKey,
            otherEmail,
            otherName,
            listingId: message.listingId,
            listingTitle: message.listingTitle || 'Listing',
            messages: [message],
            lastMessage: message.text,
            lastTime: new Date(message.timestamp),
            unread: nextUnread,
          }, ...prev].sort((a, b) => b.lastTime.getTime() - a.lastTime.getTime());
        }

        return prev
          .map(conv => conv.id !== conversationKey ? conv : {
            ...conv,
            messages: mergeConversationMessages(conv.messages, [message]),
            lastMessage: message.text,
            lastTime: new Date(message.timestamp),
            unread: nextUnread,
          })
          .sort((a, b) => b.lastTime.getTime() - a.lastTime.getTime());
      });
    };

    const handleUnreadCount = ({ from, count }: { from: string; count: number; }) => {
      setConversations(prev => prev.map(conv => 
        conv.otherEmail === from ? { ...conv, unread: count } : conv
      ));
    };

    socket.emit('join_room', myEmail);
    socket.on('receive_message', handleIncomingMessage);
    socket.on('unreadCount', handleUnreadCount);

    return () => {
      socket.off('receive_message', handleIncomingMessage);
      socket.off('unreadCount', handleUnreadCount);
    };
  }, [currentUser?.email]);

  // If user arrived from a listing, try to fetch the household info for a quick join
  useEffect(() => {
    if (!hasDraftTarget) return;
    let mounted = true;
    (async () => {
      try {
        const data = await getHousehold(draftListingId);
        if (!mounted) return;
        // backend returns null or array/object; handle either
        if (data && Array.isArray(data) && data.length>0) setHouseholdForDraft(data[0]);
        else if (data && typeof data === 'object') setHouseholdForDraft(data);
        else setHouseholdForDraft(null);
      } catch { setHouseholdForDraft(null); }
    })();
    return () => { mounted = false; };
  }, [hasDraftTarget, draftListingId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selected || !currentUser?.email) return;
    const conv = conversations.find(c => c.id === selected);
    if (!conv) return;
    setSending(true);
    const text = newMessage.trim();
    setNewMessage('');
    try {
      const saved = await sendMessageApi({ fromEmail:currentUser.email, toEmail:conv.otherEmail, listingId:conv.listingId, listingTitle:conv.listingTitle, text, fromName:currentUser.displayName || currentUser.email.split('@')[0] });
      if (saved) {
        setConversations(prev => prev.map(c => c.id !== selected ? c : {
          ...c,
          messages: mergeConversationMessages(c.messages, [saved]),
          lastMessage: saved.text,
          lastTime: new Date(saved.timestamp),
        }));
      }
      setTimeout(() => fetchConversations(true), 600);
    } catch { toast.error('Failed to send message'); }
    finally { setSending(false); inputRef.current?.focus(); }
  };

  const handleJoinByCode = async (code?: string) => {
    if (!currentUser?.email) return toast.error('Sign in to join rooms');
    const joinCode = (code || joinCodeInput || '').toString().trim().toUpperCase();
    if (!joinCode) return toast.error('Enter a join code');
    setJoining(true);
    try {
      const res = await joinHousehold(joinCode, currentUser.email, currentUser.uid);
      if (res && !res.error) {
        toast.success('Joined room successfully');
        setJoinCodeInput('');
      } else {
        toast.error(res?.error || 'Failed to join room');
      }
    } catch {
      toast.error('Failed to join room');
    } finally { setJoining(false); }
  };

  const selectConv = (id: string) => {
    setSelected(id); setMobileView('chat');
    setConversations(prev => prev.map(c => c.id!==id ? c : {...c, unread:0}));
    // Mark messages as seen in this conversation
    const conv = conversations.find(c => c.id === id);
    if (conv && currentUser?.email) {
      socket.emit('markAsSeen', {
        userEmail: currentUser.email,
        otherEmail: conv.otherEmail,
      });
    }
  };

  const sendRoomChatMessage = async () => {
    if (!roomChatText.trim() || !household || roomChatSending) return;
    setRoomChatSending(true);
    try {
      const email = currentUser?.email || '';
      const displayName = currentUser?.displayName || (email ? email.split('@')[0] : 'User');
      const msg = {
        householdId: household._id,
        senderEmail: email,
        senderName: displayName,
        text: roomChatText.trim(),
        isAnnouncement: false,
      };
      const saved = await sendRoomChat(msg);
      if (saved) {
        setRoomChatMessages(prev => [...prev, saved]);
        setRoomChatText('');
      }
    } catch { toast.error('Failed to send message'); }
    finally { setRoomChatSending(false); }
  };

  const sendAnnouncement = async () => {
    if (!announcementText.trim() || !household || announcementSending) return;
    setAnnouncementSending(true);
    try {
      const email = currentUser?.email || '';
      const displayName = currentUser?.displayName || (email ? email.split('@')[0] : 'User');
      const msg = {
        householdId: household._id,
        senderEmail: email,
        senderName: displayName,
        text: announcementText.trim(),
        isAnnouncement: true,
        isPinned: true,
      };
      const saved = await sendRoomChat(msg);
      if (saved) {
        setAnnouncements(prev => [...prev, saved]);
        setRoomChatMessages(prev => [...prev, saved]);
        setAnnouncementText('');
      }
    } catch { toast.error('Failed to send announcement'); }
    finally { setAnnouncementSending(false); }
  };

  const unpinAnnouncement = (msgId: string) => {
    setAnnouncements(prev => prev.filter(a => a._id !== msgId));
  };

  const selectedConv = useMemo(() => conversations.find(c => c.id===selected), [conversations, selected]);
  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter(c => c.otherName.toLowerCase().includes(query) || c.listingTitle.toLowerCase().includes(query));
  }, [conversations, searchQuery]);
  const totalUnread = useMemo(() => conversations.reduce((s,c)=>s+c.unread,0), [conversations]);
  const householdMembers = getHouseholdMembers(household);

  if (!currentUser) return (
    <div style={{maxWidth:460,margin:'100px auto',textAlign:'center',padding:24}}>
      <div style={{width:72,height:72,borderRadius:'50%',background:'var(--bg-subtle)',border:'2px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
        <MessageSquare size={32} style={{color:'var(--text-muted)'}}/>
      </div>
      <h2 style={{fontSize:26,fontWeight:700,marginBottom:8}}>Sign in to view messages</h2>
      <p style={{color:'var(--text-secondary)',marginBottom:28,fontSize:15}}>Your conversations with potential roommates appear here.</p>
      <Link href="/login" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'12px 28px',borderRadius:10,background:'var(--accent)',color:'#fff',fontWeight:700,fontFamily:'Times New Roman',fontSize:15}}>Sign In</Link>
    </div>
  );

  return (
    <div style={{maxWidth:1140,margin:'0 auto',padding:'36px 24px 60px'}}>
      {/* Header */}
      <div style={{marginBottom:28}}>
        <h1 style={{fontSize:30,fontWeight:700,marginBottom:6,display:'flex',alignItems:'center',gap:12}}>
          Messages
          {totalUnread>0 && <span style={{fontSize:13,background:'var(--danger)',color:'#fff',borderRadius:100,padding:'4px 12px',fontFamily:'Times New Roman',fontWeight:700}}>{totalUnread} unread</span>}
        </h1>
        <div style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'var(--text-secondary)'}}>
          {online ? <><Wifi size={13} style={{color:'var(--success)'}}/> Connected Â· syncing every 8s</>
                  : <><WifiOff size={13} style={{color:'var(--danger)'}}/><span style={{color:'var(--danger)'}}>Offline</span></>}
          {lastFetch && <span style={{color:'var(--border-strong)'}}>Â· {timeAgo(lastFetch)}</span>}
          <button onClick={()=>fetchConversations()} style={{background:'none',border:'none',cursor:'pointer',color:'var(--accent)',display:'flex',alignItems:'center',gap:4,fontSize:13,padding:'2px 6px',borderRadius:6,fontFamily:'Georgia, serif'}}>
            <RefreshCw size={12}/> Refresh
          </button>
        </div>
        {/* Quick join box (mobile-friendly) */}
        <div style={{marginTop:12,display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <div style={{display:'flex',gap:8,alignItems:'center',flex:1,minWidth:220}}>
            <input placeholder="Join room by code" value={joinCodeInput} onChange={e=>setJoinCodeInput(e.target.value)}
              style={{flex:1,padding:'10px 12px',borderRadius:8,border:'1.5px solid var(--border)',background:'var(--bg-card)',fontSize:13,outline:'none'}}/>
            <button onClick={()=>handleJoinByCode()} disabled={joining}
              style={{padding:'10px 14px',borderRadius:8,background:joining?'var(--border)':'var(--accent)',color:'#fff',border:'none',fontWeight:700}}>Join</button>
          </div>
          {hasDraftTarget && (
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span style={{fontSize:13,color:'var(--text-muted)'}}>This message links to:</span>
              <Link href={`/listings/${draftListingId}`} style={{fontSize:13,color:'var(--accent)',fontWeight:700}}>Listing</Link>
              {householdForDraft ? (
                <>
                  {getHouseholdMembers(householdForDraft).length > 1 && (
                    <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 9px',borderRadius:999,background:'var(--success-light)',color:'var(--success)',border:'1px solid var(--success)',fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.06em'}}>
                      Active
                    </span>
                  )}
                  <button onClick={()=>handleJoinByCode(householdForDraft.joinCode)} disabled={joining}
                    style={{padding:'8px 12px',borderRadius:8,background:'var(--accent-2)',color:'#fff',border:'none',fontWeight:700}}>Join listing&apos;s room</button>
                </>
              ) : (
                <span style={{fontSize:12,color:'var(--text-muted)'}}>No room created yet</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tab buttons */}
      <div style={{display:'flex',gap:12,marginBottom:20,borderBottom:'1px solid var(--border)',paddingBottom:16}}>
        <button onClick={()=>setActiveTab('messages')} style={{padding:'8px 16px',borderRadius:8,background:activeTab==='messages'?'var(--accent)':'var(--bg-subtle)',color:activeTab==='messages'?'#fff':'var(--text-secondary)',border:'none',cursor:'pointer',fontFamily:'Times New Roman',fontWeight:700,fontSize:14,transition:'all 0.12s'}}>
          <MessageSquare size={14} style={{display:'inline',marginRight:6}}/>
          Messages
        </button>
        <button onClick={()=>setActiveTab('roomchat')} style={{padding:'8px 16px',borderRadius:8,background:activeTab==='roomchat'?'var(--accent)':'var(--bg-subtle)',color:activeTab==='roomchat'?'#fff':'var(--text-secondary)',border:'none',cursor:'pointer',fontFamily:'Times New Roman',fontWeight:700,fontSize:14,transition:'all 0.12s'}}>
          <Bell size={14} style={{display:'inline',marginRight:6}}/>
          Room Chat {household ? '('+household.listingTitle+')' : ''}
        </button>
      </div>

      {activeTab === 'messages' && (
      <div className="msg-shell" style={{display:'flex',height:650,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:18,overflow:'hidden',boxShadow:'var(--shadow-md)'}}>
        {/* Sidebar */}
        <div style={{width:300,flexShrink:0,borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',background:'var(--bg)'}} className={`msg-sidebar${mobileView==='chat'?' msg-hidden':''}`}>
          <div style={{padding:'16px 16px 12px',borderBottom:'1px solid var(--border)'}}>
            <p style={{fontSize:11,fontFamily:'Times New Roman',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10}}>Conversations</p>
            <div style={{position:'relative'}}>
              <Search size={13} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)'}}/>
              <input type="text" placeholder="Searchâ€¦" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                style={{width:'100%',padding:'9px 12px 9px 34px',borderRadius:8,border:'1.5px solid var(--border)',background:'var(--bg-card)',fontSize:13,color:'var(--text-primary)',fontFamily:'Georgia, serif',outline:'none'}}
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
                {!searchQuery && <Link href="/browse" style={{fontSize:13,color:'var(--accent)',fontWeight:600}}>Browse listings â†’</Link>}
              </div>
            ) : filtered.map(conv=>(
              <button key={conv.id} onClick={()=>selectConv(conv.id)}
                style={{width:'100%',padding:'13px 16px',textAlign:'left',background:selected===conv.id?'var(--accent-light)':'transparent',borderTop:'none',borderRight:'none',borderBottom:'1px solid var(--border)',borderLeft:`3px solid ${selected===conv.id?'var(--accent)':'transparent'}`,cursor:'pointer',transition:'background 0.12s',display:'flex',gap:11,alignItems:'flex-start'}}>
                <div style={{position:'relative',flexShrink:0}}>
                  <div style={{width:42,height:42,borderRadius:'50%',background:selected===conv.id?'var(--accent)':'var(--accent-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:selected===conv.id?'#fff':'var(--accent)',fontFamily:'Times New Roman'}}>
                    {conv.otherName[0]}
                  </div>
                  {conv.unread>0&&<span style={{position:'absolute',top:-3,right:-3,width:22,height:22,borderRadius:'50%',background:'var(--danger)',border:'2px solid var(--bg)',fontSize:10,fontWeight:700,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Times New Roman'}}>{conv.unread}</span>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:2}}>
                    <p style={{fontSize:14,fontWeight:conv.unread>0?700:600,color:'var(--text-primary)',fontFamily:'Times New Roman',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:130}}>{conv.otherName}</p>
                    <span style={{fontSize:10,color:'var(--text-muted)',flexShrink:0,marginLeft:6}}>{timeAgo(conv.lastTime)}</span>
                  </div>
                  <p style={{fontSize:11,color:'var(--accent)',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontStyle:'italic'}}>{conv.listingTitle}</p>
                  <p style={{fontSize:12,color:conv.unread>0?'var(--text-primary)':'var(--text-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:conv.unread>0?700:400}}>{conv.lastMessage||'–'}</p>
                  {conv.unread>0 && <p style={{fontSize:10,color:'var(--danger)',marginTop:4,fontWeight:700}}>{conv.unread} unseen message{conv.unread>1?'s':''}</p>}
                </div>
              </button>
            ))}
          </div>

          <div style={{padding:'10px 16px',borderTop:'1px solid var(--border)',background:'var(--bg-subtle)'}}>
            <p style={{fontSize:11,color:'var(--text-muted)',fontStyle:'italic'}}>Like a listing to start a conversation.</p>
          </div>
        </div>

        {/* Chat */}
        <div style={{flex:1,display:'flex',flexDirection:'column',minHeight:0}} className={`msg-chat${mobileView==='list'&&!selected?' msg-hidden-mobile':''}`}>
          {!selectedConv ? (
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'var(--text-muted)',gap:14,padding:32,textAlign:'center'}}>
              <div style={{width:80,height:80,borderRadius:'50%',background:'var(--bg-subtle)',border:'2px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <MessageSquare size={36} style={{opacity:.3}}/>
              </div>
              <div>
                <p style={{fontSize:17,fontWeight:600,color:'var(--text-secondary)',marginBottom:6}}>Select a conversation</p>
                <p style={{fontSize:13}}>Your messages with roommates will appear here.</p>
              </div>
              <Link href="/browse" style={{marginTop:8,display:'inline-flex',alignItems:'center',gap:6,padding:'9px 18px',borderRadius:8,background:'var(--accent-light)',color:'var(--accent)',fontSize:13,fontWeight:700,fontFamily:'Times New Roman'}}>
                <Plus size={14}/> Find Roommates
              </Link>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12,background:'var(--bg-card)',flexShrink:0}}>
                <button onClick={()=>{setMobileView('list');setSelected(null);}} className="msg-back-btn" style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',display:'none',padding:4,borderRadius:6,transition:'color 0.15s'}} onMouseEnter={e=>(e.currentTarget.style.color='var(--accent)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--text-muted)')}>
                  <ArrowLeft size={18}/>
                </button>
                <div style={{width:40,height:40,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,color:'#fff',fontFamily:'Times New Roman',flexShrink:0}}>
                  {selectedConv.otherName[0]}
                </div>
                <div style={{flex:1}}>
                  <p style={{fontWeight:700,fontSize:15,fontFamily:'Times New Roman',color:'var(--text-primary)',marginBottom:1}}>{selectedConv.otherName}</p>
                  <p style={{fontSize:11,color:'var(--accent)',fontStyle:'italic'}}>re: {selectedConv.listingTitle}</p>
                </div>
                <Link href={`/listings/${selectedConv.listingId}`} style={{fontSize:12,padding:'6px 12px',borderRadius:7,border:'1px solid var(--border)',color:'var(--text-secondary)',background:'var(--bg-subtle)',fontFamily:'Times New Roman',fontWeight:600}}>
                  View listing â†’
                </Link>
              </div>

              {/* Safety banner */}
              <div style={{padding:'8px 20px',background:'var(--gold-light)',borderBottom:'1px solid var(--border)',flexShrink:0}}>
                <p style={{fontSize:11,color:'var(--gold)',lineHeight:1.4}}>âš ï¸ <strong>Safety tip:</strong> Meet in public first. Never share bank details over chat.</p>
              </div>

              {/* Messages area */}
              <div style={{flex:1,overflowY:'auto',padding:'20px 24px',display:'flex',flexDirection:'column',gap:14}}>
                {selectedConv.messages.length===0 && (
                  <div style={{textAlign:'center',padding:'30px 0',color:'var(--text-muted)',fontSize:13,fontStyle:'italic'}}>No messages yet â€” say hello!</div>
                )}
                {selectedConv.messages.map((msg,idx)=>{
                  const isMe = msg.fromEmail===currentUser.email;
                  const isUnseen = !isMe && msg.seen === false;
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
                          <div style={{width:28,height:28,borderRadius:'50%',background:'var(--accent-light)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:12,fontWeight:700,color:'var(--accent)',fontFamily:'Times New Roman'}}>
                            {selectedConv.otherName[0]}
                          </div>
                        )}
                        <div style={{maxWidth:'68%'}}>
                          <div style={{padding:'10px 15px',lineHeight:1.55,fontSize:14,fontWeight:isUnseen?700:400,...(isMe?{background:'var(--accent)',color:'#fff',borderRadius:'18px 18px 4px 18px'}:{background:isUnseen?'var(--accent-light)':'var(--bg-subtle)',color:isUnseen?'var(--accent)':'var(--text-primary)',border:`1px solid ${isUnseen?'var(--accent)':'var(--border)'}`,borderRadius:'18px 18px 18px 4px'})}}>
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
                <input ref={inputRef} type="text" placeholder="Type a message and press Enterâ€¦"
                  value={newMessage} onChange={e=>setNewMessage(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();}}}
                  disabled={sending}
                  style={{flex:1,padding:'11px 18px',borderRadius:24,border:'1.5px solid var(--border)',background:'var(--bg)',fontSize:14,color:'var(--text-primary)',fontFamily:'Times New Roman',outline:'none',transition:'border-color 0.15s'}}
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
      )}

      {activeTab === 'roomchat' && household && (
      <div style={{display:'flex',flexDirection:'column',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:18,overflow:'hidden',height:650,boxShadow:'var(--shadow-md)'}}>
        {/* Announcements */}
        {announcements.length > 0 && (
        <div style={{padding:'12px 16px',background:'var(--accent-light)',borderBottom:'1px solid var(--border)',maxHeight:120,overflowY:'auto'}}>
          <p style={{fontSize:11,fontFamily:'Times New Roman',fontWeight:700,color:'var(--accent)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.08em'}}>📌 Pinned Announcements</p>
          {announcements.map(ann => (
            <div key={ann._id} style={{display:'flex',gap:8,padding:'8px',background:'var(--bg-card)',borderRadius:8,marginBottom:6,border:'1px solid var(--border)'}}>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:11,color:'var(--accent)',fontWeight:700,fontFamily:'Times New Roman',marginBottom:2}}>{ann.senderName}</p>
                <p style={{fontSize:12,color:'var(--text-primary)',lineHeight:1.4}}>{ann.text}</p>
              </div>
              <button onClick={()=>unpinAnnouncement(ann._id)} title="Unpin" style={{background:'none',border:'none',color:'var(--danger)',cursor:'pointer',padding:4}}>
                <XIcon size={14}/>
              </button>
            </div>
          ))}
        </div>
        )}

        {/* Header */}
        <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',background:'var(--bg-subtle)',display:'flex',alignItems:'center',gap:10}}>
          <Bell size={16} style={{color:'var(--accent)'}}/>
          <p style={{fontFamily:'Times New Roman',fontWeight:700,fontSize:14,color:'var(--text-primary)'}}>Room Chat - {household.listingTitle}</p>
          {householdMembers.length > 1 && (
            <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 9px',borderRadius:999,background:'var(--success-light)',color:'var(--success)',border:'1px solid var(--success)',fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.06em'}}>
              Active
            </span>
          )}
          <span style={{marginLeft:'auto',fontSize:11,color:'var(--text-muted)',fontStyle:'italic'}}>Members: {householdMembers.length}</span>
        </div>

        {/* Messages */}
        <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
          {roomChatMessages.length===0 && (
            <div style={{textAlign:'center',color:'var(--text-muted)',fontSize:13,fontStyle:'italic',paddingTop:40}}>
              No messages yet. Start the conversation!
            </div>
          )}
          {roomChatMessages.map(m => {
            const isMe = m.senderEmail === currentUser?.email;
            return (
              <div key={m._id} style={{display:'flex',justifyContent:isMe?'flex-end':'flex-start',gap:8,alignItems:'flex-end'}}>
                {!isMe && <div style={{width:28,height:28,borderRadius:'50%',background:'var(--accent-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'var(--accent)',fontFamily:'Times New Roman',flexShrink:0}}>{m.senderName[0]}</div>}
                <div style={{maxWidth:'72%'}}>
                  {!isMe && <p style={{fontSize:10,color:'var(--text-muted)',marginBottom:3,fontFamily:'Times New Roman',fontWeight:700}}>{m.senderName}</p>}
                  <div style={{padding:'9px 14px',lineHeight:1.55,fontSize:14,...(isMe?{background:'var(--accent)',color:'#fff',borderRadius:'16px 16px 3px 16px'}:{background:m.isAnnouncement?'var(--accent-light)':'var(--bg-subtle)',color:'var(--text-primary)',border:'1px solid var(--border)',borderRadius:'16px 16px 16px 3px'})}}>
                    {m.isAnnouncement && <div style={{fontSize:10,color:'var(--accent)',fontFamily:'Times New Roman',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:5}}>📌 Announcement</div>}
                    {m.text}
                  </div>
                  <p style={{fontSize:10,color:'var(--text-muted)',marginTop:3,fontStyle:'italic'}}>{new Date(m.timestamp).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input area */}
        <div style={{borderTop:'1px solid var(--border)',padding:'12px 16px',background:'var(--bg-card)',flexShrink:0}}>
          {/* Announcement input */}
          <div style={{marginBottom:10}}>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <input value={announcementText} onChange={e=>setAnnouncementText(e.target.value)} placeholder="Create an announcement (pin it)..." 
                style={{flex:1,padding:'10px 12px',borderRadius:8,border:'1.5px solid var(--border)',background:'var(--bg)',fontSize:13,outline:'none'}}
                onFocus={e=>(e.target.style.borderColor='var(--accent)')} onBlur={e=>(e.target.style.borderColor='var(--border)')}/>
              <button onClick={sendAnnouncement} disabled={!announcementText.trim()||announcementSending} style={{padding:'8px 12px',borderRadius:8,background:announcementText.trim()&&!announcementSending?'var(--accent-2)':'var(--border)',color:'#fff',border:'none',cursor:announcementText.trim()&&!announcementSending?'pointer':'not-allowed',fontFamily:'Times New Roman',fontWeight:700,fontSize:12}}>
                <Pin size={13} style={{display:'inline',marginRight:4}}/>
                Pin
              </button>
            </div>
          </div>

          {/* Regular message input */}
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input value={roomChatText} onChange={e=>setRoomChatText(e.target.value)} placeholder="Message your housemates..." onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendRoomChatMessage();}}}
              style={{flex:1,padding:'10px 12px',borderRadius:8,border:'1.5px solid var(--border)',background:'var(--bg)',fontSize:13,outline:'none'}}
              onFocus={e=>(e.target.style.borderColor='var(--accent)')} onBlur={e=>(e.target.style.borderColor='var(--border)')}/>
            <button onClick={sendRoomChatMessage} disabled={!roomChatText.trim()||roomChatSending} style={{width:36,height:36,borderRadius:'50%',background:roomChatText.trim()&&!roomChatSending?'var(--accent)':'var(--border)',color:'#fff',border:'none',cursor:roomChatText.trim()&&!roomChatSending?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Send size={14}/>
            </button>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'roomchat' && !household && (
      <div style={{padding:'60px 24px',textAlign:'center',color:'var(--text-muted)'}}>
        <MessageSquare size={48} style={{margin:'0 auto 20px',opacity:0.3}}/>
        <p style={{fontSize:16,fontWeight:600,marginBottom:8,color:'var(--text-secondary)'}}>No household yet</p>
        <p style={{fontSize:14,marginBottom:20}}>Join a room to access room chat and announcements.</p>
        <button onClick={()=>setActiveTab('messages')} style={{padding:'10px 20px',borderRadius:8,background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Times New Roman',fontWeight:700}}>Go to Messages</button>
      </div>
      )}

      <style>{`
        @media(max-width:640px){
          .msg-shell{flex-direction:column!important;height:auto!important;max-height:100vh!important;}
          .msg-sidebar{width:100%!important;border-right:none!important;border-bottom:1px solid var(--border)!important;max-height:50vh!important;}
          .msg-chat{width:100%!important;min-height:50vh!important;height:auto!important;display:flex!important;flex-direction:column!important;}
          .msg-hidden{display:none!important;}
          .msg-back-btn{display:flex!important;}
          .msg-hidden-mobile{display:none!important;}
        }
        /* scroll areas */
        .msg-sidebar > div:nth-child(2){max-height:calc(50vh - 120px);overflow-y:auto;overflow-x:hidden;}
        .msg-chat > div:nth-child(3){flex:1;overflow-y:auto;overflow-x:hidden;}
        @media(min-width:641px){
          .msg-sidebar > div:nth-child(2){max-height:calc(650px - 120px);}
          .msg-chat > div:nth-child(3){max-height:calc(650px - 220px);}
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
