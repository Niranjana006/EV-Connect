import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../services/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, GeoPoint } from 'firebase/firestore';

interface AuthContextType {
  user: any;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  joinCommunity: () => Promise<void>;
  leaveCommunity: () => Promise<void>;
  isInCommunity: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isInCommunity, setIsInCommunity] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.error("Geolocation error:", err);
        }
      );
    } else {
      console.error("Geolocation not supported");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser);
      setUser(currentUser);
      if (currentUser && position) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        setIsInCommunity(userDoc.data()?.inCommunity || false);
        await setDoc(doc(db, 'users', currentUser.uid), {
          email: currentUser.email,
          location: new GeoPoint(position.lat, position.lng),
          lastUpdated: new Date(),
          inCommunity: userDoc.data()?.inCommunity || false
        }, { merge: true });
      }
    });
    return () => unsubscribe();
  }, [position]);

  const joinCommunity = async () => {
    if (user) {
      await setDoc(doc(db, 'users', user.uid), {
        inCommunity: true,
        joinedAt: new Date()
      }, { merge: true });
      setIsInCommunity(true);
    }
  };

  const leaveCommunity = async () => {
    if (user) {
      await setDoc(doc(db, 'users', user.uid), {
        inCommunity: false
      }, { merge: true });
      setIsInCommunity(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Email Sign-In Error:', error);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log('Sign-up successful for:', email);
    } catch (error) {
      console.error('Sign-Up Error:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle, signInWithEmail, signUpWithEmail, logout, joinCommunity, leaveCommunity, isInCommunity }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};