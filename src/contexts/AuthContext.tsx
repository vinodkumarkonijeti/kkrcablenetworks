import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  userData: User | null;
  loading: boolean;
  role: UserRole | null;
  isAdmin: boolean;
  isOperator: boolean;
  signOut: () => Promise<void>;
  register: (email: string, password: string, metadata: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ user: SupabaseUser; profile: User | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety timeout — if loading takes more than 5s, force it to false
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id).finally(() => {
          clearTimeout(safetyTimer);
          setLoading(false);
        });
      } else {
        clearTimeout(safetyTimer);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserData(session.user.id);
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No profile found — create one automatically
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const profileData = {
            id: authUser.id,
            name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email!,
            role: (authUser.user_metadata?.role || 'operator') as UserRole,
          };
          const { data: newProfile } = await supabase
            .from('users')
            .insert(profileData)
            .select('*')
            .single();
          setUserData(newProfile ?? null);
        }
      } else if (!error && data) {
        setUserData(data);
      } else {
        setUserData(null);
      }
    } catch {
      setUserData(null);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUserData(null);
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Error signing out');
    }
  };

  const register = async (email: string, password: string, metadata: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${metadata.firstName} ${metadata.lastName}`,
            role: (metadata.occupation || 'operator').toLowerCase() as UserRole,
          }
        }
      });

      if (error) throw error;
      if (data.user) {
        toast.success('Registration successful! You can now log in.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Fetch profile immediately for redirection
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      toast.success('Welcome back!');
      return { user: data.user, profile };
    } catch (error: any) {
      toast.error(error.message || 'Failed to login');
      throw error;
    }
  };

  const role = userData?.role || null;
  const isAdmin = role === 'admin';
  const isOperator = role === 'operator';

  return (
    <AuthContext.Provider value={{
      user, session, userData, loading,
      role, isAdmin, isOperator,
      signOut, register, signIn,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
