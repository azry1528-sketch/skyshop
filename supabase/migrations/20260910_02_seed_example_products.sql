-- Exemples de produits pour peupler le catalogue SkyRide Store
INSERT INTO public.products
  (slug, name, description, price_xaf, old_price_xaf, category, image_url, stock, is_trending, is_promo, rating, reviews_count)
VALUES
  (
    'trottinette-urbaine-swift-x1',
    'Trottinette électrique Swift X1',
    'Trottinette urbaine légère, autonomie 35 km, pliable en 3 secondes, idéale pour les trajets quotidiens.',
    289900, 349900, 'trottinette-urbaine',
    'https://images.unsplash.com/photo-1604868189265-219ba7a3c6a5?w=900&q=80',
    24, true, true, 4.6, 128
  ),
  (
    'trottinette-tout-terrain-raptor-pro',
    'Trottinette tout-terrain Raptor Pro',
    'Double moteur 1000W, pneus increvables 10", suspension avant/arrière pour tous les terrains.',
    459900, NULL, 'trottinette-tout-terrain',
    'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=900&q=80',
    12, true, false, 4.7, 64
  ),
  (
    'trottinette-premium-voyager-max',
    'Trottinette premium Voyager Max',
    'Autonomie longue distance 65 km, écran LCD, freinage régénératif, confort premium.',
    579900, 649900, 'trottinette-premium',
    'https://images.unsplash.com/photo-1604868196091-e6b6d6f6e6f5?w=900&q=80',
    8, false, true, 4.8, 41
  ),
  (
    'surron-light-bee-style-storm',
    'Moto électrique style Light Bee Storm',
    'Moto électrique tout-terrain, look Surron Light Bee, moteur puissant, idéale ville et piste.',
    1899000, NULL, 'surron-light-bee',
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=900&q=80',
    5, true, false, 4.9, 22
  ),
  (
    'dirt-bike-electrique-cross-e2',
    'Dirt bike électrique Cross E2',
    'Dirt bike 100% électrique, silencieuse, parfaite pour l\'apprentissage et le loisir.',
    989900, 1099000, 'dirt-bike-electrique',
    'https://images.unsplash.com/photo-1622185135505-2d795003994a?w=900&q=80',
    9, false, true, 4.5, 17
  ),
  (
    'drone-debutant-skyfly-mini',
    'Drone débutant SkyFly Mini',
    'Drone compact avec caméra HD, idéal pour débuter, mode sans tête et retour automatique.',
    59900, 79900, 'drone-debutant',
    'https://images.unsplash.com/photo-1508614999368-9260051292e5?w=900&q=80',
    40, true, true, 4.3, 210
  ),
  (
    'drone-semi-pro-aerocam-4k',
    'Drone semi-pro AeroCam 4K',
    'Caméra 4K stabilisée, GPS, autonomie 30 min, parfait pour la photo et la vidéo aérienne.',
    329900, NULL, 'drone-semi-pro',
    'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=900&q=80',
    15, true, false, 4.6, 88
  ),
  (
    'drone-professionnel-titan-x',
    'Drone professionnel Titan X',
    'Nacelle 3 axes, capteur 1 pouce, transmission longue portée pour usages professionnels.',
    1299000, 1449000, 'drone-professionnel',
    'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=900&q=80',
    4, false, true, 4.9, 12
  ),
  (
    'batterie-lithium-longue-duree-48v',
    'Batterie lithium longue durée 48V',
    'Batterie de remplacement compatible trottinettes et motos électriques, forte densité énergétique.',
    89900, NULL, 'batteries-chargeurs',
    'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=900&q=80',
    30, false, false, 4.4, 33
  ),
  (
    'casque-protection-urban-shield',
    'Casque de protection Urban Shield',
    'Casque léger et aéré, certifié sécurité, plusieurs coloris disponibles.',
    24900, 29900, 'casques-protections',
    'https://images.unsplash.com/photo-1591637333472-9fbb95b3d3b8?w=900&q=80',
    50, false, true, 4.5, 76
  ),
  (
    'ecouteurs-sans-fil-pulse-buds',
    'Écouteurs sans fil Pulse Buds',
    'Écouteurs Bluetooth 5.3, réduction de bruit active, autonomie 24h avec boîtier.',
    19900, 27900, 'electronique',
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=900&q=80',
    60, true, true, 4.4, 154
  ),
  (
    'montre-connectee-fitpulse-2',
    'Montre connectée FitPulse 2',
    'Suivi cardio, GPS intégré, étanche, autonomie 10 jours, compatible iOS et Android.',
    34900, NULL, 'electronique',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&q=80',
    35, false, false, 4.5, 92
  ),
  (
    'lampe-led-portable-glowmate',
    'Lampe LED portable GlowMate',
    'Lampe rechargeable multi-fonctions, 3 modes d\'éclairage, idéale camping et pannes.',
    9900, 13900, 'gadgets',
    'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?w=900&q=80',
    80, false, true, 4.2, 61
  )
ON CONFLICT (slug) DO NOTHING;
