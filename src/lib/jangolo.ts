// SkyRide Store shared helpers
export const BRAND = "SkyRide Store";
export const SOCIALS = {
  facebook: "https://facebook.com/skyridestore.fr",
  instagram: "https://instagram.com/skyridestore.fr",
  tiktok: "https://tiktok.com/@skyridestore.fr",
  youtube: "https://youtube.com/@skyridestore",
};
export const formatEUR = (amount: number) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0 }).format(Math.round(amount)) + " €";

// Tree structure (with optional children = sub-categories)
export type CategoryNode = { slug: string; label: string; children?: CategoryNode[] };
export const CATEGORY_TREE: CategoryNode[] = [
  {
    slug: "trottinettes-electriques",
    label: "Trottinettes électriques",
    children: [
      { slug: "trottinette-urbaine", label: "Trottinette urbaine" },
      { slug: "trottinette-tout-terrain", label: "Trottinette tout-terrain" },
      { slug: "trottinette-premium", label: "Trottinette premium" },
    ],
  },
  {
    slug: "surron-motos-electriques",
    label: "Surron & Motos électriques",
    children: [
      { slug: "surron-light-bee", label: "Style Light Bee" },
      { slug: "surron-ultra-bee", label: "Style Ultra Bee" },
      { slug: "dirt-bike-electrique", label: "Dirt bike électrique" },
    ],
  },
  {
    slug: "accessoires-mobilite",
    label: "Accessoires moto",
    children: [
      { slug: "batteries-chargeurs", label: "Batteries & chargeurs" },
      { slug: "casques-protections", label: "Casques & protections" },
      { slug: "pieces-detachees", label: "Pièces détachées" },
    ],
  },
];

// Flat list (every leaf + group) used for lookups
export const CATEGORIES = CATEGORY_TREE.flatMap((c) =>
  c.children ? [{ slug: c.slug, label: c.label }, ...c.children.map(s => ({ slug: s.slug, label: s.label }))] : [{ slug: c.slug, label: c.label }]
);

// Group slugs that have sub-categories
export const CATEGORY_GROUPS: Record<string, CategoryNode[]> = Object.fromEntries(
  CATEGORY_TREE.filter(c => c.children).map(c => [c.slug, c.children!])
);

export const PICKUP_ADDRESS = {
  name: "Point relais SkyRide Store",
  address: "12 rue de la République, 75011 Paris",
  hours: "Lun–Sam, 10h–19h",
};

export const DELIVERY_ZONES = [
  { value: "standard", label: "Livraison standard (3-5 jours ouvrés)", fee: 0 },
  { value: "express", label: "Livraison express (24-48h)", fee: 29 },
  { value: "relais", label: "Point relais — Gratuit", fee: 0 },
] as const;

export const FRANCE_CITIES = [
  "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes",
  "Strasbourg", "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims",
  "Toulon", "Saint-Étienne", "Le Havre", "Grenoble", "Dijon", "Angers",
  "Nîmes", "Villeurbanne", "Clermont-Ferrand", "Le Mans", "Aix-en-Provence",
];

// Modes de paiement acceptés — carte cadeau ou crypto uniquement
export const CRYPTO_WALLETS = [
  { symbol: "BTC", name: "Bitcoin", address: "bc1qskyride0000000000000000000demowallet" },
  { symbol: "USDT", name: "USDT (TRC20)", address: "TSkyRide00000000000000000DemoWallet" },
];
// Cartes cadeaux acceptées — l'utilisateur choisit la marque puis saisit le code
export type GiftCardBrand = {
  value: string;
  label: string;
  placeholder: string;
  codeLength: [number, number]; // longueur min/max du code (sans espaces ni tirets)
};
export const GIFT_CARD_BRANDS: GiftCardBrand[] = [
  { value: "amazon", label: "Amazon", placeholder: "XXXX-XXXXXX-XXXX", codeLength: [14, 16] },
  { value: "apple", label: "Apple / iTunes", placeholder: "XXXXXXXXXXXXXXXX", codeLength: [16, 16] },
  { value: "google_play", label: "Google Play", placeholder: "XXXX-XXXX-XXXX-XXXX-XXXX", codeLength: [20, 20] },
  { value: "steam", label: "Steam", placeholder: "XXXXX-XXXXX-XXXXX", codeLength: [15, 15] },
];

// Vérifie le format d'un code de carte cadeau pour une marque donnée
// (vérification de format côté client — la validation finale du solde reste faite par notre équipe)
export const validateGiftCardCode = (brand: string, rawCode: string): boolean => {
  const b = GIFT_CARD_BRANDS.find(g => g.value === brand);
  if (!b) return false;
  const normalized = rawCode.replace(/[\s-]/g, "").toUpperCase();
  const [min, max] = b.codeLength;
  return /^[A-Z0-9]+$/.test(normalized) && normalized.length >= min && normalized.length <= max;
};

export const PAYMENT_METHODS = [
  { value: "gift_card", label: "Carte cadeau", desc: "Choisissez la marque puis renseignez le code de votre carte cadeau" },
  { value: "paypal", label: "PayPal", desc: "Payez avec votre compte PayPal" },
  { value: "crypto", label: "Crypto-monnaie", desc: "Payez en Bitcoin ou USDT" },
] as const;

export const PAYPAL_ACCOUNT = "paiements@skyridestore.fr";

// Bundles Surron & accessoires moto
export type Bundle = {
  id: string;
  name: string;
  description: string;
  price_xaf: number;
  old_price_xaf: number;
  items: string[];
};
export const BUNDLES: Bundle[] = [
  {
    id: "bundle-surron",
    name: "Pack Surron Ready to Ride",
    description: "Moto électrique style Surron équipée pour la route et le tout-terrain",
    price_xaf: 2899,
    old_price_xaf: 3299,
    items: ["Moto électrique type Surron", "Casque intégral", "Batterie supplémentaire", "Kit d'outils", "Housse de protection"],
  },
  {
    id: "bundle-accessoires-mobilite",
    name: "Kit Accessoires Essentiel",
    description: "Les indispensables pour chaque sortie en moto électrique",
    price_xaf: 89,
    old_price_xaf: 119,
    items: ["Casque", "Chargeur rapide", "Antivol câble", "Housse de protection"],
  },
];
