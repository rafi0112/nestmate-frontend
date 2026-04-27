export interface LifestylePreferences {
  pets: boolean;
  smoking: boolean;
  nightOwl: boolean;
  earlyRiser: boolean;
  student: boolean;
  professional: boolean;
}

export interface Listing {
  _id: string;
  title: string;
  location: string;
  rentAmount: number;
  roomType: string;
  lifestylePreferences: LifestylePreferences;
  description: string;
  contactInfo: string;
  availability: string;
  userEmail?: string;
  userName?: string;
  ownerUid: string;
  ownerEmail: string;
  ownerName: string;
  imageUrl?: string;
  likes?: string[];
  visibility?: string;
  memberUids?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  ownerUid: string;
  ownerEmail: string;
  ownerName: string;
  memberUids: string[];
  joinCode: string;
  status: 'active' | 'inactive';
  settings: {
    allowMealsModule: boolean;
    allowPaymentsModule: boolean;
    allowMessagesModule: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  groupId: string;
  threadId?: string | null;
  senderUid: string;
  senderEmail: string;
  senderName: string;
  receiverUid?: string | null;
  text: string;
  participantUids: string[];
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Meal {
  _id: string;
  groupId: string;
  title: string;
  items: string[];
  totalCost: number;
  splits: Array<{ userUid: string; amount: number }>;
  dueDate?: string | null;
  createdByUid: string;
  createdByEmail: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  groupId: string;
  fromUid: string;
  toUid?: string | null;
  amount: number;
  reason: string;
  dueDate?: string | null;
  status: 'due' | 'paid' | 'cancelled';
  createdByUid: string;
  createdByEmail: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  _id: string;
  actorUid: string;
  actorEmail: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type Theme = 'light' | 'dark';
