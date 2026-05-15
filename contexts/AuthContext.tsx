import * as api from "@/components/storage/api";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({ session: null, user: null, isLoading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Získání session při startu
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Naslouchání změnám (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {

      // 1. Okamžitá aktualizace session v RAM
      setSession(session);

      if (_event === 'SIGNED_OUT') {
        // 2. Vyčištění citlivých dat při odhlášení
        try {
          const keys = ["children", "pending_child_updates", "selectedChildId", "pending_child_deletions"];
          await AsyncStorage.multiRemove(keys);
        } catch (err) {
          console.error("LOG: Chyba při čištění AsyncStorage:", err);
        }
      } else if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') {
        // 3. Zajištění profilu pouze při přihlášení
        if (session?.user) {
          api.ensureUserProfile(session.user.id, session.user.email ?? "")
            .catch(err => console.error("LOG: Nepodařilo se zajistit profil:", err));
        }
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth musí být použit uvnitř AuthProvideru');
  }
  
  return context;
};