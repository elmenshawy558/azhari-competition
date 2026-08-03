"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Student } from "@/lib/types";

interface AuthState {
  loading: boolean;
  session: Session | null;
  isAdmin: boolean;
  student: Student | null; // populated only for a logged-in, non-admin student
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);

  async function resolveRole(currentSession: Session | null) {
    if (!currentSession) {
      setIsAdmin(false);
      setStudent(null);
      return;
    }

    // This SELECT only ever returns a row for the caller's own admin
    // membership (see the RLS policy on `admins`) — it can't be used to
    // enumerate or guess anything about other users.
    const { data: adminRow } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", currentSession.user.id)
      .maybeSingle();

    if (adminRow) {
      setIsAdmin(true);
      setStudent(null);
      return;
    }

    setIsAdmin(false);
    const { data: studentRow } = await supabase
      .from("students")
      .select("*")
      .eq("user_id", currentSession.user.id)
      .maybeSingle();
    setStudent((studentRow as Student) ?? null);
  }

  async function refresh() {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    await resolveRole(data.session);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      await refresh();
      if (mounted) setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      resolveRole(newSession);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
    setStudent(null);
  }

  return (
    <AuthContext.Provider value={{ loading, session, isAdmin, student, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
