import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/jangolo/Header";

const NotFound = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <main className="flex-1 flex items-center justify-center text-center px-6">
      <div>
        <p className="text-6xl font-extrabold text-primary">404</p>
        <h1 className="text-2xl font-bold mt-3">Page introuvable</h1>
        <p className="text-muted-foreground mt-2 mb-6">Cette page n'existe pas ou a été déplacée.</p>
        <Button asChild className="bg-gradient-cta"><Link to="/">Retour à l'accueil</Link></Button>
      </div>
    </main>
  </div>
);

export default NotFound;
