"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/isAdmin";

type AuthContextType = {
  admin: boolean;
  ready: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  admin: false,
  ready: false,
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAdmin(isAdmin(session?.user?.email));
      setReady(true);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setAdmin(isAdmin(session?.user?.email));
      setReady(true);
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    location.reload();
  };

  return (
    <AuthContext.Provider value={{ admin, ready, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
