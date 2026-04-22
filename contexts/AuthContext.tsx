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
      console.log("LOG: onAuthStateChange událost:", _event);
      
      // 1. Zpracování odhlášení
      if (_event === 'SIGNED_OUT') {
        try {
          await Promise.all([
            AsyncStorage.removeItem("children"),
            AsyncStorage.removeItem("pending_child_updates"),
            AsyncStorage.removeItem("selectedChildId"),
            AsyncStorage.removeItem("pending_child_deletions") // přidal jsem pro jistotu i frontu mazání
          ]);
          console.log("LOG: Odhlášeno - AsyncStorage kompletně vyčištěn");
        } catch (err) {
          console.error("LOG: Chyba při čištění AsyncStorage:", err);
        }
      }

      // 2. Nastavení session (toto musí proběhnout i při logoutu - session bude null)
      setSession(session);

      // 3. Zajištění profilu na backendu
      if (session?.user) {
        console.log("LOG: Volám ensureUserProfile pro:", session.user.id);
        // Voláme bez awaitu, aby to neblokovalo UI, backend si s tím poradí
        api.ensureUserProfile(session.user.id, session.user.email ?? "");
      } else {
        console.log("LOG: Žádný uživatel není přihlášen");
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