import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, category, price_xaf } = await req.json();
    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) throw new Error("GROQ_API_KEY not set");

    // ─── Étape 1 : recherche web via Groq avec tool_use ───────────────────────
    // On demande d'abord à LiA de raisonner sur le produit à partir de son nom
    // puis de générer un contenu complet et réaliste.

    const systemPrompt = `Tu es LiA, l'assistante IA de SkyRide Store, expert en e-commerce de mobilité électrique (trottinettes électriques, motos type Surron, dirt bikes) en France.
Tu connais parfaitement les produits tech liés à ces motos : moteurs électriques, batteries, autonomie, accessoires de sécurité, etc.
À partir du NOM du produit fourni, tu dois :
1. Identifier le produit réel (marque, modèle, caractéristiques techniques connues)
2. Générer un contenu marketing complet, réaliste et vendeur EN FRANÇAIS
3. Adapter le contenu au marché français (livraison partout en France, prix en euros)

RÈGLES ABSOLUES :
- Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks, sans texte avant ou après
- Toutes les valeurs doivent être en français
- Les spécifications doivent être RÉELLES et PRÉCISES selon le produit identifié
- Le contenu doit être vendeur mais honnête`;

    const userPrompt = `Produit : "${name}"
Catégorie : "${category}"
Prix : ${price_xaf} €

En utilisant tes connaissances sur ce produit, génère le JSON complet ci-dessous.
Si tu reconnais le produit (ex: Surron Light Bee, Surron Ultra Bee, Talaria Sting, Xiaomi Mi Scooter, Ninebot Max, etc.), utilise ses vraies spécifications.
Sinon, génère des spécifications cohérentes avec le nom et la catégorie.

Retourne EXACTEMENT ce JSON (tous les champs sont obligatoires) :
{
  "description": "accroche courte 1 phrase max — ce qui rend ce produit unique",
  "long_description": "description détaillée 4-5 phrases vendeuses : présentation, points forts, cas d'usage, pourquoi l'acheter chez SkyRide Store",
  "benefits": [
    "Bénéfice concret 1 (ex: Autonomie de 60 km pour rouler sans contrainte)",
    "Bénéfice concret 2 (ex: Moteur puissant pour la ville comme le tout-terrain)",
    "Bénéfice concret 3 (ex: Silencieux et sans entretien moteur)",
    "Bénéfice concret 4 (ex: Batterie amovible pour une recharge facile)"
  ],
  "specifications": {
    "Marque": "marque réelle du produit",
    "Modèle": "référence exacte si connue",
    "Poids": "valeur en kg",
    "Autonomie / Batterie": "durée ou capacité",
    "Vitesse max": "en km/h si applicable",
    "Puissance moteur": "en W ou kW si applicable",
    "Connectivité": "application mobile / Bluetooth si applicable",
    "Garantie": "1 an SkyRide Store",
    "Livraison": "24-48h partout en France",
    "Dans la boîte": "accessoires inclus"
  },
  "box_contents": [
    "Produit principal",
    "Chargeur",
    "Manuel d'utilisation en français",
    "Garantie 1 an SkyRide Store"
  ],
  "extra_details": "Conseils d'utilisation, compatibilité, entretien, ou informations importantes pour l'acheteur en France. Mentionner le SAV SkyRide Store.",
  "video_url": ""
}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 2000,
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";

    // Nettoyer le JSON si le modèle a quand même ajouté des backticks
    const cleaned = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();

    // Valider que c'est du JSON parseable avant de renvoyer
    try {
      JSON.parse(cleaned);
    } catch {
      // Si le parsing échoue, on renvoie quand même le texte brut
      // — le frontend gère l'erreur de parsing
    }

    return new Response(
      JSON.stringify({ content: [{ type: "text", text: cleaned }] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
