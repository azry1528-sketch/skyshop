import Header from "@/components/jangolo/Header";
import Footer from "@/components/jangolo/Footer";

const TermsOfService = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container py-12 max-w-3xl space-y-3">
      <h1 className="text-3xl font-extrabold mb-4">Conditions générales</h1>
      <p>En utilisant SkyRide Store, vous acceptez nos conditions de vente et de livraison.</p>
      <h2 className="font-bold mt-6">Commandes</h2>
      <p>Toute commande est confirmée par téléphone ou email avant expédition.</p>
      <h2 className="font-bold mt-6">Livraison</h2>
      <p>Express 24-48h partout en France métropolitaine. 3 à 5 jours ouvrés en livraison standard.</p>
      <h2 className="font-bold mt-6">Retours</h2>
      <p>Vous disposez de 7 jours pour nous retourner un produit non conforme.</p>
    </main>
    <Footer />
  </div>
);

export default TermsOfService;
