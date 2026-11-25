import * as api from "@/components/storage/api";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userProfile: any | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({ session: null, user: null, userProfile: null, isLoading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

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
          const keys = ["children", "pending_child_updates", "selectedChildId", "pending_child_deletions", "cached_user_profile"];
          await AsyncStorage.multiRemove(keys);
          setUserProfile(null);
        } catch (err) {
          console.error("LOG: Chyba při čištění AsyncStorage:", err);
        }
      } else if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') {
        // 3. Zajištění profilu pouze při přihlášení
        if (session?.user) {
          try {
            // 1. Pokusíme se o online zajištění profilu na backendu
            const profile = await api.ensureUserProfile(session.user.id, session.user.email ?? "");
            
            // 2. Pokud se to povede, uložíme čerstvý profil do cache
            await AsyncStorage.setItem("cached_user_profile", JSON.stringify(profile));
            setUserProfile(profile);

          } catch (err: any) {
            // 3. ODCHYCENÍ OFFLINE STAVU
            if (err.message?.includes("Network request failed") || err.message?.includes("fetch")) {
              console.warn("LOG: Backend nedostupný (jsi offline). Načítám profil z cache...");
              
              const cachedData = await AsyncStorage.getItem("cached_user_profile");
              if (cachedData) {
                const profile = JSON.parse(cachedData);
                setUserProfile(profile);
              } else {
                // Nouzový fallback, pokud aplikace běží úplně poprvé a rovnou offline
                const fallbackProfile = { 
                  id: session.user.id, 
                  email: session.user.email,
                  gender: session.user.user_metadata?.gender || null 
                };
                setUserProfile(fallbackProfile);
              }
            } else {
              // Pokud je to jiná chyba (např. 403 z backendu), zalogujeme ji standardně
              console.error("LOG: Kritická chyba při zajišťování profilu:", err);
            }
          }
        }
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, userProfile, isLoading }}>
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