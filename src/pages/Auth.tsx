import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BRAND } from "@/lib/jangolo";
import { useI18n } from "@/contexts/I18nContext";

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate("/account"); });
  }, [navigate]);

  const signInGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/account" },
    });
    if (error) toast.error(error.message || "Erreur");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { display_name: name }, emailRedirectTo: `${window.location.origin}/account` },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Compte créé ! Complétez vos informations pour des livraisons rapides.");
      navigate("/account?complete=1");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error(error.message);
      navigate("/account");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-warm px-4 py-8">
      <div className="w-full max-w-md bg-card rounded-3xl p-7 shadow-warm border border-border/50">
        <Link to="/" className="flex items-center gap-2 mb-5">
          <div className="h-10 w-10 rounded-xl bg-gradient-cta flex items-center justify-center text-primary-foreground font-extrabold">S</div>
          <span className="text-xl font-extrabold">{BRAND}</span>
        </Link>
        <h1 className="text-2xl font-bold mb-1">{mode === "signin" ? "Connexion" : "Créer un compte"}</h1>
        <p className="text-sm text-muted-foreground mb-4">{t("auth.optional_hint")}</p>

        <Button type="button" onClick={signInGoogle} variant="outline" className="w-full h-11 mb-4 font-semibold">
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {t("auth.google")}
        </Button>

        <div className="flex items-center gap-2 my-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />{t("auth.or")}<span className="h-px flex-1 bg-border" /></div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <div><Label>Nom</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          )}
          <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><Label>Mot de passe</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
          <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-cta font-semibold">{loading ? "..." : mode === "signin" ? "Se connecter" : "S'inscrire"}</Button>
        </form>
        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-sm text-muted-foreground mt-4 hover:text-primary w-full text-center">
          {mode === "signin" ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
        </button>
        <Link to="/" className="block text-xs text-center text-muted-foreground mt-3 hover:text-primary">{t("auth.guest")}</Link>
      </div>
    </div>
  );
};

export default Auth;
