# Unread Messages Implementation - Frontend

## ✅ What's Been Implemented

### 1. **Database Message Type Updated**

- Added optional `seen?: boolean` field to `DBMessage` interface
- Maintains backward compatibility with existing `read` field
- Defaults to checking `seen` field first, falls back to `read` if not available

```typescript
interface DBMessage {
  _id: string;
  fromEmail: string;
  toEmail: string;
  listingId: string;
  listingTitle: string;
  text: string;
  timestamp: string;
  read: boolean;
  seen?: boolean; // ← New field for tracking message visibility
}
```

---

### 2. **Unread Count Tracking**

- **Location:** `buildConversations()` function
- Counts unseen messages intelligently:
  - Prioritizes `seen: false` if available
  - Falls back to `read: false` for backward compatibility
- Updates unread badge in real-time as messages arrive

```typescript
const isMsgUnseen = msg.seen !== undefined ? msg.seen === false : !msg.read;
if (msg.toEmail === myEmail && isMsgUnseen) conv.unread++;
```

---

### 3. **Bold Unseen Messages**

- **Visual Indicator:** Messages are **bold (fontWeight: 700)** when unseen
- **Styling:**
  - Bold text for unseen messages
  - Accent-light background for unseen message bubbles
  - Danger red color indicator
  - Normal weight (400) for seen messages

**Code:**

```typescript
const isUnseen = !isMe && msg.seen === false;

<div style={{
  fontWeight: isUnseen ? 700 : 400,
  background: isUnseen ? 'var(--accent-light)' : 'var(--bg-subtle)',
  color: isUnseen ? 'var(--accent)' : 'var(--text-primary)',
  ...
}}>
  {msg.text}
</div>
```

---

### 4. **Unread Badge Display**

- **Red danger badges** (var(--danger)) show count of unseen messages
- **Larger, more prominent:** 22×22px (was 17×17px)
- **Positioned** at top-right of conversation avatar
- **Updated in real-time** as messages are marked seen

**Styling:**

```typescript
{conv.unread>0&&<span style={{
  width: 22,
  height: 22,
  background: 'var(--danger)', // Red badge
  color: '#fff',
  fontFamily: 'Times New Roman',
  fontWeight: 700,
  fontSize: 10,
  ...
}}>
  {conv.unread}
</span>}
```

---

### 5. **Socket.io Integration**

#### **Emit: Mark Messages as Seen**

When user opens a conversation:

```typescript
const selectConv = (id: string) => {
  setSelected(id);
  // ... UI updates ...

  // Mark remote messages as seen
  const conv = conversations.find((c) => c.id === id);
  if (conv && currentUser?.email) {
    socket.emit("markAsSeen", {
      userEmail: currentUser.email,
      otherEmail: conv.otherEmail,
    });
  }
};
```

#### **Listen: New Message Received**

```typescript
socket.on("receive_message", (message: DBMessage) => {
  // Count as unseen if:
  // - Received by me
  // - Sender is someone else
  // - Chat window not active
  const isMessageUnseen = message.toEmail === myEmail && message.seen === false;
  const nextUnread =
    isMessageUnseen && selectedRef.current !== conversationKey
      ? (existing?.unread || 0) + 1
      : existing?.unread || 0;
});
```

#### **Listen: Unread Count Update**

```typescript
socket.on("unreadCount", ({ from, count }: { from: string; count: number }) => {
  setConversations((prev) =>
    prev.map((conv) =>
      conv.otherEmail === from ? { ...conv, unread: count } : conv,
    ),
  );
});
```

---

### 6. **UI Updates**

#### **Header Badge**

```
"Messages" header shows:  Messages [5 unread] ← Red badge with count
```

#### **Conversation List**

```
Avatar with red badge: [42]  ← 42 unseen messages from this person
                       │
                       └─ Bold: "Messages" (when unread > 0)
                       └─ Darker text: Last message
                       └─ Red label: "5 unseen messages" ← Danger color
```

#### **Chat Bubbles**

```
Incoming (unseen):
┌─────────────────────┐
│ Hey, are you there? │ ← Bold text
│ (accent-light bg)   │ ← Light blue background
│ (red border)        │ ← Red accent border
└─────────────────────┘

After opening chat:
┌─────────────────────┐
│ Hey, are you there? │ ← Normal text weight
│ (subtle bg)         │ ← Subtle gray background
│ (normal border)     │ ← Standard gray border
└─────────────────────┘
```

---

### 7. **Font Updates**

All message UI now uses **Times New Roman** (site-wide font preference):

- Conversation list names: Times New Roman
- Unread badges: Times New Roman
- Message timestamps: Times New Roman
- Input fields: Times New Roman

---

### 8. **Backend Compatibility Checklist**

Your backend needs to:

- [ ] Add `seen: boolean` field to Message schema (default: false)
- [ ] Update `/api/messages` to include `seen` field in responses
- [ ] Implement `POST /api/messages/:id/mark-seen` endpoint
- [ ] Add socket listener: `socket.on('markAsSeen', ...)` → Update DB
- [ ] Add socket emit: `socket.emit('unreadCount', { from, count })`
- [ ] Update socket handler to emit when new message arrives

---

## 🔄 Real-Time Flow

```
1. User B sends message to User A
   └─ Message saved with seen: false
   └─ Backend emits 'receive_message' to User A
   └─ Frontend receives, adds to conversation
   └─ Unread count increases (if chat not active)

2. User A opens chat
   └─ Frontend emits 'markAsSeen' socket event
   └─ Backend marks messages as seen
   └─ Backend emits 'unreadCount' with count: 0
   └─ UI updates: text becomes normal weight, badge disappears

3. User B checks User A's messages
   └─ Can see messages marked as seen in backend
   └─ Seen status shown via checkmark icons (✓✓)
```

---

## 🧪 Testing Checklist

- [ ] Open messages, send yourself a test message
- [ ] Verify message appears with **bold text** (unseen)
- [ ] Verify red badge with count appears
- [ ] Click conversation to open chat
- [ ] Verify text becomes **normal weight** (seen)
- [ ] Verify badge disappears after socket updates
- [ ] Test multiple unseen messages
- [ ] Test message arrival while chat is open (should stay at 0 unread)

---

## ⚙️ Configuration

No additional frontend configuration needed. The system works out-of-the-box once backend sends:

1. Messages with `seen: false` by default
2. Socket events for real-time updates
3. Proper message history with seen status

---

## 🐛 Common Issues & Solutions

**Badge not disappearing?**

- Verify backend sends `unreadCount` event after marking seen
- Check socket connection is active

**Messages not bold?**

- Ensure backend sends `seen: false` for new messages
- Check CSS variables for accent colors are defined

**Unread count wrong?**

- Backend might be double-counting or not including seen field
- Verify `buildConversations()` logic for counting

---

## 📚 Related Files

- **Frontend:** `/app/messages/page.tsx`
- **Socket Utils:** `/utils/socket.js`
- **Message Types:** `/lib/types.ts` (if exists)
