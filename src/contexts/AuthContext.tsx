import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from './ToastContext';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  updateEmail,
  updatePassword,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ user: FirebaseUser; userData: User | null }>;
  register: (email: string, password: string, userData: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changeEmail: (newEmail: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  isEmailVerified: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = { id: user.uid, ...userDoc.data() } as User;
            setUserData(userData);
          } else {
            // Do not auto-create a users doc here. Role assignment should occur
            // explicitly (for example, when user chooses "Go to Portal").
            setUserData(null);
          }
        } else {
          setUserData(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const { addToast } = useToast();

  const login = async (email: string, password: string) => {
    try {
      // Check if account is locked
      const lockout = localStorage.getItem('accountLockout');
      if (lockout) {
        const lockoutData = JSON.parse(lockout);
        if (Date.now() < lockoutData.expiresAt) {
          const remainingTime = Math.ceil((lockoutData.expiresAt - Date.now()) / 1000);
          const err: any = new Error(`Account locked. Try again in ${remainingTime} seconds.`);
          err.code = 'account/locked';
          throw err;
        } else {
          localStorage.removeItem('accountLockout');
          localStorage.removeItem('failedLoginAttempts');
        }
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const signedInUser = userCredential.user;
      
      // Clear failed attempts on successful login
      localStorage.removeItem('failedLoginAttempts');
      addToast('Logged in successfully', 'success');

      // Wait a brief moment for onAuthStateChanged to fire and populate userData
      await new Promise(resolve => setTimeout(resolve, 500));

      // Fetch the user data from Firestore (post-auth state update)
      let resultUserData: User | null = null;
      try {
        const userDocRef = doc(db, 'users', signedInUser.uid);
        const userDoc = await getDoc(userDocRef);
        // fetched user doc for uid
        if (userDoc.exists()) {
          resultUserData = { id: signedInUser.uid, ...userDoc.data() } as User;
        } else {
          // Do not auto-create a users doc here; role assignment happens explicitly
          resultUserData = null;
        }
      } catch (err) {
        console.error('Error fetching user data after login:', err);
      }
      // Update context state so downstream components have userData immediately
      setCurrentUser(signedInUser);
      setUserData(resultUserData);
      
      // Wait a brief moment to ensure state update is processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return { user: signedInUser, userData: resultUserData };
    } catch (err: any) {
      // Track failed login attempts
      const failedAttempts = parseInt(localStorage.getItem('failedLoginAttempts') || '0') + 1;
      localStorage.setItem('failedLoginAttempts', failedAttempts.toString());

      if (failedAttempts >= 3 && err.code !== 'account/locked') {
        // Lock account for 3 minutes
        const lockoutExpiry = Date.now() + 3 * 60 * 1000;
        localStorage.setItem('accountLockout', JSON.stringify({ expiresAt: lockoutExpiry }));
        addToast('Account locked due to too many failed login attempts. Try again in 3 minutes.', 'error');
      } else if (err.code === 'account/locked') {
        addToast(err.message, 'error');
      } else {
        addToast(err?.message || 'Login failed', 'error');
      }
      throw err;
    }
  };

  const register = async (email: string, password: string, userData: Omit<User, 'id' | 'createdAt'>) => {
    // Check whether the email already has sign-in methods before attempting to create
    // This allows us to provide a clearer error to the caller instead of a generic failure
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods && methods.length > 0) {
      // Throw an error with the same code Firebase uses so callers can handle it
      const err: any = new Error('Email already in use');
      err.code = 'auth/email-already-in-use';
      throw err;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...userData,
        // default role is 'operator' unless explicitly provided
        role: (userData as any)?.role || 'operator',
        createdAt: serverTimestamp()
      });
      addToast('Registration successful. Please verify your email.', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Registration failed', 'error');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      addToast('Logged out', 'info');
    } catch (err: any) {
      addToast(err?.message || 'Logout failed', 'error');
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      addToast('Password reset email sent', 'info');
    } catch (err: any) {
      addToast(err?.message || 'Reset failed', 'error');
      throw err;
    }
  };

  const changeEmail = async (newEmail: string) => {
    if (currentUser) {
      await updateEmail(currentUser, newEmail);
    }
  };

  const changePassword = async (newPassword: string) => {
    if (currentUser) {
      await updatePassword(currentUser, newPassword);
    }
  };

  const sendVerificationEmail = async () => {
    if (currentUser) {
      try {
        await sendEmailVerification(currentUser);
        addToast('Verification email sent. Please check your inbox.', 'success');
      } catch (err: any) {
        addToast(err?.message || 'Failed to send verification email', 'error');
        throw err;
      }
    }
  };

  const isEmailVerified = (): boolean => {
    return currentUser?.emailVerified || false;
  };

  const value = {
    currentUser,
    userData,
    loading,
    login,
    register,
    logout,
    resetPassword,
    changeEmail,
    changePassword,
    sendVerificationEmail,
    isEmailVerified
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
