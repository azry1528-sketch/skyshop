import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AdminRole = "super_admin" | "admin" | "moderator";

export const ADMIN_ROLES: { value: string; label: string; description: string; color: string }[] = [
  { value: "super_admin", label: "Super Admin", description: "Accès total + gestion des admins", color: "text-destructive" },
  { value: "admin",       label: "Admin",       description: "Gestion produits, commandes, utilisateurs", color: "text-primary" },
  { value: "moderator",   label: "Modérateur",  description: "Lecture seule + gestion commandes", color: "text-accent" },
  { value: "customer",    label: "Client",       description: "Compte client standard", color: "text-muted-foreground" },
];

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user, loading };
};

export const useIsAdmin = (userId?: string) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<string>("customer");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!userId) { setIsAdmin(false); setChecked(true); return; }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "super_admin", "moderator"])
      .maybeSingle()
      .then(({ data }) => {
        setIsAdmin(!!data);
        setRole(data?.role || "customer");
        setChecked(true);
      });
  }, [userId]);

  const isSuperAdmin = role === "super_admin";
  const isModerator = role === "moderator";

  return { isAdmin, role, isSuperAdmin, isModerator, checked };
};
