"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
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

  const fetchProfile = useCallback(async (userId: string, silent = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') throw error;
        setProfile(null);
      } else {
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.error("UserContext Error:", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const refreshProfile = async () => {
    if (user?.id) await fetchProfile(user.id, true);
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error("UserContext SignOut Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let isFirstLoad = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log("🔄 UserContext - Auth Event:", event);

        if (session?.user) {
          setUser(session.user);
          // On n'active le spinner que lors du tout premier montage
          await fetchProfile(session.user.id, !isFirstLoad);
          isFirstLoad = false;
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // profile retiré pour éviter la boucle infinie, supabase et fetchProfile sont stables
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