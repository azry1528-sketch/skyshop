import Header from "@/components/jangolo/Header";
import Footer from "@/components/jangolo/Footer";

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container py-12 max-w-3xl space-y-3">
      <h1 className="text-3xl font-extrabold mb-4">Politique de confidentialité</h1>
      <p>Vos données personnelles (nom, téléphone, adresse) sont utilisées uniquement pour traiter vos commandes et vous livrer. Nous ne les revendons jamais à des tiers.</p>
      <h2 className="font-bold mt-6">Données collectées</h2>
      <p>Nom, téléphone, adresse de livraison, email (facultatif), historique de commande.</p>
      <h2 className="font-bold mt-6">Vos droits</h2>
      <p>Vous pouvez demander la suppression de vos données à tout moment par email ou depuis votre espace client.</p>
    </main>
    <Footer />
  </div>
);

export default PrivacyPolicy;
