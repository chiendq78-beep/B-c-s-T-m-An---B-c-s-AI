import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsDemoAdmin: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string, role: 'admin' | 'user') => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (!isMounted) return;
        setUser(currentUser);
        if (currentUser.isAnonymous) {
          if (isMounted) {
            setProfile({
              id: currentUser.uid,
              email: '',
              fullName: 'Người dùng Trải nghiệm',
              is_active: true,
              role: 'user',
              createdAt: new Date().toISOString(),
            });
            setLoading(false);
          }
          return;
        }

        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const isAdminEmail = currentUser.email === 'chiendq78@gmail.com';
          if (userDoc.exists()) {
            const currentProfile = userDoc.data() as UserProfile;
            if (isAdminEmail && currentProfile.role !== 'admin') {
              const updatedProfile = { ...currentProfile, role: 'admin' as const };
              await setDoc(doc(db, 'users', currentUser.uid), { role: 'admin' }, { merge: true });
              if (isMounted) setProfile(updatedProfile);
            } else {
              if (isMounted) setProfile(currentProfile);
            }
          } else {
            // Create initial profile
            const newProfile: UserProfile = {
              id: currentUser.uid,
              email: currentUser.email || '',
              fullName: currentUser.displayName || 'Người dùng Tâm An',
              is_active: true,
              role: isAdminEmail ? 'admin' : 'user',
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', currentUser.uid), newProfile);
            if (isMounted) setProfile(newProfile);
          }
        } catch (e) {
          console.warn("Error fetching user profile:", e);
          if (isMounted) {
            setProfile({
              id: currentUser.uid,
              email: currentUser.email || '',
              fullName: currentUser.displayName || 'Người dùng',
              is_active: true,
              role: 'user',
              createdAt: new Date().toISOString(),
            });
          }
        }
        if (isMounted) setLoading(false);
      } else {
        // Automatically authenticate anonymously in background so app starts directly without login barrier
        try {
          const anonCred = await signInAnonymously(auth);
          if (isMounted) {
            setUser(anonCred.user);
            setProfile({
              id: anonCred.user.uid,
              email: '',
              fullName: 'Người dùng Trải nghiệm',
              is_active: true,
              role: 'user',
              createdAt: new Date().toISOString(),
            });
            setLoading(false);
          }
        } catch (e) {
          console.warn("Auto anonymous login fallback:", e);
          if (isMounted) {
            setUser(null);
            setProfile({
              id: 'guest_local',
              email: '',
              fullName: 'Người dùng Trải nghiệm',
              is_active: true,
              role: 'user',
              createdAt: new Date().toISOString()
            });
            setLoading(false);
          }
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInAsDemoAdmin = async () => {
    setLoading(true);
    try {
      const credential = await signInAnonymously(auth);
      const u = credential.user;
      const adminProfile: UserProfile = {
        id: u.uid,
        email: 'admin-demo@taman.vn',
        fullName: 'Quản trị viên (Demo)',
        is_active: true,
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', u.uid), adminProfile);
      await setDoc(doc(db, 'admins', u.uid), { promotedAt: new Date().toISOString() });
      setProfile(adminProfile);
    } catch (error) {
      console.error("Error signing in as demo admin:", error);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string, role: 'admin' | 'user') => {
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const u = credential.user;
      await updateProfile(u, { displayName: fullName });
      const newProfile: UserProfile = {
        id: u.uid,
        email: u.email || '',
        fullName: fullName,
        is_active: true,
        role: role,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', u.uid), newProfile);
      if (role === 'admin') {
        await setDoc(doc(db, 'admins', u.uid), { promotedAt: new Date().toISOString() });
      }
      setProfile(newProfile);
    } catch (error) {
      console.error("Error signing up with email:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing in with email:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      const cred = await signInAnonymously(auth);
      setUser(cred.user);
      setProfile({
        id: cred.user.uid,
        email: '',
        fullName: 'Người dùng Trải nghiệm',
        is_active: true,
        role: 'user',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging out:", error);
      setUser(null);
      setProfile({
        id: 'guest_local',
        email: '',
        fullName: 'Người dùng Trải nghiệm',
        is_active: true,
        role: 'user',
        createdAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signInWithGoogle, 
      signInAsDemoAdmin, 
      signUpWithEmail, 
      signInWithEmail, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
