
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, db } from './firebaseConfig';
import { User } from './types';
import { toPlainObject, fetchWithRetry } from './utils';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAuthReady: boolean;
  login: (code: string) => Promise<boolean>;
  handleLogin: (code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isStaff: boolean;
  isSuperAdmin: boolean;
  backendAwake: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [backendAwake, setBackendAwake] = useState(false);

  const isSuperAdmin = currentUser?.role === 'ADMIN' || currentUser?.id === 'admin_ltpf';
  const isStaff = currentUser ? currentUser.role !== 'ELEVE' : false;

  const saveUserSession = useCallback((user: User) => {
    try {
      const plain = toPlainObject(user);
      localStorage.setItem('user_session', JSON.stringify(plain));
    } catch (e) {
      console.error("Session serialization error:", e);
    }
  }, []);

  // Ping backend to check if it's awake
  useEffect(() => {
    let interval: any;
    const ping = async () => {
      try {
        const resp = await fetch("/api/health");
        if (resp.ok) {
          setBackendAwake(true);
          clearInterval(interval);
        }
      } catch (e) {
        console.warn("Backend still sleeping...");
      }
    };
    
    ping();
    interval = setInterval(ping, 5000); // Retry every 5s
    return () => clearInterval(interval);
  }, []);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log("Firebase Auth State Changed:", firebaseUser?.uid || "None");
      
      if (!firebaseUser) {
        try {
          await auth.signInAnonymously();
        } catch (e) {
          console.error("Anonymous sign-in failed:", e);
        }
      }

      // Restore session from localStorage if present
      const saved = localStorage.getItem('user_session');
      if (saved && !currentUser) {
        try {
          setCurrentUser(JSON.parse(saved));
        } catch (e) {
          localStorage.removeItem('user_session');
        }
      }

      setIsAuthReady(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const login = async (code: string): Promise<boolean> => {
    const input = code.trim();
    if (!input) return false;

    setLoading(true);
    try {
       const response = await fetchWithRetry(
          `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            matricule: input, // Send as both for compatibility
            code: input,
          }),
        }
      );

     const responseData = await response.json();

if (!response.ok) {
  console.error("Login API error:", responseData.error);
  return false;
}

if (responseData.token) {
  await auth.signInWithCustomToken(responseData.token);
}
      
      const user: User = {
        id: responseData.uid,
        name: responseData.name,
        role: responseData.role,
        classId: responseData.classId || null,
      };

      setCurrentUser(user);
      saveUserSession(user);
      return true;
    } catch (err: any) {
      console.error("LOGIN EXCEPTION:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('user_session');
  };

  const handleLogin = login;

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      loading, 
      isAuthReady, 
      login, 
      handleLogin, 
      logout, 
      isStaff, 
      isSuperAdmin, 
      backendAwake 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
