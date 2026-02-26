import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: {
    subscription_tier: string;
    trial_start_date: string | null;
    questions_today: number;
  } | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: AuthState["profile"]) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,

  setSession: (session) => {
    set({ session, user: session?.user ?? null, loading: false });
    if (session?.user) get().refreshProfile();
  },

  setProfile: (profile) => set({ profile }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("subscription_tier, trial_start_date, questions_today")
      .eq("id", user.id)
      .single();
    if (data) set({ profile: data });
  },
}));
