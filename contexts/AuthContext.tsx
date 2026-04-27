'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/* Firebase authentication only. */

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  signInGoogle: () => Promise<void>;
  updateProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function getFirebase() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey || process.env.NEXT_PUBLIC_USE_FIREBASE !== 'true') return null;

  try {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getAuth } = await import('firebase/auth');

    const config = {
      apiKey,
      authDomain:  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId:   process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket:    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId:       process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const app = getApps().length ? getApps()[0] : initializeApp(config);
    return getAuth(app);
  } catch {
    return null;
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [useFirebase, setUseFirebase] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const auth = await getFirebase();
      if (!auth) {
        setUseFirebase(false);
        setLoading(false);
        return;
      }

      setUseFirebase(true);
      const { getRedirectResult, onAuthStateChanged } = await import('firebase/auth');

      try {
        const redirectResult = await getRedirectResult(auth as Parameters<typeof getRedirectResult>[0]);
        if (redirectResult?.user) {
          setCurrentUser({
            uid: redirectResult.user.uid,
            email: redirectResult.user.email,
            displayName: redirectResult.user.displayName,
            photoURL: redirectResult.user.photoURL,
          });
        }
      } catch {
        // Ignore redirect result errors and continue with the auth listener.
      }

      unsubscribe = onAuthStateChanged(auth as Parameters<typeof onAuthStateChanged>[0], (fbUser: { uid: string; email: string|null; displayName: string|null; photoURL: string|null } | null) => {
        if (fbUser) {
          setCurrentUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
          });
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      });
    })().finally(() => setLoading(false));

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // ── Auth operations ───────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    if (useFirebase) {
      const auth = await getFirebase();
      if (!auth) throw new Error('Firebase not initialised');
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const cred = await signInWithEmailAndPassword(auth as Parameters<typeof signInWithEmailAndPassword>[0], email, password);
      setCurrentUser({ uid: cred.user.uid, email: cred.user.email, displayName: cred.user.displayName, photoURL: cred.user.photoURL });
      return;
    }

    throw new Error('Firebase authentication is required. Check NEXT_PUBLIC_USE_FIREBASE setting.');
  };

  const register = async (email: string, password: string, name: string) => {
    if (useFirebase) {
      const auth = await getFirebase();
      if (!auth) throw new Error('Firebase not initialised');
      const { createUserWithEmailAndPassword, updateProfile: fbUpdateProfile } = await import('firebase/auth');
      const cred = await createUserWithEmailAndPassword(auth as Parameters<typeof createUserWithEmailAndPassword>[0], email, password);
      await fbUpdateProfile(cred.user, { displayName: name });
      setCurrentUser({ uid: cred.user.uid, email: cred.user.email, displayName: name, photoURL: null });
      return;
    }

    throw new Error('Firebase authentication is required. Check NEXT_PUBLIC_USE_FIREBASE setting.');
  };

  const logout = async () => {
    if (useFirebase) {
      const auth = await getFirebase();
      if (auth) {
        const { signOut } = await import('firebase/auth');
        await signOut(auth as Parameters<typeof signOut>[0]);
      }
    }
    setCurrentUser(null);
  };

  const signInGoogle = async () => {
    if (useFirebase) {
      const auth = await getFirebase();
      if (!auth) throw new Error('Firebase not initialised');
      const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();

      try {
        const cred = await signInWithPopup(auth as Parameters<typeof signInWithPopup>[0], provider);
        setCurrentUser({ uid: cred.user.uid, email: cred.user.email, displayName: cred.user.displayName, photoURL: cred.user.photoURL });
        return;
      } catch (error: any) {
        const code = error?.code || '';
        if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user' || code === 'auth/operation-not-supported-in-this-environment') {
          await signInWithRedirect(auth as Parameters<typeof signInWithRedirect>[0], provider);
          return;
        }
        throw new Error(error?.message || 'Google sign-in failed. Check Firebase authorized domains and OAuth settings.');
      }
    }

    throw new Error('Firebase authentication is required. Check NEXT_PUBLIC_USE_FIREBASE setting.');
  };

  const updateProfile = async (data: { displayName?: string; photoURL?: string }) => {
    if (!currentUser) return;
    if (useFirebase) {
      const auth = await getFirebase();
      if (auth) {
        const { updateProfile: fbUpdate } = await import('firebase/auth');
        const fbAuth = auth as { currentUser: Parameters<typeof fbUpdate>[0] | null };
        if (fbAuth.currentUser) await fbUpdate(fbAuth.currentUser, data);
      }
    }
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
  };

  return (
    <AuthContext value={{ currentUser, loading, login, register, logout, signInGoogle, updateProfile }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
