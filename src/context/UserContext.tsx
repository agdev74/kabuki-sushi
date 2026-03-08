"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

export type UserProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  wallet_balance: number;
  is_admin: boolean;
  address: string | null;
  zip_code: string | null;
  city: string | null;
};

type UserContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());
  const isInitialMount = useRef(true);

  const fetchProfile = useCallback(async (userId: string, silent = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // ✅ Empêche l'affichage du spinner global si silent est vrai
    if (!silent) setLoading(true);

    const timeoutId = setTimeout(() => {
      setLoading(false);
      console.warn("⚠️ UserContext: Timeout de récupération du profil.");
    }, 5000);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') throw error;
        setProfile(null);
      } else if (data) {
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.error("❌ UserContext: Erreur lors du fetchProfile", err);
      setProfile(null);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [supabase]);

  const refreshProfile = async () => {
    if (user?.id) {
      // ✅ Rafraîchissement silencieux pour ne pas couper l'UI
      await fetchProfile(user.id, true);
    }
  };

  const signOut = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("UserContext: Erreur pendant le signOut", error);
    } finally {
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    };

    if (isInitialMount.current) {
      initAuth();
      isInitialMount.current = false;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
          setLoading(false);
        } else if (session?.user) {
          setUser(session.user);
          // On utilise le fetch silencieux ici aussi pour éviter les sauts d'UI inutiles
          await fetchProfile(session.user.id, true);
        } else {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  return (
    <UserContext.Provider value={{ user, profile, loading, refreshProfile, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) throw new Error("useUser must be used within a UserProvider");
  return context;
};