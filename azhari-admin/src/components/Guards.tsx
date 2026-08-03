"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

/**
 * Client-side redirect guards. These are a UX convenience — they stop an
 * unauthorized visitor from *seeing the page render* — but they are not the
 * security boundary. Even if someone disabled JavaScript and hit the admin
 * page directly, every Supabase query on it would return empty results or
 * be rejected, because RLS (schema.sql) enforces access at the database
 * itself, keyed off their real Supabase session — not off client state.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { loading, session, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading && (!session || !isAdmin)) {
      window.location.href = "/login";
    }
  }, [loading, session, isAdmin]);

  if (loading) return <CenteredMessage text="جاري التحقق..." />;
  if (!session || !isAdmin) return <CenteredMessage text="غير مصرح، جاري التحويل..." />;
  return <>{children}</>;
}

export function StudentGuard({ children }: { children: React.ReactNode }) {
  const { loading, session, isAdmin, student } = useAuth();

  useEffect(() => {
    if (!loading && (!session || isAdmin)) {
      window.location.href = "/login";
    }
  }, [loading, session, isAdmin]);

  if (loading) return <CenteredMessage text="جاري التحقق..." />;
  if (!session || isAdmin) return <CenteredMessage text="غير مصرح، جاري التحويل..." />;
  if (!student) return <CenteredMessage text="لم يتم العثور على ملف تسجيل مرتبط بهذا الحساب" />;
  return <>{children}</>;
}

function CenteredMessage({ text }: { text: string }) {
  return <div className="max-w-lg mx-auto px-6 py-24 text-center text-gray-500">{text}</div>;
}
